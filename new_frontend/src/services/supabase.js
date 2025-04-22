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

// In supabase.js
export const getChatMessages = async (sessionId) => {
    const { data, error } = await supabase
        .from('ChatMessages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

    if (error) {
        console.error("Failed to fetch chat messages:", error.message);
        return [];
    }

    return data;
};
// In services/supabase.js (or wherever getUserChatSessions is defined)
export const getUserChatSessions = async (userId) => {
    console.log('[getUserChatSessions] Attempting to fetch for userId:', userId); // Log input ID
    if (!userId) {
        console.error('[getUserChatSessions] No userId provided.');
        return [];
    }
    try {
        const { data, error } = await supabase
            .from('ChatSessions')
            .select('*') // Ensure you select all necessary columns (id, created_at, notes)
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            // Log the specific error from Supabase
            console.error('[getUserChatSessions] Supabase error:', error);
            // Consider re-throwing or returning empty based on how you want to handle errors
            // throw error; // Option 1: Propagate error
            return [];   // Option 2: Return empty on error
        }

        // Log the data received from Supabase *before* returning
        console.log('[getUserChatSessions] Data received from Supabase:', data);
        return data || []; // Handle null response

    } catch (catchError) {
        console.error('[getUserChatSessions] Caught exception:', catchError);
        return [];
    }
};