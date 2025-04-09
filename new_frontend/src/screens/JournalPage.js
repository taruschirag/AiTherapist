import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './JournalPage.css';


function JournalPage() {
  const [journalEntries, setJournalEntries] = useState([
    {
      id: 1,
      content: "My day was fine...",
      date: new Date(),
      reflections: [
        {
          question: "What are some Positive and Negative things that happened today?",
          answer: "Positive: workout + friends. Negative: procrastinated."
        },
        {
          question: "Anything Else You want to share with me?",
          answer: "Feeling guilty about prioritizing fun over work lately."
        }
      ]
    }
  ]);

  // Sample data for calendar - in a real app, you'd calculate this from actual entries
  const [calendarData, setCalendarData] = useState({
    currentMonth: new Date(),
    journalDates: {
      // Format: 'YYYY-MM-DD': true/false (true = has entry, false = no entry)
      '2025-04-01': true,
      '2025-04-02': false,
      '2025-04-03': true,
      '2025-04-04': true,
      '2025-04-05': false,
      '2025-04-06': false,
      '2025-04-07': true,
      '2025-04-08': true,
    }
  });

  // add this when I have authentication ready
  // useEffect(() => {
  //   if (!localStorage.getItem('user')) {
  //     navigate('/login');
  //   }
  // }, []);

  const [currentEntry, setCurrentEntry] = useState("");
  const navigate = useNavigate();

  const handleEntryChange = (e) => setCurrentEntry(e.target.value);

  const handleSubmit = () => {
    console.log("Entry submitted:", currentEntry);
    navigate('/reflect');
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