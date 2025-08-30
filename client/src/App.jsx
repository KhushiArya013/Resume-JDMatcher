// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MatcherForm from './components/MatcherForm.jsx';
import HomePage from './pages/HomePage.jsx';
import './index.css';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/resume-matcher" element={<MatcherForm />} />
      </Routes>
    </BrowserRouter>
  );
}
