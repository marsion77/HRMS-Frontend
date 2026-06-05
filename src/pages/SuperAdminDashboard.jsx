import React, { useState, useEffect } from 'react';
import API from '../services/api';

const SuperAdminDashboard = () => {
  const [hrs, setHrs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const fetchHRProfiles = async () => {
    try {
      const response = await API.get('/admin/hrs');
      if (response.data.success) {
        setHrs(response.data.hrs);
      }
    } catch (err) {
      console.error('Failed to fetch HR profiles', err);
      showFeedback('Failed to load HR profiles.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHRProfiles();
  }, []);

  const showFeedback = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 5000);
  };

  const handleInviteHR = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const response = await API.post('/admin/hr', { name, email });
      if (response.data.success) {
        showFeedback('HR profile created successfully! Invitation email has been sent.', 'success');
        setName('');
        setEmail('');
        setShowModal(false);
        fetchHRProfiles(); // refresh list
      }
    } catch (err) {
      showFeedback(err.response?.data?.message || 'Failed to invite HR.', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl font-sans">
      {/* Page Header */}
      <div className="flex justify-between items-center flex-wrap gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm shadow-slate-100/50">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">HR Profiles Directory</h1>
          <p className="text-sm text-slate-500 mt-1">
            Create, invite, and track HR administrator accounts.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flat-button px-5 py-2.5 text-sm font-semibold rounded-lg shadow-sm"
        >
          + Invite HR
        </button>
      </div>

      {/* Global message notifications */}
      {message.text && (
        <div className={`border p-4 rounded-xl text-sm font-medium transition-all ${
          message.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* HR Records Grid */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-150 bg-slate-50/50 flex justify-between items-center">
          <span className="font-semibold text-sm text-slate-700">HR Administrators</span>
          <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full border border-blue-100">
            Total Count: {hrs.length}
          </span>
        </div>

        {loading ? (
          <div className="p-16 text-center text-slate-400 font-medium tracking-wide">
            <div className="animate-pulse">Fetching HR accounts...</div>
          </div>
        ) : hrs.length === 0 ? (
          <div className="p-16 text-center text-slate-400 font-medium">
            No HR accounts found. Click "+ Invite HR" to register one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500 bg-slate-50/70">
                  <th className="p-4 pl-6">Name</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 pr-6">Created At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {hrs.map((hr) => (
                  <tr key={hr._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 pl-6 font-semibold text-slate-900">{hr.name}</td>
                    <td className="p-4 text-slate-600 text-sm font-medium">{hr.email}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                        hr.status === 'Active'
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                          : 'bg-amber-50 border-amber-200 text-amber-700'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${hr.status === 'Active' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                        {hr.status}
                      </span>
                    </td>
                    <td className="p-4 pr-6 text-slate-500 text-xs font-medium">
                      {new Date(hr.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invite HR Modal Dialog */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm transition-opacity">
          <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-2xl border border-slate-100 relative">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold tracking-tight text-slate-900">Invite HR Administrator</h2>
              <button 
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleInviteHR} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all text-slate-800"
                  placeholder="e.g. Sarah Jenkins"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all text-slate-800"
                  placeholder="e.g. sarah.jenkins@apex-hrms.com"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 font-semibold rounded-lg hover:bg-slate-50 transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors text-sm disabled:opacity-50"
                >
                  {submitLoading ? 'Sending...' : 'Send Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminDashboard;
