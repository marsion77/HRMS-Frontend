import React, { useState, useEffect } from 'react';
import API from '../services/api';

const HRLeaves = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [filterStatus, setFilterStatus] = useState('Pending'); // 'Pending' or 'History'

  const fetchLeaves = async () => {
    try {
      const response = await API.get('/hr/leaves');
      if (response.data.success) {
        setLeaves(response.data.leaves);
      }
    } catch (err) {
      console.error(err);
      showFeedback('Failed to load leave requests.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const showFeedback = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 5000);
  };

  const handleAction = async (id, status) => {
    setMessage({ text: '', type: '' });
    try {
      const response = await API.put(`/hr/leave/${id}`, { status });
      if (response.data.success) {
        showFeedback(`Leave request successfully ${status.toLowerCase()}!`, 'success');
        fetchLeaves();
      }
    } catch (err) {
      showFeedback(err.response?.data?.message || `Failed to ${status.toLowerCase()} leave request.`, 'error');
    }
  };

  const calculateDays = (start, end) => {
    const s = new Date(start);
    const e = new Date(end);
    return Math.ceil((e - s) / (1000 * 60 * 60 * 24)) + 1;
  };

  const filteredLeaves = leaves.filter(l => {
    if (filterStatus === 'Pending') {
      return l.status === 'Pending';
    } else {
      return l.status !== 'Pending';
    }
  });

  return (
    <div className="space-y-6 max-w-6xl font-sans">
      {/* Sub-header options */}
      <div className="flex justify-between items-center flex-wrap gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm shadow-slate-100/50">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">Leave Desk</h1>
          <p className="text-sm text-slate-500 mt-1">
            Review incoming employee leave requests and track approval histories.
          </p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/50">
          <button
            onClick={() => setFilterStatus('Pending')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 cursor-pointer ${
              filterStatus === 'Pending' 
                ? 'bg-white text-slate-800 shadow-sm' 
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Pending ({leaves.filter(l => l.status === 'Pending').length})
          </button>
          <button
            onClick={() => setFilterStatus('History')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 cursor-pointer ${
              filterStatus === 'History' 
                ? 'bg-white text-slate-800 shadow-sm' 
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            History ({leaves.filter(l => l.status !== 'Pending').length})
          </button>
        </div>
      </div>

      {/* Messaging Panel */}
      {message.text && (
        <div className={`border p-4 rounded-xl text-sm font-medium transition-all ${
          message.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* Main Grid View */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-150 bg-slate-50/50 flex justify-between items-center">
          <span className="font-semibold text-sm text-slate-700">
            {filterStatus === 'Pending' ? 'Active Applications' : 'Archived Requests'}
          </span>
        </div>

        {loading ? (
          <div className="p-16 text-center text-slate-400 font-medium tracking-wide">
            <div className="animate-pulse">Fetching leave documents...</div>
          </div>
        ) : filteredLeaves.length === 0 ? (
          <div className="p-16 text-center text-slate-400 font-medium">
            {filterStatus === 'Pending' 
              ? 'No pending leave applications at this time.' 
              : 'Leave history is empty.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500 bg-slate-50/70">
                  <th className="p-4 pl-6">Employee</th>
                  <th className="p-4">Leave Context</th>
                  <th className="p-4">Duration</th>
                  <th className="p-4">Reason</th>
                  {filterStatus === 'Pending' ? (
                    <th className="p-4 text-center pr-6">Decisions</th>
                  ) : (
                    <th className="p-4 pr-6">Resolution</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLeaves.map((leave) => {
                  const days = calculateDays(leave.startDate, leave.endDate);
                  const available = leave.userId 
                    ? leave.userId.leaveAllocations[leave.leaveType] - leave.userId.leaveUsed[leave.leaveType]
                    : 0;

                  return (
                    <tr key={leave._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 pl-6">
                        <p className="font-semibold text-slate-900">{leave.userId?.name || 'Unknown'}</p>
                        <p className="text-slate-500 text-xs font-medium">{leave.userId?.email || ''}</p>
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-semibold capitalize bg-slate-150/75 text-slate-700 border border-slate-200 rounded-full mb-1.5">
                          {leave.leaveType}
                        </span>
                        {filterStatus === 'Pending' && (
                          <p className="text-xs text-slate-400 font-medium">
                            Balance: <strong className="text-slate-700 font-semibold">{available} days</strong> left
                          </p>
                        )}
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
                      {filterStatus === 'Pending' ? (
                        <td className="p-4 pr-6">
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={() => handleAction(leave._id, 'Approved')}
                              className="px-3.5 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold hover:bg-emerald-100 transition-colors cursor-pointer"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleAction(leave._id, 'Rejected')}
                              className="px-3.5 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold hover:bg-rose-100 transition-colors cursor-pointer"
                            >
                              Reject
                            </button>
                          </div>
                        </td>
                      ) : (
                        <td className="p-4 pr-6">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                            leave.status === 'Approved'
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                              : 'bg-rose-50 border-rose-200 text-rose-700'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              leave.status === 'Approved' ? 'bg-emerald-500' : 'bg-rose-500'
                            }`}></span>
                            {leave.status}
                          </span>
                        </td>
                      )}
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

export default HRLeaves;
