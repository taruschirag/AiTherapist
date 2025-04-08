// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginScreen from './screens/LoginScreen';
import JournalPage from './screens/JournalPage';
import ReflectionScreen from './screens/ReflectionScreen';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/journal" element={<JournalPage />} />
        <Route path="/reflect" element={<ReflectionScreen />} />
      </Routes>
    </Router>
  );
}

export default App;
