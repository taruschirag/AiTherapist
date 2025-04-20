import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import './JournalPage.css';
import { motion } from 'framer-motion';


function JournalPage() {
  const user = { id: 'c75c812c-c...' }; // replace with your test UUID
  const [journalEntries, setJournalEntries] = useState([]);
  const [calendarData, setCalendarData] = useState({
    currentMonth: new Date(),
    journalDates: {}
  });

  const [currentEntry, setCurrentEntry] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const handleEntryChange = (e) => setCurrentEntry(e.target.value);

  // 🔍 Fetch user journal entries from Supabase
  const getUserJournals = async (userId) => {

    const { data, error } = await supabase
      .from('Journals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Failed to fetch journal entries:", error.message);
      return [];
    }

    return data;
  };

  useEffect(() => {
    const fetchJournals = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const entries = await getUserJournals(user.id);
      setJournalEntries(entries);

      // Mark journal dates on calendar
      const datesObject = entries.reduce((acc, entry) => {
        const formattedDate = new Date(entry.created_at).toISOString().split('T')[0];
        acc[formattedDate] = true;
        return acc;
      }, {});

      setCalendarData((prev) => ({
        ...prev,
        journalDates: datesObject
      }));

      setLoading(false);
    };

    fetchJournals();
  }, []);

  const handleSubmit = async () => {
    if (!currentEntry.trim()) {
      alert('Please write something in your journal before submitting.');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert('User not found.');
      return;
    }

    try {
      const { error } = await supabase
        .from('Journals')
        .insert([{
          user_id: user.id,
          content: currentEntry
        }]);

      if (error) throw error;

      const today = new Date().toISOString().split('T')[0];
      setCalendarData(prevData => ({
        ...prevData,
        journalDates: {
          ...prevData.journalDates,
          [today]: true
        }
      }));

      setCurrentEntry('');
      navigate('/home');
    } catch (error) {
      console.error('Error saving journal entry:', error);
      alert(`Failed to save your journal entry: ${error.message}`);
    }
  };

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

    const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
      <div key={day} className="calendar-weekday">{day}</div>
    ));

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    for (let day = 1; day <= daysCount; day++) {
      const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const hasEntry = calendarData.journalDates[dateString];
      const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();

      let dayClass = "calendar-day";
      if (hasEntry) {
        dayClass += " entry-exists"; // Green for days with entries
      } else {
        dayClass += " no-entry"; // Red for days without entries
      }
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
        <div className="calendar-weekdays">{weekdays}</div>
        <div className="calendar-days">{days}</div>
        <div className="calendar-legend">
          <div className="legend-item">
            <div className="legend-color entry-exists"></div>
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
    <motion.div
      className="journal-page-container"
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, ease: 'easeOut' }}>
      <div className="journal-content-wrapper">
        <div className="journal-section">
          <h1 className="journal-header">Your Journal</h1>
          <div className="journal-input-area">
            <h2 className="journal-prompt">How was your day?</h2>
            <textarea
              value={currentEntry}
              onChange={handleEntryChange}
              className="journal-textarea"
              placeholder="Start writing here..."
            />

            {journalEntries.map(entry => (
              <div key={entry.journal_id} className="previous-entry">
                <p className="entry-content">{entry.content}</p>
                <p className="entry-timestamp">{new Date(entry.created_at).toLocaleString()}</p>
              </div>
            ))}

            <button onClick={handleSubmit} className="finish-entry-button">
              Finish Entry
            </button>
          </div>
        </div>

        <div className="calendar-section">
          {renderCalendar()}
        </div>
      </div>
    </motion.div >
  );
}

export default JournalPage;