// src/services/api.js
import axios from 'axios';
const API_URL = process.env.REACT_APP_SUPABASE_URL;

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
        const token = localStorage.getItem('auth.token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// API functions for your app
export const apiService = {
    // Authentication
    login: async (email, password) => {
        const response = await api.post('/login', { email, password });
        if (response.data.access_token) {
            localStorage.setItem('auth.token', response.data.access_token);
        }
        return response.data;
    },

    signup: async (email, password) => {
        try {
            const response = await api.post('/signup', { email, password });
            if (response.data.access_token) {
                localStorage.setItem('auth.token', response.data.access_token);
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
        localStorage.removeItem('auth.token');
    },

    // Journal and Goals
    saveJournalAndGoals: async (goals, journal) => {
        console.log("API call payload:", { goals, journal });
        const response = await api.post('/goals-journals', { goals, journal });
        return response.data;
    },


    // Chat
    sendMessage: async (message, context = null) => {
        const response = await api.post('/chat', { message, context });
        return response.data;
    },

    getChatHistory: async () => {
        const response = await api.get('/chat-history');
        return response.data;
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
};

export default apiService;