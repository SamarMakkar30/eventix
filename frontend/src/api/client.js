import axios from "axios";

// In docker-compose / k8s this points at the api-gateway service.
// Override with REACT_APP_API_BASE_URL at build time for other environments.
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || "http://localhost:8080/api",
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("eventix_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;
