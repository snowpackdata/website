/**
 * Interface representing a Project in the system
 */

import { createEmptyAccount } from './Account';

export interface Project {
  ID: number;
  name: string;
  account_id: number;
  account?: any; // Account reference object
  active_start: string; // Project start date
  active_end: string; // Project end date
  budget_hours: number;
  budget_dollars: number;
  internal: boolean;
  billing_frequency: string;
  project_type: string;
  ae_id?: number; // Optional to match Go's *uint
  sdr_id?: number; // Optional to match Go's *uint
  // Include optional server fields to avoid mapping errors
  CreatedAt?: string;
  UpdatedAt?: string;
  DeletedAt?: string | null;
  billing_codes?: any[]; // The server may include associated billing codes
}

/**
 * Constants for project types
 */
export const PROJECT_TYPES = [
  'PROJECT_TYPE_NEW',
  'PROJECT_TYPE_EXISTING'
];

/**
 * Constants for billing frequencies
 */
export const BILLING_FREQUENCIES = [
  'BILLING_TYPE_MONTHLY',
  'BILLING_TYPE_PROJECT',
  'BILLING_TYPE_BIWEEKLY',
  'BILLING_TYPE_WEEKLY',
  'BILLING_TYPE_BIMONTHLY'
];

/**
 * Creates a new empty project with default values
 */
export function createEmptyProject(): Project {
  // Use UTC date functions to ensure consistent date handling
  const today = new Date();
  const endDate = new Date();
  
  // Default end date is 6 months from now, use UTC functions
  endDate.setUTCMonth(today.getUTCMonth() + 6);
  
  // Format the dates as YYYY-MM-DD strings in UTC
  const todayFormatted = `${today.getUTCFullYear()}-${String(today.getUTCMonth() + 1).padStart(2, '0')}-${String(today.getUTCDate()).padStart(2, '0')}`;
  const endDateFormatted = `${endDate.getUTCFullYear()}-${String(endDate.getUTCMonth() + 1).padStart(2, '0')}-${String(endDate.getUTCDate()).padStart(2, '0')}`;
  
  const account = createEmptyAccount();
  return {
    ID: 0,
    name: '',
    account_id: 0,
    account: account,
    active_start: todayFormatted,
    active_end: endDateFormatted,
    budget_hours: 0,
    budget_dollars: 0,
    internal: false,
    billing_frequency: 'BILLING_TYPE_MONTHLY',
    project_type: 'PROJECT_TYPE_NEW'
  };
} 