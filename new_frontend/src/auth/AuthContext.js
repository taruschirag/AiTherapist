import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, loginUser, signUpUser, logoutUser } from '../services/supabase';

const AuthContext = createContext({});
const TOKEN_KEY = 'token'; // LocalStorage key for access token

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const checkSession = async () => {
            try {
                const { data, error } = await supabase.auth.getUser();
                if (error) throw error;
                if (data?.user) {
                    setUser(data.user);
                }
            } catch (err) {
                console.error('Error restoring session:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        checkSession();
    }, []);

    const signUp = async (email, password) => {
        try {
            const result = await signUpUser(email, password);
            if (result?.user) {
                setUser(result.user);
                localStorage.setItem(TOKEN_KEY, result.session.access_token);
                return { data: result.user, error: null };
            } else {
                throw new Error('Signup failed');
            }
        } catch (error) {
            console.error('Signup error:', error.message);
            return { data: null, error };
        }
    };

    const signIn = async (email, password) => {
        try {
            const result = await loginUser(email, password);
            if (result?.user) {
                setUser(result.user);
                localStorage.setItem(TOKEN_KEY, result.session.access_token);
                return { data: result.user, error: null };
            } else {
                throw new Error('Login failed');
            }
        } catch (error) {
            console.error('Login error:', error.message);
            return { data: null, error };
        }
    };

    const signOut = async () => {
        try {
            await logoutUser();
            localStorage.removeItem(TOKEN_KEY);
            setUser(null);
        } catch (error) {
            console.error('Logout error:', error.message);
        }
    };

    const value = {
        user,
        loading,
        error,
        signUp,
        signIn,
        signOut
    };

    if (loading) {
        return <div>Loading session...</div>;
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};
