import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../services/api';

const EmployeeProfile = () => {
  const { id } = useParams();

  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name[0].toUpperCase();
  };
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [todayLog, setTodayLog] = useState(null);
  const [approvedLeaves, setApprovedLeaves] = useState([]);
  const [profileLoading, setProfileLoading] = useState(true);

  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [attendanceLoading, setAttendanceLoading] = useState(true);

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  // Build year options (last 3 years + current)
  const years = [now.getFullYear() - 2, now.getFullYear() - 1, now.getFullYear()];

  const fetchProfile = async () => {
    setProfileLoading(true);
    try {
      const res = await API.get(`/hr/employee/${id}/profile`);
      if (res.data.success) {
        setProfile(res.data.employee);
        setTodayLog(res.data.todayAttendance);
        setApprovedLeaves(res.data.approvedLeaves);
      }
    } catch (err) {
      console.error('Failed to load employee profile:', err);
    } finally {
      setProfileLoading(false);
    }
  };

  const fetchMonthlyAttendance = async () => {
    setAttendanceLoading(true);
    try {
      const res = await API.get(`/hr/employee/${id}/attendance`, {
        params: { month: selectedMonth, year: selectedYear }
      });
      if (res.data.success) {
        setAttendanceLogs(res.data.logs);
      }
    } catch (err) {
      console.error('Failed to fetch attendance logs:', err);
    } finally {
      setAttendanceLoading(false);
    }
  };

  useEffect(() => { fetchProfile(); }, [id]);
  useEffect(() => { fetchMonthlyAttendance(); }, [id, selectedMonth, selectedYear]);

  const formatTime = (isoString) => {
    if (!isoString) return '-';
    return new Date(isoString).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateStr) => {
    const [year, month, day] = dateStr.split('-');
    return new Date(year, month - 1, day).toLocaleDateString(undefined, {
      weekday: 'short', day: 'numeric', month: 'short'
    });
  };

  // Calculate total worked hours this month
  const totalMonthHours = attendanceLogs.reduce((sum, log) => sum + (log.totalHours || 0), 0);
  const daysPresent = attendanceLogs.filter(l => l.checkInTime).length;

  if (profileLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center font-sans">
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100 text-center animate-pulse flex flex-col items-center">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 mb-3">
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <p className="text-slate-500 font-semibold tracking-wide text-sm">Loading Employee Profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-16 text-center text-slate-400 font-semibold uppercase tracking-wider font-sans">
        Employee not found.
      </div>
    );
  }

  const alloc = profile.leaveAllocations || {};
  const used = profile.leaveUsed || {};

  return (
    <div className="space-y-6 max-w-6xl font-sans">

      {/* Back Button + Header */}
      <div className="flex items-center gap-4 flex-wrap bg-white p-6 rounded-2xl border border-slate-100 shadow-sm shadow-slate-100/50">
        <button
          onClick={() => navigate('/hr/employees')}
          className="flat-button-secondary py-2 px-4 text-xs font-semibold rounded-lg flex items-center gap-2"
        >
          ← Back to Employees
        </button>
        <div className="flex items-center gap-3 ml-2">
          {profile.profileImage ? (
            <img 
              src={profile.profileImage} 
              alt={profile.name} 
              className="w-12 h-12 rounded-full object-cover border border-slate-200 shadow-sm flex-shrink-0" 
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-650 flex items-center justify-center text-white font-semibold text-sm shadow-sm flex-shrink-0">
              {getInitials(profile.name)}
            </div>
          )}
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">{profile.name}</h1>
            <p className="text-xs font-medium text-slate-400 mt-0.5">{profile.email}</p>
          </div>
        </div>
        <span className={`ml-auto inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
          profile.status === 'Active'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
            : 'bg-amber-50 border-amber-200 text-amber-700'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${profile.status === 'Active' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
          {profile.status}
        </span>
      </div>

      {/* Top Row: Today's Clock + Leave Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Today's Attendance Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-semibold uppercase text-slate-500 tracking-wider mb-5">
              Today's Attendance
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-slate-50/50 border border-slate-100 p-3.5 rounded-xl">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</span>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                  todayLog?.status === 'Checked-In'
                    ? 'bg-emerald-50 border-emerald-250 text-emerald-800'
                    : todayLog?.status === 'Checked-Out'
                    ? 'bg-rose-50 border-rose-250 text-rose-800'
                    : 'bg-slate-50 border-slate-200 text-slate-650'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    todayLog?.status === 'Checked-In' ? 'bg-emerald-500' : todayLog?.status === 'Checked-Out' ? 'bg-rose-500' : 'bg-slate-400'
                  }`}></span>
                  {todayLog ? todayLog.status : 'Away'}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50/50 border border-slate-105 p-3 rounded-xl text-center">
                  <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Check In</p>
                  <p className="font-semibold text-slate-800 text-sm">{formatTime(todayLog?.checkInTime)}</p>
                </div>
                <div className="bg-slate-50/50 border border-slate-105 p-3 rounded-xl text-center">
                  <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Check Out</p>
                  <p className="font-semibold text-slate-800 text-sm">{formatTime(todayLog?.checkOutTime)}</p>
                </div>
              </div>
              
              {todayLog?.totalHours > 0 && (
                <div className="bg-slate-900 text-slate-200 p-3 rounded-xl text-center font-medium text-xs">
                  {todayLog.totalHours} hours worked today
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Leave Balances */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm lg:col-span-2">
          <h2 className="text-sm font-semibold uppercase text-slate-500 tracking-wider mb-5">
            Leave Balances
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {['sick', 'casual', 'other'].map((type) => {
              const allocated = alloc[type] || 0;
              const usedDays = used[type] || 0;
              const remaining = allocated - usedDays;
              const pct = allocated > 0 ? Math.round((usedDays / allocated) * 100) : 0;
              
              const isSick = type === 'sick';
              const isCasual = type === 'casual';
              
              return (
                <div key={type} className="border border-slate-150 p-4.5 rounded-xl bg-slate-50/30 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider capitalize">{type} Leave</span>
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                        isSick
                          ? 'bg-rose-50 border-rose-100 text-rose-700'
                          : isCasual
                          ? 'bg-blue-50 border-blue-100 text-blue-700'
                          : 'bg-emerald-50 border-emerald-100 text-emerald-700'
                      }`}>
                        Used: {usedDays}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-slate-800">{remaining}</span>
                      <span className="text-xs font-medium text-slate-400">/{allocated} days</span>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full bg-slate-100 h-1.5 rounded-full mt-4 overflow-hidden border border-slate-200/30">
                    <div
                      className={`h-full rounded-full ${
                        isSick ? 'bg-rose-500' : isCasual ? 'bg-blue-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                  <p className="text-[9px] text-slate-400 font-semibold mt-1.5">{pct}% used</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Monthly Attendance Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {/* Table Header with month/year selector */}
        <div className="px-6 py-4 border-b border-slate-150 bg-slate-50/50 flex justify-between items-center flex-wrap gap-3">
          <div>
            <span className="font-semibold text-sm text-slate-700">Monthly Attendance Log</span>
            <div className="flex gap-3 mt-1.5 text-xs font-semibold text-slate-400">
              <span>Days Present: <strong className="text-slate-700">{daysPresent}</strong></span>
              <span>|</span>
              <span>Total Hours: <strong className="text-slate-700">{Math.round(totalMonthHours * 100) / 100} hrs</strong></span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all text-slate-700 text-xs font-semibold cursor-pointer"
            >
              {monthNames.map((m, i) => (
                <option key={i + 1} value={i + 1}>{m}</option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all text-slate-700 text-xs font-semibold cursor-pointer"
            >
              {years.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {attendanceLoading ? (
          <div className="p-16 text-center text-slate-400 font-medium tracking-wide">
            <div className="animate-pulse">Loading attendance logs...</div>
          </div>
        ) : attendanceLogs.length === 0 ? (
          <div className="p-16 text-center text-slate-450 font-medium">
            No attendance records found for {monthNames[selectedMonth - 1]} {selectedYear}.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500 bg-slate-50/70">
                  <th className="p-4 pl-6">Date</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Check-In</th>
                  <th className="p-4">Check-Out</th>
                  <th className="p-4 pr-6 text-center">Hours Worked</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {attendanceLogs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 pl-6 font-semibold text-slate-900">{formatDate(log.date)}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                        log.status === 'Checked-In'
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                          : 'bg-rose-50 border-rose-200 text-rose-700'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          log.status === 'Checked-In' ? 'bg-emerald-500' : 'bg-rose-500'
                        }`}></span>
                        {log.status}
                      </span>
                    </td>
                    <td className="p-4 text-slate-650 font-medium text-sm">{formatTime(log.checkInTime)}</td>
                    <td className="p-4 text-slate-650 font-medium text-sm">{formatTime(log.checkOutTime)}</td>
                    <td className="p-4 pr-6 text-center font-semibold text-slate-800 text-sm">
                      {log.totalHours > 0 ? `${log.totalHours} hrs` : (
                        <span className="text-slate-350 font-normal">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              {/* Monthly summary row */}
              <tfoot>
                <tr className="bg-slate-50/70 border-t border-slate-200">
                  <td className="p-4 pl-6 font-semibold text-slate-600 uppercase text-xs tracking-wider" colSpan={2}>
                    Monthly Summary
                  </td>
                  <td className="p-4 text-xs font-semibold text-slate-500">{daysPresent} days present</td>
                  <td className="p-4"></td>
                  <td className="p-4 pr-6 text-center font-bold text-slate-800 text-sm">
                    {Math.round(totalMonthHours * 100) / 100} hrs total
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default EmployeeProfile;
