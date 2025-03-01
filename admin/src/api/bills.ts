import axios from 'axios';
import type { Bill } from '../types/Bill';

/**
 * API service for bill-related operations
 */
export default {
  /**
   * Get all bills
   * @returns Promise with array of bills
   */
  async getBills(): Promise<Bill[]> {
    const token = localStorage.getItem('snowpack_token');
    const response = await axios.get('/api/bills', {
      headers: { 
        'Content-Type': 'application/json', 
        'x-access-token': token 
      }
    });
    return response.data.bills;
  },

  /**
   * Get a single bill by ID
   * @param id - Bill ID
   * @returns Promise with bill data
   */
  async getBill(id: number): Promise<Bill> {
    const token = localStorage.getItem('snowpack_token');
    const response = await axios.get(`/api/bills/${id}`, {
      headers: { 
        'Content-Type': 'application/json', 
        'x-access-token': token 
      }
    });
    return response.data.bill;
  },

  /**
   * Create a new bill
   * @param bill - Bill data
   * @returns Promise with created bill
   */
  async createBill(bill: Bill): Promise<Bill> {
    const token = localStorage.getItem('snowpack_token');
    const response = await axios.post('/api/bills', bill, {
      headers: { 
        'Content-Type': 'application/json', 
        'x-access-token': token 
      }
    });
    return response.data.bill;
  },

  /**
   * Update an existing bill
   * @param bill - Bill data with ID
   * @returns Promise with updated bill
   */
  async updateBill(bill: Bill): Promise<Bill> {
    const token = localStorage.getItem('snowpack_token');
    const response = await axios.put(`/api/bills/${bill.ID}`, bill, {
      headers: { 
        'Content-Type': 'application/json', 
        'x-access-token': token 
      }
    });
    return response.data.bill;
  },

  /**
   * Delete a bill
   * @param id - Bill ID
   * @returns Promise with response data
   */
  async deleteBill(id: number): Promise<any> {
    const token = localStorage.getItem('snowpack_token');
    const response = await axios.delete(`/api/bills/${id}`, {
      headers: { 
        'Content-Type': 'application/json', 
        'x-access-token': token 
      }
    });
    return response.data;
  },

  /**
   * Change bill state (draft, paid, void)
   * @param id - Bill ID
   * @param state - New state
   * @returns Promise with updated bill
   */
  async changeBillState(id: number, state: string): Promise<Bill> {
    const token = localStorage.getItem('snowpack_token');
    const response = await axios.put(`/api/bills/${id}/state`, 
      { state },
      { 
        headers: { 
          'Content-Type': 'application/json', 
          'x-access-token': token 
        }
      }
    );
    return response.data.bill;
  }
}; 