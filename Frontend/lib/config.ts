export const getApiUrl = (): string => {
  // If explicitly configured to a non-localhost URL, use it
  if (process.env.NEXT_PUBLIC_API_URL && !process.env.NEXT_PUBLIC_API_URL.includes('localhost')) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, '');
  }

  // If running in browser on Render, automatically route to the production Render backend
  if (typeof window !== 'undefined' && window.location.hostname.includes('onrender.com')) {
    return 'https://fitquest-backend-zwvc.onrender.com';
  }

  // Default to local development server
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
};
