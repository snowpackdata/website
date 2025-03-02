import type { Rate } from '../types/Rate';
import { fetchAll, fetchById, create, update, remove } from './apiUtils';

/**
 * API service for rate-related operations
 */
const ratesAPI = {
  /**
   * Get all rates
   * @returns Promise with array of rates
   */
  async getRates(): Promise<Rate[]> {
    return fetchAll<Rate>('rates');
  },

  /**
   * Get a single rate by ID
   * @param id - Rate ID
   * @returns Promise with rate data
   */
  async getRate(id: number): Promise<Rate> {
    return fetchById<Rate>('rates', id);
  },

  /**
   * Create a new rate
   * @param rate - Rate data
   * @returns Promise with created rate
   */
  async createRate(rate: Rate): Promise<Rate> {
    return create<Rate>('rates', rate);
  },

  /**
   * Update an existing rate
   * @param rate - Rate data to update
   * @returns Promise with updated rate
   */
  async updateRate(rate: Rate): Promise<Rate> {
    return update<Rate>('rates', rate.ID, rate);
  },

  /**
   * Delete a rate
   * @param id - ID of rate to delete
   * @returns Promise with deletion result
   */
  async deleteRate(id: number): Promise<any> {
    return remove('rates', id);
  }
};

// For backward compatibility, maintain these exported functions
// that delegate to the API methods
/**
 * Fetches all rates
 * @returns Promise with rates data
 */
export const fetchRates = async () => {
  return await ratesAPI.getRates();
};

/**
 * Fetches a single rate by ID
 * @param id Rate ID
 * @returns Promise with rate data
 */
export const fetchRateById = async (id: number) => {
  return await ratesAPI.getRate(id);
};

/**
 * Creates a new rate
 * @param rateData Rate data to create
 * @returns Promise with created rate data
 */
export const createRate = async (rateData: any) => {
  return await ratesAPI.createRate(rateData as Rate);
};

/**
 * Updates an existing rate
 * @param id Rate ID
 * @param rateData Updated rate data
 * @returns Promise with updated rate data
 */
export const updateRate = async (id: number, rateData: any) => {
  const fullRate = { ...rateData, ID: id } as Rate;
  return await ratesAPI.updateRate(fullRate);
};

/**
 * Deletes a rate
 * @param id Rate ID to delete
 * @returns Promise with deletion status
 */
export const deleteRate = async (id: number) => {
  return await ratesAPI.deleteRate(id);
};

export default ratesAPI; 