import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import apiService from '../services/api';
import './JournalPage.css';

function JournalPage() {
  const [journalEntries, setJournalEntries] = useState([]);
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  // Fetch existing journal entries when component mounts
  useEffect(() => {
    const fetchJournalEntries = async () => {
      try {
        const response = await apiService.getJournalDates();
        const dates = response.dates || []; // Get dates array from response
        
        // Convert dates array to object format for calendar
        const datesObject = dates.reduce((acc, date) => {
          // Convert date string to YYYY-MM-DD format
          const formattedDate = new Date(date).toISOString().split('T')[0];
          acc[formattedDate] = true;
          return acc;
        }, {});

        setCalendarData(prevData => ({
          ...prevData,
          journalDates: datesObject
        }));

        // TODO: Implement endpoint to fetch journal entries
        // const entries = await apiService.getJournalEntries();
        // setJournalEntries(entries);
      } catch (error) {
        console.error('Error fetching journal data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchJournalEntries();
    }
  }, [user]);

  const [calendarData, setCalendarData] = useState({
    currentMonth: new Date(),
    journalDates: {}
  });

  const [currentEntry, setCurrentEntry] = useState("");
  const navigate = useNavigate();

  const handleEntryChange = (e) => setCurrentEntry(e.target.value);

  const handleSubmit = async () => {
    if (!currentEntry.trim()) {
      alert('Please write something in your journal before submitting.');
      return;
    }

    try {
      // Save the journal entry
      await apiService.saveJournalAndGoals(
        {
          yearly: "Not specified",  // Provide default values instead of empty strings
          monthly: "Not specified",
          weekly: "Not specified"
        },
        currentEntry
      );

      // Update calendar data
      const today = new Date().toISOString().split('T')[0];
      setCalendarData(prevData => ({
        ...prevData,
        journalDates: {
          ...prevData.journalDates,
          [today]: true
        }
      }));

      // Clear the current entry
      setCurrentEntry("");

      // Navigate to reflection page
      navigate('/reflect');
    } catch (error) {
      console.error('Error saving journal entry:', error);
      let errorMessage = 'Failed to save your journal entry. Please try again.';
      
      if (error.response && error.response.data) {
        console.error('Error response:', error.response.data);
        errorMessage = `Failed to save your journal entry: ${error.response.data.detail || JSON.stringify(error.response.data)}`;
      }
      
      alert(errorMessage);
    }
  };

  // Calendar functions
  const daysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (month, year) => new Date(year, month, 1).getDay();

  const renderCalendar = () => {
    const month = calendarData.currentMonth.getMonth();
    const year = calendarData.currentMonth.getFullYear();
    const daysCount = daysInMonth(month, year);
    const firstDay = firstDayOfMonth(month, year);

    const days = [];
    const monthNames = ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"];

    // Add month and year header
    const calendarHeader = (
      <div className="calendar-header">
        <button
          onClick={() => setCalendarData({
            ...calendarData,
            currentMonth: new Date(year, month - 1)
          })}
          className="calendar-nav-btn"
        >
          &lt;
        </button>
        <span className="calendar-month">
          {monthNames[month]} {year}
        </span>
        <button
          onClick={() => setCalendarData({
            ...calendarData,
            currentMonth: new Date(year, month + 1)
          })}
          className="calendar-nav-btn"
        >
          &gt;
        </button>
      </div>
    );

    // Add weekday headers
    const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
      <div key={day} className="calendar-weekday">{day}</div>
    ));

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    // Add days of the month
    for (let day = 1; day <= daysCount; day++) {
      const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const hasEntry = calendarData.journalDates[dateString];
      const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();

      let dayClass = "calendar-day";
      if (hasEntry === true) dayClass += " has-entry";
      else if (hasEntry === false) dayClass += " no-entry";
      if (isToday) dayClass += " today";

      days.push(
        <div key={day} className={dayClass}>
          {day}
        </div>
      );
    }

    return (
      <div className="calendar-container">
        {calendarHeader}
        <div className="calendar-weekdays">
          {weekdays}
        </div>
        <div className="calendar-days">
          {days}
        </div>
        <div className="calendar-legend">
          <div className="legend-item">
            <div className="legend-color has-entry"></div>
            <span>Journal Entry</span>
          </div>
          <div className="legend-item">
            <div className="legend-color no-entry"></div>
            <span>No Entry</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="journal-page-container">
      {/* Main content area - split into two sections */}
      <div className="journal-content-wrapper">
        {/* Journal section - 75% width */}
        <div className="journal-section">
          <h1 className="journal-header">Chirag's Journal</h1>
          <div className="journal-input-area">
            <h2 className="journal-prompt">Tell Me About Your Day, Chirag</h2>
            <textarea
              value={currentEntry}
              onChange={handleEntryChange}
              className="journal-textarea"
              placeholder="Start writing here..."
            />

            {journalEntries.map(entry => (
              <div key={entry.id} className="previous-entry">
                <p className="entry-content">{entry.content}</p>
                {entry.reflections.map((reflection, index) => (
                  <div key={index} className="reflection-item">
                    <p className="reflection-question">{reflection.question}</p>
                    <p className="reflection-answer">{reflection.answer}</p>
                  </div>
                ))}
              </div>
            ))}

            <button onClick={handleSubmit} className="finish-entry-button">
              Finish Entry
            </button>
          </div>
        </div>

        {/* Calendar section - 25% width */}
        <div className="calendar-section">
          {renderCalendar()}
        </div>
      </div>
    </div>
  );
}

export default JournalPage;