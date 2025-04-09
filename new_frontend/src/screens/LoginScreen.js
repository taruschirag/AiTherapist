// src/screens/LoginScreen.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginScreen.css';
import { loginUser, signUpUser } from '../services/supabase';  // ✅ Supabase helpers

const LoginScreen = () => {
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLogin, setIsLogin] = useState(true);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!email || !password) {
            setError('Please fill in all fields');
            return;
        }

        // 🔐 Use Supabase to login/signup
        const data = isLogin
            ? await loginUser(email, password)
            : await signUpUser(email, password);

        if (data) {
            navigate('/journal'); // ✅ Redirect on success
        } else {
            setError('Authentication failed. Check credentials or try again.');
        }
    };

    const toggleAuthMode = () => {
        setIsLogin(!isLogin);
        setError('');
    };

    return (
        <div className="login-screen">
            <div className="login-container">
                <div className="login-header">
                    <h1>Mindful Reflections</h1>
                    <p>Your AI Companion for Self-Growth</p>
                </div>

                <div className="auth-form-container">
                    <h2>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>

                    {error && <div className="error-message">{error}</div>}

                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="form-group">
                            <label htmlFor="email">Email</label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="your.email@example.com"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">Password</label>
                            <input
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                            />
                        </div>

                        {isLogin && (
                            <div className="forgot-password">
                                <a href="#reset">Forgot password?</a>
                            </div>
                        )}

                        <button type="submit" className="auth-button">
                            {isLogin ? 'Log In' : 'Sign Up'}
                        </button>
                    </form>

                    <div className="auth-switcher">
                        <p>
                            {isLogin
                                ? "Don't have an account?"
                                : "Already have an account?"}
                            <button
                                onClick={toggleAuthMode}
                                className="switch-auth-button"
                            >
                                {isLogin ? 'Sign Up' : 'Log In'}
                            </button>
                        </p>
                    </div>

                    <div className="auth-divider">
                        <span>or</span>
                    </div>

                    <div className="social-login">
                        <button className="social-button google">
                            Continue with Google
                        </button>
                        <button className="social-button apple">
                            Continue with Apple
                        </button>
                    </div>
                </div>

                <div className="login-footer">
                    <p>Your private space for reflection and growth</p>
                    <p className="copyright">© 2025 Mindful Reflections</p>
                </div>
            </div>

            <div className="login-illustration">
                <div className="illustration-content">
                    <div className="quote-bubble">
                        <p>"Self-reflection is the school of wisdom."</p>
                        <p className="quote-author">— Baltasar Gracián</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginScreen;
