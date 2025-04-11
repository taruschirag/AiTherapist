import React, { createContext, useContext, useState, useEffect } from 'react';
import apiService from '../services/api';

const AuthContext = createContext({});
const TOKEN_KEY = 'auth.token';

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Check for stored token and validate it
        const checkUser = async () => {
            try {
                const token = localStorage.getItem(TOKEN_KEY);
                if (token) {
                    // TODO: Add token validation endpoint if needed
                    setUser({ token }); // For now, just consider having a token as being logged in
                }
            } catch (e) {
                console.error('Error checking auth session:', e);
                setError(e.message);
            } finally {
                setLoading(false);
            }
        };

        checkUser();
    }, []);

    const signUp = async (email, password) => {
        try {
            const data = await apiService.signup(email, password);
            console.log("Signup response data:", data); // Debug log to see what's returned
            
            // Update user state with authenticated user info
            setUser(data);
            
            // Check for access token and save it
            if (data.access_token) {
                console.log("Saving access token to localStorage"); // Debug log
                localStorage.setItem(TOKEN_KEY, data.access_token);
            } else {
                console.warn("No access_token found in signup response"); // Warning log
            }
            
            return { data, error: null };
        } catch (error) {
            console.error('Error signing up:', error);
            return { data: null, error };
        }
    };

    const signIn = async (email, password) => {
        try {
            const data = await apiService.login(email, password);
            console.log("Login response data:", data); // Debug log
            
            setUser(data);
            if (data.access_token) {
                console.log("Saving access token from login to localStorage"); // Debug log
                localStorage.setItem(TOKEN_KEY, data.access_token);
            } else {
                console.warn("No access_token found in login response");
            }
            
            return { data, error: null };
        } catch (error) {
            console.error('Error signing in:', error);
            return { data: null, error };
        }
    };

    const signOut = async () => {
        try {
            await apiService.logout();
            localStorage.removeItem(TOKEN_KEY);
            setUser(null);
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    const value = {
        signUp,
        signIn,
        signOut,
        user,
        loading,
        error
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}; 