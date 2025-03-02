import axios from 'axios';

/**
 * Utility functions for API requests
 * Provides a standardized way to make API requests with consistent error handling and authentication
 */

// Get authentication token from local storage
export const getToken = (): string => {
  return localStorage.getItem('snowpack_token') || '';
};

// Generic fetch all items of a resource
export async function fetchAll<T>(endpoint: string): Promise<T[]> {
  const token = getToken();
  const response = await axios.get(`/api/${endpoint}`, {
    headers: { 
      'Content-Type': 'application/json', 
      'x-access-token': token 
    }
  });
  return response.data;
}

// Generic fetch single item by ID
export async function fetchById<T>(endpoint: string, id: number): Promise<T> {
  const token = getToken();
  const response = await axios.get(`/api/${endpoint}/${id}`, {
    headers: { 
      'Content-Type': 'application/json', 
      'x-access-token': token 
    }
  });
  return response.data;
}

// Generic create item
export async function create<T>(endpoint: string, data: any): Promise<T> {
  const token = getToken();
  const response = await axios.post(`/api/${endpoint}`, data, {
    headers: { 
      'Content-Type': 'application/json', 
      'x-access-token': token 
    }
  });
  return response.data;
}

// Generic update item
export async function update<T>(endpoint: string, id: number, data: any): Promise<T> {
  const token = getToken();
  const response = await axios.put(`/api/${endpoint}/${id}`, data, {
    headers: { 
      'Content-Type': 'application/json', 
      'x-access-token': token 
    }
  });
  return response.data;
}

// Generic delete item
export async function remove(endpoint: string, id: number): Promise<any> {
  const token = getToken();
  const response = await axios.delete(`/api/${endpoint}/${id}`, {
    headers: { 
      'Content-Type': 'application/json', 
      'x-access-token': token 
    }
  });
  return response.data;
}

// Form data utility for when we need to send form data instead of JSON
export async function createWithFormData<T>(endpoint: string, data: any): Promise<T> {
  const token = getToken();
  const formData = new FormData();
  
  // Convert data object to FormData
  Object.keys(data).forEach(key => {
    // Convert non-string values to string
    const value = typeof data[key] === 'number' || typeof data[key] === 'boolean' 
      ? data[key].toString() 
      : data[key];
    formData.set(key, value);
  });

  const response = await axios.post(`/api/${endpoint}`, formData, {
    headers: { 
      'x-access-token': token 
    }
  });
  return response.data;
}

// Update with form data utility
export async function updateWithFormData<T>(endpoint: string, id: number, data: any): Promise<T> {
  const token = getToken();
  const formData = new FormData();
  
  // Convert data object to FormData
  Object.keys(data).forEach(key => {
    // Convert non-string values to string
    const value = typeof data[key] === 'number' || typeof data[key] === 'boolean' 
      ? data[key].toString() 
      : data[key];
    formData.set(key, value);
  });

  const response = await axios.put(`/api/${endpoint}/${id}`, formData, {
    headers: { 
      'x-access-token': token 
    }
  });
  return response.data;
} 