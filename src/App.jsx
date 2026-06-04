import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

// Import Pages
import Login from './pages/Login';
import ActivateAccount from './pages/ActivateAccount';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import HREmployees from './pages/HREmployees';
import HRAttendance from './pages/HRAttendance';
import HRLeaves from './pages/HRLeaves';
import EmployeeProfile from './pages/EmployeeProfile';
import EmployeeDashboard from './pages/EmployeeDashboard';
import EmployeeLeaves from './pages/EmployeeLeaves';

const RootRedirect = () => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-xl font-extrabold uppercase tracking-widest text-slate-900 border-4 border-slate-900 p-6 bg-white shadow-[4px_4px_0px_0px_#0f172a]">
          Loading SAP HRMS...
        </div>
      </div>
    );
  }
  
  if (!user) return <Navigate to="/login" replace />;
  
  if (user.role === 'Super Admin') return <Navigate to="/admin" replace />;
  if (user.role === 'HR') return <Navigate to="/hr/employees" replace />;
  if (user.role === 'Employee') return <Navigate to="/employee/dashboard" replace />;
  
  return <Navigate to="/login" replace />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/activate/:token" element={<ActivateAccount />} />
          
          {/* Protected Routes using Layout shell */}
          <Route element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            {/* Super Admin Console */}
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute allowedRoles={['Super Admin']}>
                  <SuperAdminDashboard />
                </ProtectedRoute>
              } 
            />

            {/* HR Consoles */}
            <Route 
              path="/hr/employees" 
              element={
                <ProtectedRoute allowedRoles={['HR']}>
                  <HREmployees />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/hr/attendance" 
              element={
                <ProtectedRoute allowedRoles={['HR']}>
                  <HRAttendance />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/hr/leaves" 
              element={
                <ProtectedRoute allowedRoles={['HR']}>
                  <HRLeaves />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/hr/employee/:id/profile" 
              element={
                <ProtectedRoute allowedRoles={['HR']}>
                  <EmployeeProfile />
                </ProtectedRoute>
              } 
            />

            {/* Employee Consoles */}
            <Route 
              path="/employee/dashboard" 
              element={
                <ProtectedRoute allowedRoles={['Employee']}>
                  <EmployeeDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/employee/leaves" 
              element={
                <ProtectedRoute allowedRoles={['Employee']}>
                  <EmployeeLeaves />
                </ProtectedRoute>
              } 
            />
          </Route>

          <Route path="/" element={<RootRedirect />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
