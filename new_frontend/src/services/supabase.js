// src/supabase.js
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("Supabase URL or Key is missing. Check your .env file.");
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

//  Signup
export const signUpUser = async (email, password) => {
    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password
        });

        if (error) throw error;
        return data;
    } catch (error) {
        console.error("Signup Error:", error.message);
        return null;
    }
};

//  Login
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

export const getUserJournals = async (userId) => {
    const { data, error } = await supabase
        .from('Journals') // Case-sensitive table name!
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Failed to fetch journal entries:", error.message);
        return [];
    }

    return data;
};
