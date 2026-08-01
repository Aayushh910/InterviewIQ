import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight } from 'lucide-react';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';

const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const Register = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = (data) => {
    signup(data.fullName, data.email);
    setTimeout(() => {
      navigate('/dashboard', { replace: true });
    }, 300);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-sans font-extrabold text-white tracking-tight">Create Your Account</h2>
        <p className="text-xs text-neutral-400 mt-1">Practice smart. Interview with confidence.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Full Name"
          type="text"
          placeholder="Alex Rivera"
          icon={User}
          error={errors.fullName?.message}
          {...register('fullName')}
        />

        <Input
          label="Email Address"
          type="email"
          placeholder="alex@company.com"
          icon={Mail}
          error={errors.email?.message}
          {...register('email')}
        />

        <Input
          label="Password"
          type="password"
          placeholder="••••••••••••"
          icon={Lock}
          helperText="Use at least 8 characters including letters, numbers, and one special character."
          error={errors.password?.message}
          {...register('password')}
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={isSubmitting}
          className="w-full mt-4"
          icon={ArrowRight}
          iconPosition="right"
        >
          Create InterviewIQ Account
        </Button>
      </form>

      <p className="text-xs text-center text-neutral-400 mt-6">
        Already registered? <Link to="/login" className="text-white font-bold hover:underline">Sign In</Link>
      </p>
    </div>
  );
};
