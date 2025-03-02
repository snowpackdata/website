import type { TimesheetEntry } from '../types/Timesheet';
import { fetchAll, fetchById, create, update, remove } from './apiUtils';

/**
 * Validates timesheet entry data before sending to the API
 * @param entry - Entry data to validate
 * @returns Object with validation result and any error messages
 */
function validateTimesheetEntry(entry: Partial<TimesheetEntry>): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check required fields
  if (!entry.billing_code_id) errors.push('Billing code is required');
  if (!entry.start) errors.push('Start time is required');
  if (!entry.end) errors.push('End time is required');
  
  // Validate time range
  if (entry.start && entry.end) {
    const startTime = new Date(entry.start);
    const endTime = new Date(entry.end);
    if (endTime <= startTime) {
      errors.push('End time must be after start time');
    }
    
    // Check if duration is reasonable (optional validation)
    const durationMs = endTime.getTime() - startTime.getTime();
    const durationHours = durationMs / (1000 * 60 * 60);
    if (durationHours > 24) {
      errors.push('Duration exceeds 24 hours, please verify the times');
    }
  }
  
  return { 
    isValid: errors.length === 0,
    errors 
  };
}

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
   * Create a new timesheet entry with validation
   * @param entry - Timesheet entry data
   * @returns Promise with created entry
   * @throws Error if validation fails
   */
  async createEntry(entry: TimesheetEntry): Promise<TimesheetEntry> {
    // Validate entry data
    const validation = validateTimesheetEntry(entry);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }
    
    // Prepare form data for compatibility with Go backend
    const formData = new FormData();
    formData.set("billing_code_id", entry.billing_code_id.toString());
    
    // Format dates in the expected format (2006-01-02T15:04)
    const startDate = new Date(entry.start);
    const endDate = new Date(entry.end);
    
    // Format to YYYY-MM-DDThh:mm
    const formatDate = (date: Date) => {
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    };
    
    formData.set("start", formatDate(startDate));
    formData.set("end", formatDate(endDate));
    
    if (entry.notes) {
      formData.set("notes", entry.notes);
    }
    
    if (entry.impersonate_as_user_id) {
      formData.set("impersonate_as_user_id", entry.impersonate_as_user_id.toString());
    }
    
    try {
      return create<TimesheetEntry>('entries', formData);
    } catch (error) {
      console.error('Failed to create timesheet entry:', error);
      throw error;
    }
  },

  /**
   * Update an existing timesheet entry with validation
   * @param entry - Entry data to update
   * @returns Promise with updated entry
   * @throws Error if validation fails
   */
  async updateEntry(entry: TimesheetEntry): Promise<TimesheetEntry> {
    // Validate entry data
    const validation = validateTimesheetEntry(entry);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }
    
    // Prepare form data for compatibility with Go backend
    const formData = new FormData();
    formData.set("billing_code_id", entry.billing_code_id.toString());
    
    // Format dates in the expected format (2006-01-02T15:04)
    const startDate = new Date(entry.start);
    const endDate = new Date(entry.end);
    
    // Format to YYYY-MM-DDThh:mm
    const formatDate = (date: Date) => {
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    };
    
    formData.set("start", formatDate(startDate));
    formData.set("end", formatDate(endDate));
    
    if (entry.notes) {
      formData.set("notes", entry.notes);
    }
    
    if (entry.impersonate_as_user_id) {
      formData.set("impersonate_as_user_id", entry.impersonate_as_user_id.toString());
    }
    
    try {
      return update<TimesheetEntry>('entries', entry.entry_id, formData);
    } catch (error) {
      console.error('Failed to update timesheet entry:', error);
      throw error;
    }
  },

  /**
   * Delete a timesheet entry
   * @param id - ID of entry to delete
   * @returns Promise with deletion result
   */
  async deleteEntry(id: number): Promise<any> {
    try {
      return remove('entries', id);
    } catch (error) {
      console.error('Failed to delete timesheet entry:', error);
      throw error;
    }
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