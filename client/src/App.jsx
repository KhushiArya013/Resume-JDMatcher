import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

import MatcherForm from './components/MatcherForm.jsx';
import HomePage from './pages/HomePage.jsx';
import RefineJobDescriptionPage from './pages/RefineJobDescriptionPage.jsx';
import ImproveResumePage from './pages/ImproveResumePage.jsx';

import './index.css';

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<HomePage />} />
        <Route path="/resume-matcher" element={<MatcherForm />} />
        <Route path="/refine-jd" element={<RefineJobDescriptionPage />} />
        <Route path="/improve-resume" element={<ImproveResumePage />} />
      </Routes>
    </AnimatePresence>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <AnimatedRoutes />
    </BrowserRouter>
  );
}
