import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { supabase, getUserChatSessions, getChatMessages } from '../services/supabase';
import './ReflectionScreen.css';

// --- Helper function to format date (more robust) ---
const formatDate = (dateInput) => {
    const date = new Date(dateInput);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
        return "Today";
    }
    if (date.toDateString() === yesterday.toDateString()) {
        return "Yesterday";
    }
    // Use a consistent format like MM/DD/YYYY for others
    return date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' });
};
// --- End Helper ---

const ReflectionScreen = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    // Combined loading state for clarity
    const [isLoadingSessions, setIsLoadingSessions] = useState(true);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [showSummary, setShowSummary] = useState(false);
    const [selectedSessionId, setSelectedSessionId] = useState(null); // Store ID
    const [chatSessions, setChatSessions] = useState([]);
    const [conversation, setConversation] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [isSending, setIsSending] = useState(false);
    // No need for separate currentSessionId if selectedSessionId handles it
    // const [currentSessionId, setCurrentSessionId] = useState(null);
    const messagesEndRef = useRef(null);

    // Fetch all chat sessions for the user ONCE and handle today's session
    useEffect(() => {
        const fetchAndInitializeSessions = async () => {
            if (!user) return;

            setIsLoadingSessions(true); // Start loading indicator
            console.log("Fetching chat sessions for user:", user.id);

            try {
                console.log("Checking user ID before fetching sessions:", user?.id);
                let sessions = await getUserChatSessions(user.id);
                console.log("Raw sessions received:", sessions);

                // Check if a session for today exists in the fetched list
                const today = new Date();
                let todaySession = sessions.find(session => {
                    const sessionDate = new Date(session.created_at);
                    return sessionDate.toDateString() === today.toDateString();
                });

                let currentSessionIdToSelect = null;

                // If no session exists for today, create one
                if (!todaySession) {
                    console.log("No session found for today. Creating one...");
                    const { data: newSession, error: createError } = await supabase
                        .from('ChatSessions')
                        .insert([{ user_id: user.id }])
                        .select()
                        .single();

                    if (createError) {
                        throw createError;
                    }
                    console.log("New session created:", newSession);
                    // Add the new session to the beginning of our list
                    sessions.unshift(newSession); // Add to the front
                    todaySession = newSession; // This is now our todaySession
                }

                // Now format all sessions for display
                const formattedSessions = sessions.map(session => {
                    // The 'notes' column from Supabase IS the subheader you want
                    const title = session.notes || `Session on ${formatDate(session.created_at)}`;
                    // You might want a shorter preview, maybe first message or just static text
                    const preview = session.notes || 'No notes for this session.'; // Or fetch first message later if needed

                    return {
                        id: session.session_id,
                        date: formatDate(session.created_at), // Use helper function
                        title: title, // Use notes if available
                        preview: preview,
                        isCurrent: new Date(session.created_at).toDateString() === today.toDateString(),
                        created_at: session.created_at // Keep original if needed
                    };
                });

                console.log("Formatted sessions for display:", formattedSessions);
                setChatSessions(formattedSessions);

                // Determine which session to select initially
                if (todaySession) {
                    currentSessionIdToSelect = todaySession.session_id;
                    console.log("Selecting today's session:", currentSessionIdToSelect);
                } else if (formattedSessions.length > 0) {
                    // If somehow today's session wasn't found/created, select the latest
                    currentSessionIdToSelect = formattedSessions[0].id;
                    console.log("Selecting the latest session:", currentSessionIdToSelect);
                } else {
                    console.log("No sessions available to select.");
                }

                setSelectedSessionId(currentSessionIdToSelect); // Set the initial selected session

            } catch (error) {
                console.error('Error fetching or initializing chat sessions:', error);
                // Handle error display to user if necessary
            } finally {
                setIsLoadingSessions(false); // Stop loading indicator
            }
        };

        fetchAndInitializeSessions();
        // Dependency array ensures this runs when the user object is available/changes
    }, [user]);

    // Fetch messages when the selected session changes
    useEffect(() => {
        const fetchMessages = async () => {
            if (!selectedSessionId) {
                setConversation([]); // Clear conversation if no session is selected
                return;
            }

            setIsLoadingMessages(true); // Indicate message loading
            console.log("Fetching messages for session:", selectedSessionId);
            try {
                const messages = await getChatMessages(selectedSessionId);
                console.log("Raw messages received:", messages);

                const formattedMessages = messages.map(msg => ({
                    id: msg.chat_id,
                    text: msg.content,
                    isUser: msg.role === 'user',
                    timestamp: new Date(msg.created_at)
                })).sort((a, b) => a.timestamp - b.timestamp); // Ensure messages are chronological

                console.log("Formatted messages:", formattedMessages);
                setConversation(formattedMessages);
            } catch (error) {
                console.error(`Error fetching messages for session ${selectedSessionId}:`, error);
                setConversation([]); // Clear conversation on error
            } finally {
                setIsLoadingMessages(false); // Stop message loading
            }
        };

        fetchMessages();
    }, [selectedSessionId]); // Re-run ONLY when selectedSessionId changes

    // Scroll to bottom effect
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [conversation]); // Run when conversation updates


    const handleSendMessage = async () => {
        if (!newMessage.trim() || isSending || !selectedSessionId) return; // Ensure session is selected

        try {
            setIsSending(true);
            const messageToSend = newMessage.trim();
            const sessionId = selectedSessionId; // Use the currently selected session

            // Optimistic UI update for user message
            const userMessage = {
                id: `temp-${Date.now()}`, // Temporary ID
                text: messageToSend,
                isUser: true,
                timestamp: new Date()
            };
            setConversation(prev => [...prev, userMessage]);
            setNewMessage("");

            // --- Save user message ---
            const { data: savedUserMsg, error: insertError } = await supabase
                .from('ChatMessages')
                .insert([{
                    session_id: sessionId,
                    user_id: user.id,
                    content: messageToSend,
                    role: 'user'
                }])
                .select()
                .single();

            console.log("Inserting message for session ID:", selectedSessionId, "and user:", user.id);
            if (insertError) throw insertError;

            // --- Get AI Response (Replace with actual API call) ---
            console.log("Simulating AI response...");
            // await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate delay
            const aiReplyText = "Thanks for sharing. How did that make you feel?"; // Example response

            // --- Save AI message ---
            const { data: savedAiMsg, error: aiInsertError } = await supabase
                .from('ChatMessages')
                .insert([{
                    session_id: sessionId,
                    user_id: user.id,
                    content: aiReplyText,
                    role: 'assistant'
                }])
                .select()
                .single();

            if (aiInsertError) throw aiInsertError;

            // Update UI with actual saved messages (replace optimistic ones if needed)
            // Or simply add the AI message
            const aiMessage = {
                id: savedAiMsg.chat_id, // Use actual ID from DB
                text: savedAiMsg.content,
                isUser: false,
                timestamp: new Date(savedAiMsg.created_at)
            };

            // Replace optimistic user message with actual one if needed, or just add AI
            setConversation(prev => {
                // Option 1: Replace optimistic user message
                // const updated = prev.map(msg => msg.id === userMessage.id ? { ...userMessage, id: savedUserMsg.chat_id, timestamp: new Date(savedUserMsg.created_at) } : msg);
                // return [...updated, aiMessage];

                // Option 2: Just add AI message (simpler if optimistic ID isn't strictly needed)
                return [...prev, aiMessage];
            });


        } catch (error) {
            console.error('Error sending message:', error);
            // Add user feedback about the error
            const fallback = {
                id: `error-${Date.now()}`,
                text: "Sorry, couldn't send message. Please try again.",
                isUser: false, // Or style as an error message
                timestamp: new Date()
            };
            setConversation(prev => [...prev, fallback]);
            // Optionally remove the optimistic user message if send failed
            // setConversation(prev => prev.filter(msg => msg.id !== userMessage.id));
        } finally {
            setIsSending(false);
        }
    };


    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const toggleSummary = () => {
        setShowSummary(!showSummary);
    };

    // Renamed handler for clarity
    const handleSessionClick = (sessionId) => {
        if (sessionId !== selectedSessionId) {
            console.log("Switching selected session to:", sessionId);
            setSelectedSessionId(sessionId); // Update state to trigger message fetch
        }
    };

    // Get details of the currently selected session for display
    const getCurrentSessionDetails = () => {
        if (!selectedSessionId) {
            // Find the session marked as 'isCurrent' or default
            const current = chatSessions.find(s => s.isCurrent);
            return current || { title: "Select a Session", date: "" };
        }
        const session = chatSessions.find(s => s.id === selectedSessionId);
        return session || { title: "Loading...", date: "" }; // Fallback if session not found yet
    };

    const currentSessionDisplay = getCurrentSessionDetails();

    // Initial loading state
    if (isLoadingSessions) {
        return <div className="loading">Loading Reflection Corner...</div>;
    }

    // Check if user exists but no sessions found (after loading)
    if (user && !isLoadingSessions && chatSessions.length === 0) {
        return <div className="loading">No reflection sessions found. Start chatting to create one!</div>; // Or a more informative message
    }


    // Sample summary data (replace with actual generated summaries)
    const weekDate = "Week of " + new Date().toLocaleDateString();
    const highs = ["Completed project phase", "Good workout session", "yurd"];
    const lows = ["Felt stressed about deadline", "Missed a meeting"];
    const emotions = ["Productive but stressed", "Optimistic about weekend"];

    const selectedSessionIsCurrent = chatSessions.find(s => s.id === selectedSessionId)?.isCurrent ?? false;


    return (
        <div className="reflection-screen">
            <div className="reflection-header">
                <h1>Chirag's Reflection Corner</h1>
                <button onClick={toggleSummary} className="summary-toggle-button">
                    {showSummary ? 'Hide Summary' : 'Show Summary'}
                </button>
            </div>

            <div className="reflection-content">
                {/* Session History Sidebar */}
                <div className="chat-history-sidebar">
                    <h3>Session History</h3>
                    <div className="sessions-list">
                        {chatSessions.length === 0 && !isLoadingSessions ? (
                            <div className="session-item">No sessions yet.</div>
                        ) : (
                            chatSessions.map(session => (
                                <div
                                    key={session.id}
                                    className={`session-item ${selectedSessionId === session.id ? 'active' : ''}`}
                                    onClick={() => handleSessionClick(session.id)} // Use specific handler
                                >
                                    {/* Display the session.notes as the title */}
                                    <div className="session-title">{session.title}</div>
                                    {/* Display the formatted date */}
                                    <div className="session-date">{session.date}</div>
                                    {/* Preview is optional, could be removed or adjusted */}
                                    {/* <div className="session-preview">{session.preview}</div> */}
                                </div>
                            ))
                        )}
                        {isLoadingSessions && <div className="session-item">Loading sessions...</div>}
                    </div>
                </div>

                {/* Main Chat Area */}
                <div className={`chat-section ${showSummary ? 'with-summary' : 'full-width'}`}>
                    <div className="chat-header">
                        {/* Use details from the selected session */}
                        <h3>{currentSessionDisplay.title}</h3>
                        <span className="session-date-label">{currentSessionDisplay.date}</span>
                    </div>

                    <div className="chat-messages">
                        {isLoadingMessages ? (
                            <div className="loading">Loading messages...</div>
                        ) : conversation.length === 0 && selectedSessionId ? (
                            <div className="empty-chat-message">
                                <p>No messages found for this session. Start typing below!</p>
                            </div>
                        ) : !selectedSessionId ? (
                            <div className="empty-chat-message">
                                <p>Select a session from the history.</p>
                            </div>
                        ) : (
                            conversation.map(message => (
                                <div
                                    // Use actual DB id if available, otherwise temp id
                                    key={message.id}
                                    className={`chat-bubble ${message.isUser ? 'user-bubble' : 'therapist-bubble'}`}
                                >
                                    <p>{message.text}</p>
                                    {message.timestamp && (
                                        <small className="timestamp">
                                            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </small>
                                    )}
                                </div>
                            ))
                        )}

                        {isSending && (
                            <div className="chat-bubble therapist-bubble typing">
                                <div className="typing-indicator"><span></span><span></span><span></span></div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Only show input for the "Today" session */}
                    {(selectedSessionIsCurrent && !isLoadingMessages) && (
                        <div className="message-input-container">
                            <textarea
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyDown={handleKeyPress}
                                placeholder="Type your message here..."
                                className="message-input"
                                disabled={isSending || isLoadingMessages} // Disable during sending/loading
                            />
                            <button
                                onClick={handleSendMessage}
                                className={`send-button ${isSending ? 'sending' : ''}`}
                                disabled={!newMessage.trim() || isSending || isLoadingMessages}
                            >
                                {isSending ? 'Sending...' : 'Send'}
                            </button>
                        </div>
                    )}
                    {/* Show message if trying to type in old session */}
                    {(!selectedSessionIsCurrent && selectedSessionId && !isLoadingMessages) && (
                        <div className="message-input-container disabled-input-overlay">
                            <p>You can only add messages to the current day's session.</p>
                        </div>
                    )}


                    <button className="journal-button" onClick={() => navigate("/journal")}>
                        Go to Journal
                    </button>
                </div>

                {/* Summary Section (remains mostly the same) */}
                {showSummary && (
                    <div className="summary-section">
                        <h2>Summary ({weekDate})</h2>
                        {/* ... rest of summary content ... */}
                        <div className="summary-content">
                            <div className="category">
                                <h4>Highs</h4>
                                <ul>
                                    {highs.map((high, index) => (
                                        <li key={`high-${index}`} className="summary-item">
                                            <span className="checkmark">✓</span> {high}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="category">
                                <h4>Lows</h4>
                                <ul>
                                    {lows.map((low, index) => (
                                        <li key={`low-${index}`} className="summary-item">
                                            <span className="downmark">✗</span> {low}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="category">
                                <h4>Emotions & Mindset Shifts</h4>
                                <ul>
                                    {emotions.map((emotion, index) => (
                                        <li key={`emotion-${index}`} className="emotion-item">{emotion}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReflectionScreen;