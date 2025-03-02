import axios from 'axios';

/**
 * Utility functions for API requests
 * Provides a standardized way to make API requests with consistent error handling and authentication
 */

// Types for validation and API operations
export type ValidationResult = { 
  isValid: boolean; 
  errors: string[] 
};

export type Validator<T> = (data: Partial<T>) => ValidationResult;

export interface EntityWithId {
  ID: number;
  [key: string]: any;
}

// Configuration for API requests
const API_BASE_URL = '/api'; // Use an absolute path to ensure it works correctly with the proxy

// Get authentication token from local storage
export const getToken = (): string => {
  return localStorage.getItem('snowpack_token') || '';
};

// Configure axios instance with defaults
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to add authentication token to all requests
api.interceptors.request.use(config => {
  // Log request details in development
  if (import.meta.env.DEV) {
    console.log(`Making ${config.method?.toUpperCase() || 'GET'} request to ${config.baseURL}/${config.url}`);
  }
  
  const token = getToken();
  if (token) {
    config.headers['x-access-token'] = token;
  }
  return config;
}, error => {
  if (import.meta.env.DEV) {
    console.error('Request error:', error);
  }
  return Promise.reject(error);
});

// Add response interceptor for better error handling
api.interceptors.response.use(
  response => {
    // Log successful responses in development
    if (import.meta.env.DEV) {
      console.log(`Response from ${response.config.url}: Status ${response.status}`);
    }
    return response;
  },
  error => {
    // Log errors in development
    if (import.meta.env.DEV) {
      console.error(`API Error for ${error.config?.url}:`, error.message);
      
      // Check if it's a non-JSON response
      if (error.response) {
        const contentType = error.response.headers?.['content-type'];
        console.error(`Status: ${error.response.status}, Content-Type: ${contentType}`);
        
        // For HTML responses (likely indicating a redirect or server error page)
        if (contentType && contentType.includes('text/html')) {
          console.error('Server returned HTML instead of JSON (possible authentication issue or server error)');
          
          // If in development mode, get the first part of the HTML response for debugging
          if (error.response.data && typeof error.response.data === 'string') {
            console.error('HTML response preview:', error.response.data.substring(0, 200));
          }
        } else if (error.response.data) {
          console.error('Response data:', error.response.data);
        }
      }
    }
    
    // Check for authentication errors (401, 403) and redirect to login if needed
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      console.error('Authentication error - redirecting to login');
      // Clear existing token if there's an auth error
      localStorage.removeItem('snowpack_token');
      
      // Only redirect if we're not already on the login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// Generic fetch all items of a resource
export async function fetchAll<T>(endpoint: string): Promise<T[]> {
  const response = await api.get(`${endpoint}`);
  return response.data;
}

// Generic fetch item by ID
export async function fetchById<T>(endpoint: string, id: number): Promise<T> {
  const response = await api.get(`${endpoint}/${id}`);
  return response.data;
}

// Generic create
export async function create<T>(endpoint: string, data: any): Promise<T> {
  const response = await api.post(`${endpoint}`, data);
  return response.data;
}

// Generic update
export async function update<T>(endpoint: string, id: number, data: any): Promise<T> {
  const response = await api.put(`${endpoint}/${id}`, data);
  return response.data;
}

// Generic delete
export async function remove(endpoint: string, id: number): Promise<void> {
  await api.delete(`${endpoint}/${id}`);
}

// Create with FormData
export async function createWithFormData<T>(endpoint: string, data: FormData | Record<string, any>): Promise<T> {
  let formData: FormData;
  
  // If data is already FormData, use it directly
  if (data instanceof FormData) {
    formData = data;
  } else {
    // Otherwise, create a new FormData object from the record
    formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value);
      }
    });
  }
  
  // Send the request with FormData
  const response = await api.post(`${endpoint}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  
  return response.data;
}

// Update with FormData
export async function updateWithFormData<T>(endpoint: string, id: number, data: FormData | Record<string, any>): Promise<T> {
  let formData: FormData;
  
  // If data is already FormData, use it directly
  if (data instanceof FormData) {
    formData = data;
  } else {
    // Otherwise, create a new FormData object from the record
    formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value);
      }
    });
  }
  
  // Send the request with FormData
  const response = await api.put(`${endpoint}/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  
  return response.data;
}

/**
 * Creates a FormData object from a regular object
 * @param data Object to convert to FormData
 * @returns FormData object with all properties
 */
function createFormDataFromObject(data: Record<string, any>): FormData {
  const formData = new FormData();
  
  Object.entries(data).forEach(([key, value]) => {
    if (value === null || value === undefined) {
      return;
    }
    
    // Handle different types of values
    if (typeof value === 'boolean') {
      formData.set(key, value ? 'true' : 'false');
    } else if (typeof value === 'number') {
      formData.set(key, value.toString());
    } else if (typeof value === 'string') {
      formData.set(key, value);
    } else if (value instanceof Date) {
      formData.set(key, value.toISOString());
    }
  });
  
  return formData;
}

/**
 * Creates a form data object from entity data with default transformations
 * @param data Entity data
 * @returns FormData object
 */
export function createDefaultFormData<T extends Record<string, any>>(data: T): FormData {
  return createFormDataFromObject(data);
}

/**
 * New enhanced API utilities with validation and error handling
 */

/**
 * Creates an entity with validation and form data conversion
 * @param endpoint API endpoint 
 * @param data Entity data
 * @param validator Validation function
 * @param formDataTransformer Optional function to transform entity to form data
 * @returns Created entity
 */
export async function createEntityWithValidation<T extends EntityWithId>(
  endpoint: string, 
  data: T, 
  validator: Validator<T>,
  formDataTransformer?: (data: T) => FormData
): Promise<T> {
  // Validate data
  const validation = validator(data);
  if (!validation.isValid) {
    throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
  }
  
  try {
    // Use form data transformer if provided, otherwise use default
    const formData = formDataTransformer ? 
      formDataTransformer(data) : 
      createDefaultFormData(data);
    
    const response = await api.post(`${endpoint}`, formData);
    return response.data;
  } catch (error) {
    console.error(`Failed to create ${endpoint}:`, error);
    throw error;
  }
}

/**
 * Updates an entity with validation and form data conversion
 * @param endpoint API endpoint
 * @param id Entity ID
 * @param data Entity data
 * @param validator Validation function
 * @param formDataTransformer Optional function to transform entity to form data
 * @returns Updated entity
 */
export async function updateEntityWithValidation<T extends EntityWithId>(
  endpoint: string, 
  id: number, 
  data: T, 
  validator: Validator<T>,
  formDataTransformer?: (data: T) => FormData
): Promise<T> {
  // Validate data
  const validation = validator(data);
  if (!validation.isValid) {
    throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
  }
  
  try {
    // Use form data transformer if provided, otherwise use default
    const formData = formDataTransformer ? 
      formDataTransformer(data) : 
      createDefaultFormData(data);
    
    const response = await api.put(`${endpoint}/${id}`, formData);
    return response.data;
  } catch (error) {
    console.error(`Failed to update ${endpoint}:`, error);
    throw error;
  }
}

/**
 * Deletes an entity with error handling
 * @param endpoint API endpoint
 * @param id Entity ID
 * @returns Deletion result
 */
export async function deleteEntityWithErrorHandling(endpoint: string, id: number): Promise<any> {
  try {
    return await remove(endpoint, id);
  } catch (error) {
    console.error(`Failed to delete ${endpoint}:`, error);
    throw error;
  }
}