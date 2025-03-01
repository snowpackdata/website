import axios from 'axios';
import type { TimesheetEntry } from '../types/Timesheet';

/**
 * API service for timesheet-related operations
 */
export default {
  /**
   * Fetch all timesheet entries
   * @returns Promise with timesheet entries
   */
  async getEntries(): Promise<TimesheetEntry[]> {
    const token = localStorage.getItem('snowpack_token');
    const response = await axios.get('/api/entries', {
      headers: { 
        'Content-Type': 'application/json', 
        'x-access-token': token 
      }
    });
    return response.data;
  },



  /**
   * Create a new timesheet entry
   * @param entry - The entry data to create
   * @returns Promise with the created entry
   */
  async createEntry(entry: TimesheetEntry): Promise<TimesheetEntry> {
    const token = localStorage.getItem('snowpack_token');
    const formData = new FormData();
    
    formData.set('billing_code_id', entry.billing_code_id.toString());
    formData.set('start', entry.start);
    formData.set('end', entry.end);
    formData.set('notes', entry.notes);
    
    if (entry.impersonate_as_user_id) {
      formData.set('impersonate_as_user_id', entry.impersonate_as_user_id.toString());
    }

    const response = await axios.post('/api/entries/0', formData, {
      headers: { 
        'Content-Type': 'application/json', 
        'x-access-token': token 
      }
    });
    
    return response.data;
  },

  /**
   * Update an existing timesheet entry
   * @param entry - The entry data to update
   * @returns Promise with the updated entry
   */
  async updateEntry(entry: TimesheetEntry): Promise<TimesheetEntry> {
    const token = localStorage.getItem('snowpack_token');
    const formData = new FormData();
    
    formData.set('billing_code_id', entry.billing_code_id.toString());
    formData.set('start', entry.start);
    formData.set('end', entry.end);
    formData.set('notes', entry.notes);
    
    if (entry.impersonate_as_user_id) {
      formData.set('impersonate_as_user_id', entry.impersonate_as_user_id.toString());
    }

    const response = await axios.put(`/api/entries/${entry.entry_id}`, formData, {
      headers: { 
        'Content-Type': 'application/json', 
        'x-access-token': token 
      }
    });
    
    return response.data;
  },

  /**
   * Delete a timesheet entry
   * @param id - The ID of the entry to delete
   * @returns Promise with the response data
   */
  async deleteEntry(id: number): Promise<any> {
    const token = localStorage.getItem('snowpack_token');
    const response = await axios.delete(`/api/entries/${id}`, {
      headers: { 
        'Content-Type': 'application/json', 
        'x-access-token': token 
      }
    });
    
    return response.data;
  },

  /**
   * Change the state of a timesheet entry
   * @param id - The ID of the entry
   * @param state - The new state (draft, approved, void, etc.)
   * @returns Promise with the updated entry
   */
  async changeEntryState(id: number, state: string): Promise<TimesheetEntry> {
    const token = localStorage.getItem('snowpack_token');
    const response = await axios.post(`/api/entries/state/${id}/${state}`, null, {
      headers: { 
        'Content-Type': 'application/json', 
        'x-access-token': token 
      }
    });
    
    return response.data;
  }
}; 