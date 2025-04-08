// src/services/api.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Replace with your actual server URL
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
    async (config) => {
        const token = await AsyncStorage.getItem('token');
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
        return response.data;
    },

    signup: async (email, password) => {
        const response = await api.post('/signup', { email, password });
        return response.data;
    },

    // Journal and Goals
    saveJournalAndGoals: async (goals, journal) => {
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