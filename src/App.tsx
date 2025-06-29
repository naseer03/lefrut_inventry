import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import States from './pages/States';
import Profile from './pages/Profile';
import Permissions from './pages/Permissions';
import Staff from './pages/Staff';
import Departments from './pages/Departments';
import JobRoles from './pages/JobRoles';
import DocumentTypes from './pages/DocumentTypes';
import Products from './pages/Products';
import Categories from './pages/Categories';
import Units from './pages/Units';
import Sales from './pages/Sales';
import MobileSales from './pages/MobileSales';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/users" element={
              <ProtectedRoute requiredModule="users" requiredAction="view">
                <Users />
              </ProtectedRoute>
            } />
            <Route path="/states" element={
              <ProtectedRoute requiredModule="states" requiredAction="view">
                <States />
              </ProtectedRoute>
            } />
            <Route path="/permissions" element={
              <ProtectedRoute requiredModule="permissions" requiredAction="view">
                <Permissions />
              </ProtectedRoute>
            } />
            <Route path="/staff" element={
              <ProtectedRoute requiredModule="staff" requiredAction="view">
                <Staff />
              </ProtectedRoute>
            } />
            <Route path="/departments" element={
              <ProtectedRoute requiredModule="departments" requiredAction="view">
                <Departments />
              </ProtectedRoute>
            } />
            <Route path="/job-roles" element={
              <ProtectedRoute requiredModule="job_roles" requiredAction="view">
                <JobRoles />
              </ProtectedRoute>
            } />
            <Route path="/document-types" element={
              <ProtectedRoute requiredModule="document_types" requiredAction="view">
                <DocumentTypes />
              </ProtectedRoute>
            } />
            <Route path="/products" element={
              <ProtectedRoute requiredModule="products" requiredAction="view">
                <Products />
              </ProtectedRoute>
            } />
            <Route path="/categories" element={
              <ProtectedRoute requiredModule="categories" requiredAction="view">
                <Categories />
              </ProtectedRoute>
            } />
            <Route path="/units" element={
              <ProtectedRoute requiredModule="units" requiredAction="view">
                <Units />
              </ProtectedRoute>
            } />
            <Route path="/sales" element={
              <ProtectedRoute requiredModule="sales" requiredAction="view">
                <Sales />
              </ProtectedRoute>
            } />
            <Route path="/mobile-sales" element={
              <ProtectedRoute requiredModule="sales" requiredAction="add">
                <MobileSales />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
          </Routes>
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1f2937',
                color: '#f9fafb',
                border: '1px solid #374151'
              }
            }}
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;