// src/styles/theme.js
export const colors = {
    primary: '#5B8E7D',  // Soft Teal
    secondary: '#7FC4A3', // Lighter Teal
    accent: '#E0B96A',   // Warm Gold for highlights and CTAs
    background: '#F5F3EB', // Creamy background
    chatBubbleUser: '#E0E0E0',  // Light grey for user bubbles (neutral)
    chatBubbleAssistant: '#B2DFDB', // Light teal for assistant bubbles
    text: '#333333', // Dark grey for good contrast
    lightText: '#555555', // Slightly lighter grey
    white: '#FFFFFF',
    error: '#E57373', // Soft red
    success: '#81C784', // Soft green
};

export const fonts = {
    regular: 'System',
    medium: 'System',
    bold: 'System',
    light: 'System',
};

export const spacing = {
    xs: 4,
    s: 8,
    m: 16,
    l: 24,
    xl: 32,
    xxl: 48,
};

export const borderRadius = {
    small: 4,
    medium: 8,
    large: 16,
    extraLarge: 24,
};

export const shadows = {
    small: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.41,
        elevation: 2,
    },
    medium: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.23,
        shadowRadius: 2.62,
        elevation: 4,
    },
    large: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        elevation: 8,
    },
};