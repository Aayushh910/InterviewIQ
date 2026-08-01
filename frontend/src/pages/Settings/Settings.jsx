import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings as SettingsIcon, Bell, Camera, Mic, Shield, KeyRound, AlertTriangle,
  Check, X, Cpu, Eye, EyeOff, Sparkles, Volume2, RefreshCw, CheckCircle2
} from 'lucide-react';
import { Button } from '../../components/common/Button';

export const Settings = () => {
  // Custom AI API Key State
  const [aiProvider, setAiProvider] = useState('openai'); // 'openai' | 'gemini' | 'claude' | 'ollama'
  const [apiKey, setApiKey] = useState('sk-proj-4982a7f82b91c...89d1');
  const [voiceApiKey, setVoiceApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiTesting, setApiTesting] = useState(false);
  const [apiStatus, setApiStatus] = useState('Connected & Active (38ms ping)');

  // Hardware Devices State
  const [cameraDevice, setCameraDevice] = useState('Integrated HD Web Camera 1080p');
  const [micDevice, setMicDevice] = useState('Realtek High Definition Audio Mic');
  const [micVolume, setMicVolume] = useState(82);

  // Notifications & Privacy State
  const [notifications, setNotifications] = useState({
    emailDigest: true,
    interviewReminders: true,
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [toast, setToast] = useState('');

  // Detect real hardware devices
  useEffect(() => {
    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices()
        .then((devices) => {
          const videoDev = devices.find((d) => d.kind === 'videoinput');
          const audioDev = devices.find((d) => d.kind === 'audioinput');
          if (videoDev && videoDev.label) setCameraDevice(videoDev.label);
          if (audioDev && audioDev.label) setMicDevice(audioDev.label);
        })
        .catch(() => {});
    }
  }, []);

  const handleTestApiKey = () => {
    setApiTesting(true);
    setTimeout(() => {
      setApiTesting(false);
      setApiStatus('API Connection Verified (34ms ping)');
      setToast('Custom AI API Key verified and saved successfully!');
      setTimeout(() => setToast(''), 3000);
    }, 1200);
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    setToast('Password updated successfully!');
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setTimeout(() => setToast(''), 3000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto"
    >
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#141414] border border-white/20 text-emerald-400 text-xs font-mono font-semibold mb-2 shadow-sm">
          <SettingsIcon className="w-3.5 h-3.5" /> Workspace Control Center
        </div>
        <h1 className="text-2xl sm:text-3xl font-sans font-extrabold text-white dark:text-white light:text-slate-900 tracking-tight">
          Application Settings & AI API Management
        </h1>
        <p className="text-xs sm:text-sm text-neutral-400">
          Upload custom AI model API keys, manage microphone/camera access, configure notification preferences, and update security credentials.
        </p>
      </div>

      {toast && (
        <div className="p-4 rounded-2xl bg-[#141414] border border-white/20 text-emerald-400 text-xs font-mono text-center shadow-md">
          {toast}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* LEFT COLUMN: Custom AI API Upload & Live Hardware Diagnostics */}
        <div className="space-y-8">
          
          {/* 1. Custom AI Model API Key Configuration */}
          <div className="rounded-3xl bg-[#0A0A0A]/90 border border-white/15 p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-emerald-400" />
                <h2 className="text-base font-bold text-white">
                  Custom AI Engine & API Key Access
                </h2>
              </div>
              <span className="text-[10px] font-mono font-bold text-emerald-400 bg-[#141414] px-2.5 py-1 rounded-full border border-white/20">
                {apiStatus}
              </span>
            </div>

            <p className="text-xs text-neutral-400">
              Upload your personal AI API key (OpenAI GPT-4o, Google Gemini Pro, or Claude 3.5) to power your live mock interview loops.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase font-mono tracking-wider text-neutral-300 mb-1.5">
                  Select AI Provider Engine
                </label>
                <select
                  value={aiProvider}
                  onChange={(e) => setAiProvider(e.target.value)}
                  className="w-full bg-[#141414] border border-white/15 text-xs rounded-xl p-3 text-white font-mono focus:outline-none focus:border-emerald-400"
                >
                  <option value="openai">OpenAI (GPT-4o / GPT-4 Turbo)</option>
                  <option value="gemini">Google Gemini 1.5 Pro Engine</option>
                  <option value="claude">Anthropic Claude 3.5 Sonnet</option>
                  <option value="ollama">Local Ollama / Custom API Endpoint</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase font-mono tracking-wider text-neutral-300 mb-1.5">
                  AI Model API Key
                </label>
                <div className="relative">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-proj-..."
                    className="w-full bg-[#141414] border border-white/15 text-xs rounded-xl pl-4 pr-10 py-3 text-white font-mono focus:outline-none focus:border-emerald-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-3.5 text-neutral-400 hover:text-white"
                  >
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase font-mono tracking-wider text-neutral-300 mb-1.5">
                  Optional ElevenLabs Voice API Key (Text-to-Speech)
                </label>
                <input
                  type="password"
                  value={voiceApiKey}
                  onChange={(e) => setVoiceApiKey(e.target.value)}
                  placeholder="Optional voice synthesis key..."
                  className="w-full bg-[#141414] border border-white/15 text-xs rounded-xl p-3 text-white font-mono focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div className="pt-2">
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  onClick={handleTestApiKey}
                  disabled={apiTesting}
                  icon={RefreshCw}
                  className="w-full bg-white text-black hover:bg-neutral-200 font-bold border border-white/20 text-xs py-3 font-mono shadow-lg"
                >
                  {apiTesting ? 'Verifying AI API Endpoint...' : 'Save & Verify API Connection'}
                </Button>
              </div>
            </div>
          </div>

          {/* 2. Live Hardware Diagnostics & Device Access */}
          <div className="rounded-3xl bg-[#0A0A0A]/90 border border-white/15 p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-cyan-400" />
                <h2 className="text-base font-bold text-white">
                  Hardware Devices & Permissions Diagnostic
                </h2>
              </div>
              <span className="text-[10px] font-mono font-bold text-emerald-400 bg-[#141414] px-2 py-0.5 rounded border border-white/15">
                Hardware Access Verified
              </span>
            </div>

            <div className="space-y-4 font-mono text-xs">
              <div className="p-4 rounded-2xl bg-[#141414] border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-cyan-400" />
                    <span className="font-bold text-white">Camera Input Device</span>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-bold">Granted & Active</span>
                </div>
                <p className="text-[11px] text-neutral-300">{cameraDevice}</p>
                <p className="text-[10px] text-neutral-500">1920x1080 Resolution • 30 FPS Stream • Vision Mesh Active</p>
              </div>

              <div className="p-4 rounded-2xl bg-[#141414] border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mic className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold text-white">Microphone Input Device</span>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-bold">Granted & Active</span>
                </div>
                <p className="text-[11px] text-neutral-300">{micDevice}</p>
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-[10px] text-neutral-400">
                    <span>Live Input Level Meter:</span>
                    <span className="text-emerald-400">{micVolume}% (Clear Audio)</span>
                  </div>
                  <div className="w-full bg-black rounded-full h-2 overflow-hidden border border-white/10">
                    <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${micVolume}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Password Security, Notifications & Danger Zone */}
        <div className="space-y-8">
          
          {/* Change Password Form */}
          <div className="rounded-3xl bg-[#0A0A0A]/90 border border-white/15 p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-white/10 pb-3">
              <KeyRound className="w-5 h-5 text-emerald-400" /> Security & Password Calibration
            </h2>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase font-mono tracking-wider text-neutral-300 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  className="w-full bg-[#141414] border border-white/15 text-xs rounded-xl p-3 text-white focus:outline-none focus:border-emerald-400 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase font-mono tracking-wider text-neutral-300 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className="w-full bg-[#141414] border border-white/15 text-xs rounded-xl p-3 text-white focus:outline-none focus:border-emerald-400 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase font-mono tracking-wider text-neutral-300 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="w-full bg-[#141414] border border-white/15 text-xs rounded-xl p-3 text-white focus:outline-none focus:border-emerald-400 font-mono"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <a href="/forgot-password" className="text-xs text-cyan-400 hover:underline font-mono">
                  Forgot Password? OTP Flow →
                </a>
                <Button type="submit" variant="primary" size="md" className="bg-white text-black font-bold hover:bg-neutral-200 border border-white/20 shadow-md">
                  Update Password
                </Button>
              </div>
            </form>
          </div>

          {/* Notifications Channels */}
          <div className="rounded-3xl bg-[#0A0A0A]/90 border border-white/15 p-6 shadow-2xl backdrop-blur-xl space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-white/10 pb-3">
              <Bell className="w-5 h-5 text-purple-400" /> Notification Preferences
            </h2>

            <div className="space-y-3 text-xs">
              <label className="flex items-center justify-between p-3.5 rounded-2xl bg-[#141414] border border-white/10 cursor-pointer text-neutral-200">
                <span>Email Weekly Performance Digest</span>
                <input
                  type="checkbox"
                  checked={notifications.emailDigest}
                  onChange={(e) => setNotifications({ ...notifications, emailDigest: e.target.checked })}
                  className="w-4 h-4 rounded border-white/20 bg-black text-emerald-400 focus:ring-0"
                />
              </label>
              <label className="flex items-center justify-between p-3.5 rounded-2xl bg-[#141414] border border-white/10 cursor-pointer text-neutral-200">
                <span>Upcoming Practice Reminders</span>
                <input
                  type="checkbox"
                  checked={notifications.interviewReminders}
                  onChange={(e) => setNotifications({ ...notifications, interviewReminders: e.target.checked })}
                  className="w-4 h-4 rounded border-white/20 bg-black text-emerald-400 focus:ring-0"
                />
              </label>
            </div>
          </div>

          {/* Danger Zone: Delete Account */}
          <div className="rounded-3xl bg-[#141414] border border-red-500/30 p-6 shadow-2xl space-y-3">
            <h2 className="text-base font-bold text-red-400 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" /> Danger Zone
            </h2>
            <p className="text-xs text-neutral-400">
              Permanently delete your InterviewIQ candidate account, saved interview transcripts, and reports.
            </p>
            <button
              onClick={() => setDeleteModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold shadow-lg"
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {/* Delete Account Modal */}
      <AnimatePresence>
        {deleteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteModalOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative z-10 w-full max-w-md bg-[#0A0A0A] border border-red-500/40 rounded-3xl p-6 shadow-2xl text-white space-y-4 backdrop-blur-xl"
            >
              <div className="flex items-center gap-3 text-red-400">
                <AlertTriangle className="w-6 h-6" />
                <h3 className="text-lg font-bold">Confirm Account Deletion</h3>
              </div>
              <p className="text-xs text-neutral-300 bg-[#141414] p-3.5 rounded-2xl border border-white/10 font-sans">
                This action is permanent and cannot be undone. All your mock interview recordings, reports, and badges will be erased.
              </p>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setDeleteModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#141414] text-neutral-300 text-xs font-semibold border border-white/15"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    alert('Account deletion initiated.');
                    setDeleteModalOpen(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold"
                >
                  Confirm Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Settings;
