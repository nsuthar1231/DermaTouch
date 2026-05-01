import axios from 'axios';

// Change this URL to your production backend URL (e.g., from Render)
// Example: https://derma-touch-api.onrender.com/api
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://derma-touch-api.onrender.com/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

export default api;
