// src/ReflectionScreen.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ReflectionScreen.css';




const ReflectionScreen = () => {

    // Add this useEffect when I have authentication done
    // useEffect(() => {
    //     if (!localStorage.getItem('user')) {s
    //         navigate('/login');
    //     }
    // }, []);
    const navigate = useNavigate();
    const weekDate = "Week of March 05";

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

    const [conversation, setConversation] = useState([
        {
            id: 1,
            text: "I just had a really hard day today. I had an exam and I got my grade back for one of the classes",
            isUser: true
        },
        {
            id: 2,
            text: "Gotcha, Chirag. That sounds like a rough day... But listen, one bad exam or a few midterms don't define you...",
            isUser: false
        },
        {
            id: 3,
            text: "Right now, I'd say take a deep breath... You're carrying a lot on your shoulders, and it's okay to pause.",
            isUser: false
        },
        {
            id: 4,
            text: "Also, if you want, we can come up with a game plan... What's the move?",
            isUser: false
        },
        {
            id: 5,
            text: "I just had a really hard day today. I had an exam and I got my grade back for one of the classes",
            isUser: true
        },
        {
            id: 6,
            text: "How are you doing today, Chirag?",
            isUser: false
        }
    ]);

    const [newMessage, setNewMessage] = useState("");

    const handleSendMessage = () => {
        if (newMessage.trim()) {
            const updatedConversation = [
                ...conversation,
                { id: conversation.length + 1, text: newMessage, isUser: true }
            ];
            setConversation(updatedConversation);
            setNewMessage("");

            setTimeout(() => {
                setConversation(prev => [
                    ...prev,
                    {
                        id: prev.length + 1,
                        text: "I understand how you're feeling. Would you like to talk more about what's bothering you specifically?",
                        isUser: false
                    }
                ]);
            }, 1000);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <div className="reflection-screen">
            <div className="reflection-header">
                <h1>Chirag's Reflection Corner</h1>
            </div>

            <div className="reflection-content">
                {/* Chat Section */}
                <div className="chat-section">
                    <div className="chat-messages">
                        {conversation.map(message => (
                            <div
                                key={message.id}
                                className={`chat-bubble ${message.isUser ? 'user-bubble' : 'therapist-bubble'}`}
                            >
                                <p>{message.text}</p>
                            </div>
                        ))}
                    </div>

                    <div className="message-input-container">
                        <textarea
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={handleKeyPress}
                            placeholder="Type your message here..."
                            className="message-input"
                        />
                        <button
                            onClick={handleSendMessage}
                            className="send-button"
                        >
                            Send
                        </button>
                    </div>

                    <button
                        className="journal-button"
                        onClick={() => navigate("/journal")}
                    >
                        Start New Journal Entry
                    </button>
                </div>

                {/* Summary Section */}
                <div className="summary-section">
                    <h2>Summary ({weekDate})</h2>
                    <div className="summary-content">
                        <h3>📝 Weekly Reflection Summary (Days 1–4)</h3>

                        <div className="category">
                            <h4>📈 Highs:</h4>
                            <ul>
                                {highs.map((item, index) => (
                                    <li key={`high-${index}`} className="summary-item">
                                        <span className="checkmark">✅</span> {item}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="category">
                            <h4>📉 Lows:</h4>
                            <ul>
                                {lows.map((item, index) => (
                                    <li key={`low-${index}`} className="summary-item">
                                        <span className="downmark">🔻</span> {item}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="category">
                            <h4>🧠 Emotions & Mindset Shifts:</h4>
                            {emotions.map((item, index) => (
                                <p key={`emotion-${index}`} className="emotion-item">
                                    {index === 0 ? '😞' : '🤔'} {item}
                                </p>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReflectionScreen;
