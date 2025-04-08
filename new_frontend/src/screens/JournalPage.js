// src/JournalPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

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

  return (
    <div className="container">
      <div className="journal-page">
        <div className="journal-header">
          <h1>Chirag's Journal</h1>
        </div>
        <div className="journal-content">
          <h2>Tell Me About Your Day, Chirag</h2>

          {journalEntries.map(entry => (
            <div key={entry.id} className="previous-entry">
              <p>{entry.content}</p>
              {entry.reflections.map((reflection, index) => (
                <div key={index} className="reflection-item">
                  <h3>{reflection.question}</h3>
                  <p>{reflection.answer}</p>
                </div>
              ))}
            </div>
          ))}

          <div className="entry-form">
            <textarea
              value={currentEntry}
              onChange={handleEntryChange}
              placeholder="How was your day today?"
              rows={5}
            />
            <button onClick={handleSubmit} className="finish-entry-button">
              Finish Entry
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default JournalPage;
