import React from 'react';          
import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage.jsx';
import AdminPage from './pages/AdminPage.jsx';
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="*" element={<HomePage />} />
    </Routes>
  );
}