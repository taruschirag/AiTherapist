import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import './JournalPage.css';

function JournalPage() {
  const [calendarData, setCalendarData] = useState({
    currentMonth: new Date(),
    journalDates: {}
  });

  // State to hold the HTML content of the editable div
  const [currentEntryContent, setCurrentEntryContent] = useState('');
  // State for the selected date string (YYYY-MM-DD)
  const [selectedDate, setSelectedDate] = useState(null);
  // State to hold the full journal entry object for the selected date (if exists)
  const [selectedDateEntry, setSelectedDateEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false); // To show saving indicator (optional)
  const [userId, setUserId] = useState(null); // Store user ID

  const navigate = useNavigate();
  const editorRef = useRef(null); // Ref for the contentEditable div
  const hasChangedRef = useRef(false); // Ref to track if content has changed since last save/load

  // --- Fetch User ID ---
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      } else {
        navigate('/login'); // Redirect if not logged in
      }
    };
    getUser();
  }, [navigate]);

  // --- Fetch Initial Journal Dates for Calendar ---
  useEffect(() => {
    if (!userId) return; // Wait for user ID

    const fetchJournalDates = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('Journals')
        .select('created_at') // Only select creation dates for efficiency
        .eq('user_id', userId);

      if (error) {
        console.error("Failed to fetch journal dates:", error.message);
      } else {
        const datesObject = data.reduce((acc, entry) => {
          try {
            // Handle potential invalid dates gracefully
            const formattedDate = new Date(entry.created_at).toISOString().split('T')[0];
            if (formattedDate) {
              acc[formattedDate] = true;
            }
          } catch (e) {
            console.warn("Skipping invalid date format in journal entry:", entry.created_at);
          }
          return acc;
        }, {});

        setCalendarData((prev) => ({
          ...prev,
          journalDates: datesObject
        }));

        // Automatically select today's date on initial load
        const todayString = new Date().toISOString().split('T')[0];
        handleDateClick(todayString); // Select today
      }
      setLoading(false); // Set loading false even if selection fails initially
    };

    fetchJournalDates();
  }, [userId]); // Rerun when userId is available

  // --- Fetch Journal Entry for a Specific Date ---
  const getJournalForDate = async (userId, dateString) => {
    const { data, error } = await supabase
      .from('Journals')
      .select('*')
      .eq('user_id', userId)
      .eq('journal_date', dateString)
      .maybeSingle();

    if (error) {
      console.error('Failed to fetch journal entry:', error);
      return null;
    }
    return data;  // will be null if no row
  };

  // --- Core Save Function ---
  const performSave = useCallback(async () => {
    if (!hasChangedRef.current || isSaving || !selectedDate || !userId) return;

    // 1) grab & clean the HTML
    let rawHtml = editorRef.current?.innerHTML || '';
    rawHtml = rawHtml
      .replace(/<div><br><\/div>/gi, '<br>')
      .replace(/<div>(.*?)<\/div>/gi, (m, p) => p.trim() ? `<p>${p}</p>` : '<br>')
      .replace(/<br\s*\/?>\s*(<br\s*\/?>)+/gi, '<br>')
      .replace(/^(\s|<br\s*\/?>)+|(\s|<br\s*\/?>)+$/g, '')
      .replace(/<p>\s*(<br\s*\/?>)?\s*<\/p>/gi, '');

    // 2) if it’s empty, bail
    if (!rawHtml.trim() || !editorRef.current.textContent.trim()) {
      hasChangedRef.current = false;
      return;
    }

    setIsSaving(true);
    try {
      // 3) upsert using the cleaned HTML
      const { data: savedEntry, error } = await supabase
        .from('Journals')
        .upsert([{
          user_id: userId,
          journal_date: selectedDate,
          content: rawHtml,           // ← use rawHtml here
        }], {
          onConflict: ['user_id', 'journal_date']
        })
        .single();

      if (error) throw error;

      // 4) update your local state
      setCalendarData(cd => ({
        ...cd,
        journalDates: { ...cd.journalDates, [selectedDate]: true }
      }));
      setSelectedDateEntry(savedEntry);
      hasChangedRef.current = false;

    } catch (err) {
      console.error('PerformSave error:', err);
    } finally {
      setIsSaving(false);
    }
  }, [selectedDate, userId, isSaving]);  // ← remove contentToSave from here
  // Dependencies for the core save logic

  // --- Handle Date Click in Calendar ---
  const handleDateClick = useCallback(async (dateString) => {
    if (!userId || dateString === selectedDate) return; // Don't re-process if same date or no user

    // Save the previous entry *before* switching dates if it changed
    if (hasChangedRef.current) {
      await performSave(); // Wait for save to complete
      hasChangedRef.current = false; // Ensure flag is reset
    }

    console.log("Selected new date:", dateString);
    setSelectedDate(dateString);
    setLoading(true); // Indicate loading for the new date's content
    setSelectedDateEntry(null); // Reset entry state
    setCurrentEntryContent(''); // Clear editor content immediately

    // Ensure editorRef is available before trying to access it
    if (editorRef.current) {
      editorRef.current.innerHTML = ''; // Clear visual editor
    }


    try {
      const existingEntry = await getJournalForDate(userId, dateString);
      if (existingEntry) {
        setSelectedDateEntry(existingEntry);
        setCurrentEntryContent(existingEntry.content);
        // Set editor content *after* state is updated
        if (editorRef.current) {
          editorRef.current.innerHTML = existingEntry.content || '';
        }
      } else {
        // No existing entry, keep state as is (empty)
        if (editorRef.current) {
          editorRef.current.innerHTML = ''; // Ensure editor is empty
        }
      }
    } catch (error) {
      console.error("Error handling date click:", error);
      // Handle error appropriately, maybe show a message
    } finally {
      setLoading(false);
      hasChangedRef.current = false; // Reset changed flag when loading new date
    }
  }, [userId, selectedDate, performSave]); // Add performSave to dependencies

  // --- Handle Input in Editor ---
  const handleEditorInput = (event) => {
    // Get HTML content from the event target
    const newContent = event.target.innerHTML;
    setCurrentEntryContent(newContent); // Update state (might be useful for other features)
    if (!hasChangedRef.current) {
      hasChangedRef.current = true; // Mark content as changed
      console.log("Content changed, marked for save.");
    }
    // Optionally trigger debounced save here if desired
    // debouncedSave();
  };

  // --- Calendar Rendering Logic (mostly unchanged, minor adjustments) ---
  const daysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (month, year) => new Date(year, month, 1).getDay();

  const renderCalendar = () => {
    if (!calendarData.currentMonth) return null; // Guard against null month

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
          onClick={() => {
            performSave(); // Save before changing month
            setCalendarData({
              ...calendarData,
              currentMonth: new Date(year, month - 1)
            });
          }}
          className="calendar-nav-btn"
        >
          &lt;
        </button>
        <span className="calendar-month">
          {monthNames[month]} {year}
        </span>
        <button
          onClick={() => {
            performSave(); // Save before changing month
            setCalendarData({
              ...calendarData,
              currentMonth: new Date(year, month + 1)
            });
          }}
          className="calendar-nav-btn"
        >
          &gt;
        </button>
      </div>
    );

    const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
      <div key={day} className="calendar-weekday">{day}</div>
    ));

    // Render empty cells before the first day
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    // Render actual days
    for (let day = 1; day <= daysCount; day++) {
      const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const hasEntry = calendarData.journalDates[dateString];
      const isSelected = selectedDate === dateString;
      const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();

      let dayClass = "calendar-day";
      if (hasEntry) dayClass += " has-entry"; // Green dot if entry exists
      if (isSelected) dayClass += " selected"; // Highlight if selected
      if (isToday) dayClass += " today"; // Optional: different style for today

      days.push(
        <div
          key={day}
          className={dayClass}
          onClick={() => handleDateClick(dateString)} // Use updated handler
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
        {/* Simplified Legend */}
        <div className="calendar-legend">
          <div className="legend-item">
            <div className="legend-color has-entry"></div>
            <span>Entry Saved</span>
          </div>
          {/* Optional: Add 'No Entry' legend if needed */}
          {/* <div className="legend-item">
                    <div className="legend-color no-entry"></div>
                    <span>No Entry</span>
                 </div> */}
        </div>
      </div>
    );
  };


  // --- Main Component Render ---
  return (
    <div className="journal-page-container modern"> {/* Add 'modern' class */}
      {/* Canvas Area */}
      <div className="journal-canvas-section">
        {loading && !selectedDate && <div className="loading-overlay">Loading Journals...</div>}
        {loading && selectedDate && <div className="loading-overlay">Loading Entry...</div>}
        {isSaving && <div className="saving-indicator">Saving...</div>}

        <div
          ref={editorRef}
          className="journal-canvas"
          contentEditable={!loading && !!selectedDate} // Only editable when not loading and a date is selected
          onInput={handleEditorInput}
          onBlur={performSave} // Save when focus leaves the editor
          // Use CSS for placeholder
          data-placeholder={selectedDate ? `Start writing for ${new Date(selectedDate + 'T12:00:00Z').toLocaleDateString()}...` : "Select a date to start writing..."}
          suppressContentEditableWarning={true} // Suppress React warning about managing contentEditable
        // Set initial content (use dangerouslySetInnerHTML ONLY for initial load if necessary, but prefer ref)
        // dangerouslySetInnerHTML={{ __html: currentEntryContent }} // Generally avoid, use ref instead
        />
      </div>

      {/* Calendar Sidebar */}
      <div className="calendar-sidebar-section">
        {renderCalendar()}
      </div>
    </div>
  );
}

export default JournalPage;