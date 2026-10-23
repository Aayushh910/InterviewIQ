import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic, MicOff, Camera, CameraOff, Pause, Play, Volume2,
  Maximize2, Minimize2, FlipHorizontal, AlertTriangle, RotateCcw, ChevronRight,
  Bot, LogOut, CheckCircle2, X, PenLine
} from 'lucide-react';
import { Logo } from '../common/Logo';
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
  calculateFinalEvaluation,
  getProctoringConfig,
  submitProctoringEvents,
  getProctoringSummary,
  terminateSessionByPolicy,
} from '../../services/interviewService';
import { useAudioRecorder } from '../../hooks/useAudioRecorder';
import { useFaceDetection } from '../../hooks/useFaceDetection';
import { useBrowserMonitoring } from '../../hooks/useBrowserMonitoring';
import { FaceDetectionOverlay } from './FaceDetectionOverlay';

export const AIInterviewScreen = ({ config, onFinish, preloadedData }) => {
  const selectedDomain = config.domain || config.interviewType || 'Frontend';
  const totalQuestions = config.questionsCount || 5;

  // ─── Screen State ────────────────────────────────────────────
  const [screenState, setScreenState] = useState('PREPARING');
  const [startupHoldSeconds, setStartupHoldSeconds] = useState(8);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [timerSeconds, setTimerSeconds] = useState(180); // 3-minute timer per question
  const [isTimerRunning, setIsTimerRunning] = useState(false); // starts after AI finishes speaking
  const [isPaused, setIsPaused] = useState(false);
  const [isInitializingSession, setIsInitializingSession] = useState(false);
  const [sessionInitError, setSessionInitError] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const hasExpiredRef = useRef(false);
  const isAiSpeakingRef = useRef(false);

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
  const questionStartTimeRef = useRef(new Date().toISOString());
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

  // ─── Proctoring Policy & Buffer (Phase 16 & 17) ──────────────
  const [proctoringPolicy, setProctoringPolicy] = useState({
    tabMonitoringEnabled: true,
    fullscreenEnforcementEnabled: false,
    policyMode: 'warning_only',
    maxTabDepartures: 2,
    gracePeriodSeconds: 10.0,
    phoneDetectionEnabled: true,
    gazeEyeAnalysisEnabled: true,
    phoneConfidenceThreshold: 0.45,
    autoSubmissionEnabled: false,
  });

  const pendingEventsRef = useRef([]);

  const handleProctoringEvent = (event) => {
    if (!sessionId) return;
    pendingEventsRef.current.push({
      ...event,
      session_id: sessionId,
    });
  };

  // Periodic flush of pending proctoring events
  useEffect(() => {
    if (screenState !== 'ACTIVE' || !sessionId) return;
    const interval = setInterval(async () => {
      if (pendingEventsRef.current.length === 0) return;
      const batch = pendingEventsRef.current.splice(0, 15);
      try {
        await submitProctoringEvents(sessionId, batch);
      } catch (err) {
        pendingEventsRef.current.unshift(...batch);
      }
    }, 2500);
    return () => clearInterval(interval);
  }, [screenState, sessionId]);

  // ─── Face Detection (Phase 16) ───────────────────────────────
  const faceData = useFaceDetection(videoRef, {
    isEnabled: cameraEnabled && !!webcamStream,
    isMirrored,
    intervalMs: 120,
    phoneDetectionEnabled: proctoringPolicy.phoneDetectionEnabled,
    phoneConfidenceThreshold: proctoringPolicy.phoneConfidenceThreshold || 0.45,
    onProctoringEvent: handleProctoringEvent,
  });

  // ─── Browser & Tab Monitoring (Phase 17) ─────────────────────
  const browserMonitoring = useBrowserMonitoring({
    isActive: screenState === 'ACTIVE',
    policy: proctoringPolicy,
    onProctoringEvent: handleProctoringEvent,
    onPolicyViolation: (violation) => handlePolicyAutoSubmit(violation),
  });

  // ─── Auto-scroll transcript ───────────────────────────────────
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [liveTranscript, transcript]);

  // ─── Preloaded Session & Fullscreen Auto-start ────────────────
  useEffect(() => {
    if (preloadedData) {
      if (preloadedData.questions && preloadedData.questions.length > 0) {
        setBackendQuestions(preloadedData.questions);
        setActiveQuestion({
          id: preloadedData.questions[0].id,
          text: preloadedData.questions[0].question_text,
          type: 'main',
          depth: 0,
        });
      }
      if (preloadedData.session?.id) {
        setSessionId(preloadedData.session.id);
      }
      if (preloadedData.policy) {
        setProctoringPolicy((prev) => ({
          ...prev,
          ...preloadedData.policy,
        }));
      }
      setScreenState('PREPARING');
      setStartupHoldSeconds(8);
      setTimerSeconds(180);
      setIsTimerRunning(false);
      requestFullscreen();
      window.dispatchEvent(new CustomEvent('set-sidebar-collapsed', { detail: { collapsed: true } }));
    }
  }, [preloadedData]);

  // ─── Startup Readiness Hold Countdown (8s hold for fullscreen & accessories) ───
  useEffect(() => {
    if (screenState !== 'PREPARING') return;
    if (startupHoldSeconds <= 0) {
      setScreenState('ACTIVE');
      return;
    }
    const timer = setInterval(() => {
      setStartupHoldSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setScreenState('ACTIVE');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [screenState, startupHoldSeconds]);

  // ─── Fullscreen Listener ──────────────────────────────────────
  useEffect(() => {
    const onChange = () => {
      const isFull = Boolean(document.fullscreenElement || document.webkitFullscreenElement);
      setIsFullscreen(isFull);
      if (!isFull && screenState === 'ACTIVE' && !hasExpiredRef.current) {
        setShowExitConfirm(true);
      }
    };
    document.addEventListener('fullscreenchange', onChange);
    document.addEventListener('webkitfullscreenchange', onChange);
    return () => {
      document.removeEventListener('fullscreenchange', onChange);
      document.removeEventListener('webkitfullscreenchange', onChange);
    };
  }, [screenState]);

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

  // ─── Robust Camera Setup & Stream Binding ──────────────────────
  const requestDeviceCamera = async () => {
    try {
      setCameraError(null);
      if (webcamStream) {
        try {
          webcamStream.getTracks().forEach((t) => t.stop());
        } catch (e) {}
      }

      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: true,
        });
      } catch (conErr) {
        console.warn('High-res camera constraints failed, trying basic constraints:', conErr);
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
      }

      setWebcamStream(stream);

      const v = videoRef.current;
      if (v) {
        v.muted = true;
        v.playsInline = true;
        v.srcObject = stream;
        try {
          await v.play();
        } catch (pErr) {
          console.warn('Initial video play caught:', pErr);
        }
      }
    } catch (err) {
      console.error('requestDeviceCamera failed:', err);
      setCameraError(err.message || 'Camera and microphone access is required.');
    }
  };

  // Acquire fresh device camera immediately on mount
  useEffect(() => {
    requestDeviceCamera();
  }, []);

  // Keep HTML5 video element synchronized with webcamStream state
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !webcamStream) return;
    video.muted = true;
    video.playsInline = true;
    if (video.srcObject !== webcamStream) {
      video.srcObject = webcamStream;
    }
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch((e) => {
        console.warn('HTML5 video play warning:', e);
      });
    }
  }, [webcamStream]);

  // Auto-recovery watchdog: if video element has 0 width or readyState < 2 after 2 seconds, re-request
  useEffect(() => {
    if (!webcamStream || !cameraEnabled) return;
    const timeout = setTimeout(() => {
      const v = videoRef.current;
      if (v && (v.readyState < 2 || v.videoWidth === 0)) {
        console.warn('Camera feed inactive or frozen (videoWidth === 0), retrying fresh acquisition...');
        requestDeviceCamera();
      }
    }, 2000);
    return () => clearTimeout(timeout);
  }, [webcamStream, cameraEnabled]);

  // Keep a ref to webcamStream for unmount cleanup only
  const webcamStreamRef = useRef(null);
  useEffect(() => {
    webcamStreamRef.current = webcamStream;
  }, [webcamStream]);

  useEffect(() => {
    return () => {
      resetRecorder();
      try { recognitionRef.current?.stop(); } catch (e) {}
      webcamStreamRef.current?.getTracks().forEach((t) => t.stop());
      if (document.fullscreenElement || document.webkitFullscreenElement) exitFullscreen();
      window.dispatchEvent(new CustomEvent('set-sidebar-collapsed', { detail: { collapsed: false } }));
    };
  }, []);

  // Handle camera enabled/disabled toggle cleanly
  useEffect(() => {
    if (!webcamStream) {
      if (cameraEnabled) {
        requestDeviceCamera();
      }
      return;
    }
    webcamStream.getVideoTracks().forEach((track) => {
      track.enabled = cameraEnabled;
    });
    if (cameraEnabled && videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, [cameraEnabled, webcamStream]);

  // ─── 3-Minute Per-Question Timer ──────────────────────────────
  // Countdown starts ONLY after AI speech has completed (isTimerRunning === true)
  useEffect(() => {
    if (screenState !== 'ACTIVE' || isPaused || !isTimerRunning || timerSeconds <= 0) return;
    const interval = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleQuestionTimeExpired();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [screenState, isPaused, isTimerRunning, timerSeconds]);

  const handleQuestionTimeExpired = () => {
    // When 3-minute question timer expires, auto-submit current answer and advance
    if (inputMode === 'voice') {
      handleFinishUserAnswer();
    } else {
      handleFinishTextAnswer();
    }
  };

  const formatTimer = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  // ─── Question Lifecycle ───────────────────────────────────────
  useEffect(() => {
    setQuestionStartTime(new Date().toISOString());
    setTranscript('');
    setLiveTranscript('');
    setAudioError(null);
    setTimerSeconds(180); // Reset timer to 3 minutes for every question
    setIsTimerRunning(false); // Paused while AI speaks
  }, [activeQuestion]);

  // ─── TTS Playback ─────────────────────────────────────────────
  const playQuestionAudio = (text) => {
    if (!text?.trim()) {
      setIsTimerRunning(true);
      return;
    }
    setTtsState('loading');
    setAiState('speaking');
    isAiSpeakingRef.current = true;
    setIsTimerRunning(false);

    if (!('speechSynthesis' in window)) {
      setTtsState('idle');
      setAiState('listening');
      isAiSpeakingRef.current = false;
      setIsTimerRunning(true);
      return;
    }
    try {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.rate = 1.0;
      utter.pitch = 1.0;
      utter.lang = 'en-US';
      utter.onstart = () => {
        setTtsState('playing');
        setAiState('speaking');
        isAiSpeakingRef.current = true;
        setIsTimerRunning(false);
      };
      utter.onend = () => {
        setTtsState('idle');
        setAiState('listening');
        isAiSpeakingRef.current = false;
        setIsTimerRunning(true); // 3-minute per-question timer starts NOW!
      };
      utter.onerror = () => {
        setTtsState('idle');
        setAiState('listening');
        isAiSpeakingRef.current = false;
        setIsTimerRunning(true);
      };
      setTtsState('playing');
      window.speechSynthesis.speak(utter);
    } catch {
      setTtsState('idle');
      setAiState('listening');
      isAiSpeakingRef.current = false;
      setIsTimerRunning(true);
    }
  };

  useEffect(() => {
    if (screenState === 'ACTIVE' && activeQuestion?.text) playQuestionAudio(activeQuestion.text);
    return () => { try { window.speechSynthesis?.cancel(); } catch (e) {} };
  }, [activeQuestion, screenState]);

  const handleToggleAudio = () => {
    if ('speechSynthesis' in window && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      setTtsState('idle');
      setAiState('listening');
      isAiSpeakingRef.current = false;
      setIsTimerRunning(true);
    } else {
      playQuestionAudio(activeQuestion.text);
    }
  };

  // ─── Speech Recognition (Echo Filtered) ───────────────────────
  useEffect(() => {
    let rec = null;
    let active = true;
    if (screenState === 'ACTIVE' && micEnabled) {
      startRecording(webcamStream);
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SR) {
        try {
          rec = new SR();
          rec.continuous = true;
          rec.interimResults = true;
          rec.lang = 'en-US';
          rec.onresult = (e) => {
            // FIX: Reject audio if AI is speaking so question is never transcribed!
            if (isAiSpeakingRef.current || aiState === 'speaking') {
              return;
            }
            let t = '';
            for (let i = 0; i < e.results.length; i++) {
              t += e.results[i][0].transcript;
            }
            if (t.trim() && active) {
              setLiveTranscript(t.trim());
            }
          };
          rec.onerror = () => {};
          rec.onend = () => {
            if (active && screenState === 'ACTIVE' && micEnabled) {
              try { rec.start(); } catch (e) {}
            }
          };
          rec.start();
          recognitionRef.current = rec;
        } catch (e) {}
      }
    }
    return () => {
      active = false;
      try { rec?.stop(); } catch (e) {}
    };
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

      // Fetch authoritative proctoring policy
      try {
        const policyConfig = await getProctoringConfig(started.id);
        if (policyConfig) {
          setProctoringPolicy({
            tabMonitoringEnabled: policyConfig.tab_monitoring_enabled ?? true,
            fullscreenEnforcementEnabled: policyConfig.fullscreen_enforcement_enabled ?? false,
            policyMode: policyConfig.policy_mode ?? 'warning_only',
            maxTabDepartures: policyConfig.max_tab_departures ?? 2,
            gracePeriodSeconds: policyConfig.grace_period_seconds ?? 10.0,
            phoneDetectionEnabled: policyConfig.phone_detection_enabled ?? true,
            gazeEyeAnalysisEnabled: policyConfig.gaze_eye_analysis_enabled ?? true,
            phoneConfidenceThreshold: policyConfig.phone_confidence_threshold ?? 0.45,
            autoSubmissionEnabled: policyConfig.auto_submission_enabled ?? false,
          });
        }
      } catch (pErr) {
        // Retain default policy
      }

      const nowIso = new Date().toISOString();
      questionStartTimeRef.current = nowIso;
      setQuestionStartTime(nowIso);
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

  // ─── Automatic Policy Submission (Phase 17) ───────────────────
  const handlePolicyAutoSubmit = async (violation = {}) => {
    if (hasExpiredRef.current) return;
    hasExpiredRef.current = true;
    setScreenState('COMPLETED');
    setAiState('listening');

    try { window.speechSynthesis?.cancel(); } catch (e) {}
    if (isRecording) try { stopRecording(); } catch (e) {}

    // Flush remaining proctoring events
    if (sessionId && pendingEventsRef.current.length > 0) {
      const remaining = [...pendingEventsRef.current];
      pendingEventsRef.current = [];
      try { await submitProctoringEvents(sessionId, remaining); } catch (e) {}
    }

    const ans = (inputMode === 'voice' ? (liveTranscript || transcript) : textAnswer).trim();
    if (ans.length >= 2 && sessionId && activeQuestion.id) {
      const startedAt = questionStartTimeRef.current || new Date(Date.now() - 15000).toISOString();
      const submittedAt = new Date().toISOString();
      try {
        await submitAnswer(sessionId, {
          question_id: activeQuestion.id,
          answer_text: ans,
          started_at: startedAt,
          submitted_at: submittedAt,
        });
      } catch (e) {}
    }

    let analytics = null;
    const reason = violation.reason || 'proctoring_tab_departures';
    if (sessionId) {
      try {
        await terminateSessionByPolicy(sessionId, {
          reason,
          departureCount: violation.departureCount || proctoringPolicy.maxTabDepartures,
          details: { maxAllowed: proctoringPolicy.maxTabDepartures },
        });
        try {
          await calculateFinalEvaluation(sessionId);
        } catch (evalErr) {
          console.warn('Evaluation calculation notice:', evalErr);
        }
        analytics = await getSessionAnalytics(sessionId);
      } catch (e) {}
    }

    exitFullscreen();
    resetRecorder();
    try { recognitionRef.current?.stop(); } catch (e) {}
    webcamStream?.getTracks().forEach(t => t.stop());
    setWebcamStream(null);

    onFinish({
      durationMinutes: Math.max(1, Math.ceil((240 - timerSeconds) / 60)),
      score: analytics?.overall_score ?? 0,
      sessionId,
      analytics,
      title: `${selectedDomain} Technical Interview`,
      terminatedByPolicy: true,
      terminationReason: reason,
      departureCount: violation.departureCount,
    });
  };

  // ─── Timer Expiration ─────────────────────────────────────────
  const handleTimerExpiration = async () => {
    if (hasExpiredRef.current) return;
    hasExpiredRef.current = true;
    setScreenState('COMPLETED');
    setAiState('listening');
    try { window.speechSynthesis?.cancel(); } catch (e) {}
    if (isRecording) try { stopRecording(); } catch (e) {}
    const ans = (inputMode === 'voice' ? (liveTranscript || transcript) : textAnswer).trim();
    if (ans.length >= 2 && sessionId && activeQuestion.id) {
      const startedAt = questionStartTimeRef.current || new Date(Date.now() - 15000).toISOString();
      const submittedAt = new Date().toISOString();
      try { await submitAnswer(sessionId, { question_id: activeQuestion.id, answer_text: ans, started_at: startedAt, submitted_at: submittedAt }); } catch (e) {}
    }
    let analytics = null;
    if (sessionId) {
      try {
        await completeSession(sessionId);
        analytics = await getSessionAnalytics(sessionId);
      } catch (e) {}
    }
    exitFullscreen();
    resetRecorder();
    try { recognitionRef.current?.stop(); } catch (e) {}
    webcamStream?.getTracks().forEach(t => t.stop());
    setWebcamStream(null);
    onFinish({
      durationMinutes: Math.max(1, Math.ceil((240 - timerSeconds) / 60)),
      score: analytics?.overall_score ?? 0,
      sessionId,
      analytics,
      title: `${selectedDomain} Technical Interview`
    });
  };

  // ─── Exit ─────────────────────────────────────────────────────
  const handleExitInterview = async () => {
    exitFullscreen();
    resetRecorder();
    try { recognitionRef.current?.stop(); } catch (e) {}
    webcamStream?.getTracks().forEach(t => t.stop());
    setWebcamStream(null);
    let analytics = null;
    if (sessionId) {
      try {
        await completeSession(sessionId);
        analytics = await getSessionAnalytics(sessionId);
      } catch (e) {}
    }
    onFinish({
      durationMinutes: Math.max(1, Math.ceil((240 - timerSeconds) / 60)),
      score: analytics?.overall_score ?? 0,
      sessionId,
      analytics,
      title: `${selectedDomain} Technical Interview`
    });
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
    
    const startedAt = questionStartTimeRef.current || new Date(Date.now() - 15000).toISOString();
    const submittedAt = new Date().toISOString();

    try {
      let res;
      if (audioBlob?.size > 0) {
        try { res = await submitAudioAnswer(sessionId, activeQuestion.id, audioBlob, startedAt, submittedAt); }
        catch (e) {
          if (spokenText) {
            const a = await submitAnswer(sessionId, { question_id: activeQuestion.id, answer_text: spokenText, started_at: startedAt, submitted_at: submittedAt });
            res = { id: a.id, answer: a, next_question: null, interview_complete: currentQIndex + 1 >= totalQuestions };
          } else throw e;
        }
      } else {
        const a = await submitAnswer(sessionId, { question_id: activeQuestion.id, answer_text: spokenText, started_at: startedAt, submitted_at: submittedAt });
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
    
    const startedAt = questionStartTimeRef.current || new Date(Date.now() - 15000).toISOString();
    const submittedAt = new Date().toISOString();

    try {
      const res = await submitAnswer(sessionId, { question_id: activeQuestion.id, answer_text: textAnswer.trim(), started_at: startedAt, submitted_at: submittedAt });
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
      setScreenState('COMPLETED');
      let analytics = null;
      try {
        await completeSession(sessionId);
        try {
          await calculateFinalEvaluation(sessionId);
        } catch (evalErr) {
          console.warn('Phase 12 evaluation compute notice:', evalErr);
        }
        analytics = await getSessionAnalytics(sessionId);
      } catch (e) {}
      exitFullscreen();
      resetRecorder();
      try { recognitionRef.current?.stop(); } catch (e) {}
      webcamStream?.getTracks().forEach(t => t.stop());
      setWebcamStream(null);
      setIsSubmitting(false);
      onFinish({
        durationMinutes: Math.max(1, Math.ceil((240 - timerSeconds) / 60)),
        score: analytics?.overall_score ?? 0,
        sessionId,
        analytics,
        title: `${selectedDomain} Technical Interview`
      });
    } else if (res.next_question) {
      const nq = res.next_question;
      setActiveQuestion({ id: nq.id, text: nq.question_text, type: nq.question_type, depth: nq.follow_up_depth || 0 });
      if (nq.question_type === 'main') setCurrentQIndex(p => p + 1);
      const nextTime = new Date().toISOString();
      questionStartTimeRef.current = nextTime;
      setQuestionStartTime(nextTime);
      setTranscript(''); setLiveTranscript(''); setTextAnswer(''); setIsSubmitting(false);
    } else {
      const ni = currentQIndex + 1;
      if (ni < backendQuestions.length) {
        const nq = backendQuestions[ni];
        setCurrentQIndex(ni);
        setActiveQuestion({ id: nq.id, text: nq.question_text, type: 'main', depth: 0 });
      }
      const nextTime = new Date().toISOString();
      questionStartTimeRef.current = nextTime;
      setQuestionStartTime(nextTime);
      setTranscript(''); setLiveTranscript(''); setTextAnswer(''); setIsSubmitting(false);
    }
  };

  const progress = Math.round(((currentQIndex + 1) / totalQuestions) * 100);
  const isLastQuestion = activeQuestion.type === 'main' && currentQIndex + 1 === totalQuestions;
  const currentAnswer = inputMode === 'voice' ? (liveTranscript || transcript) : textAnswer;
  const canSubmit = inputMode === 'voice'
    ? (!isSubmitting && aiState !== 'thinking' && aiState !== 'speaking')
    : (!isSubmitting && aiState !== 'thinking' && !!textAnswer.trim());

  // ═══════════════════════════════════════════════════════════════
  // SCREEN: PREPARING
  // ═══════════════════════════════════════════════════════════════
  if (screenState === 'PREPARING') {
    return (
      <div className="min-h-[85vh] flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md"
        >
          {/* Brand badge */}
          <div className="flex items-center justify-center mb-8">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/10">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-semibold text-white tracking-wide">InterviewIQ AI</span>
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white tracking-tight mb-2">{selectedDomain}</h1>
            <p className="text-sm text-neutral-500">
              {config.job_role || `${selectedDomain} Engineer`} · {config.difficulty || 'Medium'} · {config.experience || '2+'} yrs
            </p>
          </div>

          {/* Config card */}
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl overflow-hidden mb-4">
            {[
              { label: 'Interview Type', value: config.interviewType || 'Technical' },
              { label: 'Questions', value: `${totalQuestions} questions`, accent: 'text-indigo-400' },
              { label: 'Follow-up Questions', value: config.counterQuestions !== false ? 'Enabled' : 'Disabled', accent: config.counterQuestions !== false ? 'text-emerald-400' : 'text-neutral-500' },
              { label: 'Session Duration', value: `${totalQuestions * 4} minutes (approx.)` },
            ].map(({ label, value, accent }, i) => (
              <div key={label} className={`flex items-center justify-between px-5 py-3.5 ${i !== 0 ? 'border-t border-white/[0.05]' : ''}`}>
                <span className="text-xs text-neutral-500">{label}</span>
                <span className={`text-xs font-semibold ${accent || 'text-white'}`}>{value}</span>
              </div>
            ))}
          </div>

          {/* Error */}
          {sessionInitError && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-xl p-3.5 mb-4"
            >
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span className="text-xs text-red-400 leading-relaxed">{sessionInitError}</span>
            </motion.div>
          )}

          {/* Begin button */}
          <button
            onClick={handleStartInterview}
            disabled={isInitializingSession}
            className="w-full py-4 rounded-xl bg-white text-black text-sm font-bold hover:bg-neutral-100 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2.5 shadow-lg"
          >
            {isInitializingSession ? (
              <>
                <span className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                <span>Generating questions…</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Begin Interview</span>
              </>
            )}
          </button>

          <p className="text-center text-[11px] text-neutral-600 mt-3">
            The browser will enter fullscreen when you start
          </p>
        </motion.div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // SCREEN: COMPLETED (brief transition state before onFinish)
  // ═══════════════════════════════════════════════════════════════
  if (screenState === 'COMPLETED') {
    return (
      <div className="min-h-[85vh] flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Interview Complete</h1>
          <p className="text-sm text-neutral-500 mb-6">Your responses have been submitted for evaluation.</p>
          <div className="flex items-center justify-center gap-2 text-xs text-neutral-600">
            <span className="w-4 h-4 border-2 border-neutral-700 border-t-neutral-400 rounded-full animate-spin" />
            Processing results…
          </div>
        </motion.div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // SCREEN: ACTIVE — FULL-SCREEN INTERVIEW ROOM
  // ═══════════════════════════════════════════════════════════════

  // Derived AI state label
  const aiStateLabel = (() => {
    if (aiState === 'speaking') return { text: 'AI Speaking', color: 'text-emerald-400', dot: 'bg-emerald-400' };
    if (aiState === 'thinking') return { text: 'Evaluating…', color: 'text-amber-400', dot: 'bg-amber-400' };
    if (isSubmitting) return { text: 'Processing…', color: 'text-amber-400', dot: 'bg-amber-400' };
    if (isRecording) return { text: 'Recording', color: 'text-red-400', dot: 'bg-red-500' };
    return { text: 'Listening', color: 'text-indigo-400', dot: 'bg-indigo-400' };
  })();

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#09090C] text-white overflow-hidden">

      {/* ══ TOP BAR ═══════════════════════════════════════════════════ */}
      <div className="shrink-0 h-13 flex items-center justify-between px-5 border-b border-white/[0.05] bg-[#09090C]/95 backdrop-blur-sm" style={{ height: '52px' }}>

        {/* Left — brand + status */}
        <div className="flex items-center gap-3">
          <Logo to={null} size="sm" />
          <div className="w-px h-4 bg-white/10" />
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${aiStateLabel.dot} ${aiState !== 'listening' ? 'animate-pulse' : ''}`} />
            <span className={`text-xs font-medium ${aiStateLabel.color}`}>{aiStateLabel.text}</span>
          </div>
        </div>

        {/* Center — progress */}
        <div className="flex items-center gap-1.5 absolute left-1/2 -translate-x-1/2">
          {Array.from({ length: totalQuestions }).map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all duration-500 ${
                i < currentQIndex
                  ? 'w-5 bg-emerald-400'
                  : i === currentQIndex
                  ? 'w-7 bg-white'
                  : 'w-5 bg-white/10'
              }`}
            />
          ))}
          <span className="ml-2 text-[10px] text-neutral-600 font-mono tabular-nums">
            {currentQIndex + 1}/{totalQuestions}
          </span>
        </div>

        {/* Right — controls */}
        <div className="flex items-center gap-2">
          {/* 3-Minute Question Timer */}
          <div
            className={`font-mono text-xs font-semibold tabular-nums transition-colors px-2.5 py-1 rounded-lg flex items-center gap-1.5 ${
              timerSeconds <= 30
                ? 'text-red-400 bg-red-500/10 border border-red-500/20 animate-pulse'
                : timerSeconds <= 60
                ? 'text-amber-400 bg-amber-500/10'
                : 'text-neutral-300 bg-white/[0.04]'
            }`}
            title={isTimerRunning ? '3-minute timer per question' : 'Timer starts after AI speech finishes'}
          >
            <span className="text-[10px] text-neutral-500 font-sans uppercase">
              {isTimerRunning ? 'Q Time:' : 'Waiting:'}
            </span>
            <span>{formatTimer(timerSeconds)}</span>
          </div>

          {/* Pause */}
          <button
            onClick={() => setIsPaused(!isPaused)}
            title={isPaused ? 'Resume' : 'Pause timer'}
            className="p-2 rounded-lg text-neutral-500 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </button>

          {/* Exit Interview Button (Shows warning modal) */}
          <button
            onClick={() => setShowExitConfirm(true)}
            title="Exit interview session"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-neutral-400 hover:text-red-400 hover:bg-red-500/[0.08] border border-white/[0.06] hover:border-red-500/20 transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:block">Exit Interview</span>
          </button>
        </div>
      </div>

      {/* ══ STARTUP READINESS HOLD OVERLAY (Non-blocking semi-transparent HUD) ══ */}
      <AnimatePresence>
        {screenState === 'PREPARING' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex flex-col items-center justify-center p-6 text-center"
          >
            <div className="max-w-md w-full space-y-5 bg-[#0C0C10]/90 border border-white/15 rounded-3xl p-6 shadow-2xl backdrop-blur-xl">
              {/* Circular Animated Countdown */}
              <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-2 border-cyan-400/40 animate-ping opacity-25" />
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-cyan-500/25 via-white/10 to-emerald-500/25 border border-cyan-400/40 flex flex-col items-center justify-center shadow-2xl">
                  <span className="text-3xl font-black font-mono text-white leading-none">
                    {startupHoldSeconds}
                  </span>
                  <span className="text-[8px] font-mono text-cyan-300 uppercase tracking-widest mt-1">SEC</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <h2 className="text-lg font-sans font-extrabold text-white tracking-tight">
                  Calibrating AI Interview Room
                </h2>
                <p className="text-xs text-neutral-300 leading-relaxed font-sans">
                  Camera feed active in background. Locking fullscreen & warming up AI examiner.
                </p>
              </div>

              {/* Hardware Readiness Telemetry Status Grid */}
              <div className="grid grid-cols-2 gap-2 text-left text-xs font-mono">
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.1]">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-neutral-200">Camera Live</span>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.1]">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-neutral-200">Microphone Ready</span>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.1]">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  <span className="text-neutral-200">Sensors Calibrated</span>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.1]">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-neutral-200">Questions Loaded</span>
                </div>
              </div>

              {/* Ready Now Action */}
              <button
                onClick={() => {
                  setStartupHoldSeconds(0);
                  setScreenState('ACTIVE');
                }}
                className="w-full py-3 rounded-xl bg-white text-black font-bold text-xs hover:bg-neutral-200 transition-all shadow-xl font-mono flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Ready Now · Start Interview</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══ MAIN BODY (Large Face Cam + Compact STT / Response Panel) ════════════════ */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">

        {/* ══ LEFT: QUESTION + RESPONSE PANEL (Compact & Streamlined) ══════════ */}
        <div className="w-full lg:w-[440px] xl:w-[480px] shrink-0 flex flex-col min-h-0 border-r border-white/[0.06] bg-[#0A0A0D]">

          {/* Question area */}
          <div className="px-5 py-4 flex flex-col gap-3 shrink-0 border-b border-white/[0.05]">
            {/* Question type badge */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {activeQuestion.type === 'counter' ? (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full">
                    Follow-up · Depth {activeQuestion.depth || 1}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-neutral-400 bg-white/[0.03] border border-white/[0.06] px-2.5 py-0.5 rounded-full">
                    Question {currentQIndex + 1} of {totalQuestions}
                  </span>
                )}
              </div>

              {/* Replay audio button */}
              {aiState !== 'speaking' && activeQuestion.text && (
                <button
                  onClick={handleToggleAudio}
                  title="Replay question audio"
                  className="inline-flex items-center gap-1 text-[11px] text-neutral-400 hover:text-white transition-colors px-2 py-0.5 rounded-lg hover:bg-white/[0.04]"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Replay</span>
                </button>
              )}
            </div>

            {/* THE QUESTION */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeQuestion.id || activeQuestion.text}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-base xl:text-lg font-semibold text-white leading-relaxed tracking-tight">
                  {activeQuestion.text || (
                    <span className="text-neutral-600">Loading question…</span>
                  )}
                </h2>
              </motion.div>
            </AnimatePresence>

            {/* AI speaking state */}
            <AnimatePresence>
              {aiState === 'speaking' && (
                <motion.div
                  key="speaking-pill"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="flex items-center gap-2 pt-0.5"
                >
                  <div className="flex items-end gap-[3px] h-3.5">
                    {[2, 4, 6, 4, 2].map((h, i) => (
                      <span
                        key={i}
                        className="w-[2.5px] rounded-full bg-emerald-400"
                        style={{ height: `${h * 2}px`, animation: `soundBar 0.7s ease-in-out ${i * 0.1}s infinite alternate` }}
                      />
                    ))}
                  </div>
                  <span className="text-[11px] text-emerald-400 font-mono">AI speaking...</span>
                  <button
                    onClick={handleToggleAudio}
                    className="text-[10px] text-emerald-400/60 hover:text-emerald-400 underline ml-1 transition-colors"
                  >
                    Stop
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── RESPONSE ZONE (Compact STT / Type Area) ───────────────────── */}
          <div className="flex-1 flex flex-col min-h-0 p-4 space-y-3 overflow-y-auto">
            {/* Mode toggle + clear button */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 p-0.5 bg-white/[0.03] border border-white/[0.07] rounded-lg">
                <button
                  onClick={() => setInputMode('voice')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
                    inputMode === 'voice' ? 'bg-white text-black shadow-sm' : 'text-neutral-500 hover:text-white'
                  }`}
                >
                  <Mic className="w-3.5 h-3.5" />
                  <span>Speak</span>
                </button>
                <button
                  onClick={() => setInputMode('text')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
                    inputMode === 'text' ? 'bg-white text-black shadow-sm' : 'text-neutral-500 hover:text-white'
                  }`}
                >
                  <PenLine className="w-3.5 h-3.5" />
                  <span>Type</span>
                </button>
              </div>

              {inputMode === 'voice' && (liveTranscript || transcript) && (
                <button
                  onClick={handleResetSpokenAnswer}
                  disabled={isSubmitting}
                  className="flex items-center gap-1 text-[11px] text-neutral-500 hover:text-red-400 transition-colors disabled:opacity-40 px-2 py-0.5 rounded-lg hover:bg-red-500/[0.06]"
                >
                  <RotateCcw className="w-3 h-3" />
                  Clear
                </button>
              )}
            </div>

            {/* Compact Voice Transcript Box */}
            {inputMode === 'voice' && (
              <div className="h-[120px] max-h-[140px] bg-white/[0.02] border border-white/[0.06] rounded-xl px-3.5 py-2.5 overflow-y-auto relative">
                {(liveTranscript || transcript) ? (
                  <p className="text-sm text-neutral-200 leading-relaxed font-light">
                    {liveTranscript || transcript}
                    {liveTranscript && (
                      <span className="inline-block w-0.5 h-3.5 ml-1 bg-white/40 animate-pulse align-middle" />
                    )}
                  </p>
                ) : (
                  <p className="text-xs text-neutral-600 italic">
                    {isRecording
                      ? 'Speak now — your speech is transcribed here in real-time…'
                      : 'Microphone waiting for voice input…'}
                  </p>
                )}
                <div ref={transcriptEndRef} />
              </div>
            )}

            {/* Compact Text Mode Box */}
            {inputMode === 'text' && (
              <div className="flex flex-col h-[120px] max-h-[140px]">
                <textarea
                  value={textAnswer}
                  onChange={(e) => setTextAnswer(e.target.value)}
                  placeholder="Type your answer here…"
                  className="flex-1 w-full bg-white/[0.02] border border-white/[0.06] rounded-xl px-3.5 py-2 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-white/[0.16] resize-none transition-colors leading-relaxed font-light"
                />
                <div className="mt-1 flex items-center justify-between px-1 text-[10px] text-neutral-600 font-mono">
                  <span>{textAnswer.split(/\s+/).filter(Boolean).length} words</span>
                  <span>{textAnswer.length} chars</span>
                </div>
              </div>
            )}

            {/* Error Banner */}
            <AnimatePresence>
              {audioError && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-start gap-2 bg-red-500/[0.08] border border-red-500/20 rounded-xl px-3 py-2"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-400 leading-relaxed flex-1">{audioError}</p>
                  <button
                    onClick={() => setAudioError(null)}
                    className="text-red-400/50 hover:text-red-400 transition-colors p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── BOTTOM DOCK ─────────────────────────────── */}
          <div className="shrink-0 px-5 py-3.5 border-t border-white/[0.05] bg-[#09090C]/60">
            <button
              onClick={inputMode === 'voice' ? handleFinishUserAnswer : handleFinishTextAnswer}
              disabled={!canSubmit}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white text-black text-xs font-bold hover:bg-neutral-100 disabled:opacity-35 disabled:cursor-not-allowed transition-all shadow-lg"
            >
              {isSubmitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                  <span>Evaluating response…</span>
                </>
              ) : aiState === 'thinking' ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                  <span>AI is thinking…</span>
                </>
              ) : (
                <>
                  <span>{isLastQuestion ? 'Submit & Finish Interview' : 'Submit Answer'}</span>
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* ══ RIGHT: DOMINANT USER CAMERA PANEL (Large Prominent Viewport) ═══ */}
        <div className="flex-1 min-w-0 flex flex-col min-h-0 bg-[#070709] relative p-3 sm:p-4">

          {/* Large Camera Container */}
          <div className="flex-1 relative w-full h-full min-h-[360px] rounded-2xl overflow-hidden bg-[#0D0D10] border border-white/10 shadow-2xl flex items-center justify-center">
            {cameraEnabled ? (
              <>
                <video
                  ref={(el) => {
                    videoRef.current = el;
                    if (el && webcamStream && el.srcObject !== webcamStream) {
                      el.muted = true;
                      el.playsInline = true;
                      el.srcObject = webcamStream;
                      el.play().catch(() => {});
                    }
                  }}
                  autoPlay
                  playsInline
                  muted
                  onLoadedMetadata={(e) => {
                    e.target.play().catch(() => {});
                  }}
                  onCanPlay={(e) => {
                    e.target.play().catch(() => {});
                  }}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  className={`absolute inset-0 w-full h-full object-cover z-0 ${isMirrored ? '-scale-x-100' : ''}`}
                />
                {cameraEnabled && webcamStream && (
                  <FaceDetectionOverlay
                    {...faceData}
                    isCameraOn={cameraEnabled && !!webcamStream}
                    monitoringState={browserMonitoring}
                    onDismissWarning={browserMonitoring.dismissWarning}
                  />
                )}
              </>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#0D0D10]">
                <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
                  <CameraOff className="w-6 h-6 text-neutral-600" />
                </div>
                <span className="text-xs text-neutral-600 font-mono">Camera Off</span>
              </div>
            )}

            {/* Camera error */}
            {cameraError && cameraEnabled && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 bg-[#0D0D10]/90 z-20">
                <AlertTriangle className="w-8 h-8 text-amber-500" />
                <p className="text-xs text-neutral-400 text-center leading-relaxed font-mono">{cameraError}</p>
              </div>
            )}

            {/* REC indicator */}
            {isRecording && cameraEnabled && !cameraError && (
              <div className="absolute top-3 left-3 flex items-center gap-1.5 text-[10px] font-bold text-white bg-black/75 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-red-500/30 z-20">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                REC LIVE
              </div>
            )}

            {/* AI Examiner Orb */}
            <div className="absolute bottom-3 right-3 z-20">
              <div
                className={`relative w-11 h-11 rounded-xl border flex items-center justify-center shadow-2xl transition-all duration-500 backdrop-blur-md ${
                  aiState === 'speaking'
                    ? 'bg-emerald-500/20 border-emerald-400/50 shadow-emerald-500/30'
                    : aiState === 'thinking'
                    ? 'bg-amber-500/20 border-amber-400/50 shadow-amber-500/30'
                    : 'bg-indigo-500/15 border-indigo-400/30 shadow-indigo-500/20'
                }`}
              >
                {aiState === 'speaking' ? (
                  <div className="flex items-end gap-[2px] h-4">
                    {[2, 3, 4, 3, 2].map((h, i) => (
                      <span
                        key={i}
                        className="w-[2px] rounded-full bg-emerald-400"
                        style={{ height: `${h * 2.5}px`, animation: `soundBar 0.7s ease-in-out ${i * 0.1}s infinite alternate` }}
                      />
                    ))}
                  </div>
                ) : aiState === 'thinking' ? (
                  <div className="flex items-center gap-0.5">
                    {[0, 0.15, 0.3].map((d, i) => (
                      <span key={i} className="w-1 h-1 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: `${d}s` }} />
                    ))}
                  </div>
                ) : (
                  <Bot className="w-5 h-5 text-indigo-400" />
                )}
              </div>
            </div>
          </div>

          {/* Camera Controls Strip */}
          <div className="flex items-center justify-between px-3 py-2 mt-2 rounded-xl bg-[#0D0D10]/80 border border-white/[0.06] shrink-0">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMicEnabled(!micEnabled)}
                title={micEnabled ? 'Mute microphone' : 'Unmute microphone'}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium border transition-all ${
                  micEnabled
                    ? 'bg-white/[0.04] border-white/[0.08] text-neutral-300 hover:text-white'
                    : 'bg-red-500/15 border-red-500/30 text-red-400'
                }`}
              >
                {micEnabled ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5 text-red-400" />}
                <span>{micEnabled ? 'Mic Active' : 'Mic Muted'}</span>
              </button>
              <button
                onClick={() => setCameraEnabled(!cameraEnabled)}
                title={cameraEnabled ? 'Turn camera off' : 'Turn camera on'}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium border transition-all ${
                  cameraEnabled
                    ? 'bg-white/[0.04] border-white/[0.08] text-neutral-300 hover:text-white'
                    : 'bg-red-500/15 border-red-500/30 text-red-400'
                }`}
              >
                {cameraEnabled ? <Camera className="w-3.5 h-3.5" /> : <CameraOff className="w-3.5 h-3.5 text-red-400" />}
                <span>{cameraEnabled ? 'Camera On' : 'Camera Off'}</span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              {isPaused && (
                <div className="flex items-center gap-1.5 text-xs text-amber-400 font-mono font-semibold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                  <Pause className="w-3 h-3 text-amber-400" /> Timer Paused
                </div>
              )}
              <button
                onClick={() => setIsMirrored(!isMirrored)}
                title="Flip camera mirror"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-mono text-neutral-400 hover:text-white hover:bg-white/[0.04] border border-transparent hover:border-white/10 transition-colors"
              >
                <FlipHorizontal className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Flip View</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* end main body */}

      {/* Exit Confirmation Warning Modal */}
      <AnimatePresence>
        {showExitConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/85 backdrop-blur-md"
              onClick={() => setShowExitConfirm(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative z-10 w-full max-w-md bg-[#0A0A0A] border border-amber-500/40 rounded-3xl p-6 sm:p-7 shadow-2xl text-white space-y-5"
            >
              <div className="flex items-center gap-3 text-amber-400">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Exit Interview Session?</h3>
                  <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider">
                    Session In Progress
                  </span>
                </div>
              </div>

              <p className="text-xs text-neutral-300 leading-relaxed bg-[#141414] p-4 rounded-2xl border border-white/10 font-sans">
                Are you sure you want to exit the interview? Your current progress will be ended, submitted answers will be evaluated, and your session scorecard generated.
              </p>

              <div className="flex items-center justify-end gap-3 pt-2 font-mono">
                <button
                  type="button"
                  onClick={() => {
                    setShowExitConfirm(false);
                    requestFullscreen();
                  }}
                  className="px-4 py-2.5 rounded-xl bg-[#141414] hover:bg-[#202020] text-neutral-200 text-xs font-semibold border border-white/15 transition-colors cursor-pointer"
                >
                  Continue Interview
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowExitConfirm(false);
                    handleExitInterview();
                  }}
                  className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg transition-colors cursor-pointer"
                >
                  Confirm & End Interview
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Keyframes */}
      <style>{`
        @keyframes soundBar {
          from { transform: scaleY(0.4); opacity: 0.6; }
          to   { transform: scaleY(1.4); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default AIInterviewScreen;
