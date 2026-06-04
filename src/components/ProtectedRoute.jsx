import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
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

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full flat-card text-center p-8 bg-white">
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-wide mb-4">Access Denied</h2>
          <p className="text-slate-600 mb-6 font-medium">
            Your role (${user.role}) does not have permission to access this area.
          </p>
          <button 
            onClick={() => window.location.href = '/'}
            className="flat-button py-2 px-6"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
