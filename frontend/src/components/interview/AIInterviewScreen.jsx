import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic, MicOff, Camera, CameraOff, Pause, Play, RotateCcw, XCircle, Sparkles, Volume2,
  Eye, ScanFace, Activity, Clock, HelpCircle, MessageSquareText, Send, CheckCircle2, FlipHorizontal
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
  submitAnswer,
} from '../../services/interviewService';
import { transcribeAudio } from '../../services/speechService';
import { useAudioRecorder } from '../../hooks/useAudioRecorder';

const SAMPLE_QUESTIONS = {
  Technical: [
    "Can you explain how React's Virtual DOM diffing algorithm works under the hood?",
    "How do you optimize state normalization and memory leak prevention in complex React applications?",
    "Describe your approach to designing a high-concurrency microservice with rate limiting.",
    "What are the trade-offs between REST APIs and GraphQL for large-scale mobile applications?",
    "How do you handle database indexing and query optimization when handling millions of records?",
  ],
  HR: [
    "Tell me about a time you had a technical disagreement with a teammate and how you resolved it using the STAR method.",
    "Where do you see your technical leadership trajectory over the next 3 to 5 years?",
    "Describe a project that failed or missed deadlines, and what key trade-offs you learned from it.",
    "How do you prioritize competing requests from product managers vs technical debt refactoring?",
  ]
};

export const AIInterviewScreen = ({ config, onFinish }) => {
  const questions = SAMPLE_QUESTIONS[config.interviewType] || SAMPLE_QUESTIONS.Technical;
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
    text: questions[0],
    type: 'main',
    depth: 0,
  });

  // Audio Recording Hook
  const { isRecording, startRecording, stopRecording, reset: resetRecorder } = useAudioRecorder();

  // AI & User State
  const [aiState, setAiState] = useState('speaking'); // 'speaking' | 'listening' | 'thinking'
  const [transcript, setTranscript] = useState('');

  // Device Camera Capture State
  const [webcamStream, setWebcamStream] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [isMirrored, setIsMirrored] = useState(true);
  const videoRef = useRef(null);

  // Initialize Backend Interview Session
  useEffect(() => {
    let isMounted = true;

    const initBackendSession = async () => {
      try {
        const interviews = await getUserInterviews();
        let activeInterview = interviews.find(
          (i) => i.domain === config.domain && i.interview_type === config.interviewType
        );
        if (!activeInterview) {
          activeInterview = await createInterview(config);
        }

        let qList = await getInterviewQuestions(activeInterview.id);
        if (!qList || qList.length === 0) {
          const sampleTexts = SAMPLE_QUESTIONS[config.interviewType] || SAMPLE_QUESTIONS.Technical;
          qList = [];
          for (let i = 0; i < sampleTexts.length; i++) {
            const createdQ = await addInterviewQuestion(activeInterview.id, {
              question_text: sampleTexts[i],
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
        console.warn('Backend interview session notice (offline local fallback mode active):', err);
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
      setCameraError(err.message || 'Camera & Microphone permission required');
    }
  };

  // Setup Device Camera & Mic on Mount & Cleanup on Unmount
  useEffect(() => {
    requestDeviceCamera();

    return () => {
      resetRecorder();
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

  // Start Audio Recording when AI is listening
  useEffect(() => {
    if (aiState === 'listening' && micEnabled && webcamStream && !isRecording) {
      startRecording(webcamStream);
    }
  }, [aiState, micEnabled, webcamStream, isRecording, startRecording]);

  // AI Speech simulation when active question changes
  useEffect(() => {
    setAiState('speaking');
    const questionText = activeQuestion.text;

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(questionText);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.onend = () => {
        setAiState('listening');
      };
      window.speechSynthesis.speak(utterance);
    } else {
      const timeout = setTimeout(() => setAiState('listening'), 3500);
      return () => clearTimeout(timeout);
    }
  }, [activeQuestion]);

  // Simulated Live Transcript Stream when user speaks
  useEffect(() => {
    let transcriptInterval;
    if (aiState === 'listening' && micEnabled && !isPaused) {
      const sampleAnswers = [
        "In React, the Virtual DOM creates a lightweight JavaScript tree representing the DOM elements. When component state updates, React creates a new VDOM tree and compares it against the previous snapshot using Fiber reconciliation algorithm...",
        "I approach state normalization by flattening deeply nested API data structures, using entity IDs as primary keys, and leveraging custom selector memoization to prevent unnecessary re-renders...",
        "For memory leak prevention, I strictly enforce cleanup handlers in useEffect hooks to unbind RxJS subscriptions, remove window event listeners, and abort pending HTTP requests on component unmount..."
      ];

      const currentSample = sampleAnswers[currentQIndex % sampleAnswers.length];
      let charIndex = 0;

      transcriptInterval = setInterval(() => {
        if (charIndex < currentSample.length) {
          setTranscript(currentSample.slice(0, charIndex + 8));
          charIndex += 8;
        } else {
          clearInterval(transcriptInterval);
        }
      }, 250);
    }
    return () => clearInterval(transcriptInterval);
  }, [aiState, currentQIndex, micEnabled, isPaused]);

  const handleFinishUserAnswer = async () => {
    setAiState('thinking');
    const submittedAt = new Date().toISOString();

    // 1. Stop audio recording for this question
    let audioBlob = null;
    if (isRecording) {
      audioBlob = await stopRecording();
    }

    // 2. Transcribe recorded audio with backend STT
    let finalAnswerText = transcript;
    if (audioBlob && audioBlob.size > 0) {
      try {
        const sttResponse = await transcribeAudio(audioBlob);
        if (sttResponse && sttResponse.text && sttResponse.text.trim()) {
          finalAnswerText = sttResponse.text.trim();
          setTranscript(finalAnswerText);
        }
      } catch (err) {
        console.warn('Speech transcription notice:', err);
      }
    }

    // 3. Submit Answer to Backend Session & Receive Next Question
    let nextQuestionInfo = null;
    let isComplete = false;

    if (sessionId) {
      try {
        const res = await submitAnswer(sessionId, {
          question_id: activeQuestion.id,
          answer_text: finalAnswerText || "Candidate audio response recorded.",
          started_at: questionStartTime,
          submitted_at: submittedAt,
        });

        if (res) {
          nextQuestionInfo = res.next_question;
          isComplete = res.interview_complete;
        }
      } catch (err) {
        console.warn('Backend answer submission notice:', err);
      }
    }

    setTimeout(async () => {
      if (isComplete || (!nextQuestionInfo && currentQIndex + 1 >= totalQuestions)) {
        // Complete Backend Practice Session
        if (sessionId) {
          try {
            await completeSession(sessionId);
          } catch (err) {
            console.warn('Backend session completion notice:', err);
          }
        }

        // Clean up webcam and recorder resources
        resetRecorder();
        if (webcamStream) {
          webcamStream.getTracks().forEach((track) => track.stop());
          setWebcamStream(null);
        }

        onFinish({
          durationMinutes: Math.ceil(timerSeconds / 60) || 5,
          score: 92,
          summary: "Demonstrated exceptional technical articulation with steady eye contact and high composure.",
          sessionId: sessionId,
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
      } else {
        const nextIdx = currentQIndex + 1;
        const nextQ = backendQuestions[nextIdx % backendQuestions.length] || { id: `q_${nextIdx + 1}`, question_text: questions[nextIdx % questions.length] };
        setCurrentQIndex(nextIdx);
        setActiveQuestion({
          id: nextQ.id,
          text: nextQ.question_text,
          type: 'main',
          depth: 0,
        });
        setTranscript('');
      }
    }, 1500);
  };

  const handleRestartSession = () => {
    resetRecorder();
    setCurrentQIndex(0);
    setTimerSeconds(0);
    setTranscript('');
    const firstQ = backendQuestions[0] || { id: 'q_1', question_text: questions[0] };
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

        {/* LEFT 60%: USER CAMERA (Completely Clean Feed with Only Mic & Camera Toggles) */}
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
                      {cameraError ? 'Device Camera Permission Required' : 'Starting Device Camera Feed...'}
                    </span>
                    <p className="text-[11px] text-neutral-400 max-w-xs mb-3 font-mono">
                      Allow browser camera access to stream your live video during the AI mock interview.
                    </p>
                    <button
                      onClick={requestDeviceCamera}
                      className="px-4 py-2 rounded-xl bg-emerald-400 text-black font-bold font-mono text-xs hover:bg-emerald-300 shadow-lg transition-all"
                    >
                      Enable Device Camera
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

            {/* Completely Clean Overlay: Mic, Camera & Mirror Flip Controls at Bottom-Left */}
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

        {/* RIGHT 40%: BIG LIVE ANIMATED AI SQUARE & QUESTION + USER SCRIPT CONTAINER */}
        <div className="lg:col-span-5 flex flex-col gap-4 min-h-0">

          {/* BIG LIVE ANIMATED AI SQUARE CARD */}
          <div className="bg-[#0A0A0A]/90 border border-white/15 rounded-3xl p-5 flex flex-col justify-between shadow-2xl backdrop-blur-xl relative overflow-hidden h-64 sm:h-72 shrink-0">
            {/* Background Ambient Radial Glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-cyan-500/10 pointer-events-none" />

            {/* Top Bar: Live AI Badge & Control Buttons */}
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

                {/* Animated Pulsing Wave Rings */}
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

              {/* Animated Audio Equalizer Frequency Wave */}
              <div className="flex items-center gap-1.5 h-5 mt-3">
                {[30, 70, 100, 50, 85, 40, 95, 65, 80, 45].map((h, i) => (
                  <motion.div
                    key={i}
                    animate={{ height: aiState === 'speaking' ? [`${h * 0.25}%`, `${h}%`, `${h * 0.25}%`] : '20%' }}
                    transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.06 }}
                    className="w-1 bg-emerald-400 rounded-full"
                  />
                ))}
              </div>
            </div>

            {/* Bottom Info Bar: AI State & Session Timer */}
            <div className="flex items-center justify-between z-10 pt-2 border-t border-white/10 font-mono text-xs">
              <span className={`px-2.5 py-0.5 rounded-full border font-bold text-[11px] ${aiState === 'speaking'
                  ? 'bg-[#141414] border-emerald-500/40 text-emerald-400'
                  : aiState === 'thinking'
                    ? 'bg-[#141414] border-amber-500/40 text-amber-400 animate-pulse'
                    : 'bg-[#141414] border-white/20 text-cyan-400'
                }`}>
                {aiState === 'speaking' ? 'Speaking Question...' : aiState === 'thinking' ? 'Evaluating Response...' : 'Listening to Candidate'}
              </span>

              <span className="text-neutral-400">
                Timer: <strong className="text-cyan-400">{formatTimer(timerSeconds)}</strong>
              </span>
            </div>
          </div>

          {/* COMPACT QUESTION CARD WITH USER SCRIPT DIRECTLY UNDERNEATH */}
          <div className="flex-1 bg-[#0A0A0A]/90 border border-white/15 rounded-3xl p-5 flex flex-col justify-between overflow-y-auto shadow-2xl backdrop-blur-xl space-y-4">

            {/* Top Part: AI Question */}
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
                <span className="text-[10px] font-mono text-neutral-400 bg-[#1A1A1A] px-2.5 py-1 rounded-full border border-white/10">
                  {config.interviewType} Domain
                </span>
              </div>

              <h2 className="text-base sm:text-lg font-sans font-extrabold text-white leading-relaxed tracking-tight">
                "{activeQuestion.text}"
              </h2>
            </div>

            {/* Direct Bottom Part: Candidate User Script Response & Action */}
            <div className="space-y-3 pt-3 border-t border-white/10">
              <div className="bg-[#141414] border border-white/10 rounded-2xl p-3.5 flex items-start gap-3">
                <MessageSquareText className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="flex-1 max-h-[100px] overflow-y-auto text-xs sm:text-sm font-sans font-medium text-neutral-200 leading-relaxed">
                  {transcript ? (
                    <span><strong className="text-emerald-400 font-mono text-xs uppercase block mb-0.5">Your Spoken Answer Script:</strong> {transcript}</span>
                  ) : aiState === 'listening' ? (
                    <span className="text-neutral-400 italic text-xs font-mono">Listening to candidate speech... Speak into your microphone.</span>
                  ) : (
                    <span className="text-neutral-400 italic text-xs font-mono">AI evaluating answer script...</span>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  onClick={handleFinishUserAnswer}
                  disabled={aiState === 'thinking'}
                  icon={Send}
                  iconPosition="right"
                  className="w-full bg-white text-black hover:bg-neutral-200 font-bold border border-white/20 text-xs sm:text-sm py-3 shadow-xl font-mono disabled:opacity-50"
                >
                  {activeQuestion.type === 'main' && currentQIndex + 1 === totalQuestions ? 'Submit Answer & Complete Session' : 'Submit Answer / Next Question'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIInterviewScreen;
