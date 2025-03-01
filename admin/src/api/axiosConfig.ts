import axios from 'axios';

/**
 * Configure Axios with default settings for the application
 */

// Set baseURL to the API server for development
axios.defaults.baseURL = 'http://localhost:8080';

// Add request interceptor to include the token with every request
axios.interceptors.request.use(config => {
  // Get token from local storage
  let token = localStorage.getItem('snowpack_token');

  // If no token exists in development, use a placeholder token
  if (!token && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    token = 'dev-placeholder-token';
    console.log('Using development placeholder token');
  }

  if (token) {
    config.headers['x-access-token'] = token;
  }
  
  return config;
}, error => {
  return Promise.reject(error);
});

// Add simple logging
axios.interceptors.response.use(response => {
  console.log(`Response from ${response.config.url}:`, response.status);
  return response;
}, error => {
  console.error('Response error:', error.message);
  if (error.response) {
    console.error('Status:', error.response.status);
  }
  return Promise.reject(error);
});

export default axios; 