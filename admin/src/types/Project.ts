/**
 * Interface representing a Project in the system
 */

import { createEmptyAccount, type Account } from './Account';

export interface Project {
  ID: number;
  name: string;
  account_id: number;
  account: Account;
  active_start: string; // Project start date
  active_end: string; // Project end date
  budget_hours: number;
  budget_dollars: number;
  internal: boolean;
  billing_frequency: string;
  project_type: string;
  ae_id?: number; // Optional to match Go's *uint
  sdr_id?: number; // Optional to match Go's *uint
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
  const today = new Date();
  const endDate = new Date();
  endDate.setMonth(today.getMonth() + 6); // Default end date is 6 months from now
  const account = createEmptyAccount();
  return {
    ID: 0,
    name: '',
    account_id: 0,
    account: account,
    active_start: today.toISOString().split('T')[0],
    active_end: endDate.toISOString().split('T')[0],
    budget_hours: 0,
    budget_dollars: 0,
    internal: false,
    billing_frequency: 'BILLING_TYPE_MONTHLY',
    project_type: 'PROJECT_TYPE_NEW'
  };
} 