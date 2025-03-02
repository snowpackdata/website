/**
 * Utility functions for API interactions
 * These functions handle common API operations using fetch
 */

const API_BASE_URL = 'http://localhost:8080/api';

/**
 * Fetch all items from a resource endpoint
 * @param {string} resource - The resource type (e.g., 'billing_codes', 'projects')
 * @param {object} params - Optional query parameters
 * @returns {Promise<Array>} - Promise resolving to array of items
 */
export const fetchAll = async (resource, params = {}) => {
  // Build query string from params
  const queryString = Object.keys(params).length
    ? '?' + new URLSearchParams(params).toString()
    : '';

  try {
    const response = await fetch(`${API_BASE_URL}/${resource}${queryString}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${resource}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching ${resource}:`, error);
    throw error;
  }
};

/**
 * Fetch a single item by ID
 * @param {string} resource - The resource type
 * @param {string|number} id - The item ID
 * @returns {Promise<Object>} - Promise resolving to the item
 */
export const fetchById = async (resource, id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/${resource}/${id}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${resource} with ID ${id}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching ${resource} ${id}:`, error);
    throw error;
  }
};

/**
 * Create a new item using FormData
 * @param {string} resource - The resource type
 * @param {FormData} formData - The form data for the new item
 * @returns {Promise<Object>} - Promise resolving to the created item
 */
export const createWithFormData = async (resource, formData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/${resource}/0`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create ${resource}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error creating ${resource}:`, error);
    throw error;
  }
};

/**
 * Update an existing item using FormData
 * @param {string} resource - The resource type
 * @param {string|number} id - The item ID
 * @param {FormData} formData - The form data with updated values
 * @returns {Promise<Object>} - Promise resolving to the updated item
 */
export const updateWithFormData = async (resource, id, formData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/${resource}/${id}`, {
      method: 'PUT',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update ${resource} with ID ${id}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error updating ${resource} ${id}:`, error);
    throw error;
  }
};

/**
 * Create a new item with JSON data
 * @param {string} resource - The resource type
 * @param {Object} data - The data for the new item
 * @returns {Promise<Object>} - Promise resolving to the created item
 */
export const create = async (resource, data) => {
  try {
    const response = await fetch(`${API_BASE_URL}/${resource}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create ${resource}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error creating ${resource}:`, error);
    throw error;
  }
};

/**
 * Update an existing item with JSON data
 * @param {string} resource - The resource type
 * @param {string|number} id - The item ID
 * @param {Object} data - The data with updated values
 * @returns {Promise<Object>} - Promise resolving to the updated item
 */
export const update = async (resource, id, data) => {
  try {
    const response = await fetch(`${API_BASE_URL}/${resource}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update ${resource} with ID ${id}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error updating ${resource} ${id}:`, error);
    throw error;
  }
};

/**
 * Delete an item
 * @param {string} resource - The resource type
 * @param {string|number} id - The item ID
 * @returns {Promise<void>}
 */
export const remove = async (resource, id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/${resource}/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete ${resource} with ID ${id}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error deleting ${resource} ${id}:`, error);
    throw error;
  }
};

/**
 * Change the state of an item
 * @param {string} resource - The resource type
 * @param {string|number} id - The item ID
 * @param {string} state - The new state
 * @returns {Promise<Object>} - Promise resolving to the updated item
 */
export const changeState = async (resource, id, state) => {
  try {
    const formData = new FormData();
    formData.append('state', state);
    
    const response = await fetch(`${API_BASE_URL}/${resource}/${id}/state`, {
      method: 'PUT',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error(`Failed to change state of ${resource} with ID ${id}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error changing state of ${resource} ${id}:`, error);
    throw error;
  }
}; 