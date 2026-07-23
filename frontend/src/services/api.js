import axios from "axios";
import { getToken } from "../utils/storage";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000/api",
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const message = err.response?.data?.detail || err.message || "Something went wrong";
    return Promise.reject(new Error(message));
  }
);

export default api;
