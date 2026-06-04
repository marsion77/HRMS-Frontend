import React, { useState, useEffect } from 'react';
import API from '../services/api';

const HRAttendance = () => {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState('');

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const response = await API.get('/hr/attendance');
      if (response.data.success) {
        setAttendance(response.data.attendance);
        setDate(response.data.date);
      }
    } catch (err) {
      console.error('Failed to fetch attendance logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

  const formatTime = (isoString) => {
    if (!isoString) return '-';
    const dateObj = new Date(isoString);
    return dateObj.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="space-y-8 max-w-6xl font-sans">
      {/* Action Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase text-slate-900 tracking-tight">Live Attendance Desk</h1>
          <p className="text-sm font-semibold text-slate-500 mt-1">
            Real-time check-in status and daily logs for active employees.
          </p>
        </div>
        <button
          onClick={fetchAttendance}
          className="flat-button px-6 py-3 uppercase tracking-widest text-sm"
        >
          Refresh Logs
        </button>
      </div>

      {/* Grid Dashboard panel */}
      <div className="flat-card bg-white p-0 overflow-hidden">
        <div className="p-4 border-b-2 border-slate-900 bg-slate-100 flex justify-between items-center flex-wrap gap-2">
          <div>
            <span className="font-extrabold uppercase text-xs tracking-wider text-slate-700">Daily Logs Date: </span>
            <span className="font-black text-slate-900 text-sm ml-1 uppercase">{date}</span>
          </div>
          <div className="flex gap-2">
            <span className="bg-green-100 text-green-800 border border-green-700 text-[10px] font-black px-2 py-0.5 uppercase tracking-wider">
              In: {attendance.filter(a => a.status === 'Checked-In').length}
            </span>
            <span className="bg-red-100 text-red-800 border border-red-700 text-[10px] font-black px-2 py-0.5 uppercase tracking-wider">
              Out: {attendance.filter(a => a.status === 'Checked-Out').length}
            </span>
            <span className="bg-slate-100 text-slate-800 border border-slate-700 text-[10px] font-black px-2 py-0.5 uppercase tracking-wider">
              Away: {attendance.filter(a => a.status === 'Away').length}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 font-bold uppercase tracking-wider">
            Fetching today's logs...
          </div>
        ) : attendance.length === 0 ? (
          <div className="p-12 text-center text-slate-500 font-medium">
            No active employee profiles found in the registry.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-900 text-xs font-black uppercase tracking-wider text-slate-700 bg-slate-50">
                  <th className="p-4">Employee</th>
                  <th className="p-4">Daily Status</th>
                  <th className="p-4">Check-In Time</th>
                  <th className="p-4">Check-Out Time</th>
                  <th className="p-4 text-center">Total Time</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-slate-100">
                {attendance.map((emp) => (
                  <tr key={emp.userId} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <p className="font-bold text-slate-900">{emp.name}</p>
                      <p className="text-slate-500 text-xs font-semibold">{emp.email}</p>
                    </td>
                    <td className="p-4">
                      <span className={`inline-block px-2.5 py-1 text-xs font-bold uppercase tracking-widest border-2 ${
                        emp.status === 'Checked-In'
                          ? 'bg-green-100 border-green-700 text-green-800'
                          : emp.status === 'Checked-Out'
                          ? 'bg-red-100 border-red-700 text-red-800'
                          : 'bg-slate-100 border-slate-700 text-slate-800'
                      }`}>
                        {emp.status === 'Away' ? 'Away / Not Checked In' : emp.status}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-slate-700 text-sm">
                      {formatTime(emp.checkInTime)}
                    </td>
                    <td className="p-4 font-bold text-slate-700 text-sm">
                      {formatTime(emp.checkOutTime)}
                    </td>
                    <td className="p-4 text-center font-extrabold text-slate-950">
                      {emp.totalHours > 0 ? `${emp.totalHours} hrs` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default HRAttendance;
