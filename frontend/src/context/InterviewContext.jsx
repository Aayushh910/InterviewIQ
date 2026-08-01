import React, { createContext, useContext, useState, useEffect } from 'react';
import { MOCK_INTERVIEWS, MOCK_REPORTS } from '../data/mockData';

const InterviewContext = createContext({
  interviews: [],
  reports: {},
  activeConfig: null,
  updateConfig: () => {},
  saveCompletedInterview: () => {},
  getReportById: () => null,
});

export const InterviewProvider = ({ children }) => {
  const [interviews, setInterviews] = useState(() => {
    try {
      const saved = localStorage.getItem('interviewiq_interviews');
      return saved ? JSON.parse(saved) : MOCK_INTERVIEWS;
    } catch {
      return MOCK_INTERVIEWS;
    }
  });

  const [reports, setReports] = useState(() => {
    try {
      const saved = localStorage.getItem('interviewiq_reports');
      return saved ? JSON.parse(saved) : MOCK_REPORTS;
    } catch {
      return MOCK_REPORTS;
    }
  });

  const [activeConfig, setActiveConfig] = useState({
    interviewType: 'Technical',
    domain: 'Frontend',
    questionsCount: 5,
    difficulty: 'Medium',
    experience: '2+',
    mode: 'General',
    resumeId: '',
    counterQuestions: true,
    language: 'English',
  });

  useEffect(() => {
    try {
      localStorage.setItem('interviewiq_interviews', JSON.stringify(interviews));
      localStorage.setItem('interviewiq_reports', JSON.stringify(reports));
    } catch (e) {
      console.error('Failed saving interviews to localStorage', e);
    }
  }, [interviews, reports]);

  const updateConfig = (newConfig) => {
    setActiveConfig((prev) => ({ ...prev, ...newConfig }));
  };

  const saveCompletedInterview = (sessionData) => {
    const id = `int_${Date.now()}`;
    const newInterview = {
      id,
      title: sessionData.title || `${activeConfig.domain || activeConfig.interviewType} Practice Loop`,
      mode: activeConfig.mode === 'Resume Based' ? 'resume-jd' : 'general',
      modeLabel: activeConfig.mode === 'Resume Based' ? 'Resume Based' : 'General Technical',
      role: `${activeConfig.domain || 'Software'} Engineer (${activeConfig.experience})`,
      date: new Date().toISOString().split('T')[0],
      timeAgo: 'Just now',
      duration: `${sessionData.durationMinutes || 15} Mins`,
      score: sessionData.score || 88,
      status: 'Completed',
      summary: sessionData.summary || 'Strong technical articulation with smooth vocal composure and high eye contact stability.',
      typeBadge: activeConfig.interviewType,
    };

    const newReport = {
      id,
      title: newInterview.title,
      candidateName: sessionData.candidateName || 'Alex Rivera',
      date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      duration: newInterview.duration,
      overallScore: newInterview.score,
      scores: sessionData.scores || {
        technicalSkills: 88,
        communication: 90,
        confidence: 86,
        facialExpression: 89,
        voiceAnalysis: 87,
        eyeContact: 92,
      },
      voiceMetrics: sessionData.voiceMetrics || {
        paceWPM: 142,
        paceStatus: 'Optimal (130-150 WPM)',
        fillerWordCount: 3,
        clarityScore: '92%',
      },
      facialMetrics: sessionData.facialMetrics || {
        eyeContactRatio: '92%',
        postureScore: '90% Upright',
        composureRating: 'High Confidence',
      },
      aiRecommendations: sessionData.aiRecommendations || [
        'Great technical accuracy! Strengthen your explanation of state normalization trade-offs.',
        'Maintain eye contact when pausing to construct complex algorithm logic.',
        'Use structured STAR framework when detailing personal project challenges.'
      ],
      questionAnalysis: sessionData.questionAnalysis || [
        {
          question: "Can you explain how React's Virtual DOM diffing algorithm works under the hood?",
          userAnswer: "React builds an in-memory virtual tree. When state changes, a new tree is created and diffed against the previous tree using a heuristic O(n) algorithm to compute minimal DOM updates.",
          aiSuggestedAnswer: "Excellent core concept! To make it top-tier, explicitly mention Fiber nodes, reconciliation phases (render vs commit), and key prop optimization for array diffing.",
          questionScore: 92,
          grammar: 94,
          confidence: 90,
          emotion: "Focused & Composed",
          speechPace: "138 WPM",
          facialComposure: "92%"
        },
        {
          question: "How do you handle memory leaks caused by uncleaned event listeners or subscriptions?",
          userAnswer: "In functional React components, I return cleanup functions from useEffect hooks to remove event listeners or unsubscribe from RxJS observables when components unmount.",
          aiSuggestedAnswer: "Spot on! Additionally mention AbortController for cancelling fetch requests on component unmount.",
          questionScore: 90,
          grammar: 92,
          confidence: 88,
          emotion: "Confident",
          speechPace: "144 WPM",
          facialComposure: "90%"
        }
      ]
    };

    setInterviews((prev) => [newInterview, ...prev]);
    setReports((prev) => ({ ...prev, [id]: newReport }));
    return id;
  };

  const getReportById = (id) => {
    return reports[id] || MOCK_REPORTS['int_101'] || null;
  };

  return (
    <InterviewContext.Provider
      value={{
        interviews,
        reports,
        activeConfig,
        updateConfig,
        saveCompletedInterview,
        getReportById,
      }}
    >
      {children}
    </InterviewContext.Provider>
  );
};

export const useInterview = () => useContext(InterviewContext);
