import type { TimesheetEntry } from '../types/Timesheet';
import { fetchAll, fetchById, create, update, remove } from './apiUtils';

/**
 * API service for timesheet-related operations
 */
const timesheetAPI = {
  /**
   * Fetch all timesheet entries
   * @returns Promise with timesheet entries
   */
  async getEntries(): Promise<TimesheetEntry[]> {
    return fetchAll<TimesheetEntry>('entries');
  },

  /**
   * Fetch a single timesheet entry by ID
   * @param id - Entry ID
   * @returns Promise with timesheet entry data
   */
  async getEntry(id: number): Promise<TimesheetEntry> {
    return fetchById<TimesheetEntry>('entries', id);
  },

  /**
   * Fetch users who can be impersonated for timesheet entries
   * @returns Promise with users data
   */
  async getUsers(): Promise<any[]> {
    return fetchAll('staff');
  },

  /**
   * Fetch active billing codes for timesheet entries
   * @returns Promise with billing codes data
   */
  async getActiveBillingCodes(): Promise<any[]> {
    return fetchAll('active_billing_codes');
  },

  /**
   * Create a new timesheet entry
   * @param entry - Timesheet entry data
   * @returns Promise with created entry
   */
  async createEntry(entry: TimesheetEntry): Promise<TimesheetEntry> {
    return create<TimesheetEntry>('entries', entry);
  },

  /**
   * Update an existing timesheet entry
   * @param entry - Entry data to update
   * @returns Promise with updated entry
   */
  async updateEntry(entry: TimesheetEntry): Promise<TimesheetEntry> {
    return update<TimesheetEntry>('entries', entry.entry_id, entry);
  },

  /**
   * Delete a timesheet entry
   * @param id - ID of entry to delete
   * @returns Promise with deletion result
   */
  async deleteEntry(id: number): Promise<any> {
    return remove('entries', id);
  },

  /**
   * Fetch timesheet entries for a specific time period
   * @param startDate - Start date in YYYY-MM-DD format
   * @param endDate - End date in YYYY-MM-DD format
   * @returns Promise with filtered timesheet entries
   */
  async getEntriesByDateRange(startDate: string, endDate: string): Promise<TimesheetEntry[]> {
    return fetchAll<TimesheetEntry>(`entries?start_date=${startDate}&end_date=${endDate}`);
  },

  /**
   * Fetch timesheet entries for a specific user
   * @param userId - User ID
   * @returns Promise with user's timesheet entries
   */
  async getEntriesByUser(userId: number): Promise<TimesheetEntry[]> {
    return fetchAll<TimesheetEntry>(`entries?user_id=${userId}`);
  },

  /**
   * Fetch timesheet entries for a specific project
   * @param projectId - Project ID
   * @returns Promise with project's timesheet entries
   */
  async getEntriesByProject(projectId: number): Promise<TimesheetEntry[]> {
    return fetchAll<TimesheetEntry>(`entries?project_id=${projectId}`);
  }
};

// Export as default
export default timesheetAPI;

// Export individual functions for backward compatibility
export const getEntries = timesheetAPI.getEntries;
export const getEntry = timesheetAPI.getEntry;
export const getUsers = timesheetAPI.getUsers;
export const getActiveBillingCodes = timesheetAPI.getActiveBillingCodes;
export const createEntry = timesheetAPI.createEntry;
export const updateEntry = timesheetAPI.updateEntry;
export const deleteEntry = timesheetAPI.deleteEntry;
export const getEntriesByDateRange = timesheetAPI.getEntriesByDateRange;
export const getEntriesByUser = timesheetAPI.getEntriesByUser;
export const getEntriesByProject = timesheetAPI.getEntriesByProject; 