import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './components/dashboard/Dashboard';
import PoseDetector from './components/pose/PoseDetector';
import BMICalculator from './components/fitness/BMICalculator';
import CalorieTracker from './components/fitness/CalorieTracker';
import WorkoutRecommendations from './components/fitness/WorkoutRecommendations';
import Profile from './components/profile/Profile';
import Chatbot from './components/chatbot/Chatbot';
import Home from './pages/Home';
import Auth from './pages/Auth';
import Diet from './pages/Diet';
import Onboarding from './pages/Onboarding';
import { Toaster } from '@/components/ui/sonner';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const user = localStorage.getItem('user');
  const token = localStorage.getItem('token');
  const onboarded = localStorage.getItem('onboarded');
  
  if (!user || !token) return <Navigate to="/auth" replace />;
  if (!onboarded && window.location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }
  
  return <Layout>{children}</Layout>;
};

export default function App() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const checkAuth = () => {
      const stored = localStorage.getItem('user');
      setUser(stored ? JSON.parse(stored) : null);
    };

    checkAuth();
    window.addEventListener('auth-change', checkAuth);
    window.addEventListener('storage', checkAuth);
    return () => {
      window.removeEventListener('auth-change', checkAuth);
      window.removeEventListener('storage', checkAuth);
    };
  }, []);

  return (
    <BrowserRouter>
      <Toaster theme="dark" position="top-right" richColors closeButton />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/auth" element={user ? <Navigate to="/dashboard" replace /> : <Auth />} />
        <Route path="/onboarding" element={user ? <Onboarding /> : <Navigate to="/auth" replace />} />
        
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/pose" element={<ProtectedRoute><PoseDetector /></ProtectedRoute>} />
        <Route path="/fitness" element={
          <ProtectedRoute>
            <div className="space-y-12">
              <BMICalculator />
              <WorkoutRecommendations />
            </div>
          </ProtectedRoute>
        } />
        <Route path="/chat" element={<ProtectedRoute><Chatbot /></ProtectedRoute>} />
        <Route path="/diet" element={<ProtectedRoute><Diet /></ProtectedRoute>} />
        <Route path="/tracker" element={<ProtectedRoute><CalorieTracker /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile user={user} /></ProtectedRoute>} />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
