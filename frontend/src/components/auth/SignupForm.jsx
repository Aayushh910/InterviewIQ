import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import Input from "../common/Input";
import Button from "../common/Button";
import { validateEmail, validatePassword } from "../../utils/validators";

export default function SignupForm({ onSubmit, loading }) {
  const [showPass, setShowPass] = useState(false);
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const password = watch("password");

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-[0_4px_24px_rgba(23,63,95,0.08)] p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold text-[#173F5F] mb-1.5">Create your account</h1>
          <p className="text-sm text-[#6B7280]">Start your AI interview prep journey today</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="First name"
              placeholder="Aayush"
              error={errors.firstName?.message}
              {...register("firstName", { required: "Required" })}
            />
            <Input
              label="Last name"
              placeholder="Savaliya"
              error={errors.lastName?.message}
              {...register("lastName", { required: "Required" })}
            />
          </div>

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
              placeholder="Min. 8 characters"
              error={errors.password?.message}
              {...register("password", {
                required: "Password is required",
                validate: (v) => validatePassword(v) || "Min 8 chars, 1 uppercase, 1 number",
              })}
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

          <Input
            label="Confirm password"
            type="password"
            placeholder="••••••••"
            error={errors.confirmPassword?.message}
            {...register("confirmPassword", {
              required: "Please confirm your password",
              validate: (v) => v === password || "Passwords do not match",
            })}
          />

          <Button type="submit" variant="primary" size="lg" className="w-full justify-center" disabled={loading}>
            {loading ? "Creating account..." : "Create Free Account"}
          </Button>
        </form>

        <p className="mt-4 text-center text-xs text-[#6B7280]">
          By signing up, you agree to our{" "}
          <a href="#" className="text-[#173F5F] font-medium hover:text-[#3CAEA3] transition-colors">Terms</a>
          {" "}and{" "}
          <a href="#" className="text-[#173F5F] font-medium hover:text-[#3CAEA3] transition-colors">Privacy Policy</a>
        </p>

        <p className="mt-4 text-center text-sm text-[#6B7280]">
          Already have an account?{" "}
          <Link to="/login" className="text-[#173F5F] font-semibold hover:text-[#3CAEA3] transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
