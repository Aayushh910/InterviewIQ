import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, ArrowRight, AlertTriangle } from 'lucide-react';
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
  const [errorMessage, setErrorMessage] = useState('');

  const from = location.state?.from?.pathname || '/dashboard';

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    }
  });

  const onSubmit = async (data) => {
    setErrorMessage('');
    const result = await login(data.email.trim(), data.password);
    if (result?.success) {
      navigate(from, { replace: true });
    } else {
      setErrorMessage(result?.error || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-sans font-extrabold text-white tracking-tight">Welcome Back</h2>
        <p className="text-xs text-neutral-400 mt-1">Log into your InterviewIQ account to continue your practice.</p>
      </div>

      {errorMessage && (
        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Email Address"
          type="email"
          placeholder="your.email@example.com"
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
          className="w-full mt-3 font-mono font-bold"
          icon={ArrowRight}
          iconPosition="right"
        >
          Sign In to Dashboard
        </Button>
      </form>

      <p className="text-xs text-center text-neutral-400 mt-6">
        Don't have an account? <Link to="/signup" className="text-white font-bold hover:underline">Create Account</Link>
      </p>
    </div>
  );
};

export default Login;
