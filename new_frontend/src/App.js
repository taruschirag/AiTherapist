// src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import AuthForm from './components/Auth/AuthForm';
import HomeScreen from './screens/HomeScreen';
import JournalPage from './screens/JournalPage';
import ReflectionScreen from './screens/ReflectionScreen';
import SummaryScreen from './screens/SummaryScreen';
import Navbar from './components/Navbar';
import { handleOnboardingComplete } from './services/handleOnboardingComplete';
import './App.css';
import { supabase } from './services/supabase';
import WelcomeMessageCard from './components/WelcomeMessageCard';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const [session, setSession] = React.useState(null);
  const [sessionChecked, setSessionChecked] = React.useState(false);

  React.useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setSessionChecked(true);
    };
    checkSession();
  }, []);

  if (loading || !sessionChecked) {
    return <div className="centered">Loading...</div>;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <div className="centered">Loading...</div>;
  if (user) return <Navigate to="/home" replace />;
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

      setTarget(error ? '/home' : (data.is_new_user ? '/onboarding' : '/home'));
    };
    checkNewUser();
  }, [user]);

  if (loading || !target) {
    return <div className="centered">Loading...</div>;
  }

  return <Navigate to={target} replace />;
};

const OnboardingWrapper = () => {
  const { user } = useAuth();
  return (
    <WelcomeMessageCard onComplete={() => handleOnboardingComplete(user)} />
  );
};

const InnerApp = () => {
  const location = useLocation();
  const showNavbar = !['/login', '/signup'].includes(location.pathname);

  return (
    <div className="App">
      {showNavbar && <Navbar />}
      <Routes>
        <Route path="/login" element={<PublicRoute><AuthForm mode="signin" /></PublicRoute>} />
        <Route path="/signup" element={<PublicRoute><AuthForm mode="signup" /></PublicRoute>} />
        <Route path="/onboarding" element={<ProtectedRoute><OnboardingWrapper /></ProtectedRoute>} />
        <Route path="/home" element={<ProtectedRoute><HomeScreen /></ProtectedRoute>} />
        <Route path="/journal" element={<ProtectedRoute><JournalPage /></ProtectedRoute>} />
        <Route path="/reflect" element={<ProtectedRoute><ReflectionScreen /></ProtectedRoute>} />
        <Route path="/summary" element={<ProtectedRoute><SummaryScreen /></ProtectedRoute>} />
        <Route path="/" element={<InitialRedirect />} />
      </Routes>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <InnerApp />
      </Router>
    </AuthProvider>
  );
}

export default App;
