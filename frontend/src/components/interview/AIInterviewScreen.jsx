import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic, MicOff, Camera, CameraOff, Pause, Play, Volume2, Volume1,
  Maximize2, Minimize2, ScanFace, Clock, Send, CheckCircle2,
  FlipHorizontal, AlertTriangle, RotateCcw, ChevronRight,
  Sparkles, LogOut
} from 'lucide-react';
import {
  createInterview,
  createSession,
  startSession,
  completeSession,
  generateAIQuestions,
  submitAnswer,
  submitAudioAnswer,
  submitAnswerFacialFrame,
  getSessionAnalytics,
} from '../../services/interviewService';
import { useAudioRecorder } from '../../hooks/useAudioRecorder';
import { useFaceDetection } from '../../hooks/useFaceDetection';
import { FaceDetectionOverlay } from './FaceDetectionOverlay';

export const AIInterviewScreen = ({ config, onFinish }) => {
  const selectedDomain = config.domain || config.interviewType || 'Frontend';
  const totalQuestions = config.questionsCount || 5;

  // ─── Screen State ────────────────────────────────────────────
  const [screenState, setScreenState] = useState('PREPARING');
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [timerSeconds, setTimerSeconds] = useState(240);
  const [isPaused, setIsPaused] = useState(false);
  const [isInitializingSession, setIsInitializingSession] = useState(false);
  const [sessionInitError, setSessionInitError] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const hasExpiredRef = useRef(false);

  // ─── Camera State ────────────────────────────────────────────
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [webcamStream, setWebcamStream] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [isMirrored, setIsMirrored] = useState(true);
  const videoRef = useRef(null);

  // ─── Session State ───────────────────────────────────────────
  const [sessionId, setSessionId] = useState(null);
  const [backendQuestions, setBackendQuestions] = useState([]);
  const [questionStartTime, setQuestionStartTime] = useState(() => new Date().toISOString());
  const [activeQuestion, setActiveQuestion] = useState({ id: null, text: '', type: 'main', depth: 0 });

  // ─── Answer & Transcript State ───────────────────────────────
  const { isRecording, startRecording, stopRecording, reset: resetRecorder } = useAudioRecorder();
  const [aiState, setAiState] = useState('listening');
  const [inputMode, setInputMode] = useState('voice');
  const [textAnswer, setTextAnswer] = useState('');
  const [transcript, setTranscript] = useState('');
  const [liveTranscript, setLiveTranscript] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [audioError, setAudioError] = useState(null);

  // ─── Refs ────────────────────────────────────────────────────
  const recognitionRef = useRef(null);
  const transcriptEndRef = useRef(null);
  const ttsAudioRef = useRef(null);

  // ─── TTS State ───────────────────────────────────────────────
  const [ttsState, setTtsState] = useState('idle');

  // ─── Face Detection ──────────────────────────────────────────
  const faceData = useFaceDetection(videoRef, {
    isEnabled: cameraEnabled && !!webcamStream,
    isMirrored,
    intervalMs: 120,
  });

  // ─── Auto-scroll transcript ───────────────────────────────────
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [liveTranscript, transcript]);

  // ─── Fullscreen Listener ──────────────────────────────────────
  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement || document.webkitFullscreenElement));
    document.addEventListener('fullscreenchange', onChange);
    document.addEventListener('webkitfullscreenchange', onChange);
    return () => {
      document.removeEventListener('fullscreenchange', onChange);
      document.removeEventListener('webkitfullscreenchange', onChange);
    };
  }, []);

  const requestFullscreen = async () => {
    try {
      if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
      else if (document.documentElement.webkitRequestFullscreen) await document.documentElement.webkitRequestFullscreen();
    } catch (e) { /* allowed to fail */ }
  };

  const exitFullscreen = () => {
    try {
      if (document.exitFullscreen) document.exitFullscreen();
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    } catch (e) {}
  };

  // ─── Camera Setup ─────────────────────────────────────────────
  const requestDeviceCamera = async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      });
      setWebcamStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
    } catch (err) {
      setCameraError(err.message || 'Camera and microphone access is required.');
    }
  };

  useEffect(() => {
    requestDeviceCamera();
    return () => {
      resetRecorder();
      try { recognitionRef.current?.stop(); } catch (e) {}
      webcamStream?.getTracks().forEach(t => t.stop());
      if (document.fullscreenElement || document.webkitFullscreenElement) exitFullscreen();
    };
  }, []);

  useEffect(() => {
    if (cameraEnabled) {
      if (!webcamStream) requestDeviceCamera();
      else if (videoRef.current) {
        videoRef.current.srcObject = webcamStream;
        videoRef.current.play().catch(() => {});
      }
    } else {
      webcamStream?.getTracks().forEach(t => t.stop());
      setWebcamStream(null);
    }
  }, [cameraEnabled]);

  // ─── Timer ────────────────────────────────────────────────────
  useEffect(() => {
    if (screenState !== 'ACTIVE' || isPaused || timerSeconds <= 0) return;
    const interval = setInterval(() => {
      setTimerSeconds(prev => {
        if (prev <= 1) { clearInterval(interval); handleTimerExpiration(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [screenState, isPaused, timerSeconds]);

  const formatTimer = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  // ─── Question Lifecycle ───────────────────────────────────────
  useEffect(() => {
    setQuestionStartTime(new Date().toISOString());
    setTranscript('');
    setLiveTranscript('');
    setAudioError(null);
  }, [activeQuestion]);

  // ─── TTS Playback ─────────────────────────────────────────────
  const playQuestionAudio = (text) => {
    if (!text?.trim()) return;
    setTtsState('loading');
    setAiState('speaking');
    if (!('speechSynthesis' in window)) { setTtsState('idle'); setAiState('listening'); return; }
    try {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.rate = 1.0; utter.pitch = 1.0; utter.lang = 'en-US';
      utter.onstart = () => { setTtsState('playing'); setAiState('speaking'); };
      utter.onend = () => { setTtsState('idle'); setAiState('listening'); };
      utter.onerror = () => { setTtsState('idle'); setAiState('listening'); };
      setTtsState('playing');
      window.speechSynthesis.speak(utter);
    } catch { setTtsState('idle'); setAiState('listening'); }
  };

  useEffect(() => {
    if (screenState === 'ACTIVE' && activeQuestion?.text) playQuestionAudio(activeQuestion.text);
    return () => { try { window.speechSynthesis?.cancel(); } catch (e) {} };
  }, [activeQuestion, screenState]);

  const handleToggleAudio = () => {
    if ('speechSynthesis' in window && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel(); setTtsState('idle'); setAiState('listening');
    } else {
      playQuestionAudio(activeQuestion.text);
    }
  };

  // ─── Speech Recognition ───────────────────────────────────────
  useEffect(() => {
    let rec = null;
    let active = true;
    if (screenState === 'ACTIVE' && micEnabled) {
      startRecording(webcamStream);
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SR) {
        try {
          rec = new SR();
          rec.continuous = true; rec.interimResults = true; rec.lang = 'en-US';
          rec.onresult = (e) => {
            let t = '';
            for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript;
            if (t.trim() && active) setLiveTranscript(t.trim());
          };
          rec.onerror = () => {};
          rec.onend = () => { if (active && screenState === 'ACTIVE' && micEnabled) try { rec.start(); } catch (e) {} };
          rec.start();
          recognitionRef.current = rec;
        } catch (e) {}
      }
    }
    return () => { active = false; try { rec?.stop(); } catch (e) {} };
  }, [screenState, micEnabled, webcamStream, startRecording]);

  // ─── Frame Capture ────────────────────────────────────────────
  const captureCameraFrameBlob = () => new Promise(resolve => {
    if (!videoRef.current || !cameraEnabled) return resolve(null);
    try {
      const v = videoRef.current;
      const c = document.createElement('canvas');
      c.width = v.videoWidth || 640; c.height = v.videoHeight || 480;
      const ctx = c.getContext('2d');
      if (!ctx) return resolve(null);
      ctx.drawImage(v, 0, 0, c.width, c.height);
      c.toBlob(b => resolve(b), 'image/jpeg', 0.85);
    } catch { resolve(null); }
  });

  // ─── Session Init ─────────────────────────────────────────────
  const initBackendSession = async () => {
    setIsInitializingSession(true);
    setSessionInitError(null);
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
      if (!qList?.length) throw new Error('No questions returned. Please retry.');
      setBackendQuestions(qList);
      setActiveQuestion({ id: qList[0].id, text: qList[0].question_text, type: 'main', depth: 0 });
      const session = await createSession(interview.id);
      const started = await startSession(session.id);
      setSessionId(started.id);
      setQuestionStartTime(new Date().toISOString());
      setScreenState('ACTIVE');
      setTimerSeconds(240);
      hasExpiredRef.current = false;
    } catch (err) {
      const msg = err?.response?.data?.detail || err?.message || 'Failed to start session.';
      setSessionInitError(msg);
    } finally {
      setIsInitializingSession(false);
    }
  };

  const handleStartInterview = async () => {
    requestFullscreen();
    await initBackendSession();
  };

  // ─── Timer Expiration ─────────────────────────────────────────
  const handleTimerExpiration = async () => {
    if (hasExpiredRef.current) return;
    hasExpiredRef.current = true;
    setScreenState('COMPLETED');
    setAiState('listening');
    try { window.speechSynthesis?.cancel(); } catch (e) {}
    if (isRecording) try { stopRecording(); } catch (e) {}
    const ans = (inputMode === 'voice' ? transcript : textAnswer).trim();
    if (ans.length >= 5 && sessionId) {
      try { await submitAnswer(sessionId, { question_id: activeQuestion.id, answer_text: ans, time_taken_seconds: 15 }); } catch (e) {}
    }
    if (sessionId) try { await completeSession(sessionId); } catch (e) {}
  };

  // ─── Exit ─────────────────────────────────────────────────────
  const handleExitInterview = () => {
    exitFullscreen();
    resetRecorder();
    try { recognitionRef.current?.stop(); } catch (e) {}
    webcamStream?.getTracks().forEach(t => t.stop());
    setWebcamStream(null);
    onFinish({ durationMinutes: Math.ceil((240 - timerSeconds) / 60) || 1, score: 88, sessionId });
  };

  // ─── Reset Spoken Answer ──────────────────────────────────────
  const handleResetSpokenAnswer = () => {
    resetRecorder();
    try {
      recognitionRef.current?.stop();
      setTimeout(() => { if (micEnabled) try { recognitionRef.current?.start(); } catch (e) {} }, 200);
    } catch (e) {}
    setTranscript(''); setLiveTranscript(''); setAudioError(null);
    if (micEnabled && webcamStream) startRecording(webcamStream);
  };

  // ─── Submit Spoken Answer ─────────────────────────────────────
  const handleFinishUserAnswer = async () => {
    if (isSubmitting) return;
    setAudioError(null); setIsSubmitting(true); setAiState('thinking');
    try { recognitionRef.current?.stop(); } catch (e) {}
    const frameBlob = await captureCameraFrameBlob();
    let audioBlob = null;
    try { audioBlob = await stopRecording(); } catch (e) {}
    const spokenText = (liveTranscript || transcript || '').trim();
    if (!sessionId) { setAudioError('Session not initialized.'); setIsSubmitting(false); setAiState('listening'); return; }
    if (!audioBlob?.size && !spokenText) { setAudioError('No speech detected. Please speak your answer clearly.'); setIsSubmitting(false); setAiState('listening'); return; }
    try {
      let res;
      if (audioBlob?.size > 0) {
        try { res = await submitAudioAnswer(sessionId, activeQuestion.id, audioBlob); }
        catch (e) {
          if (spokenText) {
            const a = await submitAnswer(sessionId, { question_id: activeQuestion.id, answer_text: spokenText });
            res = { id: a.id, answer: a, next_question: null, interview_complete: currentQIndex + 1 >= totalQuestions };
          } else throw e;
        }
      } else {
        const a = await submitAnswer(sessionId, { question_id: activeQuestion.id, answer_text: spokenText });
        res = { id: a.id, answer: a, next_question: null, interview_complete: currentQIndex + 1 >= totalQuestions };
      }
      setTranscript(res?.answer?.answer_text || spokenText);
      setLiveTranscript('');
      if (res.id && frameBlob) try { await submitAnswerFacialFrame(sessionId, res.id, frameBlob); } catch (e) {}
      setTimeout(() => advanceSession(res), 1000);
    } catch (err) {
      setAudioError(err?.response?.data?.detail || err?.message || 'Submission failed.');
      setIsSubmitting(false); setAiState('listening');
    }
  };

  // ─── Submit Text Answer ───────────────────────────────────────
  const handleFinishTextAnswer = async () => {
    if (isSubmitting || !textAnswer.trim()) return;
    setAudioError(null); setIsSubmitting(true); setAiState('thinking');
    if (!sessionId) { setAudioError('Session not initialized.'); setIsSubmitting(false); setAiState('listening'); return; }
    try {
      const res = await submitAnswer(sessionId, { question_id: activeQuestion.id, answer_text: textAnswer.trim() });
      setTranscript(textAnswer.trim());
      setTimeout(() => advanceSession(res), 800);
    } catch (err) {
      setAudioError(err?.response?.data?.detail || err?.message || 'Submission failed.');
      setIsSubmitting(false); setAiState('listening');
    }
  };

  // ─── Advance Session ──────────────────────────────────────────
  const advanceSession = async (res) => {
    if (res.interview_complete || (!res.next_question && currentQIndex + 1 >= totalQuestions)) {
      let analytics = null;
      try { await completeSession(sessionId); analytics = await getSessionAnalytics(sessionId); } catch (e) {}
      exitFullscreen();
      resetRecorder();
      webcamStream?.getTracks().forEach(t => t.stop());
      setWebcamStream(null);
      setIsSubmitting(false);
      onFinish({ durationMinutes: Math.ceil((240 - timerSeconds) / 60) || 1, score: analytics?.overall_score || 88, sessionId, analytics });
    } else if (res.next_question) {
      const nq = res.next_question;
      setActiveQuestion({ id: nq.id, text: nq.question_text, type: nq.question_type, depth: nq.follow_up_depth || 0 });
      if (nq.question_type === 'main') setCurrentQIndex(p => p + 1);
      setTranscript(''); setLiveTranscript(''); setTextAnswer(''); setIsSubmitting(false);
    } else {
      const ni = currentQIndex + 1;
      if (ni < backendQuestions.length) {
        const nq = backendQuestions[ni];
        setCurrentQIndex(ni);
        setActiveQuestion({ id: nq.id, text: nq.question_text, type: 'main', depth: 0 });
      }
      setTranscript(''); setLiveTranscript(''); setTextAnswer(''); setIsSubmitting(false);
    }
  };

  const progress = Math.round(((currentQIndex + 1) / totalQuestions) * 100);
  const isLastQuestion = activeQuestion.type === 'main' && currentQIndex + 1 === totalQuestions;

  // ═══════════════════════════════════════════════════════════════
  // SCREEN: PREPARING
  // ═══════════════════════════════════════════════════════════════
  if (screenState === 'PREPARING') {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-lg"
        >
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="inline-flex items-center gap-2 mb-4 text-xs font-medium text-neutral-400 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              AI Technical Interview
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">{selectedDomain}</h1>
            <p className="mt-2 text-sm text-neutral-400">Review your session details, then start when you're ready.</p>
          </div>

          {/* Details card */}
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl divide-y divide-white/[0.06] mb-4">
            {[
              { label: 'Role', value: config.job_role || `${selectedDomain} Engineer` },
              { label: 'Difficulty', value: config.difficulty || 'Medium', color: 'text-amber-400' },
              { label: 'Experience', value: `${config.experience || '2+'} years` },
              { label: 'Questions', value: `${totalQuestions} questions`, color: 'text-emerald-400' },
              { label: 'Duration', value: '4 minutes per session' },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex items-center justify-between px-5 py-3.5">
                <span className="text-sm text-neutral-400">{label}</span>
                <span className={`text-sm font-medium ${color || 'text-white'}`}>{value}</span>
              </div>
            ))}
          </div>

          {sessionInitError && (
            <div className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/20 rounded-xl p-3.5 mb-4 text-sm text-red-400">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{sessionInitError}</span>
            </div>
          )}

          <button
            onClick={handleStartInterview}
            disabled={isInitializingSession}
            className="w-full py-3.5 rounded-xl bg-white text-black text-sm font-semibold hover:bg-neutral-100 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {isInitializingSession ? (
              <>
                <span className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                Generating questions…
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                Begin Interview
              </>
            )}
          </button>
          <p className="text-center text-xs text-neutral-500 mt-3">The browser will enter fullscreen mode when you start.</p>
        </motion.div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // SCREEN: COMPLETED
  // ═══════════════════════════════════════════════════════════════
  if (screenState === 'COMPLETED') {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm text-center"
        >
          <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Interview Complete</h1>
          <p className="text-sm text-neutral-400 mb-8">Your responses have been submitted for evaluation.</p>
          <div className="bg-white/[0.03] border border-white/10 rounded-xl divide-y divide-white/[0.06] mb-6 text-left">
            <div className="flex justify-between px-5 py-3 text-sm">
              <span className="text-neutral-400">Domain</span>
              <span className="text-emerald-400 font-medium">{selectedDomain}</span>
            </div>
            <div className="flex justify-between px-5 py-3 text-sm">
              <span className="text-neutral-400">Questions</span>
              <span className="text-white font-medium">{currentQIndex + 1} of {totalQuestions}</span>
            </div>
            <div className="flex justify-between px-5 py-3 text-sm">
              <span className="text-neutral-400">Proctoring</span>
              <span className="text-cyan-400 font-medium">Active</span>
            </div>
          </div>
          <button
            onClick={() => onFinish({ durationMinutes: 4, score: 90, sessionId })}
            className="w-full py-3 rounded-xl bg-white text-black text-sm font-semibold hover:bg-neutral-100 transition-colors"
          >
            View Results
          </button>
        </motion.div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // SCREEN: ACTIVE — IMMERSIVE INTERVIEW ROOM
  // ═══════════════════════════════════════════════════════════════
  return (
    <div className="fixed inset-0 z-50 bg-[#0C0C0F] text-white flex flex-col overflow-hidden">

      {/* ── TOP BAR ─────────────────────────────────────────── */}
      <div className="shrink-0 h-14 flex items-center justify-between px-5 border-b border-white/[0.06]">
        {/* Left */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
            <span className="text-xs font-semibold text-white tracking-wide">LIVE</span>
          </div>
          <div className="w-px h-4 bg-white/10" />
          <span className="text-xs text-neutral-400">{selectedDomain} · {config.difficulty || 'Medium'}</span>
        </div>

        {/* Center — progress dots */}
        <div className="flex items-center gap-1.5">
          {Array.from({ length: totalQuestions }).map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all duration-500 ${
                i < currentQIndex ? 'bg-emerald-400 w-4' :
                i === currentQIndex ? 'bg-white w-6' : 'bg-white/15 w-4'
              }`}
            />
          ))}
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          {/* Timer */}
          <div className={`text-sm font-mono font-semibold tabular-nums transition-colors ${
            timerSeconds <= 60 ? 'text-red-400' : 'text-neutral-300'
          }`}>
            {formatTimer(timerSeconds)}
          </div>

          {/* Pause */}
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
            title={isPaused ? 'Resume' : 'Pause'}
          >
            {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </button>

          {/* Fullscreen */}
          <button
            onClick={() => isFullscreen ? exitFullscreen() : requestFullscreen()}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* End */}
          <button
            onClick={handleExitInterview}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-neutral-400 hover:text-red-400 hover:bg-red-500/10 border border-white/10 hover:border-red-500/30 transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            End
          </button>
        </div>
      </div>

      {/* ── MAIN TWO-COLUMN BODY ─────────────────────────────── */}
      <div className="flex-1 flex min-h-0 overflow-hidden">

        {/* ══ LEFT PANEL — AI Avatar + Big Camera ══════════════ */}
        <div className="w-[44%] shrink-0 flex flex-col border-r border-white/[0.06] bg-[#0a0a0d]">

          {/* ── Floating AI Avatar ─────────────────────────── */}
          <div className="shrink-0 flex flex-col items-center justify-center py-5 gap-3 border-b border-white/[0.06]">
            <div className="relative">
              {/* Animated glow */}
              <div className={`absolute -inset-4 rounded-full blur-2xl opacity-30 transition-colors duration-700 ${
                aiState === 'speaking' ? 'bg-emerald-500' :
                aiState === 'thinking' ? 'bg-amber-400' : 'bg-indigo-500'
              }`} />
              {/* Pulse ring when active */}
              {aiState !== 'listening' && (
                <div className={`absolute inset-0 rounded-full animate-ping opacity-20 ${
                  aiState === 'speaking' ? 'bg-emerald-400' : 'bg-amber-400'
                }`} style={{ animationDuration: '1.5s' }} />
              )}
              {/* Core orb */}
              <div className={`relative w-16 h-16 rounded-full border-2 flex items-center justify-center shadow-2xl transition-all duration-500 ${
                aiState === 'speaking'
                  ? 'bg-emerald-500/20 border-emerald-400/60 shadow-emerald-500/30'
                  : aiState === 'thinking'
                  ? 'bg-amber-500/20 border-amber-400/60 shadow-amber-500/30'
                  : 'bg-indigo-500/15 border-indigo-400/40 shadow-indigo-500/20'
              }`}>
                {aiState === 'speaking' ? (
                  <div className="flex items-end gap-[3px] h-6">
                    {[3, 5, 7, 5, 3].map((h, i) => (
                      <span
                        key={i}
                        className="w-[3px] rounded-full bg-emerald-400"
                        style={{
                          height: `${h * 3}px`,
                          animation: `soundBar 0.7s ease-in-out ${i * 0.1}s infinite alternate`,
                        }}
                      />
                    ))}
                  </div>
                ) : aiState === 'thinking' ? (
                  <div className="flex items-center gap-1">
                    {[0, 0.18, 0.36].map((d, i) => (
                      <span
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce"
                        style={{ animationDelay: `${d}s` }}
                      />
                    ))}
                  </div>
                ) : (
                  <Sparkles className="w-7 h-7 text-indigo-400" />
                )}
              </div>
            </div>

            <div className="text-center">
              <p className="text-sm font-semibold text-white">InterviewIQ AI</p>
              <p className={`text-xs mt-0.5 transition-colors duration-300 ${
                aiState === 'speaking' ? 'text-emerald-400' :
                aiState === 'thinking' ? 'text-amber-400' : 'text-neutral-500'
              }`}>
                {aiState === 'speaking' ? 'Reading question…' :
                 aiState === 'thinking' ? 'Evaluating response…' : 'Listening to you'}
              </p>
            </div>
          </div>

          {/* ── Big Camera Feed ────────────────────────────── */}
          <div className="flex-1 relative overflow-hidden bg-black">
            {cameraEnabled ? (
              <video
                ref={node => {
                  videoRef.current = node;
                  if (node && webcamStream && node.srcObject !== webcamStream) {
                    node.srcObject = webcamStream;
                    node.play().catch(() => {});
                  }
                }}
                autoPlay
                playsInline
                muted
                className={`absolute inset-0 w-full h-full object-cover ${isMirrored ? '-scale-x-100' : ''}`}
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#0e0e12]">
                <CameraOff className="w-10 h-10 text-neutral-700" />
                <span className="text-xs text-neutral-600">Camera off</span>
              </div>
            )}

            {cameraEnabled && webcamStream && (
              <FaceDetectionOverlay {...faceData} isCameraOn={cameraEnabled && !!webcamStream} />
            )}

            {isRecording && cameraEnabled && (
              <div className="absolute top-3 left-3 flex items-center gap-1.5 text-[10px] font-bold text-white bg-black/70 backdrop-blur-sm px-2 py-1 rounded-lg border border-white/10">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                REC
              </div>
            )}

            {/* Camera controls — bottom strip */}
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between px-3 py-3 bg-gradient-to-t from-black/90 to-transparent">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setMicEnabled(!micEnabled)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    micEnabled
                      ? 'bg-white/10 border-white/15 text-white/80 hover:text-white'
                      : 'bg-red-500/20 border-red-500/40 text-red-400'
                  }`}
                >
                  {micEnabled ? <Mic className="w-3 h-3" /> : <MicOff className="w-3 h-3" />}
                  <span>{micEnabled ? 'Mic on' : 'Muted'}</span>
                </button>
                <button
                  onClick={() => setCameraEnabled(!cameraEnabled)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    cameraEnabled
                      ? 'bg-white/10 border-white/15 text-white/80 hover:text-white'
                      : 'bg-red-500/20 border-red-500/40 text-red-400'
                  }`}
                >
                  {cameraEnabled ? <Camera className="w-3 h-3" /> : <CameraOff className="w-3 h-3" />}
                  <span>{cameraEnabled ? 'Cam on' : 'Cam off'}</span>
                </button>
              </div>
              <button
                onClick={() => setIsMirrored(!isMirrored)}
                className="p-1.5 rounded-lg bg-white/10 border border-white/15 text-white/60 hover:text-white transition-colors"
                title="Flip camera"
              >
                <FlipHorizontal className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* ══ RIGHT PANEL — Question + Transcript + Dock ═══════ */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0">

          {/* Scrollable question + transcript area */}
          <div className="flex-1 overflow-y-auto px-6 xl:px-10 pt-6 pb-0 flex flex-col gap-4">

            {/* Question type badge */}
            <div className="flex items-center gap-2">
              {activeQuestion.type === 'counter' ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
                  <Sparkles className="w-3 h-3" />
                  Follow-up · Depth {activeQuestion.depth || 1}
                </span>
              ) : (
                <span className="text-xs font-medium text-neutral-500">
                  Question {currentQIndex + 1} of {totalQuestions}
                </span>
              )}
            </div>

            {/* THE QUESTION */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeQuestion.id || activeQuestion.text}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-lg xl:text-xl font-semibold text-white leading-relaxed tracking-tight">
                  {activeQuestion.text}
                </h2>
              </motion.div>
            </AnimatePresence>

            <div className="h-px bg-white/[0.06]" />

            {/* ── DYNAMIC STATUS CARD ───────────────────────── */}
            <AnimatePresence mode="wait">
              {audioError ? (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="flex items-start gap-3 bg-red-500/10 border border-red-500/25 rounded-xl p-4"
                >
                  <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-red-400 mb-0.5">Submission Error</p>
                    <p className="text-xs text-red-400/80 leading-relaxed">{audioError}</p>
                    <button onClick={() => setAudioError(null)} className="mt-2 text-[11px] text-red-400/60 hover:text-red-400 transition-colors underline">
                      Dismiss
                    </button>
                  </div>
                </motion.div>
              ) : aiState === 'thinking' ? (
                <motion.div
                  key="thinking"
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="flex items-center gap-3 bg-amber-500/8 border border-amber-500/20 rounded-xl p-4"
                >
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
                    <div className="flex items-center gap-[3px]">
                      {[0, 0.15, 0.3].map((d, i) => (
                        <span key={i} className="w-1 h-1 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: `${d}s` }} />
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-amber-400">Evaluating Response</p>
                    <p className="text-xs text-amber-400/60 mt-0.5">AI is analyzing your answer…</p>
                  </div>
                </motion.div>
              ) : aiState === 'speaking' ? (
                <motion.div
                  key="speaking"
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="flex items-center gap-3 bg-emerald-500/8 border border-emerald-500/20 rounded-xl p-4"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
                    <Volume2 className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-emerald-400">AI is Speaking</p>
                    <p className="text-xs text-emerald-400/60 mt-0.5">Listen carefully, then answer below</p>
                  </div>
                  <button
                    onClick={handleToggleAudio}
                    className="text-[11px] text-emerald-400/70 hover:text-emerald-400 border border-emerald-500/30 px-2 py-1 rounded-lg transition-colors shrink-0"
                  >
                    Stop
                  </button>
                </motion.div>
              ) : activeQuestion.type === 'counter' ? (
                <motion.div
                  key="followup"
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="flex items-center gap-3 bg-amber-500/8 border border-amber-500/20 rounded-xl p-4"
                >
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-amber-400">Follow-up Question</p>
                    <p className="text-xs text-amber-400/60 mt-0.5">Based on your previous answer</p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="listening"
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="flex items-center gap-3 bg-indigo-500/8 border border-indigo-500/20 rounded-xl p-4"
                >
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center shrink-0">
                    <div className={`w-2.5 h-2.5 rounded-full transition-colors ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-indigo-500'}`} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-indigo-300">
                      {isRecording ? 'Recording Active' : 'Ready to Record'}
                    </p>
                    <p className="text-xs text-indigo-300/50 mt-0.5">
                      {isRecording ? 'Speak clearly — your answer is being captured' : 'Microphone is initializing…'}
                    </p>
                  </div>
                  <button
                    onClick={handleToggleAudio}
                    className="text-[11px] text-indigo-300/50 hover:text-indigo-300 border border-indigo-500/20 px-2 py-1 rounded-lg transition-colors shrink-0"
                  >
                    <Volume2 className="w-3 h-3" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── RESPONSE ZONE ─────────────────────────────── */}
            <div className="flex-1 flex flex-col min-h-0">
              {/* Mode tabs + utility row */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1 bg-white/[0.04] border border-white/[0.08] p-1 rounded-lg">
                  <button
                    onClick={() => setInputMode('voice')}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                      inputMode === 'voice' ? 'bg-white text-black shadow-sm' : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    🎙 Speak
                  </button>
                  <button
                    onClick={() => setInputMode('text')}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                      inputMode === 'text' ? 'bg-white text-black shadow-sm' : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    ✏️ Type
                  </button>
                </div>

                {/* Utility buttons */}
                <div className="flex items-center gap-1.5">
                  {(liveTranscript || transcript || textAnswer) && (
                    <button
                      onClick={() => {
                        const text = liveTranscript || transcript || textAnswer;
                        navigator.clipboard?.writeText(text).catch(() => {});
                      }}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs text-neutral-500 hover:text-white transition-all"
                      title="Copy to clipboard"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy
                    </button>
                  )}
                  {inputMode === 'voice' && (
                    <button
                      onClick={handleResetSpokenAnswer}
                      disabled={isSubmitting}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs text-neutral-500 hover:text-red-400 hover:border-red-500/20 disabled:opacity-40 transition-all"
                      title="Clear and re-record"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Voice transcript display */}
              {inputMode === 'voice' && (
                <div className="flex-1 min-h-[80px] bg-white/[0.02] border border-white/[0.07] rounded-xl px-4 py-3 overflow-y-auto">
                  {(liveTranscript || transcript) ? (
                    <p className="text-neutral-200 text-sm leading-relaxed font-light">
                      {liveTranscript || transcript}
                      {liveTranscript && <span className="inline-block w-0.5 h-3.5 ml-1 bg-white/50 animate-pulse align-middle" />}
                    </p>
                  ) : (
                    <p className="text-neutral-700 text-sm italic">
                      {isRecording ? 'Your spoken words will appear here in real-time…' : 'Waiting for microphone access…'}
                    </p>
                  )}
                  <div ref={transcriptEndRef} />
                </div>
              )}

              {/* Text mode */}
              {inputMode === 'text' && (
                <div className="flex-1 flex flex-col">
                  <textarea
                    value={textAnswer}
                    onChange={e => setTextAnswer(e.target.value)}
                    placeholder="Type your answer here…"
                    className="flex-1 min-h-[80px] w-full bg-white/[0.02] border border-white/[0.07] rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-700 focus:outline-none focus:border-white/20 resize-none transition-colors"
                  />
                  <div className="mt-1.5 flex items-center justify-between">
                    <span className="text-xs text-neutral-700">
                      {textAnswer.split(/\s+/).filter(Boolean).length} words
                    </span>
                    <span className="text-xs text-neutral-700">{textAnswer.length} chars</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── BOTTOM DOCK ─────────────────────────────────── */}
          <div className="shrink-0 border-t border-white/[0.06] px-6 xl:px-10 py-4">
            <button
              onClick={inputMode === 'voice' ? handleFinishUserAnswer : handleFinishTextAnswer}
              disabled={isSubmitting || aiState === 'thinking' || (inputMode === 'text' && !textAnswer.trim())}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white text-black text-sm font-semibold hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                  Evaluating…
                </>
              ) : (
                <>
                  {isLastQuestion ? 'Submit & Finish' : 'Submit Answer'}
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
        {/* end right panel */}
      </div>
      {/* end two-column body */}

      {/* Keyframes for AI sound bars */}
      <style>{`
        @keyframes soundBar {
          from { transform: scaleY(0.4); opacity: 0.6; }
          to   { transform: scaleY(1.3); opacity: 1; }
        }
      `}</style>

    </div>
  );
};

export default AIInterviewScreen;
