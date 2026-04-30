import axios from "axios";

// Determine base URL for API
const baseURL = import.meta.env.VITE_API_URL || "/api";

const api = axios.create({
  baseURL,
  withCredentials: true, // send cookies if needed
});

export default api;
