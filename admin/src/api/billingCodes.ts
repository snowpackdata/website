import type { BillingCode } from '../types/BillingCode';
import { fetchAll, fetchById, create, update, remove } from './apiUtils';

/**
 * API service for billing code-related operations
 */
const billingCodesAPI = {
  /**
   * Get all billing codes
   * @returns Promise with array of billing codes
   */
  async getBillingCodes(): Promise<BillingCode[]> {
    return fetchAll<BillingCode>('billing_codes');
  },

  /**
   * Get a single billing code by ID
   * @param id - Billing code ID
   * @returns Promise with billing code data
   */
  async getBillingCode(id: number): Promise<BillingCode> {
    return fetchById<BillingCode>('billing_codes', id);
  },

  /**
   * Create a new billing code
   * @param billingCode - Billing code data
   * @returns Promise with created billing code
   */
  async createBillingCode(billingCode: BillingCode): Promise<BillingCode> {
    return create<BillingCode>('billing_codes', billingCode);
  },

  /**
   * Update an existing billing code
   * @param billingCode - Billing code data to update
   * @returns Promise with updated billing code
   */
  async updateBillingCode(billingCode: BillingCode): Promise<BillingCode> {
    return update<BillingCode>('billing_codes', billingCode.ID, billingCode);
  },

  /**
   * Delete a billing code
   * @param id - ID of billing code to delete
   * @returns Promise with deletion result
   */
  async deleteBillingCode(id: number): Promise<any> {
    return remove('billing_codes', id);
  },

  /**
   * Get active billing codes
   * @returns Promise with array of active billing codes
   */
  async getActiveBillingCodes(): Promise<BillingCode[]> {
    return fetchAll<BillingCode>('active_billing_codes');
  },

  /**
   * Get billing codes for a specific project
   * @param projectId - ID of the project
   * @returns Promise with array of billing codes
   */
  async getProjectBillingCodes(projectId: number): Promise<BillingCode[]> {
    return fetchAll<BillingCode>(`projects/${projectId}/billing_codes`);
  },

  /**
   * Add billing code to a project
   * @param projectId - ID of the project
   * @param billingCodeId - ID of the billing code
   * @returns Promise with result of the operation
   */
  async addBillingCodeToProject(projectId: number, billingCodeId: number): Promise<any> {
    return create('projects/' + projectId + '/billing_codes', { billing_code_id: billingCodeId });
  },

  /**
   * Remove billing code from a project
   * @param projectId - ID of the project
   * @param billingCodeId - ID of the billing code
   * @returns Promise with result of the operation
   */
  async removeBillingCodeFromProject(projectId: number, billingCodeId: number): Promise<any> {
    return remove(`projects/${projectId}/billing_codes`, billingCodeId);
  }
};

// Export as default
export default billingCodesAPI;

// Export individual functions for backward compatibility
export const getBillingCodes = billingCodesAPI.getBillingCodes;
export const getBillingCode = billingCodesAPI.getBillingCode;
export const createBillingCode = billingCodesAPI.createBillingCode;
export const updateBillingCode = billingCodesAPI.updateBillingCode;
export const deleteBillingCode = billingCodesAPI.deleteBillingCode;
export const getActiveBillingCodes = billingCodesAPI.getActiveBillingCodes;
export const getProjectBillingCodes = billingCodesAPI.getProjectBillingCodes;
export const addBillingCodeToProject = billingCodesAPI.addBillingCodeToProject;
export const removeBillingCodeFromProject = billingCodesAPI.removeBillingCodeFromProject; 