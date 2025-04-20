import React from 'react';
import { useNavigate } from 'react-router-dom';
import './HomeScreen.css';

const HomeScreen = () => {
    const navigate = useNavigate();

    const features = [
        {
            title: 'Journal Your Thoughts',
            description: 'Write down your daily experiences and emotions in a safe space.',
            icon: '📝',
            route: '/journal'
        },
        {
            title: 'Chat with AI Therapist',
            description: 'Have a meaningful conversation with your AI therapist.',
            icon: '💭',
            route: '/reflect'
        },
        {
            title: 'View Your Progress',
            description: 'See your emotional journey and insights over time.',
            icon: '📊',
            route: '/summary'
        }
    ];

    return (
        <div className="home-screen">
            <div className="home-container">
                <div className="home-header">
                    <h1>Welcome to AI Therapist</h1>
                    <p>Your personal space for emotional well-being and self-reflection</p>
                </div>

                <div className="features-grid">
                    {features.map((feature, index) => (
                        <div 
                            key={index} 
                            className="feature-card"
                            onClick={() => navigate(feature.route)}
                        >
                            <div className="feature-icon">{feature.icon}</div>
                            <h3>{feature.title}</h3>
                            <p>{feature.description}</p>
                        </div>
                    ))}
                </div>

                <div className="daily-quote">
                    <blockquote>
                        "The journey of a thousand miles begins with a single step."
                    </blockquote>
                    <cite>- Lao Tzu</cite>
                </div>
            </div>
        </div>
    );
};

export default HomeScreen; 