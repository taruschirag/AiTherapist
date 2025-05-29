// src/pages/JournalPage.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import apiService from '../services/api';
import './JournalPage.css';

function JournalPage() {
  const [calendarData, setCalendarData] = useState({ currentMonth: new Date(), journalDates: {} });
  const [currentEntryContent, setCurrentEntryContent] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedDateEntry, setSelectedDateEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [userId, setUserId] = useState(null);

  const navigate = useNavigate();
  const editorRef = useRef(null);
  const hasChangedRef = useRef(false);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
      else navigate('/login');
    };
    getUser();
  }, [navigate]);

  useEffect(() => {
    if (!userId) return;
    const fetchJournalDates = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('Journals')
          .select('created_at')
          .eq('user_id', userId);

        if (error) throw error;

        const datesObject = data.reduce((acc, entry) => {
          const formattedDate = new Date(entry.created_at).toISOString().split('T')[0];
          if (formattedDate) acc[formattedDate] = true;
          return acc;
        }, {});

        setCalendarData(prev => ({ ...prev, journalDates: datesObject }));
        const today = new Date().toISOString().split('T')[0];
        handleDateClick(today);
      } catch (error) {
        console.error("Failed to fetch journal dates:", error);
      }
      setLoading(false);
    };
    fetchJournalDates();
  }, [userId]);

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
    return data;
  };

  const cleanHtml = html => html
    .replace(/<div><br><\/div>/gi, '<br>')
    .replace(/<div>(.*?)<\/div>/gi, (m, p) => p.trim() ? `<p>${p}</p>` : '<br>')
    .replace(/<br\s*\/?>\s*(<br\s*\/?>)+/gi, '<br>')
    .replace(/^(\s|<br\s*\/?>)+|(\s|<br\s*\/?>)+$/g, '')
    .replace(/<p>\s*(<br\s*\/?>)?\s*<\/p>/gi, '');

  const performSave = useCallback(async () => {
    if (!hasChangedRef.current || isSaving || !selectedDate || !userId) return;

    let rawHtml = editorRef.current?.innerHTML || '';
    rawHtml = cleanHtml(rawHtml);
    if (!rawHtml.trim() || !editorRef.current.textContent.trim()) {
      hasChangedRef.current = false;
      return;
    }

    setIsSaving(true);
    try {
      await apiService.saveJournal(rawHtml, selectedDate);
      setCalendarData(cd => ({
        ...cd,
        journalDates: { ...cd.journalDates, [selectedDate]: true }
      }));
      hasChangedRef.current = false;
    } catch (err) {
      console.error('Error saving journal:', err);
    } finally {
      setIsSaving(false);
    }
  }, [selectedDate, userId, isSaving]);

  const handleDateClick = useCallback(async (dateString) => {
    if (!userId || dateString === selectedDate) return;
    if (hasChangedRef.current) await performSave();
    setSelectedDate(dateString);
    setLoading(true);
    setSelectedDateEntry(null);
    setCurrentEntryContent('');
    if (editorRef.current) editorRef.current.innerHTML = '';

    try {
      const existingEntry = await getJournalForDate(userId, dateString);
      if (existingEntry) {
        setSelectedDateEntry(existingEntry);
        setCurrentEntryContent(existingEntry.content);
        if (editorRef.current) editorRef.current.innerHTML = existingEntry.content;
      }
    } catch (error) {
      console.error("Error handling date click:", error);
    } finally {
      setLoading(false);
      hasChangedRef.current = false;
    }
  }, [userId, selectedDate, performSave]);

  const handleEditorInput = (e) => {
    setCurrentEntryContent(e.target.innerHTML);
    if (!hasChangedRef.current) {
      hasChangedRef.current = true;
      console.log("Content changed, marked for save.");
    }
  };

  const renderCalendar = () => {
    const month = calendarData.currentMonth.getMonth();
    const year = calendarData.currentMonth.getFullYear();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();

    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }
    for (let day = 1; day <= daysInMonth; day++) {
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
        <div className="calendar-header">
          <button onClick={() => {
            performSave();
            setCalendarData(cd => ({ ...cd, currentMonth: new Date(year, month - 1) }));
          }}>&lt;</button>
          <span>{new Date(year, month).toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
          <button onClick={() => {
            performSave();
            setCalendarData(cd => ({ ...cd, currentMonth: new Date(year, month + 1) }));
          }}>&gt;</button>
        </div>
        <div className="calendar-days">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
            <div key={day} className="calendar-weekday">{day}</div>
          ))}
          {days}
        </div>
      </div>
    );
  };

  return (
    <div className="journal-page-container modern">
      <div className="journal-canvas-section">
        {loading && <div className="loading-overlay">Loading Entry...</div>}
        {isSaving && <div className="saving-indicator">Saving...</div>}
        <div
          ref={editorRef}
          className="journal-canvas"
          contentEditable={!loading && !!selectedDate}
          onInput={handleEditorInput}
          onBlur={performSave}
          data-placeholder={selectedDate ? `Start writing for ${new Date(selectedDate + 'T12:00:00Z').toLocaleDateString()}...` : "Select a date to start writing..."}
          suppressContentEditableWarning={true}
        />
      </div>
      <div className="calendar-sidebar-section">
        {renderCalendar()}
      </div>
    </div>
  );
}

export default JournalPage;
