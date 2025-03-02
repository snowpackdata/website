import type { Rate } from "./Rate";

/**
 * Interface representing a Billing Code in the system
 */
export interface BillingCode {
  ID: number;
  code: string;
  name: string;
  type: string;
  description: string;
  account_id: number;
  rounded_to: number;
  project: number;
  active_start: string;
  active_end: string;
  rate_id: number;
  rate: Rate;
  internal_rate_id: number;
  internal_rate: Rate;
  // Additional properties used in createEmptyBillingCode
  account_name: string;
  project_id: number;
  project_name: string;
  rate_description: string;
  internal: boolean;
  active: boolean;
}

/**
 * Creates a new empty billing code with default values
 */
export function createEmptyBillingCode(): BillingCode {
  const today = new Date().toISOString().split('T')[0]; // Get current date in YYYY-MM-DD format
  const futureDate = new Date();
  futureDate.setFullYear(futureDate.getFullYear() + 1); // Default end date is 1 year in the future
  
  return {
    ID: 0,
    code: '',
    name: '',
    type: '',
    description: '',
    account_id: 0,
    account_name: '',
    rounded_to: 0,
    project: 0,
    project_id: 0,
    project_name: '',
    active_start: today,
    active_end: futureDate.toISOString().split('T')[0],
    rate_id: 0,
    rate: { 
      ID: 0, 
      name: '', 
      amount: 0, 
      active_from: today,
      active_to: futureDate.toISOString().split('T')[0],
      internal_only: false
    },
    rate_description: '',
    internal_rate_id: 0,
    internal_rate: { 
      ID: 0, 
      name: '', 
      amount: 0, 
      active_from: today,
      active_to: futureDate.toISOString().split('T')[0],
      internal_only: true
    },
    internal: false,
    active: true
  };
} 