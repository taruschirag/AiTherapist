import React, { useState } from 'react';
import './Questionnaire.css';

function Questionnaire({ onComplete }) {
    const [currentStep, setCurrentStep] = useState(0);
    const [responses, setResponses] = useState({
        name: '',
        age: '',
        gender: '',
        journallingIntentions: '',
        personalGrowthGoals: ''
    });

    const steps = [
        {
            title: "Let's get to know you",
            emoji: "👋",
            questions: [
                {
                    key: 'name',
                    label: 'What should we call you?',
                    type: 'text',
                    placeholder: 'Your name...'
                },
                {
                    key: 'age',
                    label: 'What\'s your age?',
                    type: 'number',
                    placeholder: 'Your age...'
                }
            ]
        },
        {
            title: "A little more about you",
            emoji: "✨",
            questions: [
                {
                    key: 'gender',
                    label: 'How do you identify?',
                    type: 'select',
                    options: ['Prefer not to say', 'Woman', 'Man', 'Non-binary', 'Other']
                },
                {
                    key: 'journallingIntentions',
                    label: 'What brings you to journalling?',
                    type: 'textarea',
                    placeholder: 'Share what you hope to get from journalling...'
                }
            ]
        },
        {
            title: "Your growth journey",
            emoji: "🌱",
            questions: [
                {
                    key: 'personalGrowthGoals',
                    label: 'What are your personal growth goals?',
                    type: 'textarea',
                    placeholder: 'What areas of your life would you like to develop or improve?'
                }
            ]
        }
    ];

    const handleInputChange = (key, value) => {
        setResponses(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            // Final step - complete the questionnaire
            onComplete(responses);
        }
    };

    const handleSkip = () => {
        onComplete(responses);
    };

    const currentStepData = steps[currentStep];
    const isLastStep = currentStep === steps.length - 1;

    const renderQuestion = (question) => {
        const value = responses[question.key];

        switch (question.type) {
            case 'text':
            case 'number':
                return (
                    <input
                        type={question.type}
                        value={value}
                        onChange={(e) => handleInputChange(question.key, e.target.value)}
                        placeholder={question.placeholder}
                        className="question-input"
                        min={question.type === 'number' ? 1 : undefined}
                        max={question.type === 'number' ? 120 : undefined}
                    />
                );
            case 'select':
                return (
                    <select
                        value={value}
                        onChange={(e) => handleInputChange(question.key, e.target.value)}
                        className="question-select"
                    >
                        <option value="">Select an option...</option>
                        {question.options.map((option, index) => (
                            <option key={index} value={option}>
                                {option}
                            </option>
                        ))}
                    </select>
                );
            case 'textarea':
                return (
                    <textarea
                        value={value}
                        onChange={(e) => handleInputChange(question.key, e.target.value)}
                        placeholder={question.placeholder}
                        className="question-textarea"
                        rows="4"
                    />
                );
            default:
                return null;
        }
    };

    return (
        <div className="questionnaire-overlay">
            <div className="questionnaire-card">
                <p className="questionnaire-emoji">{currentStepData.emoji}</p>
                <h2 className="questionnaire-title">{currentStepData.title}</h2>

                <div className="questions-container">
                    {currentStepData.questions.map((question, index) => (
                        <div key={index} className="question-group">
                            <label className="question-label">{question.label}</label>
                            {renderQuestion(question)}
                        </div>
                    ))}
                </div>

                <div className="progress-indicator">
                    <span className="progress-text">
                        Step {currentStep + 1} of {steps.length}
                    </span>
                    <div className="progress-bar">
                        <div
                            className="progress-fill"
                            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                        ></div>
                    </div>
                </div>

                <div className="questionnaire-actions">
                    <button onClick={handleSkip} className="questionnaire-button skip">
                        Skip
                    </button>
                    <button onClick={handleNext} className="questionnaire-button next">
                        {isLastStep ? 'Complete' : 'Next'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Questionnaire;