import axios from 'axios';

/**
 * Configure Axios with default settings for the application
 */

// During development, the API is proxied via Vite's server.proxy
// In production, the API is served from the same domain
// So we use relative URLs instead of a fixed base URL
axios.defaults.baseURL = '';

// Add request interceptor to include the token with every request
axios.interceptors.request.use(config => {
  // Get token from local storage
  let token = localStorage.getItem('snowpack_token');

  // If no token exists in development, use a placeholder token
  if (!token && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    console.log('No token found in local storage for development environment');
  }

  if (token) {
    config.headers['x-access-token'] = token;
    // Log that we're using a token, but only show a prefix for security
    const tokenPrefix = token.substring(0, 10);
    console.log(`Using token (first 10 chars): ${tokenPrefix}...`);
    
    // Log detailed token structure without showing the actual data
    try {
      const tokenParts = token.split('.');
      if (tokenParts.length === 3) {
        console.log(`Token structure: Header.Payload.Signature (${tokenParts[0].length}.${tokenParts[1].length}.${tokenParts[2].length} chars)`);
      } else {
        console.log(`WARNING: Token doesn't have expected JWT structure (3 parts): has ${tokenParts.length} parts`);
      }
    } catch (e) {
      console.log('Error analyzing token structure:', e);
    }
    
    // Log the URL being requested with this token
    console.log(`Making authenticated request to: ${config.url}`);
  }
  
  return config;
}, error => {
  return Promise.reject(error);
});

// Add response interceptor for better error handling
axios.interceptors.response.use(response => {
  console.log(`Response from ${response.config.url}:`, response.status);
  
  // Check if the response is JSON when expected
  const contentType = response.headers['content-type'];
  if (contentType && contentType.includes('application/json')) {
    return response;
  } else if (response.config.url && !response.config.url.includes('html') && !response.config.url.includes('css')) {
    // Only warn for endpoints that should return JSON
    console.warn(`Response from ${response.config.url} is not JSON (${contentType})`);
    // Still return the response so the app can handle it
    return response;
  }
  
  return response;
}, error => {
  console.error('Response error:', error.message);
  if (error.response) {
    console.error('Status:', error.response.status);
    console.error('URL:', error.config?.url);
    console.error('Response data:', error.response.data);
    console.error('Content-Type:', error.response.headers['content-type']);
  } else if (error.request) {
    // Request was made but no response received
    console.error('No response received:', error.request);
  } else {
    // Something else caused the error
    console.error('Error setting up request:', error.message);
  }
  return Promise.reject(error);
});

export default axios; 