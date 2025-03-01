/**
 * Interface representing a Rate in the system
 */
export interface Rate {
  ID: number;
  type: string;
  name: string;
  description: string;
  amount: number;
  internal: boolean;
  active: boolean;
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
  return {
    ID: 0,
    type: 'RATE_TYPE_EXTERNAL_CLIENT_BILLABLE',
    name: '',
    description: '',
    amount: 0,
    internal: false,
    active: true
  };
} 