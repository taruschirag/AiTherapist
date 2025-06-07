import React, { useState } from 'react';

const OnboardingFlow = () => {
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

    const handleComplete = () => {
        console.log('Onboarding completed with data:', formData);
        alert('Welcome to Tranquil! Your journey begins now.');
    };

    const steps = [
        // Welcome Step
        {
            title: ":)",
            subtitle: "hi friend",
            content: (
                <div className="text-center space-y-4">
                    <p className="text-gray-600">
                        we created <strong>Tranquil</strong> because life can be a LOT
                    </p>
                    <p className="text-gray-600">
                        sometimes you need help making sense of your thoughts
                    </p>
                    <p className="text-gray-600">
                        whether you're navigating a rough day,<br />
                        or just need a moment to breathe
                    </p>
                    <p className="text-gray-800 font-medium text-lg mt-6">
                        we're here for you
                    </p>
                    <p className="text-gray-600">
                        wanna give it a try?
                    </p>
                    <p className="text-gray-500 italic mt-6">
                        love,<br />
                        <em>Our Team</em>
                    </p>
                </div>
            ),
            showSkip: true,
            nextText: "Next"
        },
        // Name Step
        {
            title: "What's your name?",
            subtitle: "let's get to know you",
            content: (
                <div className="space-y-4">
                    <input
                        type="text"
                        placeholder="Your name"
                        value={formData.name}
                        onChange={(e) => updateFormData('name', e.target.value)}
                        className="w-full p-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300 text-center text-lg"
                    />
                    <p className="text-gray-500 text-sm text-center">
                        This helps us personalize your experience
                    </p>
                </div>
            ),
            showSkip: false,
            nextText: "Continue",
            canProceed: formData.name.trim() !== ''
        },
        // Age Step
        {
            title: "How old are you?",
            subtitle: "understanding your life stage helps us serve you better",
            content: (
                <div className="space-y-4">
                    <input
                        type="number"
                        placeholder="Your age"
                        value={formData.age}
                        onChange={(e) => updateFormData('age', e.target.value)}
                        className="w-full p-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300 text-center text-lg"
                        min="13"
                        max="120"
                    />
                    <p className="text-gray-500 text-sm text-center">
                        We tailor our guidance to different life stages
                    </p>
                </div>
            ),
            showSkip: false,
            nextText: "Continue",
            canProceed: formData.age !== '' && parseInt(formData.age) >= 13
        },
        // Gender Step
        {
            title: "How do you identify?",
            subtitle: "this helps us understand your perspective",
            content: (
                <div className="space-y-3">
                    {['Woman', 'Man', 'Non-binary', 'Prefer not to say', 'Other'].map((option) => (
                        <button
                            key={option}
                            onClick={() => updateFormData('gender', option)}
                            className={`w-full p-4 rounded-lg border-2 transition-all ${formData.gender === option
                                    ? 'border-orange-400 bg-orange-50 text-orange-800'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                        >
                            {option}
                        </button>
                    ))}
                </div>
            ),
            showSkip: false,
            nextText: "Continue",
            canProceed: formData.gender !== ''
        },
        // Aspirations Step
        {
            title: "What are your aspirations for the next 6 months?",
            subtitle: "share what matters most to you right now",
            content: (
                <div className="space-y-4">
                    <textarea
                        placeholder="I want to focus on..."
                        value={formData.aspirations}
                        onChange={(e) => updateFormData('aspirations', e.target.value)}
                        rows="6"
                        className="w-full p-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none"
                    />
                    <p className="text-gray-500 text-sm text-center">
                        This helps us provide more relevant prompts and insights
                    </p>
                </div>
            ),
            showSkip: false,
            nextText: "Continue",
            canProceed: formData.aspirations.trim().length > 10
        },
        // Terms and Conditions Step
        {
            title: "Terms & Conditions",
            subtitle: "just a few important things to cover",
            content: (
                <div className="space-y-6">
                    <div className="bg-gray-50 p-4 rounded-lg text-sm space-y-3 max-h-48 overflow-y-auto">
                        <h4 className="font-semibold">Privacy & Data</h4>
                        <p>Your journal entries are private and encrypted. We use your data to improve your experience but never share personal content.</p>

                        <h4 className="font-semibold">AI Guidance</h4>
                        <p>Our AI provides suggestions and insights but is not a replacement for professional mental health care.</p>

                        <h4 className="font-semibold">Usage</h4>
                        <p>Tranquil is designed for personal reflection and growth. Please use respectfully and in accordance with our community guidelines.</p>

                        <h4 className="font-semibold">Support</h4>
                        <p>If you're experiencing a mental health crisis, please contact emergency services or a mental health professional immediately.</p>
                    </div>

                    <label className="flex items-start space-x-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={formData.termsAccepted}
                            onChange={(e) => updateFormData('termsAccepted', e.target.checked)}
                            className="mt-1 w-4 h-4 text-orange-500 rounded focus:ring-orange-300"
                        />
                        <span className="text-sm text-gray-700">
                            I agree to the Terms & Conditions and Privacy Policy. I understand that Tranquil provides guidance for personal reflection and is not a substitute for professional mental health care.
                        </span>
                    </label>
                </div>
            ),
            showSkip: false,
            nextText: "Start Journaling",
            canProceed: formData.termsAccepted,
            isLastStep: true
        }
    ];

    const currentStepData = steps[currentStep];

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md relative">
                {/* Progress indicator */}
                <div className="absolute top-4 right-4 text-xs text-gray-400">
                    {currentStep + 1} / {steps.length}
                </div>

                {/* Progress bar */}
                <div className="mb-8">
                    <div className="w-full bg-gray-200 rounded-full h-1">
                        <div
                            className="bg-orange-400 h-1 rounded-full transition-all duration-300 ease-out"
                            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                        ></div>
                    </div>
                </div>

                {/* Content */}
                <div className="text-center space-y-6">
                    <div>
                        <h1 className="text-3xl font-light text-gray-800 mb-2">
                            {currentStepData.title}
                        </h1>
                        <p className="text-gray-600 text-sm">
                            {currentStepData.subtitle}
                        </p>
                    </div>

                    <div className="py-4">
                        {currentStepData.content}
                    </div>

                    {/* Navigation buttons */}
                    <div className="flex justify-between items-center pt-6">
                        {currentStep > 0 ? (
                            <button
                                onClick={prevStep}
                                className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                            >
                                Back
                            </button>
                        ) : currentStepData.showSkip ? (
                            <button
                                onClick={() => setCurrentStep(steps.length - 1)}
                                className="px-6 py-2 text-gray-500 hover:text-gray-700 transition-colors"
                            >
                                Skip
                            </button>
                        ) : (
                            <div></div>
                        )}

                        <button
                            onClick={currentStepData.isLastStep ? handleComplete : nextStep}
                            disabled={currentStepData.canProceed !== undefined && !currentStepData.canProceed}
                            className={`px-8 py-3 rounded-lg font-medium transition-all ${currentStepData.canProceed !== undefined && !currentStepData.canProceed
                                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                    : 'bg-orange-400 hover:bg-orange-500 text-white shadow-md hover:shadow-lg'
                                }`}
                        >
                            {currentStepData.nextText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OnboardingFlow;