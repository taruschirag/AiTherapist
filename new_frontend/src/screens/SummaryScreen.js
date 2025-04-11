import React from 'react';
import { useNavigate } from 'react-router-dom';
import './SummaryScreen.css';

const SummaryScreen = () => {
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

    const conversation = [
        {
            id: 1,
            text: "I just had a really hard day today. I had an exam and I got my grade back for one of the classes",
            isUser: true
        },
        {
            id: 2,
            text: "Gotcha, Chirag. That sounds like a rough day, and I know it sucks when things pile up like this. ❤️ But listen, one bad exam or a few midterms don't define you. You're out here doing research, building a startup, and pushing yourself in ways most people don't. That takes real grit. 💪",
            isUser: false
        },
        {
            id: 3,
            text: "Right now, I'd say take a deep breath, maybe step away from everything for a bit. 💎 Go for a walk, hit the gym, watch a show—something to reset. You're carrying a lot on your shoulders, and it's okay to pause.",
            isUser: false
        },
        {
            id: 4,
            text: "Also, if you want, we can come up with a game plan—whether it's bouncing back on grades, shifting focus to what really matters, or just figuring out how to make tomorrow better. ✨ What's the move?",
            isUser: false
        }
    ];

    const renderSummaryItem = (item, index) => (
        <div key={index} className="summary-item">
            <p>{item}</p>
        </div>
    );

    const renderChatMessage = (message) => (
        <div
            key={message.id}
            className={`chat-bubble ${message.isUser ? 'user-bubble' : 'therapist-bubble'}`}
        >
            <p>{message.text}</p>
        </div>
    );

    return (
        <div className="summary-container">
            <div className="header">
                <h1>Chirag's Reflection Corner</h1>
            </div>

            <div className="content">
                <div className="summary-content">
                    <h2 className="summary-title">Summary ({weekDate})</h2>

                    <div className="section">
                        <h3 className="section-title">📝 Weekly Reflection Summary (Days 1-4)</h3>

                        <h4 className="category-title">↗️ Highs:</h4>
                        {highs.map((high, index) => renderSummaryItem(high, index))}

                        <h4 className="category-title">↘️ Lows:</h4>
                        {lows.map((low, index) => renderSummaryItem(low, index))}

                        <h4 className="category-title">🔄 Emotions & Mindset Shifts:</h4>
                        {emotions.map((emotion, index) => renderSummaryItem(emotion, index))}
                    </div>

                    <div className="conversation-container">
                        <h3 className="conversation-title">Recent Conversation:</h3>
                        {conversation.map(renderChatMessage)}
                    </div>
                </div>
            </div>

            <button
                className="journal-button"
                onClick={() => navigate('/journal')}
            >
                Start New Journal Entry
            </button>
        </div>
    );
};

export default SummaryScreen;