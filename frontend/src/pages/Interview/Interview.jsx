import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { InterviewConfigStep } from '../../components/interview/InterviewConfigStep';
import { DeviceCheckStep } from '../../components/interview/DeviceCheckStep';
import { AIInterviewScreen } from '../../components/interview/AIInterviewScreen';
import { InterviewFinishedStep } from '../../components/interview/InterviewFinishedStep';
import { useInterview } from '../../context/InterviewContext';

export const Interview = () => {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();
  const { activeConfig, updateConfig, saveCompletedInterview } = useInterview();

  const [finishedResult, setFinishedResult] = useState(null);

  const handleConfigNext = () => {
    setStep(2);
  };

  const handleDeviceCheckNext = () => {
    setStep(3);
  };

  const handleInterviewFinish = (sessionData) => {
    const reportId = saveCompletedInterview(sessionData);
    setFinishedResult({ ...sessionData, reportId });
    setStep(4);
  };

  const handleViewReport = () => {
    const targetId = finishedResult?.sessionId || finishedResult?.reportId;
    if (targetId) {
      navigate(`/results/${targetId}`);
    } else {
      navigate('/history');
    }
  };

  return (
    <div className={step === 3 ? 'w-full h-full' : 'p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto'}>
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
          <AIInterviewScreen
            key="step3"
            config={activeConfig}
            onFinish={handleInterviewFinish}
          />
        )}

        {step === 4 && (
          <InterviewFinishedStep
            key="step4"
            result={finishedResult}
            onViewReport={handleViewReport}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Interview;
