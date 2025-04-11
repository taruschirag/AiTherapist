const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export const signUp = async (email, password) => {
    const response = await fetch(`${API_URL}/api/signup`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to sign up');
    }

    const data = await response.json();
    console.log("Raw signup response from backend:", data);
    return data;
};

export const login = async (email, password) => {
    const response = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to login. Please check your credentials and try again.');
    }

    const data = await response.json();
    return data;
};

export const logout = async () => {
    // Clear local storage or any stored tokens
    localStorage.removeItem('auth.token');
}; 