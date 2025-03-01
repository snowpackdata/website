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
  rate:  Rate;
  internal_rate_id: number;
  internal_rate: Rate;
}

/**
 * Creates a new empty billing code with default values
 */
export function createEmptyBillingCode(): BillingCode {
  return {
    ID: 0,
    code: '',
    name: '',
    description: '',
    account_id: 0,
    account_name: '',
    project_id: 0,
    project_name: '',
    rate_id: 0,
    rate_description: '',
    internal: false,
    active: true
  };
} 