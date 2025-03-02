import axios from 'axios';
import type { InternalAxiosRequestConfig, AxiosResponse } from 'axios';

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

// Simple development mode detection
const isDevelopmentMode = 
  window.location.hostname === 'localhost' || 
  window.location.hostname === '127.0.0.1';

/**
 * Normalize API URLs to ensure they always include the /api prefix
 * @param endpoint The API endpoint to normalize
 * @returns Normalized endpoint URL with /api prefix
 */
function normalizeApiUrl(endpoint: string): string {
  // Remove any leading slash
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
  return `/api/${cleanEndpoint}`;
}

// Get authentication token from local storage
export const getToken = (): string => {
  return localStorage.getItem('snowpack_token') || '';
};

// Configure axios instance with defaults - explicitly DON'T use baseURL
// We'll manually construct URLs for each request to avoid inconsistencies
const api = axios.create({
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to add authentication token to all requests
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  // Ensure URL starts with /api regardless of how it was configured
  if (config.url && !config.url.startsWith('/api')) {
    const cleanUrl = config.url.startsWith('/') ? config.url.substring(1) : config.url;
    config.url = `/api/${cleanUrl}`;
  }

  // Log request details in development
  if (isDevelopmentMode) {
    console.log(`Request: ${config.method?.toUpperCase() || 'GET'} ${config.url}`);
  }
  
  const token = getToken();
  if (token && config.headers) {
    config.headers['x-access-token'] = token;
  }
  return config;
}, error => {
  if (isDevelopmentMode) {
    console.error('Request error:', error);
  }
  return Promise.reject(error);
});

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log successful responses in development
    if (isDevelopmentMode) {
      console.log(`Response from ${response.config.url}: Status ${response.status}`);
    }
    return response;
  },
  error => {
    // Log errors in development
    if (isDevelopmentMode) {
      console.error(`Error for ${error.config?.url}:`, error.message);
      
      if (error.response?.data) {
        console.error('Response data:', error.response.data);
      }
    }
    
    // Check for authentication errors (401, 403) and redirect to login if needed
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      console.error('Authentication error - redirecting to login');
      localStorage.removeItem('snowpack_token');
      
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// Generic fetch all items of a resource
export async function fetchAll<T>(endpoint: string): Promise<T[]> {
  const normalizedUrl = normalizeApiUrl(endpoint);
  const response = await api.get<T[]>(normalizedUrl);
  return response.data;
}

// Generic fetch item by ID
export async function fetchById<T>(endpoint: string, id: number): Promise<T> {
  const normalizedUrl = normalizeApiUrl(`${endpoint}/${id}`);
  const response = await api.get<T>(normalizedUrl);
  return response.data;
}

// Generic create
export async function create<T>(endpoint: string, data: any): Promise<T> {
  const normalizedUrl = normalizeApiUrl(`${endpoint}/0`);
  const response = await api.post<T>(normalizedUrl, data);
  return response.data;
}

// Generic update
export async function update<T>(endpoint: string, id: number, data: any): Promise<T> {
  const normalizedUrl = normalizeApiUrl(`${endpoint}/${id}`);
  const response = await api.put<T>(normalizedUrl, data);
  return response.data;
}

// Generic delete
export async function remove(endpoint: string, id: number): Promise<void> {
  const normalizedUrl = normalizeApiUrl(`${endpoint}/${id}`);
  await api.delete(normalizedUrl);
}

// Helper type for form data values
type FormDataValue = string | Blob | File;

// Create with FormData
export async function createWithFormData<T>(endpoint: string, data: FormData | Record<string, any>): Promise<T> {
  const normalizedUrl = normalizeApiUrl(`${endpoint}/0`);
  let formData: FormData;
  
  // If data is already FormData, use it directly
  if (data instanceof FormData) {
    formData = data;
  } else {
    // Otherwise, create a new FormData object from the record
    formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        // Convert value to string if it's not a valid FormData value type
        if (typeof value === 'object' && !(value instanceof Blob) && !(value instanceof File)) {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value as FormDataValue);
        }
      }
    });
  }

  // When using FormData, let the browser set the Content-Type to include the boundary
  const response = await api.post<T>(normalizedUrl, formData, {
    headers: {
      'Content-Type': undefined // Let browser set this with the proper boundary
    }
  });
  
  return response.data;
}

// Update with FormData
export async function updateWithFormData<T>(endpoint: string, id: number, data: FormData | Record<string, any>): Promise<T> {
  const normalizedUrl = normalizeApiUrl(`${endpoint}/${id}`);
  let formData: FormData;
  
  // If data is already FormData, use it directly
  if (data instanceof FormData) {
    formData = data;
  } else {
    // Otherwise, create a new FormData object from the record
    formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        // Convert value to string if it's not a valid FormData value type
        if (typeof value === 'object' && !(value instanceof Blob) && !(value instanceof File)) {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value as FormDataValue);
        }
      }
    });
  }
  
  // When using FormData, let the browser set the Content-Type to include the boundary
  const response = await api.put<T>(normalizedUrl, formData, {
    headers: {
      'Content-Type': undefined // Let browser set this with the proper boundary
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
    } else if (typeof value === 'object') {
      // For other objects, convert to JSON string
      formData.set(key, JSON.stringify(value));
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
  
  // Use form data transformer if provided, otherwise use default
  const formData = formDataTransformer ? 
    formDataTransformer(data) : 
    createDefaultFormData(data);
  
  return create<T>(endpoint, formData);
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
  
  // Use form data transformer if provided, otherwise use default
  const formData = formDataTransformer ? 
    formDataTransformer(data) : 
    createDefaultFormData(data);
  
  return update<T>(endpoint, id, formData);
}

/**
 * Deletes an entity with error handling
 * @param endpoint API endpoint
 * @param id Entity ID
 * @returns Deletion result
 */
export async function deleteEntityWithErrorHandling(endpoint: string, id: number): Promise<any> {
  return remove(endpoint, id);
}