import React, { createContext, useContext, useState, useEffect } from 'react';
import { getUserInterviews, getSessionAnalytics } from '../services/interviewService';

const InterviewContext = createContext({
  interviews: [],
  reports: {},
  activeConfig: null,
  updateConfig: () => {},
  saveCompletedInterview: () => {},
  getReportById: () => null,
  fetchReportById: () => Promise.resolve(null),
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

  // Load Real User Interviews from Backend Database on Mount (only if authenticated)
  useEffect(() => {
    let isMounted = true;
    const token = localStorage.getItem('interviewiq_token');
    if (!token) return;

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
    const overallScore = Math.round(analytics.overall_score ?? sessionData.score ?? 0);

    const newInterview = {
      id,
      title: sessionData.title || `${activeConfig.domain || activeConfig.interviewType || 'Technical'} Practice Session`,
      mode: activeConfig.mode === 'Resume Based' ? 'resume-jd' : 'general',
      modeLabel: activeConfig.mode === 'Resume Based' ? 'Resume Based' : 'General Technical',
      role: `${activeConfig.domain || 'Software'} Engineer (${activeConfig.experience || '2+'})`,
      date: new Date().toISOString().split('T')[0],
      timeAgo: 'Just now',
      duration: `${sessionData.durationMinutes || 4} Mins`,
      score: overallScore,
      status: 'Completed',
      summary: analytics.session_summary || sessionData.summary || 'Session completed and evaluated.',
      typeBadge: activeConfig.interviewType || 'Technical',
    };

    const questionAnalysisMapped = (analytics.question_results || []).map((qr) => ({
      question: qr.question_text,
      userAnswer: qr.answer_text || 'Spoken answer transcript recorded.',
      aiSuggestedAnswer: qr.recommended_response || qr.summary || (qr.improvements && qr.improvements.length > 0
        ? `Key Recommendation: ${qr.improvements.join(' ')}`
        : 'Comprehensive technical exemplar response.'),
      questionScore: qr.answer_score !== null && qr.answer_score !== undefined ? Math.round(qr.answer_score) : 0,
      correctness: qr.correctness !== null && qr.correctness !== undefined ? Math.round(qr.correctness) : 0,
      relevance: qr.relevance !== null && qr.relevance !== undefined ? Math.round(qr.relevance) : 0,
      technicalAccuracy: qr.technical_accuracy !== null && qr.technical_accuracy !== undefined ? Math.round(qr.technical_accuracy) : 0,
      completeness: qr.completeness !== null && qr.completeness !== undefined ? Math.round(qr.completeness) : 0,
      communication: qr.communication !== null && qr.communication !== undefined ? Math.round(qr.communication) : 0,
      grammar: qr.grammar !== null && qr.grammar !== undefined ? Math.round(qr.grammar) : (qr.clarity !== null && qr.clarity !== undefined ? Math.round(qr.clarity) : 0),
      timing: qr.timing !== null && qr.timing !== undefined ? Math.round(qr.timing) : null,
      durationSeconds: qr.duration_seconds,
      wpm: qr.wpm,
      confidence: qr.confidence_indicator !== null && qr.confidence_indicator !== undefined ? Math.round(qr.confidence_indicator * (qr.confidence_indicator <= 1.0 ? 100 : 1)) : 0,
      emotion: qr.visual_observations && qr.visual_observations.length > 0 ? qr.visual_observations[0] : "Composed",
      speechPace: qr.wpm ? `${qr.wpm} WPM (${Math.round(qr.duration_seconds || 0)}s)` : (qr.duration_seconds ? `${Math.round(qr.duration_seconds)}s` : "Timing unavailable"),
      facialComposure: analytics.visual_observations?.average_face_presence_ratio ? `${Math.round(analytics.visual_observations.average_face_presence_ratio * 100)}%` : "95%"
    }));

    const firstValidWpm = (analytics.question_results || []).find(q => q.wpm)?.wpm || null;

    const newReport = {
      id,
      title: newInterview.title,
      candidateName: sessionData.candidateName || 'Candidate',
      date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      duration: newInterview.duration,
      overallScore: overallScore,
      performanceCategory: analytics.performance_category || 'Evaluated',
      scores: {
        correctness: metrics.correctness !== undefined ? Math.round(metrics.correctness) : 0,
        relevance: metrics.relevance !== undefined ? Math.round(metrics.relevance) : 0,
        technicalAccuracy: metrics.technical_accuracy !== undefined ? Math.round(metrics.technical_accuracy) : (metrics.correctness !== undefined ? Math.round(metrics.correctness) : 0),
        completeness: metrics.completeness !== undefined ? Math.round(metrics.completeness) : 0,
        communication: metrics.communication !== undefined ? Math.round(metrics.communication) : 0,
        grammar: metrics.grammar !== undefined ? Math.round(metrics.grammar) : (metrics.clarity !== undefined ? Math.round(metrics.clarity) : 0),
        timing: metrics.timing !== undefined ? Math.round(metrics.timing) : 0,
      },
      voiceMetrics: {
        paceWPM: firstValidWpm || 140,
        paceStatus: firstValidWpm ? `${firstValidWpm} WPM (Recorded Pace)` : 'Timing unavailable',
        fillerWordCount: 0,
        clarityScore: `${metrics.clarity !== undefined ? Math.round(metrics.clarity) : overallScore}%`,
      },
      facialMetrics: {
        eyeContactRatio: analytics.visual_observations?.average_camera_alignment ? `${Math.round(analytics.visual_observations.average_camera_alignment * 100)}%` : 'Active',
        postureScore: analytics.visual_observations?.average_face_presence_ratio ? `${Math.round(analytics.visual_observations.average_face_presence_ratio * 100)}% Face Presence` : 'Composed',
        composureRating: analytics.performance_category || 'Evaluated',
      },
      topStrengths: analytics.top_strengths && analytics.top_strengths.length > 0 ? analytics.top_strengths : ['Demonstrated structured communication', 'Provided concise answers'],
      aiRecommendations: analytics.top_improvements && analytics.top_improvements.length > 0 ? analytics.top_improvements : ['Provide deeper domain-specific implementation examples', 'Elaborate on edge cases and trade-offs'],
      questionAnalysis: questionAnalysisMapped
    };

    setInterviews((prev) => [newInterview, ...prev.filter(i => i.id !== id)]);
    setReports((prev) => ({ ...prev, [id]: newReport }));
    return id;
  };

  const getReportById = (id) => {
    return reports[id] || null;
  };

  const fetchReportById = async (id) => {
    if (reports[id]) return reports[id];
    try {
      const analytics = await getSessionAnalytics(id);
      if (analytics) {
        saveCompletedInterview({
          sessionId: id,
          analytics,
          durationMinutes: 4,
          score: analytics.overall_score || 0
        });
        return reports[id] || null;
      }
    } catch (err) {
      console.warn('Could not fetch backend session analytics on refresh:', err);
    }
    return null;
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
        fetchReportById,
      }}
    >
      {children}
    </InterviewContext.Provider>
  );
};

export const useInterview = () => useContext(InterviewContext);
