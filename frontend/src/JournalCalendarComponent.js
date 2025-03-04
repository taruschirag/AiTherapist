import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';

const JournalCalendar = () => {
    const [journalDates, setJournalDates] = useState(new Set());
    const [currentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [calendarDays, setCalendarDays] = useState([]);

    useEffect(() => {
        fetchJournalDates();
    }, []);

    const fetchJournalDates = async () => {
        try {
            const response = await fetch('http://127.0.0.1:8000/api/journal-dates');
            if (response.ok) {
                const data = await response.json();
                setJournalDates(new Set(data.dates.map(date => new Date(date).toDateString())));
            }
        } catch (error) {
            console.error('Error fetching journal dates:', error);
        }
    };

    useEffect(() => {
        const year = selectedDate.getFullYear();
        const month = selectedDate.getMonth();

        // Get first day of the month
        const firstDay = new Date(year, month, 1);
        // Get last day of the month
        const lastDay = new Date(year, month + 1, 0);

        // Calculate days from previous month to fill first week
        const daysFromPrevMonth = firstDay.getDay();
        const prevMonthDays = [];
        for (let i = daysFromPrevMonth - 1; i >= 0; i--) {
            prevMonthDays.push(new Date(year, month, -i));
        }

        // Current month days
        const currentMonthDays = [];
        for (let i = 1; i <= lastDay.getDate(); i++) {
            currentMonthDays.push(new Date(year, month, i));
        }

        // Calculate days from next month to fill last week
        const remainingDays = (7 - ((daysFromPrevMonth + lastDay.getDate()) % 7)) % 7;
        const nextMonthDays = [];
        for (let i = 1; i <= remainingDays; i++) {
            nextMonthDays.push(new Date(year, month + 1, i));
        }

        setCalendarDays([...prevMonthDays, ...currentMonthDays, ...nextMonthDays]);
    }, [selectedDate]);

    const getDayStyle = (date) => {
        const isCurrentMonth = date.getMonth() === selectedDate.getMonth();
        const isToday = date.toDateString() === currentDate.toDateString();
        const hasJournal = journalDates.has(date.toDateString());

        let className = 'w-8 h-8 flex items-center justify-center text-sm rounded-full ';

        if (!isCurrentMonth) {
            className += 'text-gray-400 ';
        }

        if (isToday) {
            className += 'ring-2 ring-blue-500 ';
        }

        if (hasJournal) {
            className += isCurrentMonth ? 'bg-green-200 ' : 'bg-green-100 ';
        } else {
            className += isCurrentMonth ? 'bg-red-200 ' : 'bg-red-100 ';
        }

        return className;
    };

    const handlePrevMonth = () => {
        setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1));
    };

    const handleNextMonth = () => {
        setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1));
    };

    return (
        <div className="fixed bottom-4 right-4 w-80 bg-white rounded-lg shadow-lg p-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5" />
                    Journal Calendar
                </h3>
            </div>

            <div className="flex items-center justify-between mb-4">
                <button
                    onClick={handlePrevMonth}
                    className="p-1 hover:bg-gray-100 rounded"
                >
                    ←
                </button>
                <div className="text-lg font-medium">
                    {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </div>
                <button
                    onClick={handleNextMonth}
                    className="p-1 hover:bg-gray-100 rounded"
                >
                    →
                </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-xs font-medium text-gray-500 text-center">
                        {day}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-1 w-full">
                {calendarDays.map((date, index) => (
                    <div key={index} className="border border-gray-500 flex items-center justify-center">
                        {date.getDate()}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default JournalCalendar;