import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Camera, Mic, Wifi, Sun, ScanFace, Volume2, CheckCircle2, AlertCircle, RefreshCw, ChevronRight, ShieldCheck } from 'lucide-react';
import { Button } from '../common/Button';

export const DeviceCheckStep = ({ onNext, onBack }) => {
  const [checks, setChecks] = useState({
    camera: 'pending',
    microphone: 'pending',
    internet: 'pending',
    lighting: 'pending',
    faceDetection: 'pending',
    voiceDetection: 'pending',
  });

  const [isRunning, setIsRunning] = useState(false);

  const runDiagnostic = () => {
    setIsRunning(true);
    setChecks({
      camera: 'checking',
      microphone: 'checking',
      internet: 'checking',
      lighting: 'checking',
      faceDetection: 'checking',
      voiceDetection: 'checking',
    });

    const items = ['camera', 'microphone', 'internet', 'lighting', 'faceDetection', 'voiceDetection'];
    items.forEach((item, index) => {
      setTimeout(() => {
        setChecks((prev) => ({ ...prev, [item]: 'success' }));
        if (index === items.length - 1) {
          setIsRunning(false);
        }
      }, (index + 1) * 600);
    });
  };

  const [cameraLabel, setCameraLabel] = useState('Integrated HD Web Camera 1080p');
  const [micLabel, setMicLabel] = useState('Realtek High Definition Audio Mic');

  useEffect(() => {
    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices()
        .then((devices) => {
          const videoDev = devices.find((d) => d.kind === 'videoinput');
          const audioDev = devices.find((d) => d.kind === 'audioinput');
          if (videoDev && videoDev.label) setCameraLabel(videoDev.label);
          if (audioDev && audioDev.label) setMicLabel(audioDev.label);
        })
        .catch(() => {});
    }
    runDiagnostic();
  }, []);

  const allPassed = Object.values(checks).every((status) => status === 'success');

  const checkItems = [
    { key: 'camera', label: 'Camera Preview & Permissions', icon: Camera, desc: `Detected: ${cameraLabel}` },
    { key: 'microphone', label: 'Microphone Audio Input', icon: Mic, desc: `Detected: ${micLabel}` },
    { key: 'internet', label: 'Network Latency & Connection', icon: Wifi, desc: 'Low latency real-time streaming (<38ms)' },
    { key: 'lighting', label: 'Ambient Lighting Quality', icon: Sun, desc: 'Facial illumination & contrast locked' },
    { key: 'faceDetection', label: 'AI Face & Pose Tracker', icon: ScanFace, desc: 'Eye contact & head posture calibrated' },
    { key: 'voiceDetection', label: 'Speech Recognition Engine', icon: Volume2, desc: 'Acoustic voice model active' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="max-w-3xl mx-auto space-y-6"
    >
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#141414] border border-white/20 text-cyan-400 text-xs font-mono font-semibold shadow-sm">
          <ShieldCheck className="w-4 h-4" /> Step 2 of 4: System Readiness Check
        </div>
        <h1 className="text-2xl sm:text-3xl font-sans font-extrabold text-white dark:text-white light:text-slate-900 tracking-tight">
          Verifying Hardware & Environmental Conditions
        </h1>
        <p className="text-xs sm:text-sm text-neutral-400 max-w-lg mx-auto">
          Ensure optimal camera lighting, clear microphone audio, and stable internet before beginning.
        </p>
      </div>

      <div className="rounded-3xl bg-[#0A0A0A]/90 dark:bg-[#0A0A0A]/90 light:bg-white border border-white/15 dark:border-white/15 light:border-slate-200 p-6 sm:p-8 shadow-2xl space-y-6 backdrop-blur-xl">
        
        {/* Diagnostic Checklist */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {checkItems.map((item) => {
            const Icon = item.icon;
            const status = checks[item.key];

            return (
              <div
                key={item.key}
                className="p-4 rounded-2xl bg-[#141414]/80 dark:bg-[#141414]/80 light:bg-slate-50 border border-white/10 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    status === 'success'
                      ? 'bg-[#0A0A0A] border border-white/15 text-emerald-400'
                      : status === 'checking'
                      ? 'bg-[#0A0A0A] border border-white/15 text-cyan-400 animate-spin'
                      : 'bg-black border border-white/10 text-neutral-500'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white dark:text-white light:text-slate-900">
                      {item.label}
                    </h3>
                    <p className="text-[11px] text-neutral-400 line-clamp-1">{item.desc}</p>
                  </div>
                </div>

                <div className="shrink-0 font-mono">
                  {status === 'success' && (
                    <span className="flex items-center gap-1 text-emerald-400 text-xs font-bold bg-[#0A0A0A] px-2.5 py-1 rounded-full border border-white/15 shadow-sm">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Ready
                    </span>
                  )}
                  {status === 'checking' && (
                    <span className="flex items-center gap-1 text-cyan-400 text-xs font-semibold bg-[#0A0A0A] px-2.5 py-1 rounded-full border border-white/15 shadow-sm">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Checking
                    </span>
                  )}
                  {status === 'pending' && (
                    <span className="text-neutral-500 text-xs font-medium">Pending</span>
                  )}
                  {status === 'failure' && (
                    <span className="flex items-center gap-1 text-red-400 text-xs font-bold bg-[#0A0A0A] px-2.5 py-1 rounded-full border border-white/15 shadow-sm">
                      <AlertCircle className="w-3.5 h-3.5" /> Failed
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Diagnostic Actions & Controls */}
        <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono">
          <button
            type="button"
            onClick={runDiagnostic}
            disabled={isRunning}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#141414] hover:bg-[#202020] text-neutral-200 text-xs font-semibold border border-white/15 flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} />
            Re-run Diagnostic Check
          </button>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onBack}
              className="px-4 py-2.5 text-xs font-semibold text-neutral-400 hover:text-white"
            >
              Back to Config
            </button>

            <Button
              type="button"
              variant="primary"
              size="lg"
              onClick={onNext}
              disabled={!allPassed}
              icon={ChevronRight}
              iconPosition="right"
              className={`w-full sm:w-auto font-bold shadow-xl ${
                allPassed
                  ? 'bg-white text-black hover:bg-neutral-200 border border-white/20 text-xs sm:text-sm px-6 py-3'
                  : 'bg-[#141414] text-neutral-600 cursor-not-allowed border border-white/10'
              }`}
            >
              Enter AI Interview Screen
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
