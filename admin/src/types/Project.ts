/**
 * Interface representing a Project in the system
 */

import { createEmptyAccount, type Account } from './Account';

export interface Project {
  ID: number;
  name: string;
  code: string; // Project code/identifier
  account_id: number;
  account: Account;
  state: string;
  type: string;
  description: string;
  active_start: string; // Project start date
  active_end: string; // Project end date
  billing_frequency: string; // Client purchase order
  budget_hours: number;
  budget_dollars: number;
  project_type: string;
  ae_id: number;
  sdr_id: number;
}

/**
 * Constants for project types
 */
export const PROJECT_TYPES = [
  'PROJECT_TYPE_INTERNAL',
  'PROJECT_TYPE_EXTERNAL',
  'PROJECT_TYPE_FIXED_BID'
];

/**
 * Constants for project states
 */
export const PROJECT_STATES = [
  'PROJECT_STATE_PLANNING',
  'PROJECT_STATE_ACTIVE',
  'PROJECT_STATE_HOLD',
  'PROJECT_STATE_COMPLETED',
  'PROJECT_STATE_CANCELLED'
];

/**
 * Creates a new empty project with default values
 */
export function createEmptyProject(): Project {
  const today = new Date();
  const endDate = new Date();
  endDate.setMonth(today.getMonth() + 6); // Default end date is 6 months from now
  const account = createEmptyAccount();
  return {
    ID: 0,
    name: '',
    code: '',
    account_id: 0,
    account: account,
    state: 'PROJECT_STATE_PLANNING',
    type: 'PROJECT_TYPE_EXTERNAL',
    description: '',
    active_start: today.toISOString().split('T')[0],
    active_end: endDate.toISOString().split('T')[0],
    billing_frequency: '',
    budget_hours: 0,
    budget_dollars: 0,
    project_type: '',
    ae_id: 0,
    sdr_id: 0,
  };
} 