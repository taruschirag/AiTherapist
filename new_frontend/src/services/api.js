// src/services/api.js
import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

// Create axios instance
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add interceptor to add auth token to requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token'); // Match your existing token key from supabase.js
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => {
        // If request is successful, just return the response
        return response;
    },
    (error) => {
        // Check if the error is due to an expired/invalid token (401 or 403)
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            console.warn('Authentication error detected (401/403). Redirecting to login.');
            // Clear potentially invalid token
            localStorage.removeItem('token');
            // Redirect to login page
            // Replace with your actual routing logic
            window.location.href = '/login'; // Simple redirect
            // Or use navigate('/login') if you have access to it here
        }
        // Return the error so that calling code can still handle it if needed
        return Promise.reject(error);
    }
);

// API functions for your app
export const apiService = {
    // Authentication
    login: async (email, password) => {
        const response = await api.post('/login', { email, password });
        if (response.data.access_token) {
            localStorage.setItem('token', response.data.access_token);
        }
        return response.data;
    },

    signup: async (email, password) => {
        try {
            const response = await api.post('/signup', { email, password });
            if (response.data.access_token) {
                localStorage.setItem('token', response.data.access_token);
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

    getChatMessages: async (sessionId) => {
        // You'll need to add this endpoint to your backend
        const response = await api.get(`/chat-sessions/${sessionId}/messages`);
        return response.data.messages;
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

    // Check if user is authenticated (protected route)
    checkAuth: async () => {
        try {
            const response = await api.get('/protected');
            return { isAuthenticated: true, user: response.data.user };
        } catch (error) {
            return { isAuthenticated: false, user: null };
        }
    }
};

export default apiService;