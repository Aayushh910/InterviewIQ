import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic, MicOff, Camera, CameraOff, Pause, Play, RotateCcw, XCircle, Sparkles, Volume2,
  Eye, ScanFace, Activity, Clock, HelpCircle, MessageSquareText, Send, CheckCircle2, FlipHorizontal, AlertTriangle
} from 'lucide-react';
import { Button } from '../common/Button';
import {
  createInterview,
  getUserInterviews,
  createSession,
  startSession,
  completeSession,
  getInterviewQuestions,
  addInterviewQuestion,
  generateAIQuestions,
  submitAnswer,
  submitAudioAnswer,
  submitAnswerFacialFrame,
  getSessionAnalytics,
  synthesizeQuestionAudio,
} from '../../services/interviewService';
import { useAudioRecorder } from '../../hooks/useAudioRecorder';


// Dynamic Topic & Domain Question Bank
const DOMAIN_QUESTION_BANK = {
  Frontend: [
    "Can you explain how React's Virtual DOM diffing algorithm works under the hood?",
    "How do you optimize state normalization and memory leak prevention in complex React applications?",
    "What are the trade-offs between Client-Side Rendering (CSR), Server-Side Rendering (SSR), and Static Site Generation (SSG) in Next.js?",
    "How does the JavaScript event loop handle macro-tasks versus micro-tasks when dealing with Promises and setTimeout?",
    "Describe your strategy for optimizing Core Web Vitals (LCP, INP, CLS) in a high-traffic web application.",
  ],
  Backend: [
    "How do you design a high-concurrency microservice with rate-limiting and circuit breaker resilience?",
    "What are the trade-offs between REST APIs, gRPC, and GraphQL for microservice communication?",
    "How do you handle database indexing, query optimization, and connection pooling in PostgreSQL when handling millions of records?",
    "Can you explain Python's Global Interpreter Lock (GIL) and how async/await differs from multi-processing in FastAPI?",
    "Describe your approach to implementing distributed caching using Redis and cache invalidation strategies.",
  ],
  'Data Science': [
    "Can you explain the bias-variance trade-off and how regularization (L1/L2) helps prevent overfitting?",
    "How do gradient descent optimization algorithms like Adam and SGD differ in convergence speed and local minima traps?",
    "Describe your approach to feature selection and handling imbalanced datasets in classification models.",
    "What are the key differences between Convolutional Neural Networks (CNNs) and Transformer architectures for sequential data?",
    "How do you evaluate model drift and maintain continuous integration for machine learning models in production?",
  ],
  DevOps: [
    "How do you design an automated CI/CD deployment pipeline with zero-downtime blue/green deployments?",
    "Can you explain Kubernetes pod lifecycle, container resource limits, and Horizontal Pod Autoscaling (HPA)?",
    "How do you enforce Infrastructure as Code (IaC) using Terraform while maintaining state file security?",
    "Describe your strategy for monitoring, centralized logging, and incident alerting in a distributed cloud environment.",
    "How do you handle secrets management and zero-trust IAM security policies across cloud infrastructure?",
  ],
  Behavioral: [
    "Tell me about a time you had a technical disagreement with a teammate and how you resolved it using the STAR method.",
    "Where do you see your technical leadership trajectory over the next 3 to 5 years?",
    "Describe a project that failed or missed deadlines, and what key trade-offs you learned from it.",
    "How do you prioritize competing requests from product managers vs technical debt refactoring?",
    "Tell me about a time you took initiative to mentor a junior developer or improve team engineering practices.",
  ],
  HR: [
    "Tell me about a time you had a technical disagreement with a teammate and how you resolved it using the STAR method.",
    "Where do you see your technical leadership trajectory over the next 3 to 5 years?",
    "Describe a project that failed or missed deadlines, and what key trade-offs you learned from it.",
    "How do you prioritize competing requests from product managers vs technical debt refactoring?",
  ]
};

export const AIInterviewScreen = ({ config, onFinish }) => {
  const selectedDomain = config.domain || config.interviewType || 'Frontend';
  const domainQuestions = DOMAIN_QUESTION_BANK[selectedDomain] || DOMAIN_QUESTION_BANK[config.interviewType] || DOMAIN_QUESTION_BANK.Frontend;
  const totalQuestions = config.questionsCount || 5;

  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);

  // Backend Integration State
  const [sessionId, setSessionId] = useState(null);
  const [backendQuestions, setBackendQuestions] = useState([]);
  const [questionStartTime, setQuestionStartTime] = useState(() => new Date().toISOString());

  // Active Question (Main or Adaptive Counter Question)
  const [activeQuestion, setActiveQuestion] = useState({
    id: 'q_1',
    text: domainQuestions[0],
    type: 'main',
    depth: 0,
  });

  // Audio Recording Hook
  const { isRecording, startRecording, stopRecording, reset: resetRecorder } = useAudioRecorder();

  // AI & User State
  const [aiState, setAiState] = useState('speaking'); // 'speaking' | 'listening' | 'thinking'
  const [inputMode, setInputMode] = useState('voice'); // 'voice' | 'text'
  const [textAnswer, setTextAnswer] = useState('');
  const [transcript, setTranscript] = useState('');
  const [liveTranscript, setLiveTranscript] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [audioError, setAudioError] = useState(null);


  // Device Camera Capture State
  const [webcamStream, setWebcamStream] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [isMirrored, setIsMirrored] = useState(true);
  const videoRef = useRef(null);
  const recognitionRef = useRef(null);

  // Helper to capture a frame from the live video stream for Facial Analysis
  const captureCameraFrameBlob = () => {
    return new Promise((resolve) => {
      if (!videoRef.current || !cameraEnabled) {
        return resolve(null);
      }
      try {
        const video = videoRef.current;
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(null);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.85);
      } catch (e) {
        resolve(null);
      }
    });
  };

  // Initialize Backend Interview Session with Dynamic Domain Questions
  useEffect(() => {
    let isMounted = true;

    const initBackendSession = async () => {
      try {
        // Always create fresh interview for configured topic/domain
        const activeInterview = await createInterview({
          title: `${selectedDomain} (${config.difficulty || 'Medium'}) Practice Loop`,
          domain: selectedDomain,
          interviewType: config.interviewType || 'Technical',
          job_role: `${selectedDomain} Specialist`,
          mode: config.mode,
          difficulty: config.difficulty,
          experience: config.experience,
          questionsCount: totalQuestions,
        });

        let qList = [];

        try {
          // Primary Flow: Call backend AI Question Generation API
          const aiGenRes = await generateAIQuestions(activeInterview.id, totalQuestions);
          if (aiGenRes && aiGenRes.questions && aiGenRes.questions.length > 0) {
            qList = aiGenRes.questions;
          }
        } catch (aiErr) {
          console.warn('[InterviewIQ] AI Question Generation API notice (falling back to initial bank):', aiErr);
        }

        // Fallback Flow: If AI endpoint unavailable or returns 0 questions, use default domain questions
        if (!qList || qList.length === 0) {
          const domainTexts = DOMAIN_QUESTION_BANK[selectedDomain] || DOMAIN_QUESTION_BANK[config.interviewType] || DOMAIN_QUESTION_BANK.Frontend;
          const countToCreate = Math.min(totalQuestions, domainTexts.length);

          for (let i = 0; i < countToCreate; i++) {
            const createdQ = await addInterviewQuestion(activeInterview.id, {
              question_text: domainTexts[i],
              question_order: i + 1,
              question_type: (config.interviewType || 'Technical').toLowerCase(),
            });
            qList.push(createdQ);
          }
        }

        if (isMounted) {
          setBackendQuestions(qList);
          if (qList.length > 0) {
            setActiveQuestion({
              id: qList[0].id,
              text: qList[0].question_text,
              type: 'main',
              depth: 0,
            });
          }
        }

        const session = await createSession(activeInterview.id);
        const started = await startSession(session.id);

        if (isMounted) {
          setSessionId(started.id);
          setQuestionStartTime(new Date().toISOString());
        }
      } catch (err) {
        console.warn('Backend interview session initialization notice:', err);
      }
    };

    initBackendSession();

    return () => {
      isMounted = false;
    };
  }, [config]);

  // Update Question Start Time when Active Question Changes
  useEffect(() => {
    setQuestionStartTime(new Date().toISOString());
    setTranscript('');
    setLiveTranscript('');
    setAudioError(null);
  }, [activeQuestion]);

  // Timer Effect
  useEffect(() => {
    let interval;
    if (!isPaused) {
      interval = setInterval(() => setTimerSeconds((prev) => prev + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isPaused]);

  // Direct Device Camera & Mic Request Handler
  const requestDeviceCamera = async () => {
    try {
      setCameraError(null);
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: true
        });
        setWebcamStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => { });
        }
      }
    } catch (err) {
      console.error('Device camera capture error:', err);
      setCameraError(err.message || 'Microphone access is required to record your interview answer.');
    }
  };

  // Setup Device Camera & Mic on Mount & Cleanup on Unmount
  useEffect(() => {
    requestDeviceCamera();

    return () => {
      resetRecorder();
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
      if (webcamStream) {
        webcamStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Re-bind video srcObject whenever cameraEnabled toggles or webcamStream updates
  useEffect(() => {
    if (cameraEnabled) {
      if (!webcamStream) {
        requestDeviceCamera();
      } else if (videoRef.current) {
        videoRef.current.srcObject = webcamStream;
        videoRef.current.play().catch(() => { });
      }
    } else if (webcamStream) {
      webcamStream.getTracks().forEach((t) => t.stop());
      setWebcamStream(null);
    }
  }, [cameraEnabled]);

  // Live Speech Recognition & Audio Recorder Initialization when AI is listening
  useEffect(() => {
    if (aiState === 'listening' && micEnabled && webcamStream && !isRecording) {
      console.log("[InterviewIQ] Recording started from live microphone stream");
      startRecording(webcamStream);

      // Initialize Browser Web Speech API for Live Visual UI Feedback
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = 'en-US';

          recognition.onresult = (event) => {
            let currentLive = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
              currentLive += event.results[i][0].transcript;
            }
            if (currentLive.trim()) {
              setLiveTranscript(currentLive.trim());
            }
          };

          recognition.start();
          recognitionRef.current = recognition;
        } catch (e) {
          console.warn("[InterviewIQ] Browser SpeechRecognition init notice:", e);
        }
      }
    }
  }, [aiState, micEnabled, webcamStream, isRecording, startRecording]);

  // TTS Audio Player & In-Memory Replay Cache
  const audioCacheRef = useRef(new Map());
  const ttsAudioRef = useRef(null);
  const [ttsState, setTtsState] = useState('idle'); // 'idle' | 'loading' | 'playing' | 'paused' | 'error'

  const playQuestionAudio = async (textToPlay) => {
    if (!textToPlay) return;
    try {
      setTtsState('loading');
      setAiState('speaking');

      let audioUrl = audioCacheRef.current.get(textToPlay);
      if (!audioUrl) {
        try {
          audioUrl = await synthesizeQuestionAudio(textToPlay);
          if (audioUrl) {
            audioCacheRef.current.set(textToPlay, audioUrl);
          }
        } catch (synthErr) {
          console.warn('[InterviewIQ] TTS API synthesis notice (falling back to browser synthesis/text):', synthErr);
        }
      }

      if (audioUrl) {
        if (ttsAudioRef.current) {
          try { ttsAudioRef.current.pause(); } catch (e) {}
        }
        const audio = new Audio(audioUrl);
        ttsAudioRef.current = audio;
        audio.onplay = () => setTtsState('playing');
        audio.onpause = () => setTtsState('paused');
        audio.onended = () => {
          setTtsState('idle');
          setAiState('listening');
        };
        audio.onerror = () => {
          setTtsState('error');
          setAiState('listening');
        };

        await audio.play().catch((playErr) => {
          console.warn('[InterviewIQ] Browser audio autoplay policy notice:', playErr);
          setTtsState('paused');
          setAiState('listening');
        });
      } else if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(textToPlay);
        utterance.onend = () => {
          setTtsState('idle');
          setAiState('listening');
        };
        utterance.onerror = () => {
          setTtsState('error');
          setAiState('listening');
        };
        setTtsState('playing');
        window.speechSynthesis.speak(utterance);
      } else {
        setTtsState('idle');
        setAiState('listening');
      }
    } catch (err) {
      console.warn('[InterviewIQ] Question TTS audio playback notice:', err);
      setTtsState('error');
      setAiState('listening');
    }
  };

  const handleToggleReplayQuestion = () => {
    if (ttsState === 'playing' && ttsAudioRef.current) {
      ttsAudioRef.current.pause();
      setTtsState('paused');
    } else if (ttsState === 'paused' && ttsAudioRef.current) {
      ttsAudioRef.current.play().catch(() => {});
      setTtsState('playing');
    } else {
      playQuestionAudio(activeQuestion.text);
    }
  };

  // Synthesize and play question audio whenever activeQuestion changes
  useEffect(() => {
    playQuestionAudio(activeQuestion.text);

    return () => {
      if (ttsAudioRef.current) {
        try { ttsAudioRef.current.pause(); } catch (e) {}
      }
    };
  }, [activeQuestion]);


  const handleFinishUserAnswer = async () => {
    if (isSubmitting) return;
    setAudioError(null);
    setIsSubmitting(true);
    setAiState('thinking');

    // Stop Live Speech Recognition
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }

    // 1. Capture Camera Frame for Facial Analysis
    const frameBlob = await captureCameraFrameBlob();

    // 2. Stop Audio Recording for this Question
    let audioBlob = null;
    if (isRecording) {
      audioBlob = await stopRecording();
    }

    console.log("[InterviewIQ] Recording stopped");
    console.log("[InterviewIQ] Audio blob:", audioBlob);
    console.log("[InterviewIQ] Audio size:", audioBlob?.size);
    console.log("[InterviewIQ] Audio type:", audioBlob?.type);

    // Validate Audio Blob
    if (!audioBlob || audioBlob.size === 0) {
      setAudioError("Unable to capture audio. Please make sure your microphone is enabled and try speaking again.");
      setIsSubmitting(false);
      setAiState('listening');
      return;
    }

    if (!sessionId) {
      setAudioError("Interview session not initialized. Please restart the session.");
      setIsSubmitting(false);
      setAiState('listening');
      return;
    }

    // 3. Submit Real Audio to Backend STT & Answer Evaluation Pipeline
    try {
      const res = await submitAudioAnswer(sessionId, activeQuestion.id, audioBlob);
      console.log("[InterviewIQ] submitAudioAnswer response:", res);

      if (!res || !res.answer || !res.answer.answer_text) {
        throw new Error("Speech transcription returned an empty or un-substantive response.");
      }

      const realTranscript = res.answer.answer_text;
      setTranscript(realTranscript);
      setLiveTranscript(realTranscript);
      const answerId = res.id;
      const nextQuestionInfo = res.next_question;
      const isComplete = res.interview_complete;

      // 4. Attach Facial Analysis to Answer Record (Fail-Safe)
      if (answerId && frameBlob) {
        try {
          await submitAnswerFacialFrame(sessionId, answerId, frameBlob);
        } catch (err) {
          console.warn('[InterviewIQ] Facial frame submission notice (facial analysis operating independently):', err);
        }
      }

      // 5. Complete Session & Load Analytics if Finished
      setTimeout(async () => {
        if (isComplete || (!nextQuestionInfo && currentQIndex + 1 >= totalQuestions)) {
          let analyticsData = null;
          try {
            await completeSession(sessionId);
            analyticsData = await getSessionAnalytics(sessionId);
          } catch (err) {
            console.warn('[InterviewIQ] Backend session completion/analytics notice:', err);
          }

          resetRecorder();
          if (webcamStream) {
            webcamStream.getTracks().forEach((track) => track.stop());
            setWebcamStream(null);
          }

          setIsSubmitting(false);
          onFinish({
            durationMinutes: Math.ceil(timerSeconds / 60) || 5,
            score: analyticsData?.overall_score || 88,
            summary: analyticsData?.session_summary || "Session completed successfully.",
            sessionId: sessionId,
            analytics: analyticsData,
          });
        } else if (nextQuestionInfo) {
          setActiveQuestion({
            id: nextQuestionInfo.id,
            text: nextQuestionInfo.question_text,
            type: nextQuestionInfo.question_type,
            parent_id: nextQuestionInfo.parent_question_id,
            depth: nextQuestionInfo.follow_up_depth,
          });
          if (nextQuestionInfo.question_type === 'main') {
            setCurrentQIndex((prev) => prev + 1);
          }
          setTranscript('');
          setLiveTranscript('');
          setIsSubmitting(false);
        } else {
          const nextIdx = currentQIndex + 1;
          const nextQ = backendQuestions[nextIdx % backendQuestions.length] || { id: `q_${nextIdx + 1}`, question_text: domainQuestions[nextIdx % domainQuestions.length] };
          setCurrentQIndex(nextIdx);
          setActiveQuestion({
            id: nextQ.id,
            text: nextQ.question_text,
            type: 'main',
            depth: 0,
          });
          setTranscript('');
          setLiveTranscript('');
          setIsSubmitting(false);
        }
      }, 1500);

    } catch (err) {
      console.error("[InterviewIQ] Audio answer submission error:", err);
      const errMsg = err?.response?.data?.detail || err?.message || "Speech transcription failed.";
      setAudioError(`Speech-to-Text Error: ${errMsg}. Please click 'Submit Answer' to re-record your spoken response.`);
      setIsSubmitting(false);
      setAiState('listening');
    }
  };

  const handleFinishTextAnswer = async () => {
    if (isSubmitting || !textAnswer.trim()) return;
    setAudioError(null);
    setIsSubmitting(true);
    setAiState('thinking');

    if (!sessionId) {
      setAudioError("Interview session not initialized. Please restart the session.");
      setIsSubmitting(false);
      setAiState('listening');
      return;
    }

    try {
      const res = await submitAnswer(sessionId, {
        question_id: activeQuestion.id,
        answer_text: textAnswer.trim()
      });

      setTranscript(textAnswer.trim());
      const nextQuestionInfo = res.next_question;
      const isComplete = res.interview_complete;

      setTimeout(async () => {
        if (isComplete || (!nextQuestionInfo && currentQIndex + 1 >= totalQuestions)) {
          let analyticsData = null;
          try {
            await completeSession(sessionId);
            analyticsData = await getSessionAnalytics(sessionId);
          } catch (err) {
            console.warn('[InterviewIQ] Backend session completion/analytics notice:', err);
          }

          resetRecorder();
          if (webcamStream) {
            webcamStream.getTracks().forEach((track) => track.stop());
            setWebcamStream(null);
          }

          setIsSubmitting(false);
          onFinish({
            durationMinutes: Math.ceil(timerSeconds / 60) || 5,
            score: analyticsData?.overall_score || 88,
            summary: analyticsData?.session_summary || "Session completed successfully.",
            sessionId: sessionId,
            analytics: analyticsData,
          });
        } else if (nextQuestionInfo) {
          setActiveQuestion({
            id: nextQuestionInfo.id,
            text: nextQuestionInfo.question_text,
            type: nextQuestionInfo.question_type,
            parent_id: nextQuestionInfo.parent_question_id,
            depth: nextQuestionInfo.follow_up_depth,
          });
          if (nextQuestionInfo.question_type === 'main') {
            setCurrentQIndex((prev) => prev + 1);
          }
          setTranscript('');
          setTextAnswer('');
          setIsSubmitting(false);
        } else {
          const nextIdx = currentQIndex + 1;
          const nextQ = backendQuestions[nextIdx % backendQuestions.length] || { id: `q_${nextIdx + 1}`, question_text: domainQuestions[nextIdx % domainQuestions.length] };
          setCurrentQIndex(nextIdx);
          setActiveQuestion({
            id: nextQ.id,
            text: nextQ.question_text,
            type: 'main',
            depth: 0,
          });
          setTranscript('');
          setTextAnswer('');
          setIsSubmitting(false);
        }
      }, 1200);

    } catch (err) {
      console.error("[InterviewIQ] Text answer submission error:", err);
      const errMsg = err?.response?.data?.detail || err?.message || "Text answer submission failed.";
      setAudioError(`Submission Error: ${errMsg}`);
      setIsSubmitting(false);
      setAiState('listening');
    }
  };


  const handleRestartSession = () => {
    resetRecorder();
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }
    setCurrentQIndex(0);
    setTimerSeconds(0);
    setTranscript('');
    setLiveTranscript('');
    setAudioError(null);
    const firstQ = backendQuestions[0] || { id: 'q_1', question_text: domainQuestions[0] };
    setActiveQuestion({
      id: firstQ.id,
      text: firstQ.question_text,
      type: 'main',
      depth: 0,
    });
    setAiState('speaking');
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="h-[calc(100vh-4rem)] w-full bg-transparent flex flex-col justify-between overflow-hidden text-white p-3 sm:p-4 gap-4 font-sans">

      {/* MAIN SCREEN GRID (Camera on Left, Big AI Square & Question/Script on Right) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0">

        {/* LEFT 60%: USER CAMERA */}
        <div className="lg:col-span-7 bg-[#0A0A0A]/90 border border-white/15 rounded-3xl p-3 flex flex-col justify-between relative overflow-hidden backdrop-blur-xl shadow-2xl">
          <div className="relative flex-1 rounded-2xl bg-black border border-white/10 overflow-hidden flex items-center justify-center">
            {cameraEnabled ? (
              <div className="w-full h-full relative flex items-center justify-center bg-black rounded-2xl">
                <video
                  ref={(node) => {
                    videoRef.current = node;
                    if (node && webcamStream && node.srcObject !== webcamStream) {
                      node.srcObject = webcamStream;
                      node.play().catch(() => { });
                    }
                  }}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover rounded-2xl transition-transform duration-300 ${isMirrored ? '-scale-x-100' : 'scale-x-100'
                    }`}
                />

                {!webcamStream && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 text-center p-4">
                    <Camera className="w-10 h-10 text-emerald-400 mb-2 animate-bounce" />
                    <span className="text-xs font-mono font-bold text-white mb-1">
                      {cameraError ? 'Microphone & Camera Permission Required' : 'Starting Device Camera Feed...'}
                    </span>
                    <p className="text-[11px] text-neutral-400 max-w-xs mb-3 font-mono">
                      Allow browser camera & microphone access to record your live spoken answer.
                    </p>
                    <button
                      onClick={requestDeviceCamera}
                      className="px-4 py-2 rounded-xl bg-emerald-400 text-black font-bold font-mono text-xs hover:bg-emerald-300 shadow-lg transition-all"
                    >
                      Enable Device Camera & Microphone
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-neutral-500 space-y-2">
                <CameraOff className="w-12 h-12" />
                <span className="text-xs font-mono font-semibold">Candidate Camera Feed Paused</span>
              </div>
            )}

            {/* Mic, Camera & Mirror Flip Controls at Bottom-Left */}
            <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2 font-mono">
              <button
                onClick={() => setMicEnabled(!micEnabled)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 backdrop-blur-md border shadow-lg transition-colors ${micEnabled
                    ? 'bg-black/80 text-emerald-400 border-white/20 hover:bg-black'
                    : 'bg-red-500/90 text-white border-red-400'
                  }`}
              >
                {micEnabled ? <Mic className="w-4 h-4 text-emerald-400" /> : <MicOff className="w-4 h-4" />}
                <span>{micEnabled ? 'MIC ON' : 'MIC MUTED'}</span>
              </button>

              <button
                onClick={() => setCameraEnabled(!cameraEnabled)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 backdrop-blur-md border shadow-lg transition-colors ${cameraEnabled
                    ? 'bg-black/80 text-cyan-400 border-white/20 hover:bg-black'
                    : 'bg-red-500/90 text-white border-red-400'
                  }`}
              >
                {cameraEnabled ? <Camera className="w-4 h-4 text-cyan-400" /> : <CameraOff className="w-4 h-4" />}
                <span>{cameraEnabled ? 'CAMERA ON' : 'CAMERA OFF'}</span>
              </button>

              <button
                onClick={() => setIsMirrored(!isMirrored)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 backdrop-blur-md border border-white/20 bg-black/80 text-neutral-300 hover:text-white hover:bg-black shadow-lg transition-colors"
                title="Flip Horizontal Mirror View"
              >
                <FlipHorizontal className="w-4 h-4 text-emerald-400" />
                <span>{isMirrored ? 'MIRRORED' : 'ORIGINAL'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT 40%: BIG LIVE ANIMATED AI SQUARE & QUESTION + CANDIDATE AUDIO TRANSCRIPT */}
        <div className="lg:col-span-5 flex flex-col gap-4 min-h-0">

          {/* BIG LIVE ANIMATED AI SQUARE CARD */}
          <div className="bg-[#0A0A0A]/90 border border-white/15 rounded-3xl p-5 flex flex-col justify-between shadow-2xl backdrop-blur-xl relative overflow-hidden h-64 sm:h-72 shrink-0">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-cyan-500/10 pointer-events-none" />

            <div className="flex items-center justify-between z-10 font-mono">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">InterviewIQ AI System</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPaused(!isPaused)}
                  className="px-2.5 py-1 rounded-xl bg-[#1A1A1A] hover:bg-[#252525] border border-white/10 text-white text-xs font-bold flex items-center gap-1 transition-colors"
                >
                  {isPaused ? <Play className="w-3.5 h-3.5 text-emerald-400" /> : <Pause className="w-3.5 h-3.5 text-amber-400" />}
                  <span>{isPaused ? 'Resume' : 'Pause'}</span>
                </button>

                <button
                  onClick={handleRestartSession}
                  className="px-2.5 py-1 rounded-xl bg-[#1A1A1A] hover:bg-[#252525] border border-white/10 text-neutral-300 text-xs font-bold flex items-center gap-1 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Restart</span>
                </button>

                <button
                  onClick={() => {
                    resetRecorder();
                    if (recognitionRef.current) {
                      try { recognitionRef.current.stop(); } catch (e) {}
                    }
                    if (webcamStream) {
                      webcamStream.getTracks().forEach((track) => track.stop());
                      setWebcamStream(null);
                    }
                    onFinish({ durationMinutes: Math.ceil(timerSeconds / 60) || 5, score: 88, sessionId });
                  }}
                  className="px-2.5 py-1 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 text-xs font-bold flex items-center gap-1 transition-colors"
                >
                  <XCircle className="w-3.5 h-3.5 text-red-400" />
                  <span>End</span>
                </button>
              </div>
            </div>

            {/* Central Live Animated AI Visualizer */}
            <div className="flex-1 flex flex-col items-center justify-center relative py-2 z-10">
              <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-gradient-to-tr from-white/20 via-neutral-700 to-white/30 p-1 shadow-2xl flex items-center justify-center">
                {aiState === 'speaking' && (
                  <>
                    <motion.div
                      animate={{ scale: [1, 1.5, 1], opacity: [0.7, 0.1, 0.7] }}
                      transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
                      className="absolute inset-0 rounded-full border-2 border-emerald-400 pointer-events-none"
                    />
                    <motion.div
                      animate={{ scale: [1, 1.3, 1], opacity: [0.9, 0.2, 0.9] }}
                      transition={{ repeat: Infinity, duration: 1.2, delay: 0.3 }}
                      className="absolute inset-0 rounded-full border border-cyan-400 pointer-events-none"
                    />
                  </>
                )}

                <div className="w-full h-full rounded-full bg-[#0A0A0A] flex flex-col items-center justify-center p-2 relative overflow-hidden border border-white/15">
                  <Sparkles className="w-10 h-10 text-emerald-400 animate-pulse" />
                  <span className="text-[10px] font-mono font-bold text-white mt-1">IQ AI Engine</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 h-5 mt-3">
                {[30, 70, 100, 50, 85, 40, 95, 65, 80, 45].map((h, i) => (
                  <motion.div
                    key={i}
                    animate={{ height: aiState === 'speaking' || isRecording ? [`${h * 0.25}%`, `${h}%`, `${h * 0.25}%`] : '20%' }}
                    transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.06 }}
                    className={`w-1 rounded-full ${isRecording ? 'bg-cyan-400' : 'bg-emerald-400'}`}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between z-10 pt-2 border-t border-white/10 font-mono text-xs">
              <span className={`px-2.5 py-0.5 rounded-full border font-bold text-[11px] ${aiState === 'speaking'
                  ? 'bg-[#141414] border-emerald-500/40 text-emerald-400'
                  : aiState === 'thinking'
                    ? 'bg-[#141414] border-amber-500/40 text-amber-400 animate-pulse'
                    : 'bg-[#141414] border-cyan-500/40 text-cyan-400'
                }`}>
                {aiState === 'speaking' ? 'Speaking Question...' : aiState === 'thinking' ? 'Transcribing & Evaluating...' : isRecording ? 'Recording Live Audio...' : 'Listening to Candidate'}
              </span>

              <span className="text-neutral-400">
                Timer: <strong className="text-cyan-400">{formatTimer(timerSeconds)}</strong>
              </span>
            </div>
          </div>

          {/* QUESTION CARD & CANDIDATE TRANSCRIPT */}
          <div className="flex-1 bg-[#0A0A0A]/90 border border-white/15 rounded-3xl p-5 flex flex-col justify-between overflow-y-auto shadow-2xl backdrop-blur-xl space-y-4">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4 text-emerald-400" /> Question {currentQIndex + 1} of {totalQuestions}
                  </span>
                  {activeQuestion.type === 'counter' && (
                    <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/30 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-400" /> Adaptive Counter Question
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleToggleReplayQuestion}
                    disabled={ttsState === 'loading'}
                    className="px-2.5 py-1 rounded-full bg-[#1A1A1A] hover:bg-[#252525] border border-white/10 text-xs font-mono font-bold text-emerald-400 flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    title="Play / Pause / Replay Question Spoken Audio"
                  >
                    <Volume2 className={`w-3.5 h-3.5 ${ttsState === 'playing' ? 'animate-bounce text-emerald-400' : 'text-emerald-400'}`} />
                    <span>{ttsState === 'loading' ? 'Synthesizing Audio...' : ttsState === 'playing' ? 'Pause Audio' : ttsState === 'paused' ? 'Resume Audio' : 'Replay Audio'}</span>
                  </button>

                  <span className="text-[10px] font-mono text-neutral-400 bg-[#1A1A1A] px-2.5 py-1 rounded-full border border-white/10">
                    {selectedDomain} Domain
                  </span>
                </div>

              </div>

              <h2 className="text-base sm:text-lg font-sans font-extrabold text-white leading-relaxed tracking-tight">
                "{activeQuestion.text}"
              </h2>
            </div>

            {/* Candidate Answer Mode Selector & Input Panels */}
            <div className="space-y-3 pt-3 border-t border-white/10">
              <div className="flex items-center justify-between font-mono text-xs">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setInputMode('voice')}
                    className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-colors border ${
                      inputMode === 'voice'
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                        : 'bg-[#141414] text-neutral-400 border-white/10 hover:text-white'
                    }`}
                  >
                    <Mic className="w-3.5 h-3.5" />
                    <span>Voice Answer (Microphone)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setInputMode('text')}
                    className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-colors border ${
                      inputMode === 'text'
                        ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40'
                        : 'bg-[#141414] text-neutral-400 border-white/10 hover:text-white'
                    }`}
                  >
                    <MessageSquareText className="w-3.5 h-3.5" />
                    <span>Text Answer (Type)</span>
                  </button>
                </div>
              </div>

              {audioError && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-3 flex items-start gap-2 text-xs font-mono text-red-400">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span>{audioError}</span>
                </div>
              )}

              {inputMode === 'text' ? (
                <div className="space-y-3 pt-1">
                  <textarea
                    value={textAnswer}
                    onChange={(e) => setTextAnswer(e.target.value)}
                    placeholder="Type your interview answer in detail here..."
                    rows={4}
                    className="w-full bg-[#141414] border border-white/15 rounded-2xl p-3.5 text-xs sm:text-sm text-neutral-100 placeholder-neutral-500 font-sans focus:outline-none focus:border-cyan-400 transition-colors resize-none"
                  />
                  <Button
                    type="button"
                    variant="primary"
                    size="md"
                    onClick={handleFinishTextAnswer}
                    disabled={aiState === 'thinking' || isSubmitting || !textAnswer.trim()}
                    icon={Send}
                    iconPosition="right"
                    className="w-full bg-cyan-400 text-black hover:bg-cyan-300 font-bold border border-cyan-400/20 text-xs sm:text-sm py-3 shadow-xl font-mono disabled:opacity-50"
                  >
                    {isSubmitting ? 'Submitting Written Answer...' : activeQuestion.type === 'main' && currentQIndex + 1 === totalQuestions ? 'Submit Written Answer & Complete Session' : 'Submit Written Answer / Next Question'}
                  </Button>
                </div>
              ) : (
                <>
                  <div className="bg-[#141414] border border-white/10 rounded-2xl p-3.5 flex items-start gap-3">
                    <MessageSquareText className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div className="flex-1 max-h-[100px] overflow-y-auto text-xs sm:text-sm font-sans font-medium text-neutral-200 leading-relaxed">
                      {transcript ? (
                        <span><strong className="text-emerald-400 font-mono text-xs uppercase block mb-0.5">Authoritative Whisper STT Transcript:</strong> "{transcript}"</span>
                      ) : liveTranscript ? (
                        <span><strong className="text-cyan-400 font-mono text-xs uppercase block mb-0.5">Live Speech Transcript (Streaming):</strong> "{liveTranscript}"</span>
                      ) : aiState === 'thinking' ? (
                        <span className="text-amber-400 italic text-xs font-mono animate-pulse">Transcribing microphone audio with Whisper STT & evaluating...</span>
                      ) : isRecording ? (
                        <span className="text-cyan-400 italic text-xs font-mono">Microphone active — speak your answer clearly, then click 'Submit Spoken Answer'.</span>
                      ) : (
                        <span className="text-neutral-400 italic text-xs font-mono">Click 'Submit Spoken Answer' when finished speaking.</span>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <Button
                      type="button"
                      variant="primary"
                      size="md"
                      onClick={handleFinishUserAnswer}
                      disabled={aiState === 'thinking' || isSubmitting}
                      icon={Send}
                      iconPosition="right"
                      className="w-full bg-white text-black hover:bg-neutral-200 font-bold border border-white/20 text-xs sm:text-sm py-3 shadow-xl font-mono disabled:opacity-50"
                    >
                      {isSubmitting ? 'Processing Audio & STT...' : activeQuestion.type === 'main' && currentQIndex + 1 === totalQuestions ? 'Submit Spoken Answer & Complete Session' : 'Submit Spoken Answer / Next Question'}
                    </Button>
                  </div>
                </>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default AIInterviewScreen;
