// Export all API services
import accountsAPI from './accounts';
import billingCodesAPI from './billingCodes';
import projectsAPI from './projects';
import ratesAPI from './rates';
import timesheetAPI from './timesheet';
import invoicesAPI from './invoices';
import billsAPI from './bills';

// Import specific functions to resolve naming conflicts
import {
  fetchAccounts, getAccount, createAccount, updateAccount, deleteAccount, inviteUser
} from './accounts';

import {
  getBillingCodes, getBillingCode, createBillingCode, updateBillingCode, deleteBillingCode,
  getActiveBillingCodes as getBillingCodesActive, // Rename to avoid conflict
  getProjectBillingCodes, addBillingCodeToProject, removeBillingCodeFromProject
} from './billingCodes';

import {
  getEntries, getEntry, getUsers, getActiveBillingCodes as getTimesheetActiveBillingCodes, // Rename to avoid conflict
  createEntry, updateEntry, deleteEntry, getEntriesByDateRange, getEntriesByUser, getEntriesByProject
} from './timesheet';

import {
  getInvoices, getInvoice, createInvoice, updateInvoice, deleteInvoice,
  changeInvoiceState, getDraftInvoices
} from './invoices';

import {
  getBills, getBill, createBill, updateBill, deleteBill, changeBillState
} from './bills';

// Export default APIs
export {
  accountsAPI,
  billingCodesAPI,
  projectsAPI,
  ratesAPI,
  timesheetAPI,
  invoicesAPI,
  billsAPI
};

// Export individual functions from projects and rates (via wildcard since no conflicts)
export * from './projects';
export * from './rates';

// Export utility functions
export * from './apiUtils';

// Re-export individual account functions
export {
  fetchAccounts, getAccount, createAccount, updateAccount, deleteAccount, inviteUser
};

// Re-export individual billing code functions
export {
  getBillingCodes, getBillingCode, createBillingCode, updateBillingCode, deleteBillingCode,
  getBillingCodesActive as getActiveBillingCodes, // Keep original name in exported API
  getProjectBillingCodes, addBillingCodeToProject, removeBillingCodeFromProject
};

// Re-export individual timesheet functions
export {
  getEntries, getEntry, getUsers, getTimesheetActiveBillingCodes,
  createEntry, updateEntry, deleteEntry, getEntriesByDateRange, getEntriesByUser, getEntriesByProject
};

// Re-export individual invoice functions
export {
  getInvoices, getInvoice, createInvoice, updateInvoice, deleteInvoice,
  changeInvoiceState, getDraftInvoices
};

// Re-export individual bill functions
export {
  getBills, getBill, createBill, updateBill, deleteBill, changeBillState
}; 