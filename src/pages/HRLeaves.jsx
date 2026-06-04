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
    <div className="space-y-8 max-w-6xl font-sans">
      {/* Sub-header options */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase text-slate-900 tracking-tight">Leave Desk</h1>
          <p className="text-sm font-semibold text-slate-500 mt-1">
            Review incoming employee leave requests and track approval histories.
          </p>
        </div>
        <div className="flex border-2 border-slate-900">
          <button
            onClick={() => setFilterStatus('Pending')}
            className={`px-4 py-2 text-xs font-black uppercase tracking-wider transition-all duration-100 ${
              filterStatus === 'Pending' ? 'bg-slate-900 text-white' : 'bg-white text-slate-900 hover:bg-slate-100'
            }`}
          >
            Pending ({leaves.filter(l => l.status === 'Pending').length})
          </button>
          <button
            onClick={() => setFilterStatus('History')}
            className={`px-4 py-2 text-xs font-black uppercase tracking-wider transition-all duration-100 ${
              filterStatus === 'History' ? 'bg-slate-900 text-white' : 'bg-white text-slate-900 hover:bg-slate-100'
            }`}
          >
            History ({leaves.filter(l => l.status !== 'Pending').length})
          </button>
        </div>
      </div>

      {/* Messaging Panel */}
      {message.text && (
        <div className={`border-2 p-4 font-bold text-sm rounded-none ${
          message.type === 'success' 
            ? 'bg-green-50 border-green-500 text-green-900' 
            : 'bg-red-50 border-red-500 text-red-900'
        }`}>
          {message.text}
        </div>
      )}

      {/* Main Grid View */}
      <div className="flat-card bg-white p-0 overflow-hidden">
        <div className="p-4 border-b-2 border-slate-900 bg-slate-100 flex justify-between items-center">
          <span className="font-extrabold uppercase text-xs tracking-wider text-slate-700">
            {filterStatus === 'Pending' ? 'Active Applications' : 'Archived Requests'}
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 font-bold uppercase tracking-wider">
            Fetching leave documents...
          </div>
        ) : filteredLeaves.length === 0 ? (
          <div className="p-12 text-center text-slate-500 font-medium">
            {filterStatus === 'Pending' 
              ? 'No pending leave applications at this time.' 
              : 'Leave history is empty.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-900 text-xs font-black uppercase tracking-wider text-slate-700 bg-slate-50">
                  <th className="p-4">Employee</th>
                  <th className="p-4">Leave Context</th>
                  <th className="p-4">Duration</th>
                  <th className="p-4">Reason</th>
                  {filterStatus === 'Pending' ? (
                    <th className="p-4 text-center">Decisions</th>
                  ) : (
                    <th className="p-4">Resolution</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-slate-100">
                {filteredLeaves.map((leave) => {
                  const days = calculateDays(leave.startDate, leave.endDate);
                  const available = leave.userId 
                    ? leave.userId.leaveAllocations[leave.leaveType] - leave.userId.leaveUsed[leave.leaveType]
                    : 0;

                  return (
                    <tr key={leave._id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4">
                        <p className="font-bold text-slate-900">{leave.userId?.name || 'Unknown'}</p>
                        <p className="text-slate-500 text-xs font-semibold">{leave.userId?.email || ''}</p>
                      </td>
                      <td className="p-4">
                        <span className="inline-block px-2 py-0.5 text-xs font-black uppercase tracking-wider bg-slate-200 border border-slate-400 text-slate-800 mb-1.5 font-bold">
                          {leave.leaveType}
                        </span>
                        {filterStatus === 'Pending' && (
                          <p className="text-xs text-slate-500 font-semibold">
                            Balance: <strong className="text-slate-900">{available} days</strong> left
                          </p>
                        )}
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
                      {filterStatus === 'Pending' ? (
                        <td className="p-4">
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={() => handleAction(leave._id, 'Approved')}
                              className="flat-button py-1 px-3 text-xs uppercase tracking-wider bg-green-700 border-green-700 text-white hover:bg-white hover:text-green-700 hover:shadow-[4px_4px_0px_0px_rgba(21,128,61,1)]"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleAction(leave._id, 'Rejected')}
                              className="flat-button py-1 px-3 text-xs uppercase tracking-wider bg-red-700 border-red-700 text-white hover:bg-white hover:text-red-700 hover:shadow-[4px_4px_0px_0px_rgba(185,28,28,1)]"
                            >
                              Reject
                            </button>
                          </div>
                        </td>
                      ) : (
                        <td className="p-4">
                          <span className={`inline-block px-2.5 py-1 text-xs font-bold uppercase tracking-widest border-2 ${
                            leave.status === 'Approved'
                              ? 'bg-green-100 border-green-700 text-green-800'
                              : 'bg-red-100 border-red-700 text-red-800'
                          }`}>
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
