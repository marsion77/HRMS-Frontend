import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Hamburger Icon
const HamburgerIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

// Close Icon
const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Auto-close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Auto-close on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getNavLinks = () => {
    switch (user?.role) {
      case 'Super Admin':
        return [{ path: '/admin', label: 'HR Management' }];
      case 'HR':
        return [
          { path: '/hr/employees', label: 'Employee Management' },
          { path: '/hr/attendance', label: 'Live Attendance' },
          { path: '/hr/leaves', label: 'Leave Desk' }
        ];
      case 'Employee':
        return [
          { path: '/employee/dashboard', label: 'My Console' },
          { path: '/employee/leaves', label: 'Leave History' }
        ];
      default:
        return [];
    }
  };

  const links = getNavLinks();

  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name[0].toUpperCase();
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300">
      {/* Brand */}
      <div className="p-6 border-b border-slate-800 bg-slate-950 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-extrabold text-base shadow-md shadow-blue-500/20">S</span>
            <span>SAP HRMS</span>
          </h1>
          <p className="text-[10px] uppercase font-extrabold tracking-widest text-slate-500 mt-0.5">Enterprise Suite</p>
        </div>
        {/* Close button — mobile only */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="md:hidden text-slate-400 hover:text-white transition-colors p-1"
          aria-label="Close menu"
        >
          <CloseIcon />
        </button>
      </div>

      {/* User Badge */}
      <div className="p-4 mx-4 my-6 bg-slate-800/40 border border-slate-800/60 rounded-xl flex items-center gap-3">
        {user?.profileImage ? (
          <img 
            src={user.profileImage} 
            alt="Profile" 
            className="w-10 h-10 rounded-full object-cover shadow-md border border-slate-700/60 flex-shrink-0" 
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-650 flex items-center justify-center text-white font-semibold text-sm shadow-md flex-shrink-0">
            {getInitials(user?.name)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-white truncate text-sm" title={user?.name}>{user?.name}</h3>
          <span className="inline-block mt-0.5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-slate-700/60 text-blue-400 rounded-full">
            {user?.role}
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-1.5">
        {links.map((link) => {
          const isActive = location.pathname === link.path ||
            location.pathname.startsWith(link.path + '/');
          return (
            <Link
              key={link.path}
              to={link.path}
              className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-all duration-150 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* Sign Out */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-300 hover:text-white bg-slate-800/50 hover:bg-slate-800 rounded-lg transition-all duration-150"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900 font-sans">

      {/* ─── Desktop Sidebar (always visible ≥ md) ─── */}
      <aside className="hidden md:flex md:w-64 flex-col bg-slate-900 flex-shrink-0 sticky top-0 h-screen overflow-y-auto border-r border-slate-800">
        <SidebarContent />
      </aside>

      {/* ─── Mobile Overlay Backdrop ─── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm md:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ─── Mobile Sidebar (slides in from left) ─── */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-72 bg-slate-900 flex flex-col md:hidden transition-transform duration-300 ease-in-out overflow-y-auto border-r border-slate-850 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent />
      </aside>

      {/* ─── Main Content Area ─── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-x-hidden">

        {/* Top Header Bar */}
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 md:px-6 py-4 flex justify-between items-center sticky top-0 z-30 shadow-sm shadow-slate-100">
          <div className="flex items-center gap-3">
            {/* Hamburger — mobile only */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200 transition-colors"
              aria-label="Open menu"
            >
              <HamburgerIcon />
            </button>
            <h2 className="text-base md:text-lg font-semibold text-slate-800 tracking-tight truncate">
              {links.find((l) =>
                location.pathname === l.path || location.pathname.startsWith(l.path + '/')
              )?.label || 'System Console'}
            </h2>
          </div>

          {/* Date & User Info */}
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="hidden sm:block text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200 flex-shrink-0">
              {new Date().toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
            </div>
            
            {user?.profileImage ? (
              <img 
                src={user.profileImage} 
                alt="Profile" 
                className="w-8 h-8 rounded-full object-cover border border-slate-205 shadow-sm cursor-pointer" 
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-650 flex items-center justify-center text-white font-semibold text-xs shadow-sm cursor-pointer">
                {getInitials(user?.name)}
              </div>
            )}
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 md:p-8 flex-1 bg-slate-50/50">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
