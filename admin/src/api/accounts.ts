import axios from 'axios';
import type { Account } from '../types/Account';

const API_URL = import.meta.env.VITE_API_URL || '';

/**
 * API service for account-related operations
 */
export default {
  /**
   * Fetch all accounts
   * @returns Promise with account data
   */
  async getAccounts(): Promise<Account[]> {
    const token = localStorage.getItem('snowpack_token');
    const response = await axios.get('/api/accounts', {
      headers: { 
        'Content-Type': 'application/json', 
        'x-access-token': token 
      }
    });
    return response.data;
  },

  /**
   * Create a new account
   * @param account - The account data to create
   * @returns Promise with the created account
   */
  async createAccount(account: Account): Promise<Account> {
    const token = localStorage.getItem('snowpack_token');
    const formData = new FormData();
    
    formData.set('name', account.name);
    formData.set('website', account.website);
    formData.set('email', account.email);
    formData.set('type', account.type);
    formData.set('legal_name', account.legal_name);
    formData.set('address', account.address);
    formData.set('billing_frequency', account.billing_frequency);
    formData.set('budget_hours', account.budget_hours.toString());
    formData.set('budget_dollars', account.budget_dollars.toString());
    formData.set('projects_single_invoice', account.projects_single_invoice.toString());

    const response = await axios.post('/api/accounts/0', formData, {
      headers: { 
        'Content-Type': 'application/json', 
        'x-access-token': token 
      }
    });
    
    return response.data;
  },

  /**
   * Update an existing account
   * @param account - The account data to update
   * @returns Promise with the updated account
   */
  async updateAccount(account: Account): Promise<Account> {
    const token = localStorage.getItem('snowpack_token');
    const formData = new FormData();
    
    formData.set('name', account.name);
    formData.set('website', account.website);
    formData.set('email', account.email);
    formData.set('type', account.type);
    formData.set('legal_name', account.legal_name);
    formData.set('address', account.address);
    formData.set('billing_frequency', account.billing_frequency);
    formData.set('budget_hours', account.budget_hours.toString());
    formData.set('budget_dollars', account.budget_dollars.toString());
    formData.set('projects_single_invoice', account.projects_single_invoice.toString());

    const response = await axios.put(`/api/accounts/${account.ID}`, formData, {
      headers: { 
        'Content-Type': 'application/json', 
        'x-access-token': token 
      }
    });
    
    return response.data;
  },

  /**
   * Delete an account
   * @param id - The ID of the account to delete
   * @returns Promise with the response data
   */
  async deleteAccount(id: number): Promise<any> {
    const token = localStorage.getItem('snowpack_token');
    const response = await axios.delete(`/api/accounts/${id}`, {
      headers: { 
        'Content-Type': 'application/json', 
        'x-access-token': token 
      }
    });
    
    return response.data;
  },

  /**
   * Invite a user to an account
   * @param accountId - The ID of the account
   * @param email - The email of the user to invite
   * @returns Promise with the invited user data
   */
  async inviteUser(accountId: number, email: string): Promise<any> {
    const token = localStorage.getItem('snowpack_token');
    const formData = new FormData();
    formData.set('email', email);
    
    const response = await axios.post(`/api/accounts/${accountId}/invite`, formData, {
      headers: { 
        'Content-Type': 'application/json', 
        'x-access-token': token 
      }
    });
    
    return response.data;
  }
};

/**
 * Fetches all accounts
 * @returns Promise with accounts data
 */
export const fetchAccounts = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/accounts`);
    return response.data;
  } catch (error) {
    console.error('Error fetching accounts:', error);
    throw error;
  }
};

/**
 * Fetches a single account by ID
 * @param id Account ID
 * @returns Promise with account data
 */
export const fetchAccountById = async (id: number) => {
  try {
    const response = await axios.get(`${API_URL}/api/accounts/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching account ${id}:`, error);
    throw error;
  }
};

/**
 * Creates a new account
 * @param accountData Account data to create
 * @returns Promise with created account data
 */
export const createAccount = async (accountData: any) => {
  try {
    const response = await axios.post(`${API_URL}/api/accounts`, accountData);
    return response.data;
  } catch (error) {
    console.error('Error creating account:', error);
    throw error;
  }
};

/**
 * Updates an existing account
 * @param id Account ID
 * @param accountData Updated account data
 * @returns Promise with updated account data
 */
export const updateAccount = async (id: number, accountData: any) => {
  try {
    const response = await axios.put(`${API_URL}/api/accounts/${id}`, accountData);
    return response.data;
  } catch (error) {
    console.error(`Error updating account ${id}:`, error);
    throw error;
  }
};

/**
 * Deletes an account
 * @param id Account ID to delete
 * @returns Promise with deletion status
 */
export const deleteAccount = async (id: number) => {
  try {
    const response = await axios.delete(`${API_URL}/api/accounts/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting account ${id}:`, error);
    throw error;
  }
}; 