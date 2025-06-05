import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import WelcomeMessageCard from '../components/WelcomeMessageCard';
import { useAuth } from '../auth/AuthContext';
import { Feather, BrainCircuit, LineChart, MessageCircleHeart } from 'lucide-react';


import './HomeScreen.css';

const HomeScreen = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [quote, setQuote] = useState({ text: "Loading quote...", author: "" });
    const [showWelcome, setShowWelcome] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [userName, setUserName] = useState('');

    useEffect(() => {
        const welcomeSeen = localStorage.getItem('hasSeenWelcomeMessage');
        if (!welcomeSeen) {
            setShowWelcome(true);
        }
        setIsLoading(false);

        fetchQuote();

        // Extract name from email or use default greeting
        if (user && user.email) {
            const name = user.email.split('@')[0];
            setUserName(name.charAt(0).toUpperCase() + name.slice(1));
        }
    }, [user]);

    const fetchQuote = () => {
        // Array of meaningful quotes for mental health and self-reflection
        const quotes = [
            { text: "The journey of a thousand miles begins with a single step.", author: "Lao Tzu" },
            { text: "What we think, we become. All that we are arises with our thoughts.", author: "Buddha" },
            { text: "The only way out is through.", author: "Robert Frost" },
            { text: "Yesterday is history, tomorrow is a mystery, today is a gift.", author: "Eleanor Roosevelt" },
            { text: "Be yourself; everyone else is already taken.", author: "Oscar Wilde" },
            { text: "In the middle of difficulty lies opportunity.", author: "Albert Einstein" },
            { text: "The present moment is the only time over which we have dominion.", author: "Thích Nhất Hạnh" }
        ];

        const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
        setQuote(randomQuote);
    };

    const handleWelcomeComplete = () => {
        localStorage.setItem('hasSeenWelcomeMessage', 'true');
        setShowWelcome(false);
    };

    if (isLoading) {
        return (
            <div className="loading-screen">
                <div className="loading-spinner"></div>
                <p>Preparing your space...</p>
            </div>
        );
    }

    if (showWelcome) {
        return <WelcomeMessageCard onComplete={handleWelcomeComplete} />;
    }

    const features = [
        {
            title: 'Journal Your Thoughts',
            description: 'Write down your experiences and emotions in a safe, private space.',
            icon: <Feather size={32} strokeWidth={1.75} />,
            route: '/journal',
            accent: 'coral'
        },
        {
            title: 'Chat with AI Therapist',
            description: 'Reflect and receive support from your AI companion.',
            icon: <MessageCircleHeart size={32} strokeWidth={1.75} />,
            route: '/reflect',
            accent: 'sage'
        },
        {
            title: 'View Your Progress',
            description: 'Visualize patterns in your emotional journey.',
            icon: <LineChart size={32} strokeWidth={1.75} />,
            route: '/summary',
            accent: 'lavender'
        }
    ];


    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    };

    const getPersonalizedHeader = () => {
        if (userName) {
            return `${getGreeting()}, ${userName}`;
        }
        return 'Welcome to Tranquil';
    };

    const getPersonalizedSubtext = () => {
        const hour = new Date().getHours();
        if (hour < 12) {
            return 'Start your day with mindful reflection and self-care';
        } else if (hour < 17) {
            return 'Take a moment to check in with yourself and your emotions';
        } else {
            return 'Wind down and reflect on your day in this peaceful space';
        }
    };

    return (
        <div className="home-screen">
            <div className="home-container">
                <header className="home-header">
                    <h1 className="welcome-heading">{getPersonalizedHeader()}</h1>
                    <p className="welcome-subtext">{getPersonalizedSubtext()}</p>
                </header>

                <main className="main-content">
                    <section className="features-section">
                        <div className="features-grid">
                            {features.map((feature, index) => (
                                <article
                                    key={index}
                                    className={`feature-card feature-card--${feature.accent}`}
                                    onClick={() => navigate(feature.route)}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            navigate(feature.route);
                                        }
                                    }}
                                    aria-label={`Navigate to ${feature.title}`}
                                >
                                    <div className="feature-icon" aria-hidden="true">
                                        {feature.icon}
                                    </div>
                                    <h3 className="feature-title">{feature.title}</h3>
                                    <p className="feature-description">{feature.description}</p>
                                    <div className="feature-arrow" aria-hidden="true">→</div>
                                </article>
                            ))}
                        </div>
                    </section>

                    <section className="inspiration-section">
                        <div className="daily-quote">
                            <div className="quote-content">
                                <blockquote className="quote-text">
                                    {quote.text}
                                </blockquote>
                                <cite className="quote-author">— {quote.author}</cite>
                            </div>
                            <button
                                className="refresh-quote-btn"
                                onClick={fetchQuote}
                                aria-label="Get a new inspirational quote"
                                title="Get a new quote"
                            >
                                ↻
                            </button>
                        </div>
                    </section>
                </main>

                <footer className="home-footer">
                    <p className="footer-text">
                        Remember: Your mental health journey is unique. Take it one step at a time.
                    </p>
                </footer>
            </div>
        </div>
    );
};

export default HomeScreen;