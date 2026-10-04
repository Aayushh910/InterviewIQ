import { apiClient } from './apiClient';

export const createInterview = async (data) => {
  const response = await apiClient.post('/interviews', {
    title: data.title || `${data.domain || data.interviewType || 'General'} Mock Interview`,
    job_role: `${data.domain || 'Software'} Engineer`,
    interview_type: data.interviewType || 'Technical',
    mode: data.mode === 'Resume Based' ? 'Resume Based' : 'General',
    domain: data.domain || 'Frontend',
    difficulty: data.difficulty || 'Medium',
    experience_level: data.experience || '2+',
    question_count: data.questionsCount || 5,
    counter_questions: data.counterQuestions !== undefined ? data.counterQuestions : true,
    status: 'ready',
  });
  return response.data;
};

export const getUserInterviews = async () => {
  const response = await apiClient.get('/interviews');
  return response.data;
};

export const getInterviewById = async (interviewId) => {
  const response = await apiClient.get(`/interviews/${interviewId}`);
  return response.data;
};

export const createSession = async (interviewId) => {
  const response = await apiClient.post(`/interviews/${interviewId}/sessions`);
  return response.data;
};

export const startSession = async (sessionId) => {
  const response = await apiClient.post(`/sessions/${sessionId}/start`);
  return response.data;
};

export const completeSession = async (sessionId) => {
  const response = await apiClient.post(`/sessions/${sessionId}/complete`);
  return response.data;
};

export const getInterviewQuestions = async (interviewId) => {
  const response = await apiClient.get(`/interviews/${interviewId}/questions`);
  return response.data;
};

export const addInterviewQuestion = async (interviewId, questionData) => {
  const response = await apiClient.post(`/interviews/${interviewId}/questions`, {
    question_text: questionData.question_text || questionData.text,
    question_order: questionData.question_order || 1,
    question_type: questionData.question_type || 'technical',
  });
  return response.data;
};

export const generateAIQuestions = async (interviewId, numberOfQuestions = 5) => {
  const response = await apiClient.post('/ai/questions/generate', {
    interview_id: interviewId,
    number_of_questions: numberOfQuestions,
  });
  return response.data;
};

export const requestFollowUp = async (interviewId, questionId, answerId) => {
  const response = await apiClient.post('/ai/follow-up/generate', {
    interview_id: interviewId,
    question_id: questionId,
    answer_id: answerId,
  });
  return response.data;
};

export const transcribeInterviewAudio = async (audioBlob, interviewId = null, questionId = null) => {
  const formData = new FormData();
  const ext = audioBlob?.type?.includes('mp4') ? 'mp4' : audioBlob?.type?.includes('wav') ? 'wav' : 'webm';
  formData.append('file', audioBlob, `speech_recording.${ext}`);
  if (interviewId) formData.append('interview_id', interviewId);
  if (questionId) formData.append('question_id', questionId);

  const response = await apiClient.post('/ai/speech/transcribe', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const synthesizeQuestionAudio = async (text, voice = 'default', language = 'en') => {
  const response = await apiClient.post(
    '/ai/speech/synthesize',
    { text, voice, language },
    { responseType: 'blob' }
  );
  return URL.createObjectURL(response.data);
};





export const submitAnswer = async (sessionId, answerData) => {
  const response = await apiClient.post(`/sessions/${sessionId}/answers`, {
    question_id: answerData.question_id,
    answer_text: answerData.answer_text || '',
    started_at: answerData.started_at || new Date().toISOString(),
    submitted_at: answerData.submitted_at || new Date().toISOString(),
  });
  return response.data;
};

export const submitAudioAnswer = async (sessionId, questionId, audioBlob, startedAt = null, submittedAt = null) => {
  const formData = new FormData();
  formData.append('question_id', questionId);
  if (startedAt) formData.append('started_at', startedAt);
  if (submittedAt) formData.append('submitted_at', submittedAt);
  const ext = audioBlob?.type?.includes('mp4') ? 'mp4' : audioBlob?.type?.includes('wav') ? 'wav' : 'webm';
  formData.append('file', audioBlob, `candidate_answer.${ext}`);

  const response = await apiClient.post(`/sessions/${sessionId}/answers/audio`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const submitAnswerFacialFrame = async (sessionId, answerId, imageBlob) => {
  const formData = new FormData();
  formData.append('file', imageBlob, 'frame.jpg');

  const response = await apiClient.post(`/sessions/${sessionId}/answers/${answerId}/facial`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const submitAnswerFacialVideo = async (sessionId, answerId, videoBlob) => {
  const formData = new FormData();
  const ext = videoBlob?.type?.includes('webm') ? 'webm' : 'mp4';
  formData.append('file', videoBlob, `interview_video.${ext}`);

  const response = await apiClient.post(`/sessions/${sessionId}/answers/${answerId}/facial/video`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const getAnswerMultimodalAnalysis = async (sessionId, answerId) => {
  const response = await apiClient.get(`/sessions/${sessionId}/answers/${answerId}/multimodal`);
  return response.data;
};

export const getSessionMultimodalAnalysis = async (sessionId) => {
  const response = await apiClient.get(`/sessions/${sessionId}/multimodal`);
  return response.data;
};

export const getSessionAnalytics = async (sessionId) => {
  const response = await apiClient.get(`/sessions/${sessionId}/analytics`);
  return response.data;
};

export const getSessionAnswers = async (sessionId) => {
  const response = await apiClient.get(`/sessions/${sessionId}/answers`);
  return response.data;
};

// ─── Phase 8: Interview State Manager Client APIs ──────────────────────────

export const createSessionState = async (interviewId) => {
  const response = await apiClient.post(`/sessions/state/${interviewId}`);
  return response.data;
};

export const getSessionState = async (sessionId) => {
  const response = await apiClient.get(`/sessions/${sessionId}/state`);
  return response.data;
};

export const initializeSessionState = async (sessionId, initData = {}) => {
  const response = await apiClient.post(`/sessions/${sessionId}/state/initialize`, initData);
  return response.data;
};

export const updateSessionState = async (sessionId, updateData) => {
  const response = await apiClient.patch(`/sessions/${sessionId}/state`, updateData);
  return response.data;
};

export const addSessionQuestion = async (sessionId, questionData) => {
  const response = await apiClient.post(`/sessions/${sessionId}/state/questions`, {
    question_text: questionData.question_text || questionData.text,
    question_order: questionData.question_order,
    question_type: questionData.question_type || 'technical',
    topic: questionData.topic,
    difficulty: questionData.difficulty,
  });
  return response.data;
};

export const submitAnswerToState = async (sessionId, answerData) => {
  const response = await apiClient.post(`/sessions/${sessionId}/state/answers`, {
    question_id: answerData.question_id,
    answer_text: answerData.answer_text || '',
    started_at: answerData.started_at,
    submitted_at: answerData.submitted_at,
  });
  return response.data;
};

export const addFollowUpToState = async (sessionId, followUpData) => {
  const response = await apiClient.post(`/sessions/${sessionId}/state/follow-ups`, {
    parent_question_id: followUpData.parent_question_id,
    answer_id: followUpData.answer_id,
    question_text: followUpData.question_text || followUpData.text,
    follow_up_depth: followUpData.follow_up_depth || 1,
    question_order: followUpData.question_order,
  });
  return response.data;
};

export const addEvaluationReferenceToState = async (sessionId, evalData) => {
  const response = await apiClient.post(`/sessions/${sessionId}/state/evaluations`, evalData);
  return response.data;
};

export const endSessionState = async (sessionId, reason = 'completed') => {
  const response = await apiClient.post(`/sessions/${sessionId}/state/end?reason=${reason}`);
  return response.data;
};

// ─── Phase 9: Tool Registry Client APIs ────────────────────────────────────

export const getAvailableTools = async (includeFuture = false) => {
  const response = await apiClient.get(`/tools?include_future=${includeFuture}`);
  return response.data;
};

export const getToolDefinition = async (toolName) => {
  const response = await apiClient.get(`/tools/${toolName}`);
  return response.data;
};

export const executeTool = async (toolName, payload = {}) => {
  const response = await apiClient.post(`/tools/${toolName}/execute`, payload);
  return response.data;
};

// ─── Phase 10: Groq Interview Agent Client APIs ───────────────────────────

export const orchestrateAgentTurn = async (turnData, providerOverride = null, mockMode = null) => {
  let url = '/agent/orchestrate';
  const params = [];
  if (providerOverride) params.push(`provider_override=${encodeURIComponent(providerOverride)}`);
  if (mockMode) params.push(`mock_mode=${encodeURIComponent(mockMode)}`);
  if (params.length > 0) url += `?${params.join('&')}`;

  const response = await apiClient.post(url, {
    session_id: turnData.session_id,
    user_message: turnData.user_message || null,
    candidate_answer: turnData.candidate_answer || null,
    question_id: turnData.question_id || null,
    duration_seconds: turnData.duration_seconds || null,
    max_iterations: turnData.max_iterations || 4,
  });
  return response.data;
};

export const getAgentCapabilities = async () => {
  const response = await apiClient.get('/agent/capabilities');
  return response.data;
};

// ─── Phase 11: Multimodal Evidence APIs ────────────────────────────────────

export const getSessionMultimodalEvidence = async (sessionId, evidenceType = null) => {
  const url = evidenceType 
    ? `/sessions/${sessionId}/multimodal/evidence?evidence_type=${encodeURIComponent(evidenceType)}`
    : `/sessions/${sessionId}/multimodal/evidence`;
  const response = await apiClient.get(url);
  return response.data;
};

// ─── Phase 12: Final Evaluation APIs ──────────────────────────────────────

export const calculateFinalEvaluation = async (sessionId, forceRecalculate = false) => {
  const response = await apiClient.post(`/evaluation/sessions/${sessionId}/final`, {
    force_recalculate: forceRecalculate,
  });
  return response.data;
};

export const getSessionFinalEvaluation = async (sessionId) => {
  const response = await apiClient.get(`/evaluation/sessions/${sessionId}/final`);
  return response.data;
};

// ─── Phase 13: Results Dashboard & Interview Reports APIs ──────────────────

export const getInterviewResults = async (sessionId) => {
  const response = await apiClient.get(`/results/sessions/${sessionId}`);
  return response.data;
};

export const downloadInterviewReportPdf = async (sessionId, filename = null) => {
  const response = await apiClient.get(`/reports/sessions/${sessionId}/pdf`, {
    responseType: 'blob',
  });
  const blob = new Blob([response.data], { type: 'application/pdf' });
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = filename || `InterviewIQ_Report_${sessionId.slice(0, 8)}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(downloadUrl);
  return true;
};





