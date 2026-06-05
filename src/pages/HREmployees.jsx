import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';

const HREmployees = () => {
  const [employees, setEmployees] = useState([]);

  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name[0].toUpperCase();
  };
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const navigate = useNavigate();
  
  // Invite employee form state
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [sickAlloc, setSickAlloc] = useState(12);
  const [casualAlloc, setCasualAlloc] = useState(10);
  const [otherAlloc, setOtherAlloc] = useState(8);

  // Edit allocations form state
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [editSick, setEditSick] = useState(12);
  const [editCasual, setEditCasual] = useState(10);
  const [editOther, setEditOther] = useState(8);

  const [message, setMessage] = useState({ text: '', type: '' });

  const fetchEmployees = async () => {
    try {
      const response = await API.get('/hr/employees');
      if (response.data.success) {
        setEmployees(response.data.employees);
      }
    } catch (err) {
      console.error(err);
      showFeedback('Failed to load employee list.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const showFeedback = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 5000);
  };

  const handleInviteEmployee = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const response = await API.post('/hr/employee', {
        name: inviteName,
        email: inviteEmail,
        sickAllocation: sickAlloc,
        casualAllocation: casualAlloc,
        otherAllocation: otherAlloc
      });

      if (response.data.success) {
        showFeedback('Employee invited successfully! Activation link sent.', 'success');
        setInviteName('');
        setInviteEmail('');
        setSickAlloc(12);
        setCasualAlloc(10);
        setOtherAlloc(8);
        setShowInviteModal(false);
        fetchEmployees();
      }
    } catch (err) {
      showFeedback(err.response?.data?.message || 'Failed to invite employee.', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  const openEditModal = (emp) => {
    setSelectedEmployee(emp);
    setEditSick(emp.leaveAllocations?.sick || 12);
    setEditCasual(emp.leaveAllocations?.casual || 10);
    setEditOther(emp.leaveAllocations?.other || 8);
    setShowEditModal(true);
  };

  const handleUpdateAllocations = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const response = await API.put(`/hr/employee/${selectedEmployee._id}/allocation`, {
        sick: editSick,
        casual: editCasual,
        other: editOther
      });

      if (response.data.success) {
        showFeedback('Leave allocations updated successfully.', 'success');
        setShowEditModal(false);
        fetchEmployees();
      }
    } catch (err) {
      showFeedback(err.response?.data?.message || 'Failed to update leave allocations.', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl font-sans">
      {/* Header Panel */}
      <div className="flex justify-between items-center flex-wrap gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm shadow-slate-100/50">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">Employee Directory</h1>
          <p className="text-sm text-slate-500 mt-1">
            Register new employee profiles, customize leave allowances, and monitor activation status.
          </p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="flat-button px-5 py-2.5 text-sm font-semibold rounded-lg shadow-sm"
        >
          + Invite Employee
        </button>
      </div>

      {/* Message Box */}
      {message.text && (
        <div className={`border p-4 rounded-xl text-sm font-medium transition-all ${
          message.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* Directory Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-150 bg-slate-50/50 flex justify-between items-center">
          <span className="font-semibold text-sm text-slate-700">Employees Registry</span>
          <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full border border-blue-100">
            Total Count: {employees.length}
          </span>
        </div>

        {loading ? (
          <div className="p-16 text-center text-slate-400 font-medium tracking-wide">
            <div className="animate-pulse">Loading employees database...</div>
          </div>
        ) : employees.length === 0 ? (
          <div className="p-16 text-center text-slate-400 font-medium">
            No employees registered yet. Click "+ Invite Employee" to onboard team members.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500 bg-slate-50/70">
                  <th className="p-4 pl-6">Name</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Leave Allocations (Sick/Casual/Other)</th>
                  <th className="p-4 pr-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employees.map((emp) => (
                  <tr key={emp._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 pl-6 font-semibold text-slate-900">
                      <div className="flex items-center gap-3">
                        {emp.profileImage ? (
                          <img 
                            src={emp.profileImage} 
                            alt={emp.name} 
                            className="w-8 h-8 rounded-full object-cover border border-slate-200 shadow-sm flex-shrink-0" 
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-650 flex items-center justify-center text-white text-[10px] font-semibold flex-shrink-0 shadow-sm">
                            {getInitials(emp.name)}
                          </div>
                        )}
                        <span>{emp.name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-slate-600 text-sm font-medium">{emp.email}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                        emp.status === 'Active'
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                          : 'bg-amber-50 border-amber-200 text-amber-700'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${emp.status === 'Active' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                        {emp.status}
                      </span>
                    </td>
                    <td className="p-4 text-slate-600 text-sm font-medium">
                      Sick: <span className="font-semibold text-slate-800">{emp.leaveAllocations?.sick}</span> | 
                      Casual: <span className="font-semibold text-slate-800">{emp.leaveAllocations?.casual}</span> | 
                      Other: <span className="font-semibold text-slate-800">{emp.leaveAllocations?.other}</span>
                    </td>
                    <td className="p-4 pr-6 text-center">
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => navigate(`/hr/employee/${emp._id}/profile`)}
                          className="px-3.5 py-1.5 bg-blue-50 text-blue-600 border border-blue-150 rounded-lg text-xs font-semibold hover:bg-blue-100 transition-colors cursor-pointer"
                        >
                          Profile
                        </button>
                        <button
                          onClick={() => openEditModal(emp)}
                          className="px-3.5 py-1.5 bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
                        >
                          Edit Leaves
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm transition-opacity">
          <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-2xl border border-slate-100 relative">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold tracking-tight text-slate-900">Invite Employee</h2>
              <button 
                onClick={() => setShowInviteModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleInviteEmployee} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all text-slate-800 text-sm"
                  placeholder="e.g. Jason Derulo"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all text-slate-800 text-sm"
                  placeholder="e.g. jason@apex-hrms.com"
                />
              </div>

              <div className="border-t border-slate-100 pt-4 mt-4">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Leave Allowances (Days/Year)</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1 text-center">Sick</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={sickAlloc}
                      onChange={(e) => setSickAlloc(e.target.value)}
                      className="w-full px-2 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all text-slate-800 text-center text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1 text-center">Casual</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={casualAlloc}
                      onChange={(e) => setCasualAlloc(e.target.value)}
                      className="w-full px-2 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all text-slate-800 text-center text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1 text-center">Other</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={otherAlloc}
                      onChange={(e) => setOtherAlloc(e.target.value)}
                      className="w-full px-2 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all text-slate-800 text-center text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 font-semibold rounded-lg hover:bg-slate-50 transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors text-sm disabled:opacity-50"
                >
                  {submitLoading ? 'Inviting...' : 'Send Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Leave Allocations Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm transition-opacity">
          <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-2xl border border-slate-100 relative">
            <div className="flex justify-between items-center mb-1">
              <h2 className="text-lg font-bold tracking-tight text-slate-900">Modify Allocations</h2>
              <button 
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-xs font-semibold text-slate-500 mb-6">
              Editing leaves for: <strong className="text-slate-700">{selectedEmployee?.name}</strong>
            </p>
            
            <form onSubmit={handleUpdateAllocations} className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 text-center">Sick Leave</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={editSick}
                    onChange={(e) => setEditSick(e.target.value)}
                    className="w-full px-2 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all text-slate-800 text-center text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 text-center">Casual Leave</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={editCasual}
                    onChange={(e) => setEditCasual(e.target.value)}
                    className="w-full px-2 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all text-slate-800 text-center text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 text-center">Other Leave</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={editOther}
                    onChange={(e) => setEditOther(e.target.value)}
                    className="w-full px-2 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all text-slate-800 text-center text-sm"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 font-semibold rounded-lg hover:bg-slate-50 transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors text-sm disabled:opacity-50"
                >
                  {submitLoading ? 'Updating...' : 'Save Adjustments'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HREmployees;
