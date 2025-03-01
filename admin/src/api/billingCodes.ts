import axios from 'axios';
import type { BillingCode } from '../types/BillingCode';

const API_URL = import.meta.env.VITE_API_URL || '';

/**
 * API service for billing code-related operations
 */
export default {
  /**
   * Get all billing codes
   * @returns Promise with array of billing codes
   */
  async getBillingCodes(): Promise<BillingCode[]> {
    const token = localStorage.getItem('snowpack_token');
    const response = await axios.get('/api/billing_codes', {
      headers: { 
        'Content-Type': 'application/json', 
        'x-access-token': token 
      }
    });
    return response.data;
  },

  /**
   * Get a single billing code by ID
   * @param id - Billing code ID
   * @returns Promise with billing code data
   */
  async getBillingCode(id: number): Promise<BillingCode> {
    const token = localStorage.getItem('snowpack_token');
    const response = await axios.get(`/api/billing_codes/${id}`, {
      headers: { 
        'Content-Type': 'application/json', 
        'x-access-token': token 
      }
    });
    return response.data;
  },

  /**
   * Create a new billing code
   * @param billingCode - Billing code data
   * @returns Promise with created billing code
   */
  async createBillingCode(billingCode: BillingCode): Promise<BillingCode> {
    const token = localStorage.getItem('snowpack_token');
    const response = await axios.post('/api/billing_codes', billingCode, {
      headers: { 
        'Content-Type': 'application/json', 
        'x-access-token': token 
      }
    });
    return response.data.billing_code;
  },

  /**
   * Update an existing billing code
   * @param billingCode - Billing code data with ID
   * @returns Promise with updated billing code
   */
  async updateBillingCode(billingCode: BillingCode): Promise<BillingCode> {
    const token = localStorage.getItem('snowpack_token');
    const response = await axios.put(`/api/billing-codes/${billingCode.ID}`, billingCode, {
      headers: { 
        'Content-Type': 'application/json', 
        'x-access-token': token 
      }
    });
    return response.data.billing_code;
  },

  /**
   * Delete a billing code
   * @param id - Billing code ID
   * @returns Promise with response data
   */
  async deleteBillingCode(id: number): Promise<any> {
    const token = localStorage.getItem('snowpack_token');
    const response = await axios.delete(`/api/billing-codes/${id}`, {
      headers: { 
        'Content-Type': 'application/json', 
        'x-access-token': token 
      }
    });
    return response.data;
  },

  /**
   * Get billing codes by project
   * @param projectId - Project ID
   * @returns Promise with billing codes for the project
   */
  async getBillingCodesByProject(projectId: number): Promise<BillingCode[]> {
    const token = localStorage.getItem('snowpack_token');
    const response = await axios.get(`/api/projects/${projectId}/billing-codes`, {
      headers: { 
        'Content-Type': 'application/json', 
        'x-access-token': token 
      }
    });
    return response.data.billing_codes;
  }
};

/**
 * Fetches all billing codes or billing codes for a specific project if projectId is provided
 * @param projectId Optional project ID to filter billing codes
 * @returns Promise with billing codes data
 */
export const fetchBillingCodes = async (projectId?: number) => {
  try {
    const url = projectId 
      ? `${API_URL}/api/billing-codes?project_id=${projectId}`
      : `${API_URL}/api/billing-codes`;
      
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching billing codes:', error);
    throw error;
  }
};

/**
 * Fetches a single billing code by ID
 * @param id Billing code ID
 * @returns Promise with billing code data
 */
export const fetchBillingCodeById = async (id: number) => {
  try {
    const response = await axios.get(`${API_URL}/api/billing-codes/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching billing code ${id}:`, error);
    throw error;
  }
};

/**
 * Creates a new billing code
 * @param billingCodeData Billing code data to create
 * @returns Promise with created billing code data
 */
export const createBillingCode = async (billingCodeData: any) => {
  try {
    const response = await axios.post(`${API_URL}/api/billing-codes`, billingCodeData);
    return response.data;
  } catch (error) {
    console.error('Error creating billing code:', error);
    throw error;
  }
};

/**
 * Updates an existing billing code
 * @param id Billing code ID
 * @param billingCodeData Updated billing code data
 * @returns Promise with updated billing code data
 */
export const updateBillingCode = async (id: number, billingCodeData: any) => {
  try {
    const response = await axios.put(`${API_URL}/api/billing-codes/${id}`, billingCodeData);
    return response.data;
  } catch (error) {
    console.error(`Error updating billing code ${id}:`, error);
    throw error;
  }
};

/**
 * Deletes a billing code
 * @param id Billing code ID to delete
 * @returns Promise with deletion status
 */
export const deleteBillingCode = async (id: number) => {
  try {
    const response = await axios.delete(`${API_URL}/api/billing-codes/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting billing code ${id}:`, error);
    throw error;
  }
}; 