import React from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';

import MatcherForm from './components/MatcherForm.jsx';
import HomePage from './pages/HomePage.jsx';
import RefineJobDescriptionPage from './pages/RefineJobDescriptionPage.jsx';
import ImproveResumePage from './pages/ImproveResumePage.jsx';
import CoverLetterPage from './pages/CoverLetterPage.jsx';

import './index.css';

// ── Protected Route ──────────────────────────────────────────────────
function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  return children;
}

// ── Routes ───────────────────────────────────────────────────────────
const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <>
      <Navbar />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<HomePage />} />
          <Route path="/resume-matcher" element={<ProtectedRoute><MatcherForm /></ProtectedRoute>} />
          <Route path="/refine-jd" element={<ProtectedRoute><RefineJobDescriptionPage /></ProtectedRoute>} />
          <Route path="/improve-resume" element={<ProtectedRoute><ImproveResumePage /></ProtectedRoute>} />
          <Route path="/cover-letter" element={<ProtectedRoute><CoverLetterPage /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </>
  );
};

// ── App ──────────────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AnimatedRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}