// src/ReflectionScreen.js
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import apiService from '../services/api';
import './ReflectionScreen.css';

const ReflectionScreen = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [showSummary, setShowSummary] = useState(false);
    const [selectedSession, setSelectedSession] = useState(null);
    const weekDate = "Week of March 05";
    const messagesEndRef = useRef(null);

    // Hardcoded chat history sessions
    const chatSessions = [
        { id: 1, date: "June 10, 2023", title: "Initial Assessment", preview: "Tell me about what brought you here today..." },
        { id: 2, date: "June 17, 2023", title: "Anxiety Management", preview: "Let's discuss some strategies for managing anxiety..." },
        { id: 3, date: "June 24, 2023", title: "Progress Check-in", preview: "How have the techniques been working for you..." },
        { id: 4, date: "July 1, 2023", title: "Stress & Work-Life Balance", preview: "I understand work has been challenging lately..." },
        { id: 5, date: "July 8, 2023", title: "Relationship Dynamics", preview: "You mentioned some tension with your partner..." },
        { id: 6, date: "Today", title: "Current Session", preview: "How are you feeling today?", isCurrent: true }
    ];

    const highs = [
        "Refined User Acquisition Strategy - Broke down tasks into smaller steps to stay motivated.",
        "Proactive Decision-Making - Started researching San Francisco housing & networking opportunities.",
        "Reframed Perspective on Research - Found ways to connect Capital One work to long-term goals.",
        "Took Action Instead of Overthinking - Created a structured action plan for startup growth."
    ];

    const lows = [
        "Feeling Stuck & Doubting Progress - Frustrated with slow traction on AI therapist app.",
        "Uncertainty About the Future - Struggled with indecision about moving to SF for the summer.",
        "Lack of Immediate Validation - Questioned whether the startup was valuable without users.",
        "Overwhelmed by Comparisons - Felt behind on securing an internship, funding, or accelerator spots."
    ];

    const emotions = [
        "Frustration & Self-Doubt - Questioned startup progress & research relevance.",
        "Uncertainty & Hesitation - Struggled with decision-making around future plans."
    ];

    const [conversation, setConversation] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [isSending, setIsSending] = useState(false);

    // Scroll to bottom of chat when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [conversation]);

    // Fetch chat history when component mounts
    useEffect(() => {
        const fetchChatHistory = async () => {
            try {
                const response = await apiService.getChatHistory();
                if (response && response.messages) {
                    // Transform the messages into our expected format
                    const formattedMessages = response.messages.map(msg => ({
                        id: msg.id || Date.now() + Math.random(),
                        text: msg.content,
                        isUser: msg.role === 'user',
                        timestamp: new Date(msg.created_at)
                    }));
                    setConversation(formattedMessages);
                }
            } catch (error) {
                console.error('Error fetching chat history:', error);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchChatHistory();
        } else {
            setLoading(false);
        }
    }, [user]);

    const handleSendMessage = async () => {
        if (newMessage.trim() && !isSending) {
            try {
                setIsSending(true);
                
                // Add user message to conversation immediately
                const userMessage = { 
                    id: Date.now(), 
                    text: newMessage.trim(), 
                    isUser: true,
                    timestamp: new Date()
                };
                setConversation(prev => [...prev, userMessage]);
                const messageToSend = newMessage.trim();
                setNewMessage(""); // Clear input field immediately
                
                // Send message to backend and get AI response
                const response = await apiService.sendMessage(messageToSend);
                
                // Add AI response to conversation
                if (response && response.response) {
                    const aiMessage = { 
                        id: Date.now() + 1, 
                        text: response.response, 
                        isUser: false,
                        timestamp: new Date()
                    };
                    setConversation(prev => [...prev, aiMessage]);
                } else {
                    throw new Error("Invalid response format");
                }
            } catch (error) {
                console.error('Error sending message:', error);
                // Add error message to conversation
                const errorMessage = {
                    id: Date.now() + 1,
                    text: "Sorry, I'm having trouble responding right now. Please try again.",
                    isUser: false,
                    timestamp: new Date()
                };
                setConversation(prev => [...prev, errorMessage]);
            } finally {
                setIsSending(false);
            }
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const toggleSummary = () => {
        setShowSummary(!showSummary);
    };

    const handleSessionSelect = (sessionId) => {
        setSelectedSession(sessionId);
        // In a real app, this would load the selected chat session
        // For now, we're just showing the current conversation
    };

    if (loading) {
        return <div className="loading">Loading...</div>;
    }

    return (
        <div className="reflection-screen">
            <div className="reflection-header">
                <h1>Chirag's Reflection Corner</h1>
                <button onClick={toggleSummary} className="summary-toggle-button">
                    {showSummary ? 'Hide Summary' : 'Show Summary'}
                </button>
            </div>

            <div className="reflection-content">
                {/* Chat History Sidebar */}
                <div className="chat-history-sidebar">
                    <h3>Session History</h3>
                    <div className="sessions-list">
                        {chatSessions.map(session => (
                            <div 
                                key={session.id}
                                className={`session-item ${
                                    (selectedSession === session.id || 
                                    (selectedSession === null && session.isCurrent)) ? 'active' : ''
                                }`}
                                onClick={() => handleSessionSelect(session.id)}
                            >
                                <div className="session-date">{session.date}</div>
                                <div className="session-title">{session.title}</div>
                                <div className="session-preview">{session.preview}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Main Chat Section */}
                <div className={`chat-section ${showSummary ? 'with-summary' : 'full-width'}`}>
                    <div className="chat-messages">
                        {conversation.length === 0 && (
                            <div className="empty-chat-message">
                                <p>No messages yet. Start a conversation!</p>
                            </div>
                        )}
                        
                        {conversation.map(message => (
                            <div
                                key={message.id}
                                className={`chat-bubble ${message.isUser ? 'user-bubble' : 'therapist-bubble'}`}
                            >
                                <p>{message.text}</p>
                                {message.timestamp && (
                                    <small className="timestamp">
                                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </small>
                                )}
                            </div>
                        ))}
                        
                        {isSending && (
                            <div className="chat-bubble therapist-bubble typing">
                                <div className="typing-indicator">
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </div>
                            </div>
                        )}
                        
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="message-input-container">
                        <textarea
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={handleKeyPress}
                            placeholder="Type your message here..."
                            className="message-input"
                            disabled={isSending}
                        />
                        <button
                            onClick={handleSendMessage}
                            className={`send-button ${isSending ? 'sending' : ''}`}
                            disabled={!newMessage.trim() || isSending}
                        >
                            {isSending ? 'Sending...' : 'Send'}
                        </button>
                    </div>

                    <button
                        className="journal-button"
                        onClick={() => navigate("/journal")}
                    >
                        Start New Journal Entry
                    </button>
                </div>

                {/* Summary Section (Collapsible) */}
                {showSummary && (
                    <div className="summary-section">
                        <h2>Summary ({weekDate})</h2>
                        
                        <div className="summary-content">
                            <div className="category">
                                <h4>Highs</h4>
                                <ul>
                                    {highs.map((high, index) => (
                                        <li key={`high-${index}`} className="summary-item">
                                            <span className="checkmark">✓</span> {high}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            
                            <div className="category">
                                <h4>Lows</h4>
                                <ul>
                                    {lows.map((low, index) => (
                                        <li key={`low-${index}`} className="summary-item">
                                            <span className="downmark">✗</span> {low}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            
                            <div className="category">
                                <h4>Emotions & Mindset Shifts</h4>
                                <ul>
                                    {emotions.map((emotion, index) => (
                                        <li key={`emotion-${index}`} className="emotion-item">{emotion}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReflectionScreen;
