import axios from 'axios';
import type { Invoice } from '../types/Invoice';

/**
 * API service for invoice-related operations
 */
export default {
  /**
   * Get all invoices
   * @returns Promise with array of invoices
   */
  async getInvoices(): Promise<Invoice[]> {
    const token = localStorage.getItem('snowpack_token');
    const response = await axios.get('/api/invoices/accepted', {
      headers: { 
        'Content-Type': 'application/json', 
        'x-access-token': token 
      }
    });
    return response.data;
  },

  /**
   * Get a single invoice by ID
   * @param id - Invoice ID
   * @returns Promise with invoice data
   */
  async getInvoice(id: number): Promise<Invoice> {
    const token = localStorage.getItem('snowpack_token');
    const response = await axios.get(`/api/invoices/${id}`, {
      headers: { 
        'Content-Type': 'application/json', 
        'x-access-token': token 
      }
    });
    return response.data.invoice;
  },

  /**
   * Create a new invoice
   * @param invoice - Invoice data
   * @returns Promise with created invoice
   */
  async createInvoice(invoice: Invoice): Promise<Invoice> {
    const token = localStorage.getItem('snowpack_token');
    const response = await axios.post('/api/invoices', invoice, {
      headers: { 
        'Content-Type': 'application/json', 
        'x-access-token': token 
      }
    });
    return response.data.invoice;
  },

  /**
   * Update an existing invoice
   * @param invoice - Invoice data with ID
   * @returns Promise with updated invoice
   */
  async updateInvoice(invoice: Invoice): Promise<Invoice> {
    const token = localStorage.getItem('snowpack_token');
    const response = await axios.put(`/api/invoices/${invoice.ID}`, invoice, {
      headers: { 
        'Content-Type': 'application/json', 
        'x-access-token': token 
      }
    });
    return response.data.invoice;
  },

  /**
   * Delete an invoice
   * @param id - Invoice ID
   * @returns Promise with response data
   */
  async deleteInvoice(id: number): Promise<any> {
    const token = localStorage.getItem('snowpack_token');
    const response = await axios.delete(`/api/invoices/${id}`, {
      headers: { 
        'Content-Type': 'application/json', 
        'x-access-token': token 
      }
    });
    return response.data;
  },

  /**
   * Change invoice state (draft, sent, paid, void)
   * @param id - Invoice ID
   * @param state - New state
   * @returns Promise with updated invoice
   */
  async changeInvoiceState(id: number, state: string): Promise<Invoice> {
    const token = localStorage.getItem('snowpack_token');
    const response = await axios.put(`/api/invoices/${id}/state`, 
      { state },
      { 
        headers: { 
          'Content-Type': 'application/json', 
          'x-access-token': token 
        } 
      }
    );
    return response.data.invoice;
  }
}; 