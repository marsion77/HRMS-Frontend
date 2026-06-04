import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../services/api';

const EmployeeProfile = () => {
  const { id } = useParams();
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
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="text-lg font-extrabold uppercase tracking-widest text-slate-900 border-4 border-slate-900 p-6 bg-white shadow-[4px_4px_0px_0px_#0f172a]">
          Loading Employee Profile...
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-8 text-center text-slate-500 font-bold uppercase">Employee not found.</div>
    );
  }

  const alloc = profile.leaveAllocations || {};
  const used = profile.leaveUsed || {};

  return (
    <div className="space-y-8 max-w-6xl font-sans">

      {/* Back Button + Header */}
      <div className="flex items-center gap-4 flex-wrap">
        <button
          onClick={() => navigate('/hr/employees')}
          className="flat-button-secondary py-2 px-4 text-xs uppercase tracking-wider flex items-center gap-2"
        >
          ← Back to Employees
        </button>
        <div>
          <h1 className="text-3xl font-black uppercase text-slate-900 tracking-tight">{profile.name}</h1>
          <p className="text-sm font-semibold text-slate-500">{profile.email}</p>
        </div>
        <span className={`ml-auto inline-block px-3 py-1 text-xs font-black uppercase tracking-widest border-2 ${
          profile.status === 'Active'
            ? 'bg-green-100 border-green-700 text-green-800'
            : 'bg-yellow-100 border-yellow-700 text-yellow-800'
        }`}>
          {profile.status}
        </span>
      </div>

      {/* Top Row: Today's Clock + Leave Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Today's Attendance Card */}
        <div className="flat-card bg-white p-6">
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-700 border-b-2 border-slate-900 pb-2 mb-4">
            Today's Attendance
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-extrabold uppercase text-slate-500">Status</span>
              <span className={`px-2.5 py-0.5 text-xs font-black uppercase tracking-widest border-2 ${
                todayLog?.status === 'Checked-In'
                  ? 'bg-green-100 border-green-700 text-green-800'
                  : todayLog?.status === 'Checked-Out'
                  ? 'bg-red-100 border-red-700 text-red-800'
                  : 'bg-slate-100 border-slate-700 text-slate-700'
              }`}>
                {todayLog ? todayLog.status : 'Away'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 border border-slate-200 p-3">
                <p className="text-[10px] uppercase font-extrabold text-slate-400 mb-1">Check In</p>
                <p className="font-bold text-slate-900">{formatTime(todayLog?.checkInTime)}</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 p-3">
                <p className="text-[10px] uppercase font-extrabold text-slate-400 mb-1">Check Out</p>
                <p className="font-bold text-slate-900">{formatTime(todayLog?.checkOutTime)}</p>
              </div>
            </div>
            {todayLog?.totalHours > 0 && (
              <div className="bg-slate-900 text-white p-3 text-center font-extrabold text-sm">
                {todayLog.totalHours} hours worked today
              </div>
            )}
          </div>
        </div>

        {/* Leave Balances */}
        <div className="flat-card bg-white p-6 lg:col-span-2">
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-700 border-b-2 border-slate-900 pb-2 mb-4">
            Leave Balances
          </h2>
          <div className="grid grid-cols-3 gap-4">
            {['sick', 'casual', 'other'].map((type) => {
              const allocated = alloc[type] || 0;
              const usedDays = used[type] || 0;
              const remaining = allocated - usedDays;
              const pct = allocated > 0 ? Math.round((usedDays / allocated) * 100) : 0;
              return (
                <div key={type} className="border-2 border-slate-900 p-4 bg-slate-50 shadow-[2px_2px_0px_0px_#0f172a]">
                  <h3 className="text-[10px] uppercase font-extrabold tracking-widest text-slate-500 mb-2 capitalize">
                    {type} Leave
                  </h3>
                  <div className="flex justify-between items-end mb-2">
                    <div>
                      <span className="text-2xl font-black text-slate-900">{remaining}</span>
                      <span className="text-xs font-bold text-slate-400">/{allocated}</span>
                    </div>
                    <span className="text-[10px] font-black uppercase bg-slate-900 text-white px-1.5 py-0.5">
                      Used: {usedDays}
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="h-1.5 bg-slate-200 border border-slate-300">
                    <div
                      className="h-full bg-slate-900"
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 font-semibold mt-1">{pct}% used</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Monthly Attendance Table */}
      <div className="flat-card bg-white p-0 overflow-hidden">
        {/* Table Header with month/year selector */}
        <div className="p-4 border-b-2 border-slate-900 bg-slate-100 flex justify-between items-center flex-wrap gap-3">
          <div>
            <span className="font-extrabold uppercase text-xs tracking-wider text-slate-700">Monthly Attendance Log</span>
            <div className="flex gap-3 mt-1 text-xs font-bold text-slate-500">
              <span>Days Present: <strong className="text-slate-900">{daysPresent}</strong></span>
              <span>|</span>
              <span>Total Hours: <strong className="text-slate-900">{Math.round(totalMonthHours * 100) / 100} hrs</strong></span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="flat-input py-1 px-2 text-xs font-bold"
            >
              {monthNames.map((m, i) => (
                <option key={i + 1} value={i + 1}>{m}</option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="flat-input py-1 px-2 text-xs font-bold"
            >
              {years.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {attendanceLoading ? (
          <div className="p-12 text-center text-slate-500 font-bold uppercase tracking-wider text-sm">
            Loading attendance logs...
          </div>
        ) : attendanceLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-500 font-medium">
            No attendance records found for {monthNames[selectedMonth - 1]} {selectedYear}.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-900 text-xs font-black uppercase tracking-wider text-slate-700 bg-slate-50">
                  <th className="p-4">Date</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Check-In</th>
                  <th className="p-4">Check-Out</th>
                  <th className="p-4 text-center">Hours Worked</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-slate-100">
                {attendanceLogs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-bold text-slate-900">{formatDate(log.date)}</td>
                    <td className="p-4">
                      <span className={`inline-block px-2.5 py-0.5 text-xs font-black uppercase tracking-widest border-2 ${
                        log.status === 'Checked-In'
                          ? 'bg-green-100 border-green-700 text-green-800'
                          : 'bg-red-100 border-red-700 text-red-800'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-slate-700">{formatTime(log.checkInTime)}</td>
                    <td className="p-4 font-bold text-slate-700">{formatTime(log.checkOutTime)}</td>
                    <td className="p-4 text-center font-extrabold text-slate-900">
                      {log.totalHours > 0 ? `${log.totalHours} hrs` : (
                        <span className="text-slate-400 font-semibold">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              {/* Monthly summary row */}
              <tfoot>
                <tr className="border-t-2 border-slate-900 bg-slate-100">
                  <td className="p-4 font-black text-slate-900 uppercase text-xs tracking-wider" colSpan={2}>
                    Monthly Summary
                  </td>
                  <td className="p-4 text-xs font-bold text-slate-600">{daysPresent} days present</td>
                  <td className="p-4"></td>
                  <td className="p-4 text-center font-black text-slate-900">
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
