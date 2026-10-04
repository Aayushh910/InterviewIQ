import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

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

