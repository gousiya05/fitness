import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './components/dashboard/Dashboard';
import PoseDetector from './components/pose/PoseDetector';
import FoodScanner from './components/dashboard/FoodScanner';
import BMICalculator from './components/fitness/BMICalculator';
import CalorieTracker from './components/fitness/CalorieTracker';
import WorkoutRecommendations from './components/fitness/WorkoutRecommendations';
import Profile from './components/profile/Profile';
import Chatbot from './components/chatbot/Chatbot';
import Home from './pages/Home';
import Auth from './pages/Auth';
import Diet from './pages/Diet';
import Onboarding from './pages/Onboarding';
import MlDashboard from './components/dashboard/MlDashboard';
import { Toaster } from '@/components/ui/sonner';
import AppErrorBoundary from './components/ErrorBoundary';


// ─────────────────────────────────────────────────────────
// Protected Route — redirects unauthenticated users to /auth
// ─────────────────────────────────────────────────────────
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/auth" replace />;
  return <Layout>{children}</Layout>;
};

// ─────────────────────────────────────────────────────────
// App root
// ─────────────────────────────────────────────────────────
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
    <AppErrorBoundary>
      <BrowserRouter>
        <Toaster theme="dark" position="top-right" richColors closeButton />
        <Routes>
          {/* Public routes */}
          <Route path="/"          element={<Home />} />
          <Route path="/auth"      element={<Auth />} />
          <Route path="/onboarding" element={<Onboarding />} />

          {/* Protected routes — require JWT token */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/scanner"   element={<ProtectedRoute><FoodScanner /></ProtectedRoute>} />
          <Route path="/pose"      element={<ProtectedRoute><PoseDetector /></ProtectedRoute>} />
          <Route path="/fitness"   element={
            <ProtectedRoute>
              <div className="space-y-12">
                <BMICalculator />
                <WorkoutRecommendations />
              </div>
            </ProtectedRoute>
          } />
          <Route path="/chat"    element={<ProtectedRoute><Chatbot /></ProtectedRoute>} />
          <Route path="/diet"    element={<ProtectedRoute><Diet /></ProtectedRoute>} />
          <Route path="/tracker" element={<ProtectedRoute><CalorieTracker /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile user={user} /></ProtectedRoute>} />
          <Route path="/ml"      element={<ProtectedRoute><MlDashboard /></ProtectedRoute>} />

          {/* Catch-all — redirect unknown routes to landing */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppErrorBoundary>
  );
}
