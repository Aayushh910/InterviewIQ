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
