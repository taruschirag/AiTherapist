// src/services/api.js
import axios from 'axios';
import { supabase } from './supabase';
import { useState } from 'react';

const API_URL = 'https://aitherapist-production.up.railway.app/';

// Create axios instance
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add interceptor to add auth token to requests
api.interceptors.request.use(
    async (config) => {
        // Try localStorage first, then fall back to Supabase session
        let token = localStorage.getItem('token');
        if (!token) {
            // Try to get from Supabase session
            const { data: { session } = {} } = await supabase.auth.getSession();
            token = session?.access_token;
        }
        if (!token) {
            // Fallback: detect Supabase-js internal storage key
            for (const key of Object.keys(localStorage)) {
                if (key.endsWith('-auth-token')) {
                    try {
                        const parsed = JSON.parse(localStorage.getItem(key));
                        token = parsed?.access_token;
                    } catch {
                        // ignore parse errors
                    }
                    break;
                }
            }
        }
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// api.interceptors.response.use(
//     response => response,
//     async error => {
//         const original = error.config;
//         const status = error.response?.status;

//         // only handle auth errors once
//         if ((status === 401 || status === 403) && !original._retry) {
//             original._retry = true;

//             try {
//                 const refreshToken = localStorage.getItem('refresh_token');
//                 const { data } = await api.post('/refresh', { refresh_token: refreshToken });
//                 localStorage.setItem('token', data.access_token);
//                 localStorage.setItem('refresh_token', data.refresh_token);

//                 // Update the header and retry
//                 api.defaults.headers.Authorization = `Bearer ${data.access_token}`;
//                 original.headers.Authorization = `Bearer ${data.access_token}`;
//                 return api.request(original);
//             } catch (refreshError) {
//                 // Refresh failed → fall through to logout
//                 console.warn("Token refresh failed, redirecting to login.");
//             }
//         }

//         // If we get here, either it wasn't a 401/403, or refresh failed
//         localStorage.removeItem('token');
//         localStorage.removeItem('refresh_token');
//         window.location.href = "/login";
//         return Promise.reject(error);
//     }
// );

api.interceptors.request.use(
    async (config) => {
        let token = null;

        // 1. Try known localStorage keys (Railway won't persist Supabase session automatically)
        try {
            for (const key of Object.keys(localStorage)) {
                if (key.includes('auth-token')) {
                    const session = JSON.parse(localStorage.getItem(key));
                    token = session?.access_token;
                    if (token) break;
                }
            }
        } catch (err) {
            console.warn("Failed to parse auth token:", err);
        }

        // 2. Optional fallback to Supabase session (if using supabase-js auth methods)
        if (!token && supabase?.auth) {
            const { data: { session } = {} } = await supabase.auth.getSession();
            token = session?.access_token;
        }

        // 3. Attach the token if found
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => Promise.reject(error)
);



// API functions for your app
export const apiService = {
    // Authentication
    login: async (email, password) => {
        const response = await api.post('/login', { email, password });
        if (response.data.access_token) {
            localStorage.setItem('token', response.data.access_token);
            localStorage.setItem('refresh_token', response.data.refresh_token);
        }
        return response.data;
    },

    signup: async (email, password) => {
        try {
            const response = await api.post('/signup', { email, password });
            if (response.data.access_token) {
                localStorage.setItem('token', response.data.access_token);
                localStorage.setItem('refresh_token', response.data.refresh_token);
            } else {
                console.warn('No access token in signup response:', response.data);
            }
            return response.data;
        } catch (error) {
            console.error('Signup API error:', error);

            // Get more details about the error
            if (error.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                console.error('Error data:', error.response.data);
                console.error('Error status:', error.response.status);
                console.error('Error headers:', error.response.headers);

                // If there's a more specific error detail from the server
                if (error.response.data && error.response.data.detail) {
                    throw new Error(error.response.data.detail);
                }
            } else if (error.request) {
                // The request was made but no response was received
                console.error('No response received:', error.request);
                throw new Error('No response from server. Check your connection.');
            }

            // Pass through the error
            throw error;
        }
    },

    logout: async () => {
        localStorage.removeItem('token');
    },

    // Journal and Goals
    saveJournalAndGoals: async (goals, journal) => {
        const response = await api.post('/goals-journals', {
            goals: {
                yearly: goals.yearly || "Not specified",
                monthly: goals.monthly || "Not specified",
                weekly: goals.weekly || "Not specified"
            },
            journal
        });
        return response.data;
    },


    saveJournal: async (content, journal_date) => {
        const response = await api.post('/journals', {
            content,
            journal_date
        });
        return response.data;
    },


    // Chat - updated to match your backend API
    sendChatMessage: async (message, context = null) => {
        const response = await api.post('/chat', { message, context });
        return response.data;
    },

    getChatHistory: async () => {
        const response = await api.get('/chat-history');
        return response.data.messages; // Based on your backend response structure
    },

    // New chat session methods for ReflectionScreen
    getUserChatSessions: async () => {
        // Now this will automatically trigger the interceptor if it gets 401/403
        const response = await api.get('/chat-sessions');
        return response.data.sessions;
    },

    // services/api.js
    getChatMessages: async (sessionId) => {
        try {
            console.log('Fetching messages for session:', sessionId);
            const response = await api.get(`/chat-sessions/${sessionId}/messages`);
            console.log('Axios full response:', response);
            console.log('…but the real payload is response.data:', response.data);

            // response.data might be:
            //  • an array of messages: [ { chat_id, content, …}, … ]
            //  • an object with a `messages` field: { messages: [ … ] }
            //  • something else entirely
            // Let's normalize below.

            const payload = response.data;
            if (Array.isArray(payload)) {
                return payload;
            }
            if (payload && Array.isArray(payload.messages)) {
                return payload.messages;
            }
            console.warn('getChatMessages: unexpected payload shape, returning empty array');
            return [];
        } catch (error) {
            console.error('Error fetching chat messages:', error);
            return [];
        }
    },


    // Method to send a message in a specific chat session
    sendSessionMessage: async (sessionId, message) => {
        // You'll need to add this endpoint to your backend
        const response = await api.post(`/chat-sessions/${sessionId}/messages`, { message });
        return response.data;
    },

    // Create a new chat session
    createChatSession: async () => {
        // You'll need to add this endpoint to your backend
        const response = await api.post('/chat-sessions');
        return response.data.session;
    },

    // Insights
    generateInsights: async () => {
        const response = await api.post('/generate-insights');
        return response.data;
    },

    getInsights: async () => {
        const response = await api.get('/insights');
        return response.data;
    },

    // Journal dates for calendar view
    getJournalDates: async () => {
        const response = await api.get('/journal-dates');
        return response.data;
    },

    // Fetch a journal summary for a given date range
    getJournalSummary: async (startDate, endDate) => {
        const response = await api.get(
            `/journal-summaries?start_date=${startDate}&end_date=${endDate}`
        );
        return response.data;
    },

    // Create a journal summary for a given date range
    createJournalSummary: async (startDate, endDate) => {
        const response = await api.post('/journal-summaries', {
            start_date: startDate,
            end_date: endDate
        });
        return response.data;
    },

    // Check if user is authenticated (protected route)
    checkAuth: async () => {
        try {
            const response = await api.get('/protected');
            return { isAuthenticated: true, user: response.data.user };
        } catch (error) {
            return { isAuthenticated: false, user: null };
        }
    },

    getUserProfile: async () => {
        const response = await api.get('/user-profile');
        return response.data;  // { user_id, profile_data, updated_at }
    }
};

export default apiService;