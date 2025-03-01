import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '';

/**
 * Fetches all rates
 * @returns Promise with rates data
 */
export const fetchRates = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/rates`);
    return response.data;
  } catch (error) {
    console.error('Error fetching rates:', error);
    throw error;
  }
};

/**
 * Fetches a single rate by ID
 * @param id Rate ID
 * @returns Promise with rate data
 */
export const fetchRateById = async (id: number) => {
  try {
    const response = await axios.get(`${API_URL}/api/rates/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching rate ${id}:`, error);
    throw error;
  }
};

/**
 * Creates a new rate
 * @param rateData Rate data to create
 * @returns Promise with created rate data
 */
export const createRate = async (rateData: any) => {
  try {
    const response = await axios.post(`${API_URL}/api/rates`, rateData);
    return response.data;
  } catch (error) {
    console.error('Error creating rate:', error);
    throw error;
  }
};

/**
 * Updates an existing rate
 * @param id Rate ID
 * @param rateData Updated rate data
 * @returns Promise with updated rate data
 */
export const updateRate = async (id: number, rateData: any) => {
  try {
    const response = await axios.put(`${API_URL}/api/rates/${id}`, rateData);
    return response.data;
  } catch (error) {
    console.error(`Error updating rate ${id}:`, error);
    throw error;
  }
};

/**
 * Deletes a rate
 * @param id Rate ID to delete
 * @returns Promise with deletion status
 */
export const deleteRate = async (id: number) => {
  try {
    const response = await axios.delete(`${API_URL}/api/rates/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting rate ${id}:`, error);
    throw error;
  }
}; 