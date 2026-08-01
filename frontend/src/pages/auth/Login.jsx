import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Github } from 'lucide-react';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [toast, setToast] = useState('');

  const from = location.state?.from?.pathname || '/dashboard';

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'candidate@interviewiq.ai',
      password: 'Candidate@123',
    }
  });

  const onSubmit = (data) => {
    login(data.email, data.password);
    setTimeout(() => {
      navigate(from, { replace: true });
    }, 300);
  };

  const handleOAuthClick = () => {
    setToast('Coming Soon - OAuth will be implemented in the backend');
    setTimeout(() => setToast(''), 4000);
  };

  const handleSelectCredential = (email, password) => {
    setValue('email', email);
    setValue('password', password);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-sans font-extrabold text-white tracking-tight">Welcome Back</h2>
        <p className="text-xs text-neutral-400 mt-1">Pick up right where you left off and conquer your next interview.</p>
      </div>

      {toast && (
        <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono text-center">
          {toast}
        </div>
      )}

      {/* Demo Quick Credential Selectors */}
      <div className="mb-5 p-3 rounded-xl bg-[#121212] border border-[#222222] space-y-2">
        <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block">Demo Accounts:</span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleSelectCredential('candidate@interviewiq.ai', 'Candidate@123')}
            className="flex-1 py-1.5 px-2.5 rounded-lg bg-neutral-900 border border-neutral-800 text-[11px] font-medium text-emerald-400 hover:border-emerald-500/40 transition-colors"
          >
            Candidate Demo
          </button>
          <button
            type="button"
            onClick={() => handleSelectCredential('admin@interviewiq.ai', 'Admin@123')}
            className="flex-1 py-1.5 px-2.5 rounded-lg bg-neutral-900 border border-neutral-800 text-[11px] font-medium text-cyan-400 hover:border-cyan-500/40 transition-colors"
          >
            Admin Demo
          </button>
        </div>
      </div>

      {/* Social Logins */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <button
          type="button"
          onClick={handleOAuthClick}
          className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#121212] border border-[#222222] text-xs font-medium text-neutral-200 hover:border-neutral-500 hover:bg-[#181818] transition-all cursor-pointer"
        >
          <Github className="w-4 h-4 text-white" /> GitHub
        </button>
        <button
          type="button"
          onClick={handleOAuthClick}
          className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#121212] border border-[#222222] text-xs font-medium text-neutral-200 hover:border-neutral-500 hover:bg-[#181818] transition-all cursor-pointer"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg> Google
        </button>
      </div>

      <div className="relative flex items-center justify-center mb-6">
        <div className="border-t border-[#222222] w-full" />
        <span className="bg-[#0A0A0A] px-3 text-[10px] font-mono text-neutral-500 uppercase absolute">or sign in with email</span>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Email Address"
          type="email"
          placeholder="candidate@interviewiq.ai"
          icon={Mail}
          error={errors.email?.message}
          {...register('email')}
        />

        <Input
          label="Password"
          type="password"
          placeholder="••••••••••••"
          icon={Lock}
          error={errors.password?.message}
          {...register('password')}
        />

        <div className="flex items-center justify-between text-xs pt-1">
          <label className="flex items-center gap-2 text-neutral-400 cursor-pointer">
            <input type="checkbox" defaultChecked className="rounded bg-black border-[#222222] text-white focus:ring-0" />
            Remember me
          </label>
          <Link to="/forgot-password" className="text-neutral-300 hover:text-white underline">Forgot password?</Link>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={isSubmitting}
          className="w-full mt-3"
          icon={ArrowRight}
          iconPosition="right"
        >
          Continue to Dashboard
        </Button>
      </form>

      <p className="text-xs text-center text-neutral-400 mt-6">
        Don't have an account? <Link to="/signup" className="text-white font-bold hover:underline">Create Account</Link>
      </p>
    </div>
  );
};
