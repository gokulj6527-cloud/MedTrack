import React, { useState } from 'react';
import { X, KeyRound, UserCheck, ShieldCheck, Factory, Truck, Pill, AlertCircle } from 'lucide-react';
import { api, setAuthToken, type UserToken } from '../services/api';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserToken) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.login(userId, password);
      if (res.success) {
        setAuthToken(res.token, res.user);
        onSuccess(res.user);
        onClose();
      } else {
        setError(res.message || 'Login failed.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error logging in.');
    } finally {
      setLoading(false);
    }
  };

  const selectQuickAccount = (id: string, pass: string) => {
    setUserId(id);
    setPassword(pass);
    setError(null);
  };

  const seedAccounts = [
    { role: 'ADMIN', id: 'ADMIN001', pass: 'Admin@123', label: 'System Administrator', icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { role: 'MANUFACTURER', id: 'MAN001', pass: 'Man@123', label: 'Apollo Pharma', icon: Factory, color: 'text-blue-600', bg: 'bg-blue-50' },
    { role: 'DISTRIBUTOR', id: 'DIST001', pass: 'Dist@123', label: 'HealthCare Dist', icon: Truck, color: 'text-amber-600', bg: 'bg-amber-50' },
    { role: 'PHARMACIST', id: 'PHARM001', pass: 'Pharm@123', label: 'Apollo Pharm', icon: Pill, color: 'text-purple-600', bg: 'bg-purple-50' },
    { role: 'USER', id: 'USER001', pass: 'User@123', label: 'Patient / Recipient', icon: UserCheck, color: 'text-teal-600', bg: 'bg-teal-50' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg rounded-2xl bg-white border border-slate-200 p-8 shadow-2xl">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full bg-slate-50 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="space-y-2 mb-8">
          <div className="inline-flex items-center space-x-2 text-xs font-semibold text-emerald-700 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
            <KeyRound className="w-3.5 h-3.5" />
            <span>Role Authentication</span>
          </div>
          <h2 className="text-2xl font-light text-slate-900 tracking-tight">Log In to MedTrack</h2>
          <p className="text-sm text-slate-500 font-light">
            Select a quick demo account or enter your credentials.
          </p>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm flex items-center space-x-3 shadow-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* Quick Demo Credentials Preset Bar */}
        <div className="mb-8 space-y-3">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Quick Academic Demo Accounts
          </div>
          <div className="grid grid-cols-2 gap-3">
            {seedAccounts.map((acc, idx) => {
              const Icon = acc.icon;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => selectQuickAccount(acc.id, acc.pass)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    userId === acc.id
                      ? 'bg-slate-50 border-emerald-400 shadow-sm ring-1 ring-emerald-400'
                      : 'bg-white border-slate-200 hover:border-emerald-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-1">
                    <div className={`p-1.5 rounded-lg ${acc.bg}`}>
                      <Icon className={`w-3.5 h-3.5 ${acc.color}`} />
                    </div>
                    <span className="font-semibold text-slate-800 text-sm">{acc.id}</span>
                  </div>
                  <div className="text-xs text-slate-500 font-light pl-8">{acc.label}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Form Input */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">User ID</label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="e.g. ADMIN001"
              required
              className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
              className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 mt-2 rounded-xl bg-emerald-700 text-white font-medium text-sm shadow-md hover:bg-emerald-800 hover:shadow-lg focus:ring-2 focus:ring-emerald-500/50 focus:outline-none transition-all flex items-center justify-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <UserCheck className="w-4 h-4" />
                <span>Log In to Dashboard</span>
              </>
            )}
          </button>
        </form>

      </div>
    </div>
  );
};
