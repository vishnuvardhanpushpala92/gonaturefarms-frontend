import React from 'react';
import CheckoutModal from './components/CheckoutModalNew';          
import { Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage.jsx';
import AdminPage from './pages/AdminPage.jsx';
import CustomerDashboard from './pages/CustomerDashboard.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import AdminLoginPage from './pages/AdminLoginPage.jsx';
import TrackingPage from './pages/TrackingPage.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/tracking" element={<TrackingPage />} />
      <Route path="/dashboard" element={<CustomerDashboard />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="*" element={<HomePage />} />
    </Routes>
  );
}