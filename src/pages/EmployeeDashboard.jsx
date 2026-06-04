import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';

const EmployeeDashboard = () => {
  const { user, refreshUser } = useAuth();
  
  // Attendance state
  const [todayLog, setTodayLog] = useState(null);
  const [attendanceLoading, setAttendanceLoading] = useState(true);
  const [toggleLoading, setToggleLoading] = useState(false);

  // Leave history state
  const [myLeaves, setMyLeaves] = useState([]);
  const [leavesLoading, setLeavesLoading] = useState(true);

  // Modal / Leave application state
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [leaveType, setLeaveType] = useState('sick');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);

  const [message, setMessage] = useState({ text: '', type: '' });

  const showFeedback = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 5000);
  };

  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name[0].toUpperCase();
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showFeedback('Profile image must be less than 2MB.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64Data = reader.result;
        const response = await API.put('/employee/profile-image', { profileImage: base64Data });
        if (response.data.success) {
          showFeedback('Profile picture updated successfully!', 'success');
          refreshUser();
        }
      } catch (err) {
        showFeedback(err.response?.data?.message || 'Failed to update profile picture.', 'error');
      }
    };
    reader.readAsDataURL(file);
  };

  const fetchAttendance = async () => {
    try {
      const response = await API.get('/employee/attendance/today');
      if (response.data.success) {
        setTodayLog(response.data.attendance);
      }
    } catch (err) {
      console.error('Error fetching today attendance:', err);
    } finally {
      setAttendanceLoading(false);
    }
  };

  const fetchMyLeaves = async () => {
    try {
      const response = await API.get('/employee/leaves');
      if (response.data.success) {
        setMyLeaves(response.data.leaves);
      }
    } catch (err) {
      console.error('Error fetching leaves:', err);
    } finally {
      setLeavesLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
    fetchMyLeaves();
  }, []);

  const handleAttendanceToggle = async () => {
    setToggleLoading(true);
    setMessage({ text: '', type: '' });
    try {
      const response = await API.post('/employee/attendance/toggle');
      if (response.data.success) {
        setTodayLog(response.data.attendance);
        showFeedback(response.data.message, 'success');
      }
    } catch (err) {
      showFeedback(err.response?.data?.message || 'Attendance toggle failed.', 'error');
    } finally {
      setToggleLoading(false);
    }
  };

  const handleApplyLeave = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const response = await API.post('/employee/leave', {
        leaveType,
        startDate,
        endDate,
        reason
      });

      if (response.data.success) {
        showFeedback('Leave application submitted successfully!', 'success');
        setLeaveType('sick');
        setStartDate('');
        setEndDate('');
        setReason('');
        setShowApplyModal(false);
        fetchMyLeaves(); // Reload history
        refreshUser(); // Sync user leave allocations
      }
    } catch (err) {
      showFeedback(err.response?.data?.message || 'Failed to submit leave request.', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  const formatTime = (isoString) => {
    if (!isoString) return '-';
    return new Date(isoString).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  };

  // Calculations
  const allocations = user?.leaveAllocations || { sick: 12, casual: 10, other: 8 };
  const used = user?.leaveUsed || { sick: 0, casual: 0, other: 0 };
  const available = {
    sick: allocations.sick - used.sick,
    casual: allocations.casual - used.casual,
    other: allocations.other - used.other
  };

  // Percentages for progress bars
  const sickPercent = allocations.sick > 0 ? (used.sick / allocations.sick) * 100 : 0;
  const casualPercent = allocations.casual > 0 ? (used.casual / allocations.casual) * 100 : 0;
  const otherPercent = allocations.other > 0 ? (used.other / allocations.other) * 100 : 0;

  return (
    <div className="space-y-6 max-w-6xl font-sans">
      {/* Welcome Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm shadow-slate-100/50 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4 flex-wrap">
          {/* Editable Avatar */}
          <div className="relative group cursor-pointer flex-shrink-0">
            <input 
              type="file" 
              id="avatar-upload" 
              className="hidden" 
              accept="image/*" 
              onChange={handleImageUpload} 
            />
            <label htmlFor="avatar-upload" className="cursor-pointer block relative">
              {user?.profileImage ? (
                <img 
                  src={user.profileImage} 
                  alt="Profile" 
                  className="w-16 h-16 rounded-full object-cover shadow-md border border-slate-150 group-hover:opacity-75 transition-opacity" 
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-650 flex items-center justify-center text-white font-bold text-xl shadow-md border border-slate-150 group-hover:opacity-75 transition-opacity">
                  {getInitials(user?.name)}
                </div>
              )}
              {/* Camera Icon Overlay */}
              <div className="absolute inset-0 bg-black/45 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            </label>
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">Welcome, {user?.name} 👋</h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage your daily check-in logs and request leave allowances.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-xs font-semibold text-slate-500">System Online</span>
        </div>
      </div>

      {message.text && (
        <div className={`border p-4 rounded-xl text-sm font-medium transition-all ${
          message.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* Main Grid split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Attendance Console */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between h-full">
          <div>
            <h2 className="text-sm font-semibold uppercase text-slate-500 tracking-wider mb-6">Attendance clock</h2>
            
            {attendanceLoading ? (
              <div className="py-8 text-center text-slate-400 text-sm font-medium animate-pulse">
                Reading time clock...
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-slate-50/50 border border-slate-100 p-4 rounded-xl">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</span>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                    todayLog?.status === 'Checked-In'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                      : todayLog?.status === 'Checked-Out'
                      ? 'bg-rose-50 border-rose-200 text-rose-700'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      todayLog?.status === 'Checked-In' 
                        ? 'bg-emerald-500' 
                        : todayLog?.status === 'Checked-Out' 
                        ? 'bg-rose-500' 
                        : 'bg-slate-400'
                    }`}></span>
                    {todayLog ? todayLog.status : 'Away'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50/50 border border-slate-100 p-3.5 rounded-xl text-center">
                    <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Check In</p>
                    <p className="font-semibold text-slate-800 text-base">{formatTime(todayLog?.checkInTime)}</p>
                  </div>
                  <div className="bg-slate-50/50 border border-slate-100 p-3.5 rounded-xl text-center">
                    <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Check Out</p>
                    <p className="font-semibold text-slate-800 text-base">{formatTime(todayLog?.checkOutTime)}</p>
                  </div>
                </div>

                {todayLog?.totalHours > 0 && (
                  <div className="bg-slate-900 text-slate-200 py-3 px-4 rounded-xl text-center font-semibold text-xs tracking-wide">
                    Worked Hours Today: <span className="text-white text-sm font-bold">{todayLog.totalHours} hrs</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="pt-6 border-t border-slate-100 mt-6">
            <button
              onClick={handleAttendanceToggle}
              disabled={toggleLoading || todayLog?.status === 'Checked-Out'}
              className={`w-full py-3 text-sm font-semibold rounded-xl transition-all cursor-pointer ${
                todayLog?.status === 'Checked-In' 
                  ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-650/15' 
                  : todayLog?.status === 'Checked-Out'
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/15'
              } disabled:opacity-50`}
            >
              {toggleLoading 
                ? 'Processing...' 
                : todayLog?.status === 'Checked-In' 
                ? 'Check Out' 
                : todayLog?.status === 'Checked-Out'
                ? 'Shift Completed'
                : 'Check In'}
            </button>
          </div>
        </div>

        {/* Leave Balances */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-6">
              <h2 className="text-sm font-semibold uppercase text-slate-500 tracking-wider">Leave Allowances</h2>
              <button
                onClick={() => setShowApplyModal(true)}
                className="flat-button-secondary py-1.5 px-4 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors"
              >
                Apply For Leave
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Sick Card */}
              <div className="border border-slate-150 p-4.5 rounded-xl bg-slate-50/30 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Sick Leave</span>
                    <span className="text-[9px] font-bold uppercase tracking-wider bg-rose-50 text-rose-750 px-2 py-0.5 rounded-full border border-rose-100">
                      Used: {used.sick}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-slate-800">{available.sick}</span>
                    <span className="text-xs font-medium text-slate-400">/{allocations.sick} days left</span>
                  </div>
                </div>
                {/* Visual Progress Bar */}
                <div className="w-full bg-slate-100 h-1.5 rounded-full mt-4 overflow-hidden border border-slate-200/30">
                  <div className="bg-rose-500 h-full rounded-full" style={{ width: `${Math.min(sickPercent, 100)}%` }}></div>
                </div>
              </div>

              {/* Casual Card */}
              <div className="border border-slate-150 p-4.5 rounded-xl bg-slate-50/30 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Casual Leave</span>
                    <span className="text-[9px] font-bold uppercase tracking-wider bg-blue-50 text-blue-750 px-2 py-0.5 rounded-full border border-blue-100">
                      Used: {used.casual}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-slate-800">{available.casual}</span>
                    <span className="text-xs font-medium text-slate-400">/{allocations.casual} days left</span>
                  </div>
                </div>
                {/* Visual Progress Bar */}
                <div className="w-full bg-slate-100 h-1.5 rounded-full mt-4 overflow-hidden border border-slate-200/30">
                  <div className="bg-blue-500 h-full rounded-full" style={{ width: `${Math.min(casualPercent, 100)}%` }}></div>
                </div>
              </div>

              {/* Other Card */}
              <div className="border border-slate-150 p-4.5 rounded-xl bg-slate-50/30 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Other Leave</span>
                    <span className="text-[9px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-750 px-2 py-0.5 rounded-full border border-emerald-100">
                      Used: {used.other}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-slate-800">{available.other}</span>
                    <span className="text-xs font-medium text-slate-400">/{allocations.other} days left</span>
                  </div>
                </div>
                {/* Visual Progress Bar */}
                <div className="w-full bg-slate-100 h-1.5 rounded-full mt-4 overflow-hidden border border-slate-200/30">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${Math.min(otherPercent, 100)}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Leave Request History Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-150 bg-slate-50/50 flex justify-between items-center">
          <span className="font-semibold text-sm text-slate-700">My Leave Applications</span>
          <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full border border-blue-100">
            Records: {myLeaves.length}
          </span>
        </div>

        {leavesLoading ? (
          <div className="p-16 text-center text-slate-400 font-medium tracking-wide">
            <div className="animate-pulse">Fetching leaves history...</div>
          </div>
        ) : myLeaves.length === 0 ? (
          <div className="p-16 text-center text-slate-400 font-medium">
            You haven't submitted any leave applications yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500 bg-slate-50/70">
                  <th className="p-4 pl-6">Leave Type</th>
                  <th className="p-4">Duration</th>
                  <th className="p-4">Reason</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 pr-6">Applied Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {myLeaves.map((leave) => {
                  const days = Math.ceil((new Date(leave.endDate) - new Date(leave.startDate)) / (1000 * 60 * 60 * 24)) + 1;
                  return (
                    <tr key={leave._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 pl-6">
                        <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold capitalize bg-slate-150/70 text-slate-700 border border-slate-200 rounded-full">
                          {leave.leaveType}
                        </span>
                      </td>
                      <td className="p-4">
                        <p className="font-semibold text-slate-900 text-sm">{days} {days === 1 ? 'day' : 'days'}</p>
                        <p className="text-xs font-medium text-slate-400">
                          {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                        </p>
                      </td>
                      <td className="p-4 text-slate-500 font-medium text-sm max-w-xs truncate" title={leave.reason}>
                        {leave.reason}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                          leave.status === 'Approved'
                            ? 'bg-emerald-50 border-emerald-250 text-emerald-700'
                            : leave.status === 'Rejected'
                            ? 'bg-rose-50 border-rose-250 text-rose-700'
                            : 'bg-amber-50 border-amber-250 text-amber-700'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            leave.status === 'Approved' ? 'bg-emerald-500' : leave.status === 'Rejected' ? 'bg-rose-500' : 'bg-amber-500'
                          }`}></span>
                          {leave.status}
                        </span>
                      </td>
                      <td className="p-4 pr-6 text-slate-400 text-xs font-medium">
                        {new Date(leave.appliedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Apply Leave Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm transition-opacity">
          <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-2xl border border-slate-100 relative font-sans">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold tracking-tight text-slate-900">Apply For Leave</h2>
              <button 
                onClick={() => setShowApplyModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleApplyLeave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Leave Type
                </label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all text-slate-800 text-sm"
                >
                  <option value="sick">Sick Leave ({available.sick} days left)</option>
                  <option value="casual">Casual Leave ({available.casual} days left)</option>
                  <option value="other">Other Leave ({available.other} days left)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all text-slate-800 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all text-slate-800 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Reason for Leave
                </label>
                <textarea
                  required
                  rows="3"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all text-slate-800 text-sm"
                  placeholder="Provide context for approval"
                ></textarea>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 font-semibold rounded-lg hover:bg-slate-50 transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors text-sm disabled:opacity-50"
                >
                  {submitLoading ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeDashboard;
