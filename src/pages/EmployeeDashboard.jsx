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
    return new Date(isoString).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  // Calculations
  const allocations = user?.leaveAllocations || { sick: 12, casual: 10, other: 8 };
  const used = user?.leaveUsed || { sick: 0, casual: 0, other: 0 };
  const available = {
    sick: allocations.sick - used.sick,
    casual: allocations.casual - used.casual,
    other: allocations.other - used.other
  };

  return (
    <div className="space-y-8 max-w-6xl font-sans">
      {/* Welcome Banner */}
      <div>
        <h1 className="text-3xl font-black uppercase text-slate-900 tracking-tight">Employee Console</h1>
        <p className="text-sm font-semibold text-slate-500 mt-1">
          Manage your daily check-in logs and request leave allowances.
        </p>
      </div>

      {message.text && (
        <div className={`border-2 p-4 font-bold text-sm rounded-none ${
          message.type === 'success' 
            ? 'bg-green-50 border-green-500 text-green-900' 
            : 'bg-red-50 border-red-500 text-red-900'
        }`}>
          {message.text}
        </div>
      )}

      {/* Main Grid split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Attendance Console */}
        <div className="flat-card bg-white p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-black uppercase text-slate-900 border-b-2 border-slate-900 pb-2 mb-6">Attendance clock</h2>
            
            {attendanceLoading ? (
              <div className="text-slate-500 text-sm font-bold uppercase tracking-wider py-6">
                Reading time clock...
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-slate-50 border border-slate-350 p-4">
                  <span className="text-xs uppercase font-extrabold text-slate-505">Status</span>
                  <span className={`px-2.5 py-0.5 text-xs font-black uppercase tracking-widest border-2 ${
                    todayLog?.status === 'Checked-In'
                      ? 'bg-green-100 border-green-700 text-green-800'
                      : todayLog?.status === 'Checked-Out'
                      ? 'bg-red-100 border-red-700 text-red-800'
                      : 'bg-slate-100 border-slate-700 text-slate-800'
                  }`}>
                    {todayLog ? todayLog.status : 'Away / Not Checked In'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 border border-slate-350 p-4">
                    <p className="text-[10px] uppercase font-extrabold text-slate-500 mb-1">Check In</p>
                    <p className="font-bold text-slate-900">{formatTime(todayLog?.checkInTime)}</p>
                  </div>
                  <div className="bg-slate-50 border border-slate-350 p-4">
                    <p className="text-[10px] uppercase font-extrabold text-slate-500 mb-1">Check Out</p>
                    <p className="font-bold text-slate-900">{formatTime(todayLog?.checkOutTime)}</p>
                  </div>
                </div>

                {todayLog?.totalHours > 0 && (
                  <div className="bg-slate-900 text-white p-4 text-center font-bold">
                    Worked Hours Today: {todayLog.totalHours} hrs
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="pt-6 border-t border-slate-200 mt-6">
            <button
              onClick={handleAttendanceToggle}
              disabled={toggleLoading || todayLog?.status === 'Checked-Out'}
              className={`w-full flat-button py-3 text-sm uppercase tracking-widest ${
                todayLog?.status === 'Checked-In' ? 'bg-red-600 border-red-700 text-white hover:bg-white hover:text-red-700 hover:shadow-[4px_4px_0px_0px_rgba(220,38,38,1)]' : ''
              } disabled:opacity-50 disabled:cursor-not-allowed`}
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
        <div className="flat-card bg-white p-6 lg:col-span-2">
          <div className="flex justify-between items-center border-b-2 border-slate-900 pb-2 mb-6">
            <h2 className="text-lg font-black uppercase text-slate-900">Available Leaves</h2>
            <button
              onClick={() => setShowApplyModal(true)}
              className="flat-button-secondary py-1 px-3 text-xs uppercase tracking-wider"
            >
              Apply For Leave
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Sick Card */}
            <div className="border-2 border-slate-900 p-4 bg-slate-50 shadow-[2px_2px_0px_0px_#0f172a]">
              <h3 className="text-xs uppercase font-extrabold tracking-widest text-slate-505 mb-2">Sick Leave</h3>
              <div className="flex justify-between items-end">
                <div>
                  <span className="text-3xl font-black text-slate-900">{available.sick}</span>
                  <span className="text-xs font-bold text-slate-400">/{allocations.sick} days</span>
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider bg-slate-900 text-white px-2 py-0.5 border border-slate-900">
                  Used: {used.sick}
                </span>
              </div>
            </div>

            {/* Casual Card */}
            <div className="border-2 border-slate-900 p-4 bg-slate-50 shadow-[2px_2px_0px_0px_#0f172a]">
              <h3 className="text-xs uppercase font-extrabold tracking-widest text-slate-550 mb-2">Casual Leave</h3>
              <div className="flex justify-between items-end">
                <div>
                  <span className="text-3xl font-black text-slate-900">{available.casual}</span>
                  <span className="text-xs font-bold text-slate-400">/{allocations.casual} days</span>
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider bg-slate-900 text-white px-2 py-0.5 border border-slate-900">
                  Used: {used.casual}
                </span>
              </div>
            </div>

            {/* Other Card */}
            <div className="border-2 border-slate-900 p-4 bg-slate-50 shadow-[2px_2px_0px_0px_#0f172a]">
              <h3 className="text-xs uppercase font-extrabold tracking-widest text-slate-500 mb-2">Other Leave</h3>
              <div className="flex justify-between items-end">
                <div>
                  <span className="text-3xl font-black text-slate-900">{available.other}</span>
                  <span className="text-xs font-bold text-slate-400">/{allocations.other} days</span>
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider bg-slate-900 text-white px-2 py-0.5 border border-slate-900">
                  Used: {used.other}
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Leave Request History Table */}
      <div className="flat-card bg-white p-0 overflow-hidden">
        <div className="p-4 border-b-2 border-slate-900 bg-slate-100 flex justify-between items-center">
          <span className="font-extrabold uppercase text-xs tracking-wider text-slate-700">My Leave Applications</span>
          <span className="bg-slate-900 text-white text-xs font-black px-2 py-0.5 border border-slate-900">
            Records: {myLeaves.length}
          </span>
        </div>

        {leavesLoading ? (
          <div className="p-12 text-center text-slate-500 font-bold uppercase tracking-wider">
            Fetching leaves history...
          </div>
        ) : myLeaves.length === 0 ? (
          <div className="p-12 text-center text-slate-500 font-medium">
            You haven't submitted any leave applications yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-900 text-xs font-black uppercase tracking-wider text-slate-700 bg-slate-50">
                  <th className="p-4">Leave Type</th>
                  <th className="p-4">Duration</th>
                  <th className="p-4">Reason</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Applied Date</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-slate-100">
                {myLeaves.map((leave) => {
                  const days = Math.ceil((new Date(leave.endDate) - new Date(leave.startDate)) / (1000 * 60 * 60 * 24)) + 1;
                  return (
                    <tr key={leave._id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4">
                        <span className="inline-block px-2.5 py-0.5 text-xs font-black uppercase tracking-wider bg-slate-200 border border-slate-400 text-slate-800 font-bold">
                          {leave.leaveType}
                        </span>
                      </td>
                      <td className="p-4">
                        <p className="font-bold text-slate-900 text-sm">{days} {days === 1 ? 'day' : 'days'}</p>
                        <p className="text-xs font-semibold text-slate-500">
                          {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                        </p>
                      </td>
                      <td className="p-4 text-slate-600 font-semibold text-sm max-w-xs truncate" title={leave.reason}>
                        {leave.reason}
                      </td>
                      <td className="p-4">
                        <span className={`inline-block px-2.5 py-1 text-xs font-bold uppercase tracking-widest border-2 ${
                          leave.status === 'Approved'
                            ? 'bg-green-100 border-green-700 text-green-800'
                            : leave.status === 'Rejected'
                            ? 'bg-red-100 border-red-700 text-red-800'
                            : 'bg-yellow-100 border-yellow-700 text-yellow-800'
                        }`}>
                          {leave.status}
                        </span>
                      </td>
                      <td className="p-4 text-slate-500 font-semibold text-xs">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="max-w-md w-full flat-card bg-white p-8 relative font-sans">
            <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900 mb-6">Apply For Leave</h2>
            
            <form onSubmit={handleApplyLeave} className="space-y-4">
              <div>
                <label className="block text-xs uppercase font-black tracking-wider text-slate-700 mb-1.5">
                  Leave Type
                </label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  className="w-full flat-input py-2"
                >
                  <option value="sick">Sick Leave ({available.sick} days left)</option>
                  <option value="casual">Casual Leave ({available.casual} days left)</option>
                  <option value="other">Other Leave ({available.other} days left)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase font-black tracking-wider text-slate-700 mb-1.5">
                    Start Date
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full flat-input py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase font-black tracking-wider text-slate-700 mb-1.5">
                    End Date
                  </label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full flat-input py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase font-black tracking-wider text-slate-700 mb-1.5">
                  Reason for Leave
                </label>
                <textarea
                  required
                  rows="3"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full flat-input py-2"
                  placeholder="Provide context for approval"
                ></textarea>
              </div>

              <div className="flex gap-4 pt-4 border-t border-slate-200 mt-6">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="flex-1 flat-button-secondary py-2 uppercase tracking-wider text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="flex-1 flat-button py-2 uppercase tracking-wider text-xs disabled:opacity-50"
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
