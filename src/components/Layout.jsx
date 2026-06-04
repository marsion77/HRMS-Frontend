import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Hamburger Icon
const HamburgerIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

// Close Icon
const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
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

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="p-6 border-b-4 border-slate-900 bg-slate-900 text-white flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black tracking-wider text-white">SAP HRMS</h1>
          <p className="text-xs uppercase font-extrabold tracking-widest text-slate-400">Enterprise Suite</p>
        </div>
        {/* Close button — mobile only */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="md:hidden text-white hover:text-slate-300 transition-colors p-1"
          aria-label="Close menu"
        >
          <CloseIcon />
        </button>
      </div>

      {/* User Badge */}
      <div className="p-6 border-b-2 border-slate-900 bg-slate-100">
        <p className="text-xs uppercase font-extrabold tracking-wider text-slate-500">Active Profile</p>
        <h3 className="font-bold text-slate-900 truncate text-lg">{user?.name}</h3>
        <span className="inline-block mt-2 px-2 py-0.5 text-xs font-black uppercase tracking-wider bg-slate-900 text-white border border-slate-900">
          {user?.role}
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-6 space-y-3">
        {links.map((link) => {
          const isActive = location.pathname === link.path ||
            location.pathname.startsWith(link.path + '/');
          return (
            <Link
              key={link.path}
              to={link.path}
              className={`block w-full text-left p-3 font-bold border-2 transition-all duration-100 ${
                isActive
                  ? 'bg-slate-900 text-white border-slate-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                  : 'bg-white text-slate-900 border-slate-900 hover:bg-slate-100 hover:translate-x-1'
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* Sign Out */}
      <div className="p-6 border-t-2 border-slate-900 bg-slate-100">
        <button
          onClick={handleLogout}
          className="w-full flat-button py-2 uppercase text-sm tracking-widest"
        >
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900 font-sans">

      {/* ─── Desktop Sidebar (always visible ≥ md) ─── */}
      <aside className="hidden md:flex md:w-64 flex-col bg-white border-r-4 border-slate-900 flex-shrink-0 sticky top-0 h-screen overflow-y-auto">
        <SidebarContent />
      </aside>

      {/* ─── Mobile Overlay Backdrop ─── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ─── Mobile Sidebar (slides in from left) ─── */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-72 bg-white border-r-4 border-slate-900 flex flex-col md:hidden transition-transform duration-300 ease-in-out overflow-y-auto ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent />
      </aside>

      {/* ─── Main Content Area ─── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-x-hidden">

        {/* Top Header Bar */}
        <header className="bg-white border-b-4 border-slate-900 px-4 md:px-6 py-4 flex justify-between items-center sticky top-0 z-30">
          <div className="flex items-center gap-3">
            {/* Hamburger — mobile only */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden flat-button-secondary p-2 border-2 border-slate-900"
              aria-label="Open menu"
            >
              <HamburgerIcon />
            </button>
            <h2 className="text-lg md:text-xl font-black uppercase tracking-tight truncate">
              {links.find((l) =>
                location.pathname === l.path || location.pathname.startsWith(l.path + '/')
              )?.label || 'System Console'}
            </h2>
          </div>

          {/* Date — hidden on small screens */}
          <div className="hidden sm:block text-xs font-black text-slate-500 uppercase tracking-widest bg-slate-100 px-3 py-1 border border-slate-300 flex-shrink-0">
            {new Date().toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 md:p-8 flex-1">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
