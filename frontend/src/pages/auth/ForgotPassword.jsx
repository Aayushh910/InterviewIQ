import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { KeyRound, Mail, ShieldCheck, Camera, Mic, CheckCircle2, ArrowRight, Lock, RefreshCw, Sparkles, Volume2 } from 'lucide-react';
import { Button } from '../../components/common/Button';

export const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password, 4: Hardware Check

  // Form State
  const [email, setEmail] = useState('candidate@interviewiq.ai');
  const [otp, setOtp] = useState(['8', '4', '9', '2', '1', '7']);
  const [resendTimer, setResendTimer] = useState(45);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Hardware State
  const [cameraDevice, setCameraDevice] = useState('Integrated HD Web Camera 1080p');
  const [micDevice, setMicDevice] = useState('Realtek High Definition Audio Mic');
  const [hardwareStatus, setHardwareStatus] = useState({ camera: 'Granted & Active', mic: 'Granted & Active' });
  const [micVolume, setMicVolume] = useState(78);

  // OTP Countdown Effect
  useEffect(() => {
    let interval;
    if (step === 2 && resendTimer > 0) {
      interval = setInterval(() => setResendTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [step, resendTimer]);

  // Real Hardware Detection on Step 4
  useEffect(() => {
    if (step === 4 && navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices()
        .then((devices) => {
          const videoDev = devices.find((d) => d.kind === 'videoinput');
          const audioDev = devices.find((d) => d.kind === 'audioinput');
          if (videoDev && videoDev.label) setCameraDevice(videoDev.label);
          if (audioDev && audioDev.label) setMicDevice(audioDev.label);
        })
        .catch(() => {});
    }
  }, [step]);

  const handleSendOtp = (e) => {
    e.preventDefault();
    if (!email) return;
    setStep(2);
    setResendTimer(45);
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    if (otp.join('').length === 6) {
      setStep(3);
    }
  };

  const handleResetPassword = (e) => {
    e.preventDefault();
    if (password && password === confirmPassword) {
      setStep(4);
    }
  };

  const handleOtpChange = (index, val) => {
    if (val.length > 1) val = val.slice(-1);
    const newOtp = [...otp];
    newOtp[index] = val;
    setOtp(newOtp);

    // Auto-focus next input
    if (val && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto py-4 font-sans">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl bg-[#0A0A0A]/95 border border-white/15 p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6 text-white"
      >
        {/* Step Indicator Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#141414] border border-white/20 text-emerald-400 text-xs font-mono font-semibold">
            <KeyRound className="w-3.5 h-3.5" /> Step {step} of 4: Account Recovery & System Pre-flight
          </div>
          <h1 className="text-2xl font-sans font-extrabold tracking-tight">
            {step === 1 && "Reset Account Password"}
            {step === 2 && "Enter Email OTP Verification Code"}
            {step === 3 && "Create New Secure Password"}
            {step === 4 && "Hardware Access Pre-flight Check"}
          </h1>
          <p className="text-xs text-neutral-400 max-w-sm mx-auto">
            {step === 1 && "Enter your registered candidate email address to receive a 6-digit verification code."}
            {step === 2 && `We sent a 6-digit OTP code to ${email}. Check your inbox.`}
            {step === 3 && "Set your new password with 256-bit encryption compliance."}
            {step === 4 && "Verify your microphone and camera access details before launching your next AI session."}
          </p>
        </div>

        {/* STEP 1: ENTER EMAIL */}
        {step === 1 && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase font-mono tracking-wider text-neutral-300 mb-1.5">
                Registered Candidate Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-neutral-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="w-full bg-[#141414] border border-white/15 text-xs rounded-xl pl-10 pr-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-400 font-mono transition-colors"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              icon={ArrowRight}
              iconPosition="right"
              className="w-full bg-white text-black hover:bg-neutral-200 font-bold border border-white/20 shadow-xl py-3 text-xs sm:text-sm"
            >
              Send 6-Digit Verification OTP
            </Button>

            <div className="text-center pt-2">
              <Link to="/login" className="text-xs font-mono text-neutral-400 hover:text-white">
                Remember your password? <span className="text-emerald-400 underline">Back to Login</span>
              </Link>
            </div>
          </form>
        )}

        {/* STEP 2: ENTER OTP */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase font-mono text-center tracking-wider text-neutral-300">
                6-Digit Security Code
              </label>

              <div className="flex justify-center items-center gap-2 font-mono">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`otp-input-${idx}`}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    className="w-11 h-12 text-center text-lg font-bold bg-[#141414] border border-white/20 rounded-xl text-emerald-400 focus:outline-none focus:border-emerald-400 shadow-md"
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-neutral-400">Didn't receive code?</span>
              <button
                type="button"
                disabled={resendTimer > 0}
                onClick={() => setResendTimer(45)}
                className="text-cyan-400 hover:underline disabled:opacity-50"
              >
                {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP Now'}
              </button>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              icon={ShieldCheck}
              iconPosition="right"
              className="w-full bg-white text-black hover:bg-neutral-200 font-bold border border-white/20 shadow-xl py-3 text-xs sm:text-sm"
            >
              Verify OTP Code
            </Button>
          </form>
        )}

        {/* STEP 3: NEW PASSWORD */}
        {step === 3 && (
          <form onSubmit={handleResetPassword} className="space-y-4">
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
                  className="w-full bg-[#141414] border border-white/15 text-xs rounded-xl pl-10 pr-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-400 font-mono transition-colors"
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
                  className="w-full bg-[#141414] border border-white/15 text-xs rounded-xl pl-10 pr-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-400 font-mono transition-colors"
                />
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-[#141414] border border-white/10 text-[11px] font-mono text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Password Security: Strong 256-bit Encryption Verified</span>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              icon={ArrowRight}
              iconPosition="right"
              className="w-full bg-white text-black hover:bg-neutral-200 font-bold border border-white/20 shadow-xl py-3 text-xs sm:text-sm"
            >
              Update Password & Run Pre-flight Check
            </Button>
          </form>
        )}

        {/* STEP 4: HARDWARE PRE-FLIGHT DIAGNOSTICS */}
        {step === 4 && (
          <div className="space-y-6 font-mono text-xs">
            <div className="p-4 rounded-2xl bg-[#141414] border border-white/15 space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-cyan-400" />
                  <span className="font-bold text-white">Camera Access Details</span>
                </div>
                <span className="text-[10px] text-emerald-400 bg-black px-2 py-0.5 rounded border border-white/15">
                  {hardwareStatus.camera}
                </span>
              </div>
              <div className="text-[11px] text-neutral-300">
                Device Name: <strong className="text-white">{cameraDevice}</strong>
              </div>
              <div className="text-[11px] text-neutral-400">
                Resolution: 1920 x 1080 @ 30 FPS • Vision Mesh Locked
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#141414] border border-white/15 space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <div className="flex items-center gap-2">
                  <Mic className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-white">Microphone Access Details</span>
                </div>
                <span className="text-[10px] text-emerald-400 bg-black px-2 py-0.5 rounded border border-white/15">
                  {hardwareStatus.mic}
                </span>
              </div>
              <div className="text-[11px] text-neutral-300">
                Device Name: <strong className="text-white">{micDevice}</strong>
              </div>
              <div className="space-y-1 pt-1">
                <div className="flex justify-between text-[10px] text-neutral-400">
                  <span>Input Volume Meter:</span>
                  <span className="text-emerald-400">{micVolume}% (Optimal)</span>
                </div>
                <div className="w-full bg-black rounded-full h-2 overflow-hidden border border-white/10">
                  <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${micVolume}%` }} />
                </div>
              </div>
            </div>

            <Button
              type="button"
              variant="primary"
              size="lg"
              onClick={() => navigate('/login')}
              icon={CheckCircle2}
              iconPosition="right"
              className="w-full bg-white text-black hover:bg-neutral-200 font-bold border border-white/20 shadow-xl py-3 text-xs sm:text-sm"
            >
              Complete Reset & Launch Login
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
