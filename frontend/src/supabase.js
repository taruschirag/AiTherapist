import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_KEY = process.env.REACT_APP_SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("Supabase URL or Key is missing. Check your .env file.");
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// 🚀 Signup Function
export const signUpUser = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({
        email,
        password
    });

    if (error) {
        console.error("Signup Error:", error.message);
        return null;
    }

    console.log("User signed up:", data);
    return data;
};

// 🚀 Login Function
export const loginUser = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        console.error("Login Error:", error.message);
        return null;
    }

    console.log("User logged in:", data);
    localStorage.setItem("token", data.session.access_token);  // Store token
    return data;
};

// 🚀 Logout Function
export const logoutUser = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
        console.error("Logout Error:", error.message);
    } else {
        console.log("User logged out");
        localStorage.removeItem("token");
    }
};

// 🚀 Fetch Protected Data (With Authorization Header)
export const fetchProtectedData = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
        console.error("No token found, user must log in.");
        return;
    }

    const response = await fetch("http://localhost:8000/api/protected", {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        }
    });

    const data = await response.json();
    console.log("Protected Data:", data);
};
