import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import apiService from '../services/api';
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
    const [summaryData, setSummaryData] = useState({
        highs: [],
        lows: [],
        emotions: []
    });
    const messagesEndRef = useRef(null);
    const [journalSummary, setJournalSummary] = useState(null);

    // Fetch all chat sessions for the user ONCE and handle today's session
    useEffect(() => {
        const fetchAndInitializeSessions = async () => {
            if (!user) return;

            setIsLoadingSessions(true); // Start loading indicator
            console.log("Fetching chat sessions for user:", user.id);

            try {
                console.log("Checking user ID before fetching sessions:", user?.id);
                // Use API service instead of direct Supabase call
                const response = await apiService.getUserChatSessions();
                const sessions = response || [];
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
                    // Use API service to create a new session
                    const newSession = await apiService.createChatSession();
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

                // Try to restore the last selected session from localStorage
                const lastSelectedSessionId = localStorage.getItem('lastSelectedSessionId');
                if (lastSelectedSessionId && formattedSessions.some(s => s.id === lastSelectedSessionId)) {
                    currentSessionIdToSelect = lastSelectedSessionId;
                    console.log("Restoring last selected session:", currentSessionIdToSelect);
                } else if (todaySession) {
                    currentSessionIdToSelect = todaySession.session_id;
                    console.log("Selecting today's session:", currentSessionIdToSelect);
                } else if (formattedSessions.length > 0) {
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
    }, [user]); // Dependency array ensures this runs when the user object is available/changes

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
                // Get messages from API
                const messages = await apiService.getChatMessages(selectedSessionId);
                console.log("Messages received from API:", messages);

                // Format messages for display
                const formattedMessages = messages.map(msg => ({
                    id: msg.chat_id,
                    text: msg.content,
                    isUser: msg.role === 'user',
                    timestamp: new Date(msg.created_at)
                }));

                console.log("Formatted messages for display:", formattedMessages);
                setConversation(formattedMessages);
            } catch (error) {
                console.error("Error fetching messages:", error);
                setConversation([]); // Reset on error
            } finally {
                setIsLoadingMessages(false);
            }
        };

        if (selectedSessionId) {
            console.log("Selected session changed, fetching messages for:", selectedSessionId);
            fetchMessages();
        }
    }, [selectedSessionId]); // Only re-run when selectedSessionId changes

    // Add debug logging for conversation changes
    useEffect(() => {
        console.log("Conversation state updated:", conversation);
    }, [conversation]);

    // Save selected session ID to localStorage whenever it changes
    useEffect(() => {
        if (selectedSessionId) {
            localStorage.setItem('lastSelectedSessionId', selectedSessionId);
        }
    }, [selectedSessionId]);

    // Scroll to bottom effect
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [conversation]); // Run when conversation updates

    const handleSendMessage = async () => {
        if (!newMessage.trim() || isSending || !selectedSessionId) return; // Ensure session is selected

        // Create the message object outside try block so it's accessible in catch
        const messageToSend = newMessage.trim();
        const userMessage = {
            id: `temp-${Date.now()}`, // Temporary ID
            text: messageToSend,
            isUser: true,
            timestamp: new Date()
        };

        try {
            setIsSending(true);
            const sessionId = selectedSessionId; // Use the currently selected session

            // Optimistic UI update for user message
            setConversation(prev => [...prev, userMessage]);
            setNewMessage("");

            // Send message using API service
            const response = await apiService.sendSessionMessage(sessionId, messageToSend);
            console.log("Message sent, response:", response);

            // If the API returns both user and AI messages, update the conversation
            if (response.userMessage && response.aiMessage) {
                setConversation(prev => {
                    // Remove the optimistic message
                    const withoutOptimistic = prev.filter(msg => msg.id !== userMessage.id);

                    // Add both the confirmed user message and AI response
                    return [
                        ...withoutOptimistic,
                        {
                            id: response.userMessage.chat_id,
                            text: response.userMessage.content,
                            isUser: true,
                            timestamp: new Date(response.userMessage.created_at)
                        },
                        {
                            id: response.aiMessage.chat_id,
                            text: response.aiMessage.content,
                            isUser: false,
                            timestamp: new Date(response.aiMessage.created_at)
                        }
                    ];
                });
            } else {
                // If we don't get both messages back, refresh the entire conversation
                const refreshResponse = await apiService.getChatMessages(sessionId);
                if (refreshResponse?.messages) {
                    const refreshedMessages = refreshResponse.messages
                        .filter(msg => msg && msg.content && msg.role)
                        .map(msg => ({
                            id: msg.chat_id,
                            text: msg.content,
                            isUser: msg.role === 'user',
                            timestamp: new Date(msg.created_at)
                        }))
                        .sort((a, b) => a.timestamp - b.timestamp);
                    setConversation(refreshedMessages);
                }
            }
        } catch (error) {
            console.error('Error sending message:', error);
            // Remove the optimistic message and show error
            setConversation(prev => prev.filter(msg => msg.id !== userMessage.id));
            // Add error message
            setConversation(prev => [...prev, {
                id: `error-${Date.now()}`,
                text: "Sorry, couldn't send message. Please try again.",
                isUser: false,
                timestamp: new Date()
            }]);
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

    const toggleSummary = async () => {
        // If we're about to open, and haven't loaded yet:
        if (!showSummary && !journalSummary) {
            try {
                const today = new Date()
                const endDate = today.toISOString().slice(0, 10)
                const start = new Date(); start.setDate(today.getDate() - 6)
                const startDate = start.toISOString().slice(0, 10)

                // try GET, fall back to POST
                let summary
                try {
                    summary = await apiService.getJournalSummary(startDate, endDate)
                } catch (err) {
                    if (err.response?.status === 404) {
                        summary = await apiService.createJournalSummary(startDate, endDate)
                    } else {
                        throw err
                    }
                }

                console.log("Fetched or created journal summary:", summary)
                setJournalSummary(summary)

            } catch (e) {
                console.error("Error fetching summary:", e)
            }
        }

        setShowSummary(s => !s)
    }


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

    const weekDate = "Week of " + new Date().toLocaleDateString();
    const selectedSessionIsCurrent = chatSessions.find(s => s.id === selectedSessionId)?.isCurrent ?? false;

    return (
        <div className="reflection-screen">
            <div className="reflection-header">
                <h1>Your Reflection Corner</h1>
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

                {/* Summary Section */}
                {showSummary && (
                    <div className="summary-section">
                        <h2>Summary ({weekDate})</h2>
                        <div className="summary-content">
                            <p>
                                From {journalSummary.start_date} to {journalSummary.end_date}
                            </p>
                            <p>{journalSummary.summary_text}</p>


                        </div>
                    </div>
                )}



            </div>
        </div>
    );
};

export default ReflectionScreen;