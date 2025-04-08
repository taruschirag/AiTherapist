// src/services/auth.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from './api';

export const authService = {
    // Save tokens
    setTokens: async (accessToken, refreshToken) => {
        await AsyncStorage.setItem('token', accessToken);
        await AsyncStorage.setItem('refreshToken', refreshToken);
    },

    // Get access token
    getToken: async () => {
        return await AsyncStorage.getItem('token');
    },

    // Handle login
    login: async (email, password) => {
        try {
            const response = await apiService.login(email, password);
            await authService.setTokens(
                response.access_token,
                response.refresh_token
            );
            return true;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    },

    // Handle signup
    signup: async (email, password) => {
        try {
            await apiService.signup(email, password);
            // After signup, we need to login to get tokens
            return await authService.login(email, password);
        } catch (error) {
            console.error('Signup error:', error);
            throw error;
        }
    },

    // Handle logout
    logout: async () => {
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('refreshToken');
    },

    // Check if user is logged in
    isLoggedIn: async () => {
        const token = await AsyncStorage.getItem('token');
        return !!token;
    },
};

export default authService;