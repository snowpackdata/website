import axios from 'axios';
import type { Account } from '../types/Account';

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