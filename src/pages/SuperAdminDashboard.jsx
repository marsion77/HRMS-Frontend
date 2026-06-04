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
    <div className="space-y-8 max-w-6xl">
      {/* Page Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase text-slate-900 tracking-tight">HR Profiles Directory</h1>
          <p className="text-sm font-semibold text-slate-500 mt-1">
            Create, invite, and track HR administrator accounts.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flat-button px-6 py-3 uppercase tracking-widest text-sm"
        >
          + Invite HR
        </button>
      </div>

      {/* Global message notifications */}
      {message.text && (
        <div className={`border-2 p-4 font-bold text-sm rounded-none ${
          message.type === 'success' 
            ? 'bg-green-50 border-green-500 text-green-900' 
            : 'bg-red-50 border-red-500 text-red-900'
        }`}>
          {message.text}
        </div>
      )}

      {/* HR Records Grid */}
      <div className="flat-card bg-white p-0 overflow-hidden">
        <div className="p-4 border-b-2 border-slate-900 bg-slate-100 flex justify-between items-center">
          <span className="font-extrabold uppercase text-xs tracking-wider text-slate-700">HR Administators</span>
          <span className="bg-slate-900 text-white text-xs font-black px-2 py-0.5 border border-slate-900">
            Total Count: {hrs.length}
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 font-bold uppercase tracking-wider">
            Fetching HR accounts...
          </div>
        ) : hrs.length === 0 ? (
          <div className="p-12 text-center text-slate-500 font-medium">
            No HR accounts found. Click "+ Invite HR" to register one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-900 text-xs font-black uppercase tracking-wider text-slate-700 bg-slate-50">
                  <th className="p-4">Name</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Created At</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-slate-100">
                {hrs.map((hr) => (
                  <tr key={hr._id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-bold text-slate-900">{hr.name}</td>
                    <td className="p-4 text-slate-600 font-medium">{hr.email}</td>
                    <td className="p-4">
                      <span className={`inline-block px-2.5 py-1 text-xs font-bold uppercase tracking-widest border-2 ${
                        hr.status === 'Active'
                          ? 'bg-green-100 border-green-700 text-green-800'
                          : 'bg-yellow-100 border-yellow-700 text-yellow-800'
                      }`}>
                        {hr.status}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500 font-semibold text-xs">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="max-w-md w-full flat-card bg-white p-8 relative">
            <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900 mb-6">Invite HR Administrator</h2>
            
            <form onSubmit={handleInviteHR} className="space-y-6">
              <div>
                <label className="block text-xs uppercase font-black tracking-wider text-slate-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full flat-input"
                  placeholder="e.g. Sarah Jenkins"
                />
              </div>

              <div>
                <label className="block text-xs uppercase font-black tracking-wider text-slate-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full flat-input"
                  placeholder="e.g. sarah.jenkins@sap.com"
                />
              </div>

              <div className="flex gap-4 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 flat-button-secondary py-2.5 uppercase tracking-wider text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="flex-1 flat-button py-2.5 uppercase tracking-wider text-xs disabled:opacity-50"
                >
                  {submitLoading ? 'Sending Invitation...' : 'Send Invitation'}
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
