// src/supabase.js
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://dsdmhulhwkfidcmijqxn.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzZG1odWxod2tmaWRjbWlqcXhuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMzUyNzc3MCwiZXhwIjoyMDQ5MTAzNzcwfQ.gZij1cv0Nh2Z8fHVT2VWlDM_Q_5TEcavW7ifAElAWGo;"

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("Supabase URL or Key is missing. Check your .env file.");
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// 🔐 Signup Function
export const signUpUser = async (email, password) => {
    try {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;

        console.log("Signup successful:", data);
        return data;
    } catch (error) {
        console.error("Signup Error:", error.message);
        return null;
    }
};

// 🔐 Login Function
export const loginUser = async (email, password) => {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        console.log("Login successful:", data);
        localStorage.setItem("token", data.session.access_token);
        return data;
    } catch (error) {
        console.error("Login Error:", error.message);
        return null;
    }
};

// 🔐 Logout
export const logoutUser = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error("Logout Error:", error.message);
    } else {
        localStorage.removeItem("token");
        console.log("User logged out");
    }
};

// Optional: For testing protected API
export const fetchProtectedData = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
        console.error("No token found, please log in.");
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
