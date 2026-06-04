import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../services/api';

const EyeIcon = ({ visible }) => visible ? (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
) : (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
  </svg>
);

const ActivateAccount = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(true);
  const [invitedUser, setInvitedUser] = useState(null);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tokenError, setTokenError] = useState('');

  useEffect(() => {
    const verifyToken = async () => {
      try {
        const response = await API.get(`/auth/activate/${token}`);
        if (response.data.success) {
          setInvitedUser(response.data);
        } else {
          setTokenError('The activation link is invalid or has expired.');
        }
      } catch (err) {
        setTokenError(err.response?.data?.message || 'The activation link is invalid or has expired.');
      } finally {
        setVerifying(false);
        setLoading(false);
      }
    };
    verifyToken();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const response = await API.post('/auth/activate', { token, password });
      if (response.data.success) {
        setSuccess('Account activated successfully! Redirecting to login page...');
        setTimeout(() => navigate('/login'), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to activate account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-xl font-extrabold uppercase tracking-widest text-slate-900 border-4 border-slate-900 p-6 bg-white shadow-[4px_4px_0px_0px_#0f172a]">
          Verifying activation link...
        </div>
      </div>
    );
  }

  if (tokenError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full flat-card bg-white p-8 text-center">
          <h1 className="text-2xl font-black text-red-600 uppercase tracking-tight mb-4">Activation Failed</h1>
          <p className="text-slate-600 mb-6 font-semibold">{tokenError}</p>
          <button onClick={() => navigate('/login')} className="flat-button py-2 px-6">Go to Login</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans">
      <div className="max-w-md w-full flat-card bg-white p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900">Activate Account</h1>
          <p className="text-sm font-semibold text-slate-500 mt-1">
            Setting up profile for <strong className="text-slate-900">{invitedUser?.name}</strong> as <strong className="text-slate-900">{invitedUser?.role}</strong>
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border-2 border-red-500 text-red-900 font-bold p-3 text-sm mb-6">{error}</div>
        )}
        {success && (
          <div className="bg-green-50 border-2 border-green-500 text-green-900 font-bold p-3 text-sm mb-6">{success}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs uppercase font-black tracking-wider text-slate-700 mb-2">Email Address</label>
            <input
              type="text"
              disabled
              value={invitedUser?.email}
              className="w-full flat-input bg-slate-100 cursor-not-allowed opacity-70"
            />
          </div>

          <div>
            <label className="block text-xs uppercase font-black tracking-wider text-slate-700 mb-2">New Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full flat-input pr-12"
                placeholder="Min. 6 characters"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900 transition-colors"
                tabIndex={-1}
              >
                <EyeIcon visible={showPassword} />
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase font-black tracking-wider text-slate-700 mb-2">Confirm Password</label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full flat-input pr-12"
                placeholder="Repeat password"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900 transition-colors"
                tabIndex={-1}
              >
                <EyeIcon visible={showConfirm} />
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flat-button py-3 text-sm uppercase tracking-widest disabled:opacity-50"
          >
            {loading ? 'Activating Account...' : 'Activate Profile'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ActivateAccount;
