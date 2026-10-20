import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { KeyRound, Mail, Lock, CheckCircle2, ArrowRight, AlertTriangle } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { apiClient } from '../../services/apiClient';

export const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    if (password.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await apiClient.post('/auth/reset-password', {
        email: email.trim().toLowerCase(),
        password,
      });
      setSuccess(true);
    } catch (err) {
      const msg = err?.response?.data?.detail || 'Failed to reset password. Please check your email.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-sans font-extrabold text-white tracking-tight">
          Reset Password
        </h2>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success ? (
        <div className="space-y-5 text-center">
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono flex items-center justify-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span>Password reset successfully!</span>
          </div>

          <p className="text-xs text-neutral-400">
            Your account credentials have been updated. You can now sign in with your new password.
          </p>

          <Button
            type="button"
            variant="primary"
            size="lg"
            className="w-full font-mono font-bold"
            onClick={() => navigate('/login')}
          >
            Go to Sign In
          </Button>
        </div>
      ) : (
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase font-mono tracking-wider text-neutral-300 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-neutral-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                className="w-full bg-[#141414] border border-white/15 text-xs rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-emerald-400 transition-colors font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase font-mono tracking-wider text-neutral-300 mb-1.5">
              New Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-neutral-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-[#141414] border border-white/15 text-xs rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-emerald-400 transition-colors font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase font-mono tracking-wider text-neutral-300 mb-1.5">
              Confirm New Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-neutral-400" />
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-[#141414] border border-white/15 text-xs rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-emerald-400 transition-colors font-mono"
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={loading}
            className="w-full mt-3 font-mono font-bold"
            icon={ArrowRight}
            iconPosition="right"
          >
            Set New Password
          </Button>

          <p className="text-xs text-center text-neutral-400 mt-5">
            Remembered your password? <Link to="/login" className="text-white font-bold hover:underline">Sign In</Link>
          </p>
        </form>
      )}
    </div>
  );
};

export default ForgotPassword;
