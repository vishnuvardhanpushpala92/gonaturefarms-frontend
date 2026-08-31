import React from 'react';
import CheckoutModal from './components/CheckoutModalNew';          
import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage.jsx';
import AdminPage from './pages/AdminPage.jsx';
import CustomerDashboard from './pages/CustomerDashboard.jsx';
import AboutUs from './pages/AboutUs.jsx';
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/dashboard" element={<CustomerDashboard />} />
      <Route path="/about-us" element={<AboutUs />} />
      <Route path="*" element={<HomePage />} />
    </Routes>
  );
}