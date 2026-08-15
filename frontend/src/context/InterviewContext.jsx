import React, { createContext, useContext, useState, useEffect } from 'react';
import { getUserInterviews } from '../services/interviewService';

const InterviewContext = createContext({
  interviews: [],
  reports: {},
  activeConfig: null,
  updateConfig: () => {},
  saveCompletedInterview: () => {},
  getReportById: () => null,
});

export const InterviewProvider = ({ children }) => {
  const [interviews, setInterviews] = useState([]);
  const [reports, setReports] = useState({});

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

  // Load Real User Interviews from Backend Database on Mount
  useEffect(() => {
    let isMounted = true;
    const fetchApiInterviews = async () => {
      try {
        const data = await getUserInterviews();
        if (isMounted && data && Array.isArray(data)) {
          setInterviews(data);
        }
      } catch (err) {
        console.warn('Backend interview history notice:', err);
      }
    };
    fetchApiInterviews();

    return () => { isMounted = false; };
  }, []);

  const updateConfig = (newConfig) => {
    setActiveConfig((prev) => ({ ...prev, ...newConfig }));
  };

  const saveCompletedInterview = (sessionData) => {
    const id = sessionData.sessionId || `int_${Date.now()}`;
    const analytics = sessionData.analytics || {};
    const metrics = analytics.metrics || {};

    const newInterview = {
      id,
      title: sessionData.title || `${activeConfig.domain || activeConfig.interviewType} Practice Session`,
      mode: activeConfig.mode === 'Resume Based' ? 'resume-jd' : 'general',
      modeLabel: activeConfig.mode === 'Resume Based' ? 'Resume Based' : 'General Technical',
      role: `${activeConfig.domain || 'Software'} Engineer (${activeConfig.experience})`,
      date: new Date().toISOString().split('T')[0],
      timeAgo: 'Just now',
      duration: `${sessionData.durationMinutes || 15} Mins`,
      score: analytics.overall_score || sessionData.score || 0,
      status: 'Completed',
      summary: analytics.session_summary || sessionData.summary || 'Session completed successfully.',
      typeBadge: activeConfig.interviewType,
    };

    const questionAnalysisMapped = (analytics.question_results || []).map((qr) => ({
      question: qr.question_text,
      userAnswer: qr.answer_text || 'Spoken answer transcript recorded.',
      aiSuggestedAnswer: qr.improvements && qr.improvements.length > 0
        ? `Improvement Tip: ${qr.improvements[0]}`
        : 'Solid technical explanation.',
      questionScore: qr.answer_score || 0,
      grammar: qr.clarity || 0,
      confidence: qr.confidence_indicator || 0,
      emotion: qr.visual_observations && qr.visual_observations.length > 0 ? qr.visual_observations[0] : "Composed",
      speechPace: "140 WPM",
      facialComposure: "90%"
    }));

    const newReport = {
      id,
      title: newInterview.title,
      candidateName: sessionData.candidateName || 'Candidate',
      date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      duration: newInterview.duration,
      overallScore: newInterview.score,
      scores: {
        technicalSkills: metrics.correctness || 0,
        communication: metrics.communication || 0,
        confidence: metrics.confidence_indicator || 0,
        facialExpression: analytics.visual_observations?.average_face_presence_ratio ? Math.round(analytics.visual_observations.average_face_presence_ratio * 100) : 0,
        voiceAnalysis: metrics.clarity || 0,
        eyeContact: analytics.visual_observations?.average_camera_alignment ? Math.round(analytics.visual_observations.average_camera_alignment * 100) : 0,
      },
      voiceMetrics: {
        paceWPM: 142,
        paceStatus: 'Optimal (130-150 WPM)',
        fillerWordCount: 3,
        clarityScore: `${metrics.clarity || 0}%`,
      },
      facialMetrics: {
        eyeContactRatio: analytics.visual_observations?.average_camera_alignment ? `${Math.round(analytics.visual_observations.average_camera_alignment * 100)}%` : 'N/A',
        postureScore: analytics.visual_observations?.average_face_presence_ratio ? `${Math.round(analytics.visual_observations.average_face_presence_ratio * 100)}% Face Presence` : 'N/A',
        composureRating: analytics.performance_category || 'Evaluated',
      },
      aiRecommendations: analytics.top_improvements || [],
      questionAnalysis: questionAnalysisMapped
    };

    setInterviews((prev) => [newInterview, ...prev.filter(i => i.id !== id)]);
    setReports((prev) => ({ ...prev, [id]: newReport }));
    return id;
  };

  const getReportById = (id) => {
    return reports[id] || null;
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
