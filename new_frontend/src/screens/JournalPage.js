import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import './JournalPage.css';

function JournalPage() {
  const [calendarData, setCalendarData] = useState({
    currentMonth: new Date(),
    journalDates: {}
  });

  const [currentEntry, setCurrentEntry] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedDateEntry, setSelectedDateEntry] = useState(null);
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

  // Fetch journal entry for specific date// Fetch journal entry for specific date
  const getJournalForDate = async (userId, dateString) => { // Renamed 'date' to 'dateString' for clarity
    // Construct UTC start and end times directly from the YYYY-MM-DD string
    const startOfDayUTC = `${dateString}T00:00:00.000Z`;
    const endOfDayUTC = `${dateString}T23:59:59.999Z`;

    console.log(`Querying for date: ${dateString}, UTC Range: ${startOfDayUTC} to ${endOfDayUTC}`); // Add logging

    const { data, error } = await supabase
      .from('Journals')
      .select('*')
      .eq('user_id', userId)
      // Use the precise UTC strings for the query
      .gte('created_at', startOfDayUTC)
      .lte('created_at', endOfDayUTC)
      .maybeSingle(); // Use maybeSingle() instead of single() to handle 0 or 1 result gracefully without error

    // Note: PGRST116 means "Requested range not satisfiable" which often happens with single()
    // when no rows are found. maybeSingle() returns null instead of erroring in that case.
    if (error) {
      console.error("Failed to fetch journal entry:", error.message);
      return null;
    }

    // console.log("Fetched entry:", data); // Add logging

    return data;
  };




  useEffect(() => {
    const fetchJournals = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const entries = await getUserJournals(user.id);

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

  const handleDateClick = async (dateString) => {
    setSelectedDate(dateString);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const existingEntry = await getJournalForDate(user.id, dateString);
    setSelectedDateEntry(existingEntry);

    if (existingEntry) {
      setCurrentEntry(existingEntry.content);
    } else {
      setCurrentEntry('');
    }
  };

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
      const entryDate = selectedDate ? new Date(selectedDate) : new Date();

      if (selectedDateEntry) {
        // Update existing entry
        const { error } = await supabase
          .from('Journals')
          .update({ content: currentEntry })
          .eq('journal_id', selectedDateEntry.journal_id);

        if (error) throw error;
      } else {
        // Create new entry
        const { error } = await supabase
          .from('Journals')
          .insert([{
            user_id: user.id,
            content: currentEntry,
            created_at: entryDate.toISOString()
          }]);

        if (error) throw error;
      }

      const dateString = entryDate.toISOString().split('T')[0];
      setCalendarData(prevData => ({
        ...prevData,
        journalDates: {
          ...prevData.journalDates,
          [dateString]: true
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
      const isSelected = selectedDate === dateString;
      const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();

      let dayClass = "calendar-day";
      if (hasEntry) dayClass += " has-entry";
      if (isSelected) dayClass += " selected";
      if (isToday) dayClass += " today";

      days.push(
        <div
          key={day}
          className={dayClass}
          onClick={() => handleDateClick(dateString)}
        >
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
      <div className="journal-content-wrapper">
        <div className="journal-section">
          <h1 className="journal-header">Your Journal</h1>
          <div className="journal-input-area">
            <h2 className="journal-prompt">
              {selectedDate
                ? `Journal for ${new Date(selectedDate).toLocaleDateString()}`
                : 'How was your day?'}
            </h2>
            <textarea
              value={currentEntry}
              onChange={handleEntryChange}
              className="journal-textarea"
              placeholder={selectedDate
                ? `Write your journal entry for ${new Date(selectedDate).toLocaleDateString()}...`
                : "Start writing here..."}
            />

            <button onClick={handleSubmit} className="finish-entry-button">
              {selectedDateEntry ? 'Update Entry' : 'Finish Entry'}
            </button>
          </div>
        </div>

        <div className="calendar-section">
          {renderCalendar()}
        </div>
      </div>
    </div>
  );
}

export default JournalPage;