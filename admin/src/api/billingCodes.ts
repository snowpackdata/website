import axios from 'axios';
import type { BillingCode } from '../types/BillingCode';

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
    const response = await axios.get('/api/billing-codes', {
      headers: { 
        'Content-Type': 'application/json', 
        'x-access-token': token 
      }
    });
    return response.data.billing_codes;
  },

  /**
   * Get a single billing code by ID
   * @param id - Billing code ID
   * @returns Promise with billing code data
   */
  async getBillingCode(id: number): Promise<BillingCode> {
    const token = localStorage.getItem('snowpack_token');
    const response = await axios.get(`/api/billing-codes/${id}`, {
      headers: { 
        'Content-Type': 'application/json', 
        'x-access-token': token 
      }
    });
    return response.data.billing_code;
  },

  /**
   * Create a new billing code
   * @param billingCode - Billing code data
   * @returns Promise with created billing code
   */
  async createBillingCode(billingCode: BillingCode): Promise<BillingCode> {
    const token = localStorage.getItem('snowpack_token');
    const response = await axios.post('/api/billing-codes', billingCode, {
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