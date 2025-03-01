/**
 * Interface representing a Bill in the system
 */
export interface Bill {
  ID: number;
  staff_id: number;
  staff_name: string;
  vendor_name: string; // Vendor/supplier name
  bill_number: string; // Bill reference number
  state: string;
  date_created: string;
  date_paid: string;
  date_voided: string;
  date_issued: string; // When the bill was issued
  date_due: string; // When the bill is due to be paid
  description: string; // Description or notes about the bill
  entries: any[]; // Timesheet entries associated with this bill
  total_hours: number;
  total_amount: number;
}

/**
 * Constants for bill states
 */
export const BILL_STATES = [
  'BILL_STATE_DRAFT',
  'BILL_STATE_PAID',
  'BILL_STATE_VOID'
];

/**
 * Creates a new empty bill with default values
 */
export function createEmptyBill(): Bill {
  const today = new Date();
  const dueDate = new Date();
  dueDate.setDate(today.getDate() + 30); // Default due date is 30 days from today
  
  return {
    ID: 0,
    staff_id: 0,
    staff_name: '',
    vendor_name: '',
    bill_number: '',
    state: 'BILL_STATE_DRAFT',
    date_created: today.toISOString(),
    date_issued: today.toISOString(),
    date_due: dueDate.toISOString(),
    date_paid: '',
    date_voided: '',
    description: '',
    entries: [],
    total_hours: 0,
    total_amount: 0
  };
} 