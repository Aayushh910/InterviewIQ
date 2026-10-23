import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, KeyRound, ArrowRight } from 'lucide-react';
import { InterviewConfigStep } from '../../components/interview/InterviewConfigStep';
import { DeviceCheckStep } from '../../components/interview/DeviceCheckStep';
import { InterviewPreviewStep } from '../../components/interview/InterviewPreviewStep';
import { AIInterviewScreen } from '../../components/interview/AIInterviewScreen';
import { InterviewFinishedStep } from '../../components/interview/InterviewFinishedStep';
import { useInterview } from '../../context/InterviewContext';
import { Button } from '../../components/common/Button';

export const Interview = () => {
  const [step, setStep] = useState(1);
  const [missingKeyModal, setMissingKeyModal] = useState(false);
  const [sessionPayload, setSessionPayload] = useState(null);
  const navigate = useNavigate();
  const { activeConfig, updateConfig, saveCompletedInterview } = useInterview();

  const [finishedResult, setFinishedResult] = useState(null);

  const handleConfigNext = () => {
    const hasGroqKey = !!(
      localStorage.getItem('interviewiq_groq_api_key') ||
      localStorage.getItem('interviewiq_ai_api_key')
    );
    if (!hasGroqKey) {
      setMissingKeyModal(true);
      return;
    }
    setStep(2);
  };

  const handleDeviceCheckNext = () => {
    const hasGroqKey = !!(
      localStorage.getItem('interviewiq_groq_api_key') ||
      localStorage.getItem('interviewiq_ai_api_key')
    );
    if (!hasGroqKey) {
      setMissingKeyModal(true);
      return;
    }
    setStep(3);
  };

  const handleStartPreview = (payload) => {
    setSessionPayload(payload);
    setStep(4);
  };

  const handleInterviewFinish = (sessionData) => {
    const reportId = saveCompletedInterview(sessionData);
    setFinishedResult({ ...sessionData, reportId });
    setStep(5);
  };

  const handleViewReport = () => {
    const targetId = finishedResult?.sessionId || finishedResult?.reportId;
    if (targetId) {
      navigate(`/history?id=${targetId}`);
    } else {
      navigate('/history');
    }
  };

  return (
    <div className={step === 4 ? 'w-full h-full' : 'p-3 sm:p-4 lg:p-5 max-w-6xl mx-auto'}>
      <AnimatePresence mode="wait">
        {step === 1 && (
          <InterviewConfigStep
            key="step1"
            config={activeConfig}
            onChange={updateConfig}
            onNext={handleConfigNext}
          />
        )}

        {step === 2 && (
          <DeviceCheckStep
            key="step2"
            onNext={handleDeviceCheckNext}
            onBack={() => setStep(1)}
          />
        )}

        {step === 3 && (
          <InterviewPreviewStep
            key="step3"
            config={activeConfig}
            onStartInterview={handleStartPreview}
            onBack={() => setStep(2)}
          />
        )}

        {step === 4 && (
          <AIInterviewScreen
            key="step4"
            config={activeConfig}
            preloadedData={sessionPayload?.preloadedData}
            initialStream={sessionPayload?.initialStream}
            onFinish={handleInterviewFinish}
          />
        )}

        {step === 5 && (
          <InterviewFinishedStep
            key="step5"
            result={finishedResult}
            onViewReport={handleViewReport}
          />
        )}
      </AnimatePresence>

      {/* Groq API Key Missing Warning Modal */}
      <AnimatePresence>
        {missingKeyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMissingKeyModal(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative z-10 w-full max-w-md bg-[#0A0A0A] border border-amber-500/40 rounded-3xl p-6 sm:p-7 shadow-2xl text-white space-y-5 backdrop-blur-xl"
            >
              <div className="flex items-center gap-3 text-amber-400">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <KeyRound className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Groq API Key Required</h3>
                  <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider">
                    No API Key Provided
                  </span>
                </div>
              </div>

              <p className="text-xs text-neutral-300 leading-relaxed font-sans bg-[#141414] p-4 rounded-2xl border border-white/10">
                You must upload your personal Groq API key in Settings before launching any AI interview session. Groq powers our real-time question generation and Whisper voice transcription.
              </p>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-3 font-mono">
                <button
                  type="button"
                  onClick={() => setMissingKeyModal(false)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#141414] text-neutral-300 hover:text-white border border-white/10 text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <Link
                  to="/settings"
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white text-black font-bold text-xs hover:bg-neutral-200 transition-all flex items-center justify-center gap-2 shadow-lg"
                >
                  Go to Settings <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Interview;
