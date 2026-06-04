import React, { useState, useEffect } from 'react';
import API from '../services/api';

const EmployeeLeaves = () => {
  const [myLeaves, setMyLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMyLeaves = async () => {
    try {
      const response = await API.get('/employee/leaves');
      if (response.data.success) {
        setMyLeaves(response.data.leaves);
      }
    } catch (err) {
      console.error('Error fetching leaves:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyLeaves();
  }, []);

  return (
    <div className="space-y-8 max-w-6xl font-sans">
      <div>
        <h1 className="text-3xl font-black uppercase text-slate-900 tracking-tight">Leave History</h1>
        <p className="text-sm font-semibold text-slate-505 mt-1">
          Review all your submitted leave applications and their current status.
        </p>
      </div>

      <div className="flat-card bg-white p-0 overflow-hidden">
        <div className="p-4 border-b-2 border-slate-900 bg-slate-100 flex justify-between items-center">
          <span className="font-extrabold uppercase text-xs tracking-wider text-slate-700">My Leave Applications</span>
          <span className="bg-slate-900 text-white text-xs font-black px-2 py-0.5 border border-slate-900">
            Records: {myLeaves.length}
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 font-bold uppercase tracking-wider">
            Loading history...
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
                        <span className="inline-block px-2.5 py-0.5 text-xs font-black uppercase tracking-wider bg-slate-205 border border-slate-400 text-slate-800 font-bold">
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
    </div>
  );
};

export default EmployeeLeaves;
