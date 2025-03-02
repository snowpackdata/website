import type { Account } from '../types/Account';
import { fetchAll, fetchById, createWithFormData, updateWithFormData, remove } from './apiUtils';

const API_URL = import.meta.env.VITE_API_URL || '/api';

// Simple token getter function
const getToken = () => {
  return localStorage.getItem('token') || '';
};

/**
 * API service for account-related operations
 */
const accountsAPI = {
  /**
   * Fetch all accounts
   * @returns Promise with account data
   */
  async fetchAccounts(): Promise<Account[]> {
    return fetchAll<Account>('accounts');
  },

  /**
   * Get a single account by ID
   * @param id - Account ID
   * @returns Promise with account data
   */
  async getAccount(id: number): Promise<Account> {
    return fetchById<Account>('accounts', id);
  },

  /**
   * Create a new account
   * @param account - The account data to create
   * @returns Promise with the created account
   */
  async createAccount(account: Account): Promise<Account> {
    return createWithFormData<Account>('accounts/0', account);
  },

  /**
   * Update an existing account
   * @param account - The account data to update
   * @returns Promise with the updated account
   */
  async updateAccount(account: Account): Promise<Account> {
    return updateWithFormData<Account>('accounts', account.ID, account);
  },

  /**
   * Delete an account
   * @param id - The ID of the account to delete
   * @returns Promise with the response data
   */
  async deleteAccount(id: number): Promise<any> {
    return remove('accounts', id);
  },

  /**
   * Invite a user to an account
   * @param accountId - The ID of the account
   * @param email - The email of the user to invite
   * @returns Promise with the invited user data
   */
  async inviteUser(accountId: number, email: string): Promise<any> {
    return createWithFormData('accounts/' + accountId + '/invite', { email });
  }
};

// Export as default
export default accountsAPI;

// Export individual functions for backward compatibility
export const fetchAccounts = accountsAPI.fetchAccounts;
export const getAccount = accountsAPI.getAccount;
export const createAccount = accountsAPI.createAccount;
export const updateAccount = accountsAPI.updateAccount;
export const deleteAccount = accountsAPI.deleteAccount;
export const inviteUser = accountsAPI.inviteUser;



