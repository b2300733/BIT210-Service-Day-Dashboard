const isLocalRuntime =
  typeof window === 'undefined' || window.location.hostname === 'localhost';

export const API_BASE_URL = isLocalRuntime ? 'http://localhost:3000/api' : '/api';
