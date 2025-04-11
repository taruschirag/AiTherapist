import React, { useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import './AuthForm.css';

const AuthForm = ({ mode = 'signin' }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { signIn, signUp } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (mode === 'signup') {
                const { error } = await signUp(email, password);
                if (error) {
                    // Extract the most helpful part of the error message
                    const errorMessage = error.message || 'Failed to sign up';
                    throw new Error(errorMessage);
                }
                // Successfully signed up and automatically logged in
                navigate('/home');
            } else {
                const { error } = await signIn(email, password);
                if (error) {
                    // Extract the most helpful part of the error message
                    const errorMessage = error.message || 'Failed to sign in';
                    throw new Error(errorMessage);
                }
                navigate('/home');
            }
        } catch (error) {
            console.error('Authentication error:', error);
            
            let userFriendlyMessage = error.message;
            
            // Make the error message more user-friendly
            if (error.message.includes('500')) {
                userFriendlyMessage = 'Server error occurred. Please try again later or contact support.';
            } else if (error.message.includes('sign up')) {
                userFriendlyMessage = 'Failed to create account. This email may already be registered.';
            } else if (error.message.includes('sign in') || error.message.includes('login')) {
                userFriendlyMessage = 'Login failed. Please check your email and password.';
            }
            
            setError(userFriendlyMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-form-container">
            <form onSubmit={handleSubmit} className="auth-form">
                <h2>{mode === 'signup' ? 'Create Account' : 'Welcome Back'}</h2>
                
                {error && <div className="auth-error">{error}</div>}
                
                <div className="form-group">
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                
                <div className="form-group">
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                    />
                </div>
                
                <button type="submit" disabled={loading} className="auth-button">
                    {loading ? 'Loading...' : mode === 'signup' ? 'Sign Up' : 'Sign In'}
                </button>

                <div className="auth-switch">
                    {mode === 'signup' ? (
                        <p>Already have an account? <a href="/login">Sign In</a></p>
                    ) : (
                        <p>Don't have an account? <a href="/signup">Sign Up</a></p>
                    )}
                </div>
            </form>
        </div>
    );
};

export default AuthForm; 