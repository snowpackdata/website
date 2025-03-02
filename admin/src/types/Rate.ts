/**
 * Interface representing a Rate in the system
 */
export interface Rate {
  ID: number;
  name: string;
  amount: number;
  active_from: string;
  active_to: string;
  internal_only: boolean;
  CreatedAt?: string;
  UpdatedAt?: string;
  DeletedAt?: string | null;
  BillingCodes?: any[];
}

/**
 * Constants for rate types
 */
export const RATE_TYPES = [
  'RATE_TYPE_INTERNAL_CLIENT_NON_BILLABLE',
  'RATE_TYPE_INTERNAL_CLIENT_BILLABLE',
  'RATE_TYPE_INTERNAL_ADMINISTRATIVE_NON_BILLABLE',
  'RATE_TYPE_INTERNAL_ADMINISTRATIVE',
  'RATE_TYPE_EXTERNAL_CLIENT_BILLABLE',
  'RATE_TYPE_EXTERNAL_CLIENT_NON_BILLABLE',
  'RATE_TYPE_INTERNAL_PROJECT'
];

/**
 * Human-readable rate type mapping
 */
export const RATE_TYPE_NAMES = {
  'RATE_TYPE_INTERNAL_CLIENT_NON_BILLABLE': 'Internal Client Non-Billable',
  'RATE_TYPE_INTERNAL_CLIENT_BILLABLE': 'Internal Client',
  'RATE_TYPE_INTERNAL_ADMINISTRATIVE_NON_BILLABLE': 'Internal Administrative Non-Billable',
  'RATE_TYPE_INTERNAL_ADMINISTRATIVE': 'Internal Administrative',
  'RATE_TYPE_EXTERNAL_CLIENT_BILLABLE': 'External Client',
  'RATE_TYPE_EXTERNAL_CLIENT_NON_BILLABLE': 'External Client Non-Billable',
  'RATE_TYPE_INTERNAL_PROJECT': 'Internal Project'
};

/**
 * Creates a new empty rate with default values
 */
export function createEmptyRate(): Rate {
  const today = new Date().toISOString().split('T')[0]; // Get current date in YYYY-MM-DD format
  const futureDate = new Date();
  futureDate.setFullYear(futureDate.getFullYear() + 1); // Default end date is 1 year in the future
  
  return {
    ID: 0,
    name: '',
    amount: 0,
    active_from: today,
    active_to: futureDate.toISOString().split('T')[0],
    internal_only: false
  };
} 