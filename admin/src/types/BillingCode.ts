/**
 * Interface representing a Billing Code in the system
 */
export interface BillingCode {
  ID: number;
  code: string;
  name: string;
  description: string;
  account_id: number;
  account_name: string;
  project_id: number;
  project_name: string;
  rate_id: number;
  rate_description: string;
  internal: boolean;
  active: boolean;
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