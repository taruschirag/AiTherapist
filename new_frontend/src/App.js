// src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import AuthForm from './components/Auth/AuthForm';
import HomeScreen from './screens/HomeScreen';
import JournalPage from './screens/JournalPage';
import ReflectionScreen from './screens/ReflectionScreen';
import SummaryScreen from './screens/SummaryScreen';
import Navbar from './components/Navbar';
import { handleOnboardingComplete } from './services/handleOnboardingComplete';
import './App.css';
import { supabase } from './services/supabase'; // adjust path if different
import WelcomeMessageCard from './components/WelcomeMessageCard';


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


const InitialRedirect = () => {
  const { user, loading } = useAuth();
  const [target, setTarget] = React.useState(null);


  React.useEffect(() => {
    const checkNewUser = async () => {
      if (!user) {
        setTarget('/login');
        return;
      }

      const { data, error } = await supabase
        .from('users')
        .select('is_new_user')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error checking user status:', error);
        setTarget('/home'); // Fallback
      } else {
        // Choose one and remove the other
        setTarget(data.is_new_user ? '/onboarding' : '/home');
      }

    };

    checkNewUser();
  }, [user]);

  if (loading || !target) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        Loading...
      </div>
    );
  }

  return <Navigate to={target} replace />;
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

const OnboardingWrapper = () => {
  const { user } = useAuth();
  return (
    <WelcomeMessageCard onComplete={() => handleOnboardingComplete(user)} />
  );
};

function App() {

  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navbar />
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

            {/* Protected routes */}
            <Route
              path="/onboarding"
              element={
                <ProtectedRoute>
                  <OnboardingWrapper />
                </ProtectedRoute>
              }
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
            <Route path="/" element={<InitialRedirect />} />

          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
