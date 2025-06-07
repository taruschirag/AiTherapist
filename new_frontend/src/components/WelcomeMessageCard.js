import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './WelcomeMessageCard.css';
import { supabase } from '../services/supabase';


const WelcomeMessageCard = ({ onComplete }) => {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(0);
    const [formData, setFormData] = useState({
        name: '',
        age: '',
        gender: '',
        aspirations: '',
        termsAccepted: false
    });

    const updateFormData = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const nextStep = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        }
    };

    const prevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleComplete = async () => {
        console.log('Onboarding completed with data:', formData);
        localStorage.setItem('hasSeenWelcomeMessage', 'true');

        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
            const { error } = await supabase
                .from('Users')
                .update({ is_new_user: false })
                .eq('user_id', user.id);

            if (error) {
                console.error('Failed to update is_new_user flag:', error.message);
            }
        }

        if (typeof onComplete === 'function') {
            await onComplete(); // ✅ await this so it updates Supabase properly
        }

        setTimeout(() => {
            navigate('/home');
        }, 50);
    };





    const steps = [
        // Welcome Step
        {
            title: ":)",
            subtitle: "hi friend",
            content: (
                <div>
                    <div className="welcome-text">
                        we created <span className="app-name">Tranquil</span> because life can be a LOT
                    </div>
                    <div className="welcome-text small">
                        sometimes you need help making sense of your thoughts
                    </div>
                    <div className="welcome-text small">
                        whether you're navigating a rough day,
                    </div>
                    <div className="welcome-text small">
                        or just need a moment to breathe
                    </div>
                    <div className="welcome-text bold">
                        we're here for you
                    </div>
                    <div className="welcome-text small">
                        wanna give it a try?
                    </div>
                    <div className="welcome-love">
                        love,
                    </div>
                    <div className="welcome-signature">
                        Our Team
                    </div>
                </div>
            ),
            showSkip: true,
            nextText: "Next",
            showBack: false
        },
        // Name Step
        {
            title: "What's your name?",
            subtitle: "let's get to know you",
            content: (
                <div>
                    <input
                        type="text"
                        placeholder="Your name"
                        value={formData.name}
                        onChange={(e) => updateFormData('name', e.target.value)}
                        className="form-input"
                    />
                    <div className="form-helper">
                        This helps us personalize your experience
                    </div>
                </div>
            ),
            showSkip: false,
            nextText: "Continue",
            canProceed: formData.name.trim() !== '',
            showBack: true
        },
        // Age Step
        {
            title: "How old are you?",
            subtitle: "understanding your life stage helps us serve you better",
            content: (
                <div>
                    <input
                        type="number"
                        placeholder="Your age"
                        value={formData.age}
                        onChange={(e) => updateFormData('age', e.target.value)}
                        className="form-input"
                        min="13"
                        max="120"
                    />
                    <div className="form-helper">
                        We tailor our guidance to different life stages
                    </div>
                </div>
            ),
            showSkip: false,
            nextText: "Continue",
            canProceed: formData.age !== '' && parseInt(formData.age) >= 13,
            showBack: true
        },
        // Gender Step
        {
            title: "How do you identify?",
            subtitle: "this helps us understand your perspective",
            content: (
                <div className="gender-options">
                    {['Woman', 'Man', 'Non-binary', 'Prefer not to say', 'Other'].map((option) => (
                        <button
                            key={option}
                            onClick={() => updateFormData('gender', option)}
                            className={`gender-option ${formData.gender === option ? 'selected' : ''}`}
                        >
                            {option}
                        </button>
                    ))}
                </div>
            ),
            showSkip: false,
            nextText: "Continue",
            canProceed: formData.gender !== '',
            showBack: true
        },
        // Aspirations Step
        {
            title: "What are your aspirations for the next 6 months?",
            subtitle: "share what matters most to you right now",
            content: (
                <div>
                    <textarea
                        placeholder="I want to focus on..."
                        value={formData.aspirations}
                        onChange={(e) => updateFormData('aspirations', e.target.value)}
                        rows="6"
                        className="form-textarea"
                    />
                    <div className="form-helper">
                        This helps us provide more relevant prompts and insights
                    </div>
                </div>
            ),
            showSkip: false,
            nextText: "Continue",
            canProceed: formData.aspirations.trim().length > 10,
            showBack: true
        },
        // Terms and Conditions Step
        {
            title: "Terms & Conditions",
            subtitle: "just a few important things to cover",
            content: (
                <div>
                    <div className="terms-content">
                        <div className="terms-section">
                            <h4>Privacy & Data</h4>
                            <p>Your journal entries are private and encrypted. We use your data to improve your experience but never share personal content.</p>
                        </div>

                        <div className="terms-section">
                            <h4>AI Guidance</h4>
                            <p>Our AI provides suggestions and insights but is not a replacement for professional mental health care.</p>
                        </div>

                        <div className="terms-section">
                            <h4>Usage</h4>
                            <p>Tranquil is designed for personal reflection and growth. Please use respectfully and in accordance with our community guidelines.</p>
                        </div>

                        <div className="terms-section">
                            <h4>Support</h4>
                            <p>If you're experiencing a mental health crisis, please contact emergency services or a mental health professional immediately.</p>
                        </div>
                    </div>

                    <label className="terms-checkbox">
                        <input
                            type="checkbox"
                            checked={formData.termsAccepted}
                            onChange={(e) => updateFormData('termsAccepted', e.target.checked)}
                        />
                        <span>
                            I agree to the Terms & Conditions and Privacy Policy. I understand that Tranquil provides guidance for personal reflection and is not a substitute for professional mental health care.
                        </span>
                    </label>
                </div>
            ),
            showSkip: false,
            nextText: "Start Journaling",
            canProceed: formData.termsAccepted,
            isLastStep: true,
            showBack: true
        }
    ];

    const currentStepData = steps[currentStep];

    return (
        <div className="welcome-card-overlay">
            <div className="welcome-card">
                {/* Progress indicator */}
                <div className="progress-indicator">
                    {currentStep + 1} / {steps.length}
                </div>

                {/* Progress bar */}
                <div className="progress-bar-container">
                    <div
                        className="progress-bar"
                        style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                    ></div>
                </div>

                {/* Content */}
                {currentStep === 0 ? (
                    // Welcome step with emoji
                    <div>
                        <div className="welcome-emoji">{currentStepData.title}</div>
                        <div className="welcome-text small">{currentStepData.subtitle}</div>
                        {currentStepData.content}
                    </div>
                ) : (
                    // Other steps
                    <div>
                        <h1 className="step-title">{currentStepData.title}</h1>
                        <div className="step-subtitle">{currentStepData.subtitle}</div>
                        <div className="step-content">
                            {currentStepData.content}
                        </div>
                    </div>
                )}

                {/* Navigation buttons */}
                <div className="welcome-actions">
                    {currentStepData.showBack ? (
                        <button
                            onClick={prevStep}
                            className="welcome-button skip"
                        >
                            Back
                        </button>
                    ) : currentStepData.showSkip ? (
                        <button
                            onClick={() => setCurrentStep(steps.length - 1)}
                            className="welcome-button skip"
                        >
                            Skip
                        </button>
                    ) : (
                        <div></div>
                    )}

                    <button
                        onClick={currentStepData.isLastStep ? handleComplete : nextStep}
                        disabled={currentStepData.canProceed !== undefined && !currentStepData.canProceed}
                        className={`welcome-button next ${currentStepData.canProceed !== undefined && !currentStepData.canProceed ? 'disabled' : ''
                            }`}
                    >
                        {currentStepData.nextText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WelcomeMessageCard;