import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

// Lazy Import Pages
const Login = lazy(() => import('./pages/Login'));
const ActivateAccount = lazy(() => import('./pages/ActivateAccount'));
const SuperAdminDashboard = lazy(() => import('./pages/SuperAdminDashboard'));
const HREmployees = lazy(() => import('./pages/HREmployees'));
const HRAttendance = lazy(() => import('./pages/HRAttendance'));
const HRLeaves = lazy(() => import('./pages/HRLeaves'));
const EmployeeProfile = lazy(() => import('./pages/EmployeeProfile'));
const EmployeeDashboard = lazy(() => import('./pages/EmployeeDashboard'));
const EmployeeLeaves = lazy(() => import('./pages/EmployeeLeaves'));

const RootRedirect = () => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans">
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100 text-center flex flex-col items-center">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 mb-3">
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <p className="text-slate-500 font-semibold tracking-wide text-sm animate-pulse">Loading Apex HRMS...</p>
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
        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans">
            <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100 text-center flex flex-col items-center">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 mb-3">
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <p className="text-slate-500 font-semibold tracking-wide text-sm animate-pulse">Loading view...</p>
            </div>
          </div>
        }>
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
        </Suspense>
      </Router>
    </AuthProvider>
  );
}

export default App;
