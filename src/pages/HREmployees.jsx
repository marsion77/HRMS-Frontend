import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';

const HREmployees = () => {
  const [employees, setEmployees] = useState([]);
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
    <div className="space-y-8 max-w-6xl font-sans">
      {/* Header Panel */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase text-slate-900 tracking-tight">Employee Directory</h1>
          <p className="text-sm font-semibold text-slate-500 mt-1">
            Register new employee profiles, customize leave allowances, and monitor activation status.
          </p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="flat-button px-6 py-3 uppercase tracking-widest text-sm"
        >
          + Invite Employee
        </button>
      </div>

      {/* Message Box */}
      {message.text && (
        <div className={`border-2 p-4 font-bold text-sm rounded-none ${
          message.type === 'success' 
            ? 'bg-green-50 border-green-500 text-green-900' 
            : 'bg-red-50 border-red-500 text-red-900'
        }`}>
          {message.text}
        </div>
      )}

      {/* Directory Table */}
      <div className="flat-card bg-white p-0 overflow-hidden">
        <div className="p-4 border-b-2 border-slate-900 bg-slate-100 flex justify-between items-center">
          <span className="font-extrabold uppercase text-xs tracking-wider text-slate-700">Employees Registry</span>
          <span className="bg-slate-900 text-white text-xs font-black px-2 py-0.5 border border-slate-900">
            Total Count: {employees.length}
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 font-bold uppercase tracking-wider">
            Loading employees database...
          </div>
        ) : employees.length === 0 ? (
          <div className="p-12 text-center text-slate-500 font-medium">
            No employees registered yet. Click "+ Invite Employee" to onboard team members.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-900 text-xs font-black uppercase tracking-wider text-slate-700 bg-slate-50">
                  <th className="p-4">Name</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Leave Allocations (Sick / Casual / Other)</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-slate-100">
                {employees.map((emp) => (
                  <tr key={emp._id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-bold text-slate-900">{emp.name}</td>
                    <td className="p-4 text-slate-600 font-semibold text-sm">{emp.email}</td>
                    <td className="p-4">
                      <span className={`inline-block px-2.5 py-1 text-xs font-bold uppercase tracking-widest border-2 ${
                        emp.status === 'Active'
                          ? 'bg-green-100 border-green-700 text-green-800'
                          : 'bg-yellow-100 border-yellow-700 text-yellow-800'
                      }`}>
                        {emp.status}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-slate-700 text-sm">
                      Sick: <span className="text-slate-900">{emp.leaveAllocations?.sick}</span> | 
                      Casual: <span className="text-slate-900">{emp.leaveAllocations?.casual}</span> | 
                      Other: <span className="text-slate-900">{emp.leaveAllocations?.other}</span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => navigate(`/hr/employee/${emp._id}/profile`)}
                          className="flat-button py-1 px-3 text-xs uppercase tracking-wider"
                        >
                          View Profile
                        </button>
                        <button
                          onClick={() => openEditModal(emp)}
                          className="flat-button-secondary py-1 px-3 text-xs uppercase tracking-wider"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="max-w-md w-full flat-card bg-white p-8 relative">
            <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900 mb-6">Invite Employee</h2>
            
            <form onSubmit={handleInviteEmployee} className="space-y-4">
              <div>
                <label className="block text-xs uppercase font-black tracking-wider text-slate-700 mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  className="w-full flat-input py-2"
                  placeholder="e.g. Jason Derulo"
                />
              </div>

              <div>
                <label className="block text-xs uppercase font-black tracking-wider text-slate-700 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full flat-input py-2"
                  placeholder="e.g. jason@sap.com"
                />
              </div>

              <div className="border-t border-slate-200 pt-4">
                <h3 className="text-xs uppercase font-black text-slate-700 tracking-wider mb-3">Leave Allowances (Days/Year)</h3>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] uppercase font-black text-slate-500 mb-1">Sick</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={sickAlloc}
                      onChange={(e) => setSickAlloc(e.target.value)}
                      className="w-full flat-input py-1.5 text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-black text-slate-500 mb-1">Casual</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={casualAlloc}
                      onChange={(e) => setCasualAlloc(e.target.value)}
                      className="w-full flat-input py-1.5 text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-black text-slate-500 mb-1">Other</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={otherAlloc}
                      onChange={(e) => setOtherAlloc(e.target.value)}
                      className="w-full flat-input py-1.5 text-center"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t border-slate-200 mt-4">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 flat-button-secondary py-2 uppercase tracking-wider text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="flex-1 flat-button py-2 uppercase tracking-wider text-xs disabled:opacity-50"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="max-w-md w-full flat-card bg-white p-8 relative">
            <h2 className="text-xl font-black uppercase tracking-tight text-slate-900 mb-2">Modify Allocations</h2>
            <p className="text-xs font-semibold text-slate-500 mb-6">
              Editing leaves for: <strong className="text-slate-900">{selectedEmployee?.name}</strong>
            </p>
            
            <form onSubmit={handleUpdateAllocations} className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs uppercase font-black text-slate-700 mb-2">Sick Leave</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={editSick}
                    onChange={(e) => setEditSick(e.target.value)}
                    className="w-full flat-input text-center"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase font-black text-slate-700 mb-2">Casual Leave</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={editCasual}
                    onChange={(e) => setEditCasual(e.target.value)}
                    className="w-full flat-input text-center"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase font-black text-slate-700 mb-2">Other Leave</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={editOther}
                    onChange={(e) => setEditOther(e.target.value)}
                    className="w-full flat-input text-center"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 flat-button-secondary py-2 uppercase tracking-wider text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="flex-1 flat-button py-2 uppercase tracking-wider text-xs disabled:opacity-50"
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
