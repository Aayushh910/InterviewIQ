import axios from 'axios';

const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (!envUrl) {
    return 'http://localhost:8000/api/v1';
  }
  let clean = envUrl.trim().replace(/\/+$/, '');
  if (!clean.endsWith('/api/v1')) {
    if (clean.endsWith('/api')) {
      clean += '/v1';
    } else {
      clean += '/api/v1';
    }
  }
  return clean;
};

const API_BASE_URL = getApiBaseUrl();

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Bearer Token (except for unauthenticated login/signup endpoints)
apiClient.interceptors.request.use((config) => {
  const isAuthEndpoint = config.url && (
    config.url.includes('/auth/login') ||
    config.url.includes('/auth/signup') ||
    config.url.includes('/auth/register')
  );

  if (!isAuthEndpoint) {
    const token = localStorage.getItem('interviewiq_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  // Attach Groq API Key if configured by candidate
  const groqKey = localStorage.getItem('interviewiq_groq_api_key') || localStorage.getItem('interviewiq_ai_api_key');
  if (groqKey) {
    config.headers['x-groq-api-key'] = groqKey;
    config.headers['x-ai-api-key'] = groqKey;
    config.headers['x-ai-provider'] = 'groq';
  }

  const customAiModel = localStorage.getItem('interviewiq_ai_model');
  if (customAiModel) {
    config.headers['x-ai-model'] = customAiModel;
  }

  return config;
}, (error) => {
  return Promise.reject(error);
});


// Response Interceptor: Handle 401 Unauthorized
apiClient.interceptors.response.use((response) => {
  return response;
}, (error) => {
  if (error.response && error.response.status === 401) {
    // Clear local storage if token expired or user no longer exists
    localStorage.removeItem('interviewiq_token');
    localStorage.removeItem('interviewiq_user');
    window.dispatchEvent(new CustomEvent('auth:unauthorized'));
  }
  return Promise.reject(error);
});

