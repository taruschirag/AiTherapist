import React, { useState, useEffect } from 'react';
import apiService from '../services/api';
import './SummaryScreen.css';

const SummaryScreen = () => {
    const [profileData, setProfileData] = useState(null);

    useEffect(() => {
        apiService.getUserProfile()
            .then(data => {
                console.log("Received profile data from backend:", data);
                setProfileData(data.profile_data);
            })
            .catch(err => console.error('Failed to load profile:', err));
    }, []);

    if (!profileData) {
        return <div className="loading">Loading profile...</div>;
    }

    // Use metadata.created_at if present, else fallback
    const createdAt = profileData.metadata?.created_at || profileData.created_at;

    // Ratings/assessments array (may be called ratings or assessments)
    const assessments = profileData.ratings || profileData.assessments || [];

    // Strengths and weaknesses (object of key: value)
    const strengths = profileData.strengths || {};
    const weaknesses = profileData.weaknesses || {};

    const renderScoreBar = (score, maxScore) => {
        const percentage = (score / maxScore) * 100;
        return (
            <div className="score-bar-container">
                <div className="score-bar-background">
                    <div
                        className="score-bar-fill"
                        style={{ width: `${percentage}%` }}
                    ></div>
                </div>
                <div className="score-text">{score}/{maxScore}</div>
            </div>
        );
    };

    const handleJournalClick = () => {
        window.location.href = '/journal';
    };

    return (
        <div className="summary-container">
            <div className="header">
                <h1>{profileData.name}'s Profile</h1>
                {createdAt && (
                    <p className="profile-date">Created: {new Date(createdAt).toLocaleDateString()}</p>
                )}
            </div>

            <div className="content">
                <div className="profile-card">
                    <h2 className="profile-section-title">Assessment Summary</h2>
                    {Array.isArray(assessments) && assessments.map((assessment, index) => (
                        <div key={index} className="assessment-item">
                            <div className="assessment-header">
                                <h3 className="assessment-category">{assessment.category}</h3>
                                {renderScoreBar(assessment.score, assessment.max_score || assessment.maxScore)}
                            </div>
                            <p className="assessment-description">{assessment.description}</p>
                        </div>
                    ))}
                </div>

                {Object.keys(strengths).length > 0 && (
                    <div className="profile-card">
                        <h2 className="profile-section-title">Strengths</h2>
                        {Object.entries(strengths).map(([key, value]) => (
                            <div key={key} className="strength-item">
                                <h3 className="strength-title">{key.replace(/_/g, ' ')}</h3>
                                <p className="strength-description">{value}</p>
                            </div>
                        ))}
                    </div>
                )}

                {Object.keys(weaknesses).length > 0 && (
                    <div className="profile-card">
                        <h2 className="profile-section-title">Weaknesses</h2>
                        {Object.entries(weaknesses).map(([key, value]) => (
                            <div key={key} className="weakness-item">
                                <h3 className="weakness-title">{key.replace(/_/g, ' ')}</h3>
                                <p className="weakness-description">{value}</p>
                            </div>
                        ))}
                    </div>
                )}

                <button
                    className="journal-button"
                    onClick={handleJournalClick}
                >
                    Start New Journal Entry
                </button>
            </div>
        </div>
    );
};

export default SummaryScreen;