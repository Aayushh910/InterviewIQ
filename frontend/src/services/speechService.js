import { apiClient } from './apiClient';

export const transcribeAudio = async (audioBlob) => {
  if (!audioBlob || audioBlob.size === 0) {
    return { text: '', language: 'en', duration_seconds: 0.0 };
  }

  const formData = new FormData();
  const ext = audioBlob.type.includes('mp4') ? 'mp4' : audioBlob.type.includes('wav') ? 'wav' : 'webm';
  formData.append('file', audioBlob, `candidate_answer.${ext}`);

  const response = await apiClient.post('/analysis/speech/transcribe', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};
