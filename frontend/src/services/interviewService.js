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

export const submitAnswer = async (sessionId, answerData) => {
  const response = await apiClient.post(`/sessions/${sessionId}/answers`, {
    question_id: answerData.question_id,
    answer_text: answerData.answer_text || '',
    started_at: answerData.started_at || new Date().toISOString(),
    submitted_at: answerData.submitted_at || new Date().toISOString(),
  });
  return response.data;
};

export const getSessionAnswers = async (sessionId) => {
  const response = await apiClient.get(`/sessions/${sessionId}/answers`);
  return response.data;
};
