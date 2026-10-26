import axios from "axios";

// Determine base backend URL: environment variable > production fallback > local dev fallback
const rawUrl =
  import.meta.env.VITE_BACKEND_URL ||
  import.meta.env.VITE_API_URL ||
  (import.meta.env.MODE === "production"
    ? "https://infra-chat.onrender.com"
    : "http://localhost:5000");

// Normalize: remove trailing slash and trailing /api if provided
export const BACKEND_URL = rawUrl.replace(/\/+$/, "").replace(/\/api$/, "");
export const API_BASE = BACKEND_URL;

const baseURL = `${BACKEND_URL}/api`;

const api = axios.create({
  baseURL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
