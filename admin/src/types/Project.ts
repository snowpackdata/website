/**
 * Interface representing a Project in the system
 */
export interface Project {
  ID: number;
  name: string;
  code: string; // Project code/identifier
  account_id: number;
  account_name: string;
  state: string;
  type: string;
  description: string;
  start_date: string; // Project start date
  end_date: string; // Project end date
  client_po: string; // Client purchase order
  active: boolean; // Whether the project is active
  budget_hours: number;
  budget_dollars: number;
  total_hours: number;
  total_fees: number;
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
  
  return {
    ID: 0,
    name: '',
    code: '',
    account_id: 0,
    account_name: '',
    state: 'PROJECT_STATE_PLANNING',
    type: 'PROJECT_TYPE_EXTERNAL',
    description: '',
    start_date: today.toISOString().split('T')[0],
    end_date: endDate.toISOString().split('T')[0],
    client_po: '',
    active: true,
    budget_hours: 0,
    budget_dollars: 0,
    total_hours: 0,
    total_fees: 0
  };
} 