import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera,
  Mic,
  Volume2,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  X,
  Play,
  RotateCcw,
  Loader2,
  ShieldCheck,
  AlertTriangle,
  HelpCircle,
} from 'lucide-react';
import {
  createInterview,
  createSession,
  startSession,
  generateAIQuestions,
  getProctoringConfig,
} from '../../services/interviewService';
import { preloadFaceDetectionModels } from '../../hooks/useFaceDetection';

export const InterviewPreviewStep = ({ config, onStartInterview, onBack }) => {
  const selectedDomain = config.domain || config.interviewType || 'Frontend';
  const totalQuestions = config.questionsCount || 5;

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);

  const [streamActive, setStreamActive] = useState(false);
  const [micVolume, setMicVolume] = useState(0);
  const [cameraError, setCameraError] = useState(null);

  // Pre-fetching state
  const [preloadedData, setPreloadedData] = useState(null);
  const [isPreloading, setIsPreloading] = useState(true);
  const [preloadError, setPreloadError] = useState(null);

  // Walkthrough navigation steps
  const [currentStep, setCurrentStep] = useState(0);
  const [tourSkipped, setTourSkipped] = useState(false);

  // Countdown state before start
  const [countdown, setCountdown] = useState(null);

  const navigationSteps = [
    {
      title: 'Face & Posture Framing',
      description: 'Center your face within the guide box. Maintain natural eye contact with your camera and avoid heavy backlighting.',
      highlight: 'camera',
    },
    {
      title: 'Microphone & Speech Check',
      description: 'Speak into your microphone now. The live volume level indicator should animate green when you talk.',
      highlight: 'mic',
    },
    {
      title: '3-Minute Per-Question Timer',
      description: 'You will have 3 full minutes to answer each question. The countdown only starts after the AI finishes speaking.',
      highlight: 'timer',
    },
    {
      title: 'Fullscreen Immersion',
      description: 'Clicking Begin Interview enters fullscreen. To end early, click "End Interview" with the exit confirmation popup.',
      highlight: 'fullscreen',
    },
  ];

  // ─── 1. Setup Live Camera & Audio Level Meter ─────────────────────────────
  useEffect(() => {
    let mounted = true;
    preloadFaceDetectionModels();

    async function initMedia() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: true,
        });

        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        setStreamActive(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }

        // Setup Audio Analyser for live volume meter
        try {
          const AudioContext = window.AudioContext || window.webkitAudioContext;
          if (AudioContext) {
            const ctx = new AudioContext();
            audioContextRef.current = ctx;
            const source = ctx.createMediaStreamSource(stream);
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 256;
            source.connect(analyser);
            analyserRef.current = analyser;

            const dataArray = new Uint8Array(analyser.frequencyBinCount);

            const checkVolume = () => {
              if (!mounted) return;
              analyser.getByteFrequencyData(dataArray);
              let sum = 0;
              for (let i = 0; i < dataArray.length; i++) {
                sum += dataArray[i];
              }
              const avg = sum / dataArray.length;
              // Normalize 0 to 100
              const normalized = Math.min(100, Math.round((avg / 128) * 100));
              setMicVolume(normalized);
              animFrameRef.current = requestAnimationFrame(checkVolume);
            };

            checkVolume();
          }
        } catch (aErr) {
          console.warn('AudioContext volume meter setup warning:', aErr);
        }
      } catch (err) {
        if (mounted) {
          setCameraError(err.message || 'Unable to access camera or microphone.');
        }
      }
    }

    initMedia();

    return () => {
      mounted = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        try {
          audioContextRef.current.close();
        } catch (e) {}
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // ─── 2. Background Pre-fetch of AI Interview Questions ────────────────────
  useEffect(() => {
    let isCancelled = false;

    async function prefetchSession() {
      setIsPreloading(true);
      setPreloadError(null);

      try {
        const interview = await createInterview({
          title: `${selectedDomain} (${config.difficulty || 'Medium'}) Practice Loop`,
          domain: selectedDomain,
          interviewType: config.interviewType || 'Technical',
          job_role: config.job_role || `${selectedDomain} Engineer`,
          mode: config.mode || 'General',
          difficulty: config.difficulty || 'Medium',
          experience: config.experience || '2+',
          questionsCount: totalQuestions,
          counterQuestions: config.counterQuestions !== false,
        });

        const { questions: qList } = await generateAIQuestions(interview.id, totalQuestions);

        if (!qList || !qList.length) {
          throw new Error('AI question generation returned empty list. Please try again.');
        }

        const session = await createSession(interview.id);
        const started = await startSession(session.id);

        let policyConfig = null;
        try {
          policyConfig = await getProctoringConfig(started.id);
        } catch (e) {}

        if (!isCancelled) {
          setPreloadedData({
            interview,
            session: started,
            questions: qList,
            policy: policyConfig,
          });
          setIsPreloading(false);
        }
      } catch (err) {
        if (!isCancelled) {
          const msg = err?.response?.data?.detail || err?.message || 'Failed to prepare interview session.';
          setPreloadError(msg);
          setIsPreloading(false);
        }
      }
    }

    prefetchSession();

    return () => {
      isCancelled = true;
    };
  }, [config]);

  // ─── 3. Start Interview Handler with 2-second countdown ────────────────────
  const handleBeginClick = () => {
    if (countdown !== null) return;
    setCountdown(2);

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          // Hand off to active interview
          onStartInterview({
            preloadedData,
            initialStream: streamRef.current,
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="max-w-5xl mx-auto space-y-6"
    >
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#141414] border border-white/20 text-cyan-400 text-xs font-mono font-semibold mb-2 shadow-sm">
            <Camera className="w-3.5 h-3.5" /> Step 3: Audio, Video & Navigation Preview
          </div>
          <h1 className="text-2xl sm:text-3xl font-sans font-extrabold text-white tracking-tight">
            Frame Your Face & Test Microphone
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400">
            Ensure your face is well-framed and your voice levels are active before starting.
          </p>
        </div>

        {/* Readiness Pill */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#0A0A0A] border border-white/15 text-xs font-mono shrink-0 shadow-lg">
          {isPreloading ? (
            <>
              <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
              <span className="text-neutral-300">Preparing AI Questions...</span>
            </>
          ) : preloadError ? (
            <>
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span className="text-amber-300">Retry Question Generation</span>
            </>
          ) : (
            <>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-400 font-bold">AI Interviewer Ready</span>
            </>
          )}
        </div>
      </div>

      {/* Main Grid: Camera Preview on Left, Settings/Navigation Guide on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Live Camera & Mic (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative rounded-3xl overflow-hidden bg-black border border-white/20 shadow-2xl aspect-video flex items-center justify-center">
            {cameraError ? (
              <div className="p-6 text-center space-y-3">
                <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto" />
                <p className="text-xs text-rose-300 font-mono">{cameraError}</p>
              </div>
            ) : (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover -scale-x-100"
              />
            )}

            {/* Face Centering Oval Guide */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-48 h-64 border-2 border-dashed border-emerald-400/50 rounded-[50%] flex items-center justify-center shadow-[0_0_20px_rgba(52,211,153,0.15)]">
                <span className="text-[10px] font-mono font-semibold text-emerald-300/80 bg-black/60 px-2 py-0.5 rounded-full">
                  Keep Face Centered
                </span>
              </div>
            </div>

            {/* Countdown Overlay */}
            {countdown !== null && (
              <div className="absolute inset-0 bg-black/85 backdrop-blur-md z-30 flex flex-col items-center justify-center gap-3">
                <motion.div
                  key={countdown}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 1.5, opacity: 0 }}
                  className="text-6xl font-black text-white font-mono"
                >
                  {countdown}
                </motion.div>
                <p className="text-xs font-mono text-emerald-400 tracking-wider uppercase">
                  Entering Fullscreen Interview Room...
                </p>
              </div>
            )}
          </div>

          {/* Live Mic Meter Card */}
          <div className="rounded-2xl bg-[#0A0A0A]/90 border border-white/15 p-4 shadow-xl backdrop-blur-xl space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="flex items-center gap-2 text-neutral-300">
                <Mic className="w-4 h-4 text-emerald-400" /> Live Microphone Input:
              </span>
              <span className={micVolume > 15 ? 'text-emerald-400 font-bold' : 'text-neutral-500'}>
                {micVolume > 15 ? 'Receiving Voice Audio' : 'Speak to test volume'}
              </span>
            </div>

            <div className="w-full h-2.5 rounded-full bg-[#141414] border border-white/10 overflow-hidden flex">
              <div
                className={`h-full transition-all duration-75 ${
                  micVolume > 50 ? 'bg-emerald-400' : micVolume > 20 ? 'bg-cyan-400' : 'bg-neutral-600'
                }`}
                style={{ width: `${Math.max(4, micVolume)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Right Column: Walkthrough Guide & Start Interview Card (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Navigation Guide Card */}
          {!tourSkipped ? (
            <div className="rounded-3xl bg-[#0A0A0A]/90 border border-white/15 p-6 shadow-2xl backdrop-blur-xl space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-400">
                  <HelpCircle className="w-4 h-4" /> Navigation Guide ({currentStep + 1} of {navigationSteps.length})
                </div>
                <button
                  onClick={() => setTourSkipped(true)}
                  className="text-[11px] font-mono text-neutral-400 hover:text-white underline cursor-pointer"
                >
                  Skip Guide
                </button>
              </div>

              <div className="space-y-2 min-h-[90px]">
                <h3 className="text-base font-bold text-white">
                  {navigationSteps[currentStep].title}
                </h3>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  {navigationSteps[currentStep].description}
                </p>
              </div>

              {/* Step Navigation Controls */}
              <div className="flex items-center justify-between pt-2 border-t border-white/10">
                <div className="flex items-center gap-1.5">
                  {navigationSteps.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentStep(i)}
                      className={`h-1.5 rounded-full transition-all cursor-pointer ${
                        i === currentStep ? 'w-6 bg-white' : 'w-2 bg-white/20'
                      }`}
                    />
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    disabled={currentStep === 0}
                    onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
                    className="p-1.5 rounded-lg bg-[#141414] hover:bg-[#1f1f1f] text-neutral-300 disabled:opacity-30 disabled:cursor-not-allowed border border-white/10"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    disabled={currentStep === navigationSteps.length - 1}
                    onClick={() => setCurrentStep((prev) => Math.min(navigationSteps.length - 1, prev + 1))}
                    className="p-1.5 rounded-lg bg-[#141414] hover:bg-[#1f1f1f] text-neutral-300 disabled:opacity-30 disabled:cursor-not-allowed border border-white/10"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl bg-[#0A0A0A]/90 border border-white/15 p-4 shadow-xl flex items-center justify-between">
              <span className="text-xs font-mono text-neutral-400">Navigation guide skipped</span>
              <button
                onClick={() => setTourSkipped(false)}
                className="text-xs font-mono text-cyan-400 hover:underline cursor-pointer"
              >
                Show Guide
              </button>
            </div>
          )}

          {/* Session Overview & Launch Card */}
          <div className="rounded-3xl bg-[#0A0A0A]/90 border border-white/15 p-6 shadow-2xl backdrop-blur-xl space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Session Parameters
            </h3>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between py-1.5 border-b border-white/10 text-neutral-400">
                <span>Role & Domain:</span>
                <span className="text-white font-semibold">{selectedDomain}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-white/10 text-neutral-400">
                <span>Per-Question Time:</span>
                <span className="text-emerald-400 font-semibold">3 Minutes</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-white/10 text-neutral-400">
                <span>Questions Count:</span>
                <span className="text-white font-semibold">{totalQuestions} Questions</span>
              </div>
            </div>

            {preloadError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-mono">
                {preloadError}
              </div>
            )}

            {/* Launch Button */}
            <button
              onClick={handleBeginClick}
              disabled={isPreloading || countdown !== null}
              className="w-full py-3.5 px-6 rounded-2xl bg-white text-black font-extrabold text-sm hover:bg-neutral-200 transition-all shadow-2xl border border-white/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {countdown !== null ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                  <span>Launching in {countdown}s...</span>
                </>
              ) : isPreloading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                  <span>Preloading Questions...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-black" />
                  <span>Begin Interview</span>
                </>
              )}
            </button>

            <button
              onClick={onBack}
              disabled={countdown !== null}
              className="w-full py-2.5 text-xs text-neutral-400 hover:text-white font-mono transition-colors cursor-pointer text-center"
            >
              Back to Device Check
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default InterviewPreviewStep;
