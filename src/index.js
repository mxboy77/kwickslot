import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import Home from './pages/Home';
import Poll from './pages/Poll';
import PollResults from './pages/PollResults';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <Router>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/poll/:id" element={<Poll />} />
      <Route path="/poll/:id/results" element={<PollResults />} /> {/* 👈 This was missing */}
    </Routes>
  </Router>
);
