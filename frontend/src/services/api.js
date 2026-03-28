import axios from "axios";

// Use the Render backend URL in production (Vercel), and localhost in development
const baseURL = import.meta.env.MODE === "production"
  ? "https://infra-chat.onrender.com/api"
  : "http://localhost:5000/api";

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
