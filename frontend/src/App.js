import React, { useState, useEffect, useRef } from "react";
import "./index.css";
import JournalCalendar from './JournalCalendarComponent'

function App() {
  const [yearlyGoal, setYearlyGoal] = useState("");
  const [monthlyGoal, setMonthlyGoal] = useState("");
  const [weeklyGoal, setWeeklyGoal] = useState("");
  const [journal, setJournal] = useState("");
  const [insights, setInsights] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [chatMessages, setChatHistory] = useState([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [isChatting, setIsChatting] = useState(false);
  const chatEndRef = useRef(null);


  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const fetchChatHistory = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/api/chat-history");
      if (response.ok) {
        const data = await response.json();
        setChatHistory(data.messages);  // ✅ Now this will work!
      }
    } catch (error) {
      console.error("Error fetching chat history:", error);
    }
  };

  useEffect(() => {
    fetchChatHistory();  // ✅ Fetch chat history when the component mounts
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = {
      goals: { yearly: yearlyGoal, monthly: monthlyGoal, weekly: weeklyGoal },
      journal: journal,
    };

    try {
      const response = await fetch("http://127.0.0.1:8000/api/goals-journals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const result = await response.json();
        alert(result.message);
        setYearlyGoal("");
        setMonthlyGoal("");
        setWeeklyGoal("");
        setJournal("");
      } else {
        alert("Failed to save data.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred while saving data.");
    }
  };

  const handleTherapistInsights = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("http://127.0.0.1:8000/api/generate-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        const result = await response.json();
        setInsights(result.insights);
        setIsChatting(true); // Enable chat after insights are generated
      } else {
        const errorData = await response.json();
        alert(`Failed to generate insights: ${errorData.detail || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error:", error);
      alert(`An error occurred while generating insights: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };


  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!currentMessage.trim()) return;

    console.log("Sending message:", currentMessage);

    setChatHistory((prevHistory) => [
      ...prevHistory,
      { role: "user", content: currentMessage }
    ]);

    try {
      const response = await fetch("http://127.0.0.1:8000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: currentMessage, context: insights }),
      });

      console.log("Response received:", response);

      if (response.ok) {
        const data = await response.json();
        console.log("AI Response:", data.response);

        setChatHistory((prevHistory) => [
          ...prevHistory,
          { role: "assistant", content: data.response }
        ]);

        setCurrentMessage("");
      } else {
        console.error("API call failed:", response.status);
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };





  return (
    <div className="container">
      <h1 className="title">Goals and Journals</h1>

      <div className="layout">
        <div className="main-content">
          <form onSubmit={handleSubmit} className="form">
            <div>
              <label>Journal:</label>
              <textarea
                value={journal}
                onChange={(e) => setJournal(e.target.value)}
                className="textarea"
              />
            </div>
            <button type="submit" className="button">Submit</button>
            <button
              type="button"
              onClick={handleTherapistInsights}
              disabled={isLoading}
              className="button"
            >
              {isLoading ? "Generating Insights..." : "Need Therapy?"}
            </button>
          </form>
          {insights && (
            <div className="insights-container">
              <h2 className="insights-title">Therapist Insights</h2>
              <p className="insights-text">{insights}</p>
            </div>
          )}

          {isChatting && (
            <div className="chat-container">
              <div className="chat-messages">
                {chatMessages.map((msg, index) => (
                  <div
                    key={index}
                    className={`message ${msg.role === 'user' ? 'user-message' : 'assistant-message'}`}
                  >
                    <p>{msg.content}</p>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <form onSubmit={handleSendMessage} className="chat-input-form">
                <input
                  type="text"
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="chat-input"
                />
                <button type="submit" className="button">Send</button>
              </form>
            </div>
          )}
        </div>

        <div className="sidebar">
          <div>
            <label>Yearly Goal</label>
            <input
              type="text"
              value={yearlyGoal}
              onChange={(e) => setYearlyGoal(e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label>Monthly Goal</label>
            <input
              type="text"
              value={monthlyGoal}
              onChange={(e) => setMonthlyGoal(e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label>Weekly Goal</label>
            <input
              type="text"
              value={weeklyGoal}
              onChange={(e) => setWeeklyGoal(e.target.value)}
              className="input"
            />
          </div>
        </div>
      </div>
      <JournalCalendar />
    </div>
  );
}

export default App;