import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import Input from "../common/Input";
import Button from "../common/Button";
import { validateEmail } from "../../utils/validators";

export default function LoginForm({ onSubmit, loading }) {
  const [showPass, setShowPass] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-[0_4px_24px_rgba(23,63,95,0.08)] p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold text-[#173F5F] mb-1.5">Welcome back</h1>
          <p className="text-sm text-[#6B7280]">Sign in to continue your interview prep</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <Input
            label="Email address"
            type="email"
            placeholder="you@example.com"
            error={errors.email?.message}
            {...register("email", {
              required: "Email is required",
              validate: (v) => validateEmail(v) || "Enter a valid email",
            })}
          />

          <div className="relative">
            <Input
              label="Password"
              type={showPass ? "text" : "password"}
              placeholder="••••••••"
              error={errors.password?.message}
              {...register("password", { required: "Password is required", minLength: { value: 6, message: "Minimum 6 characters" } })}
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-[34px] text-[#6B7280] hover:text-[#1F2937] transition-colors"
              aria-label={showPass ? "Hide password" : "Show password"}
            >
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <div className="flex justify-end">
            <Link to="/forgot-password" className="text-xs text-[#3CAEA3] hover:text-[#2d9d92] font-medium transition-colors">
              Forgot password?
            </Link>
          </div>

          <Button type="submit" variant="primary" size="lg" className="w-full justify-center" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-[#6B7280]">
          Don't have an account?{" "}
          <Link to="/signup" className="text-[#173F5F] font-semibold hover:text-[#3CAEA3] transition-colors">
            Create one free
          </Link>
        </p>
      </div>
    </div>
  );
}
