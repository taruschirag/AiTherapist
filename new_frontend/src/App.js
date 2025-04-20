// src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import AuthForm from './components/Auth/AuthForm';
import HomeScreen from './screens/HomeScreen';
import JournalPage from './screens/JournalPage';
import ReflectionScreen from './screens/ReflectionScreen';
import SummaryScreen from './screens/SummaryScreen';
import './App.css';

// Protected Route wrapper
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        Loading...
      </div>
    );
  }


  // change back later

  // if (!user) {
  //   return <Navigate to="/login" replace />;
  // }

  return children;
};

// Public Route wrapper (redirects to home if already authenticated)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        Loading...
      </div>
    );
  }

  if (user) {
    return <Navigate to="/home" replace />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <AuthForm mode="signin" />
                </PublicRoute>
              }
            />
            <Route
              path="/signup"
              element={
                <PublicRoute>
                  <AuthForm mode="signup" />
                </PublicRoute>
              }
            />
            <Route
              path="/"
              element={<Navigate to="/login" replace />}
            />
            <Route
              path="/home"
              element={
                <ProtectedRoute>
                  <HomeScreen />
                </ProtectedRoute>
              }
            />
            <Route
              path="/journal"
              element={
                <ProtectedRoute>
                  <JournalPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reflect"
              element={
                <ProtectedRoute>
                  <ReflectionScreen />
                </ProtectedRoute>
              }
            />
            <Route
              path="/summary"
              element={
                <ProtectedRoute>
                  <SummaryScreen />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
