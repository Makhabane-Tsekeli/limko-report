// src/config.js
const config = {
  development: {
    API_BASE_URL: 'http://localhost:5000'
  },
  production: {
    API_BASE_URL: 'https://limko-report-1.onrender.com'
  }
};

// Use Vite environment variable or fallback
export const API_BASE_URL = 
  import.meta.env.VITE_API_BASE_URL || 
  (import.meta.env.MODE === 'production' 
    ? config.production.API_BASE_URL 
    : config.development.API_BASE_URL);