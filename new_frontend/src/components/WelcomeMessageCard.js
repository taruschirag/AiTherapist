import React from 'react';
import './WelcomeMessageCard.css'; // We'll create this CSS file next

function WelcomeMessageCard({ onComplete }) {
    // Both Skip and Next will mark the message as seen
    const handleComplete = () => {
        onComplete();
    };

    return (
        <div className="welcome-card-overlay">
            <div className="welcome-card">
                <p className="welcome-emoji">:)</p>
                <p className="welcome-text">hi friend</p>
                <p className="welcome-text">we created <span className="app-name">Tranquil</span> because life can be a LOT </p>
                <p className="welcome-text small">sometimes you need help making sense of your thoughts</p>
                <p className="welcome-text small">whether you're navigating a rough day,</p>
                <p className="welcome-text small">or just need a moment to breathe</p>
                <p className="welcome-text bold">we're here for you</p>
                <p className="welcome-text">wanna give it a try?</p>
                {/* Optional: Link to a guide if you have one */}
                {/* <p className="welcome-text">start with this <a href="/guide">quick guide</a></p> */}
                <p className="welcome-love">love,</p>
                <p className="welcome-signature">Our Team</p> {/* Or your names */}

                <div className="welcome-actions">
                    <button onClick={handleComplete} className="welcome-button skip">
                        Skip
                    </button>
                    <button onClick={handleComplete} className="welcome-button next">
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
}

export default WelcomeMessageCard;