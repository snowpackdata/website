<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import type { Invoice } from '../../types/Invoice';
import { getInvoices } from '../../api';

// State
const invoices = ref<Invoice[]>([]);
const isLoading = ref(true);
const error = ref<string | null>(null);
const successMessage = ref<string | null>(null);

// Fetch invoices on component mount
onMounted(async () => {
  await fetchInvoices();
});

// Fetch all invoices
const fetchInvoices = async () => {
  isLoading.value = true;
  error.value = null;
  
  try {
    invoices.value = await getInvoices();
  } catch (err) {
    console.error('Error fetching invoices:', err);
    error.value = 'Failed to load invoices. Please try again.';
  } finally {
    isLoading.value = false;
  }
};

// Action handlers for invoices
const markInvoicePaid = async (invoice: Invoice) => {
  try {
    const response = await fetch(`/api/invoices/${invoice.ID}/paid`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to mark invoice as paid: ${response.statusText}`);
    }
    
    successMessage.value = `Invoice #${formatInvoiceNumber(invoice)} has been marked as paid`;
    // Refresh invoices to get updated data
    await fetchInvoices();
    
    // Clear success message after 3 seconds
    setTimeout(() => {
      successMessage.value = null;
    }, 3000);
  } catch (err) {
    console.error('Error marking invoice as paid:', err);
    error.value = err instanceof Error ? err.message : 'Failed to mark invoice as paid';
  }
};

const sendInvoice = async (invoice: Invoice) => {
  try {
    const response = await fetch(`/api/invoices/${invoice.ID}/sent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to send invoice: ${response.statusText}`);
    }
    
    successMessage.value = `Invoice #${formatInvoiceNumber(invoice)} has been sent`;
    // Refresh invoices to get updated data
    await fetchInvoices();
    
    // Clear success message after 3 seconds
    setTimeout(() => {
      successMessage.value = null;
    }, 3000);
  } catch (err) {
    console.error('Error sending invoice:', err);
    error.value = err instanceof Error ? err.message : 'Failed to send invoice';
  }
};

const voidInvoice = async (invoice: Invoice) => {
  // First confirm with the user
  if (!confirm(`Are you sure you want to void invoice #${formatInvoiceNumber(invoice)}? This action cannot be undone.`)) {
    return; // User cancelled
  }
  
  try {
    const response = await fetch(`/api/invoices/${invoice.ID}/void`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to void invoice: ${response.statusText}`);
    }
    
    successMessage.value = `Invoice #${formatInvoiceNumber(invoice)} has been voided`;
    // Refresh invoices to get updated data
    await fetchInvoices();
    
    // Clear success message after 3 seconds
    setTimeout(() => {
      successMessage.value = null;
    }, 3000);
  } catch (err) {
    console.error('Error voiding invoice:', err);
    error.value = err instanceof Error ? err.message : 'Failed to void invoice';
  }
};

// Format date for display
const formatDate = (dateString: string | undefined | null): string => {
  if (!dateString) return '-';
  // Check for nonsensical dates (starting with 00, 0000-, or specific invalid date)
  if (dateString.startsWith('00') || dateString === '0001-01-01T00:00:00Z') return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString();
};

// Format invoice number as YYYYNNNN where YYYY is the year of accepted_at date
// and NNNN is the zero-padded 4-digit invoice ID
const formatInvoiceNumber = (invoice: Invoice): string => {
  // Default to current year if no accepted_at date
  let year = new Date().getFullYear();
  
  // If invoice has an accepted_at date, use its year
  if (invoice.accepted_at) {
    year = new Date(invoice.accepted_at).getFullYear();
  } else if (invoice.date_created) {
    // Fall back to date_created if needed
    year = new Date(invoice.date_created).getFullYear();
  }
  
  // Zero pad the invoice ID to 4 digits
  const paddedId = invoice.ID.toString().padStart(4, '0');
  
  return `${year}${paddedId}`;
};

// Format currency 
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

// Calculate days remaining until due or days overdue
const getDaysStatus = (invoice: Invoice): { text: string, className: string } => {
  // Only show "Paid" for invoices in PAID state, not for SENT or APPROVED
  if (invoice.state === 'INVOICE_STATE_PAID' && invoice.closed_at) {
    return { text: 'Paid', className: 'text-green-800' };
  }
  
  // Special case for APPROVED invoices with null or nonsensical due dates
  if (invoice.state === 'INVOICE_STATE_APPROVED' && 
      (!invoice.due_at || invoice.due_at.startsWith('00') || invoice.due_at === '0001-01-01T00:00:00Z')) {
    return { text: 'Not Sent', className: 'text-gray-600' };
  }
  
  const today = new Date();
  const due = new Date(invoice.due_at);
  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return { 
      text: `${Math.abs(diffDays)} days overdue`, 
      className: 'text-red-600 font-semibold'
    };
  } else if (diffDays === 0) {
    return { 
      text: 'Due today', 
      className: 'text-orange-600 font-semibold'
    };
  } else if (diffDays <= 7) {
    return { 
      text: `Due in ${diffDays} days`, 
      className: 'text-orange-500 font-semibold'
    };
  } else {
    return { 
      text: `Due in ${diffDays} days`, 
      className: 'text-gray-600'
    };
  }
};

// Check if invoice has a PDF file attached
const hasInvoiceFile = (invoice: Invoice): boolean => {
  return !!invoice.file;
};

// Get file URL for the invoice
const getInvoiceFileUrl = (invoice: Invoice): string => {
  return invoice.file || '';
};

// Calculate summary statistics for the dashboard
const invoiceStats = computed(() => {
  if (!invoices.value.length) {
    return [
      { name: 'Total Outstanding', value: '$0.00' },
      { name: 'Overdue', value: '$0.00' },
      { name: 'Due Soon (7 days)', value: '$0.00' },
      { name: 'Total Paid', value: '$0.00' }
    ];
  }
  
  let totalOutstanding = 0;
  let totalOverdue = 0;
  let totalDueSoon = 0;
  let totalPaid = 0;
  
  const today = new Date();
  
  invoices.value.forEach(invoice => {
    if (invoice.state === 'INVOICE_STATE_SENT' || invoice.state === 'INVOICE_STATE_APPROVED') {
      // Add to outstanding total
      totalOutstanding += invoice.total_amount;
      
      // Check if overdue or due soon
      if (invoice.due_at) {
        const dueDate = new Date(invoice.due_at);
        const diffTime = dueDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) {
          // Overdue
          totalOverdue += invoice.total_amount;
        } else if (diffDays <= 7) {
          // Due within a week
          totalDueSoon += invoice.total_amount;
        }
      }
    } else if (invoice.state === 'INVOICE_STATE_PAID') {
      totalPaid += invoice.total_amount;
    }
  });
  
  return [
    { name: 'Total Outstanding', value: formatCurrency(totalOutstanding) },
    { name: 'Overdue', value: formatCurrency(totalOverdue) },
    { name: 'Due Soon (7 days)', value: formatCurrency(totalDueSoon) },
    { name: 'Total Paid', value: formatCurrency(totalPaid) }
  ];
});

// Group invoices by state with custom order
const invoicesByState = computed(() => {
  // Define the order of states we want to display
  const stateOrder = [
    'INVOICE_STATE_SENT',
    'INVOICE_STATE_APPROVED',
    'INVOICE_STATE_DRAFT',
    'INVOICE_STATE_PAID',
    'INVOICE_STATE_VOID'
  ];
  
  const groups: { name: string, displayName: string, invoices: Invoice[] }[] = [];
  
  // Create a group for each invoice state in our preferred order
  stateOrder.forEach(state => {
    const stateInvoices = invoices.value
      .filter(invoice => invoice.state === state)
      .sort((a, b) => {
        // For active states, sort by due date (closest first)
        if (['INVOICE_STATE_SENT', 'INVOICE_STATE_APPROVED'].includes(state)) {
          return new Date(a.due_at).getTime() - new Date(b.due_at).getTime();
        }
        // For other states, sort by created date (newest first)
        return new Date(b.date_created).getTime() - new Date(a.date_created).getTime();
      });
    
    if (stateInvoices.length > 0) {
      groups.push({
        name: state,
        displayName: state.replace('INVOICE_STATE_', ''),
        invoices: stateInvoices
      });
    }
  });
  
  return groups;
});
</script>

<template>
  <div class="px-3 sm:px-4 lg:px-6">
    <div class="sm:flex sm:items-center">
      <div class="sm:flex-auto">
        <h1 class="text-lg font-semibold text-blue">Accounts Receivable</h1>
        <p class="mt-1 text-xs text-gray">Track and manage all incoming payments from your clients.</p>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="isLoading" class="flex flex-col items-center justify-center p-6 bg-white rounded-lg shadow mt-4">
      <i class="fas fa-spinner fa-spin text-3xl text-teal mb-3"></i>
      <span class="text-sm text-gray-dark">Loading accounts receivable data...</span>
    </div>
    
    <!-- Error notification -->
    <div v-if="error" class="rounded-md bg-red-50 p-3 mt-4">
      <div class="flex">
        <div class="flex-shrink-0">
          <i class="fas fa-exclamation-circle text-red-400"></i>
        </div>
        <div class="ml-3">
          <h3 class="text-xs font-medium text-red-800">Error</h3>
          <div class="mt-1 text-xs text-red-700">
            {{ error }}
          </div>
        </div>
      </div>
    </div>
    
    <!-- Success notification -->
    <div v-if="successMessage" class="rounded-md bg-green-50 p-3 mt-4">
      <div class="flex">
        <div class="flex-shrink-0">
          <i class="fas fa-check-circle text-green-400"></i>
        </div>
        <div class="ml-3">
          <h3 class="text-xs font-medium text-green-800">Success</h3>
          <div class="mt-1 text-xs text-green-700">
            {{ successMessage }}
          </div>
        </div>
      </div>
    </div>
    
    <!-- Empty state -->
    <div v-if="invoices.length === 0 && !isLoading" class="flex flex-col items-center justify-center p-6 bg-white rounded-lg shadow mt-4">
      <i class="fas fa-file-invoice-dollar text-4xl text-teal mb-3"></i>
      <p class="text-base font-medium text-gray-dark">No receivables found</p>
      <p class="text-xs text-gray mb-3">Your accounts receivable will appear here once they are created</p>
    </div>
    
    <!-- Stats dashboard -->
    <div v-if="invoices.length > 0 && !isLoading" class="mt-4 mb-6">
      <div class="bg-gray-900 rounded-lg shadow">
        <div class="mx-auto max-w-7xl">
          <div class="grid grid-cols-1 gap-px bg-white/5 sm:grid-cols-2 lg:grid-cols-4 rounded-lg overflow-hidden">
            <div v-for="stat in invoiceStats" :key="stat.name" class="bg-gray-900 px-3 py-4 sm:px-4 lg:px-6">
              <p class="text-xs font-medium text-gray-400">{{ stat.name }}</p>
              <p class="mt-1 flex items-baseline gap-x-2">
                <span class="text-3xl font-semibold tracking-tight text-white">{{ stat.value }}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Invoices by state -->
    <div v-if="invoices.length > 0 && !isLoading" class="mt-6 flow-root">
      <div class="-mx-3 -my-2 overflow-x-auto sm:-mx-4 lg:-mx-6">
        <div class="inline-block min-w-full py-2 align-middle sm:px-4 lg:px-6">
          <table class="min-w-full divide-y divide-gray-200">
            <template v-for="group in invoicesByState" :key="group.name">
              <thead>
                <tr>
                  <th colspan="8" scope="colgroup" class="bg-gray-50 py-1.5 pl-3 pr-2 text-left text-xs font-semibold text-gray-900 sm:pl-2">
                    {{ group.displayName }} ({{ group.invoices.length }})
                  </th>
                </tr>
                <tr class="border-b border-gray-100">
                  <th scope="col" class="py-2 pl-3 pr-2 text-left text-xs font-medium text-gray-700 sm:pl-2">Invoice #</th>
                  <th scope="col" class="px-2 py-2 text-left text-xs font-medium text-gray-700">Client</th>
                  <th scope="col" class="px-2 py-2 text-left text-xs font-medium text-gray-700">Project</th>
                  <th scope="col" class="px-2 py-2 text-left text-xs font-medium text-gray-700">Period</th>
                  <th scope="col" class="px-2 py-2 text-left text-xs font-medium text-gray-700">Due Date</th>
                  <th scope="col" class="px-2 py-2 text-right text-xs font-medium text-gray-700">Amount</th>
                  <th scope="col" class="px-2 py-2 text-center text-xs font-medium text-gray-700">PDF</th>
                  <th scope="col" class="px-2 py-2 text-center text-xs font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-100">
                <tr v-for="invoice in group.invoices" :key="invoice.ID"
                    class="hover:bg-gray-50 transition-colors duration-150">
                  <td class="whitespace-nowrap py-1.5 pl-3 pr-2 text-xs font-medium text-gray-900 sm:pl-2">
                    {{ formatInvoiceNumber(invoice) }}
                  </td>
                  <td class="whitespace-nowrap px-2 py-1.5 text-xs text-gray-600">
                    {{ invoice.account?.name || 'N/A' }}
                  </td>
                  <td class="whitespace-nowrap px-2 py-1.5 text-xs text-gray-600">
                    {{ invoice.project?.name || 'Multiple' }}
                  </td>
                  <td class="whitespace-nowrap px-2 py-1.5 text-xs text-gray-600">
                    {{ formatDate(invoice.period_start) }} - {{ formatDate(invoice.period_end) }}
                  </td>
                  <td class="whitespace-nowrap px-2 py-1.5 text-xs">
                    <div>{{ formatDate(invoice.due_at) }}</div>
                    <div v-if="group.name !== 'INVOICE_STATE_PAID' && group.name !== 'INVOICE_STATE_VOID'" 
                         :class="getDaysStatus(invoice).className">
                      {{ getDaysStatus(invoice).text }}
                    </div>
                    <div v-else-if="group.name === 'INVOICE_STATE_PAID'" class="text-xs text-green-600">
                      Paid on {{ formatDate(invoice.closed_at) }}
                    </div>
                  </td>
                  <td class="whitespace-nowrap px-2 py-1.5 text-xs text-right font-medium">
                    {{ formatCurrency(invoice.total_amount) }}
                  </td>
                  <td class="whitespace-nowrap px-2 py-1.5 text-xs text-center">
                    <a v-if="hasInvoiceFile(invoice)" 
                       :href="getInvoiceFileUrl(invoice)" 
                       target="_blank" 
                       class="text-blue-600 hover:text-blue-800">
                      <i class="fas fa-file-pdf"></i>
                    </a>
                    <span v-else class="text-gray-300">
                      <i class="fas fa-file-pdf"></i>
                    </span>
                  </td>
                  <!-- Action buttons column -->
                  <td class="whitespace-nowrap px-2 py-1.5 text-xs text-center">
                    <div class="flex flex-col space-y-1">
                      <!-- Primary action based on state -->
                      <button v-if="invoice.state === 'INVOICE_STATE_SENT'" 
                              @click="markInvoicePaid(invoice)"
                              class="bg-green-600 text-white py-1 px-3 rounded-md text-xs font-medium hover:bg-green-700 transition-colors">
                        <i class="fas fa-check mr-1"></i> Mark Paid
                      </button>
                      <button v-if="invoice.state === 'INVOICE_STATE_APPROVED'" 
                              @click="sendInvoice(invoice)"
                              class="bg-blue-600 text-white py-1 px-3 rounded-md text-xs font-medium hover:bg-blue-700 transition-colors">
                        <i class="fas fa-paper-plane mr-1"></i> Send
                      </button>
                      
                      <!-- Void action for both states -->
                      <button v-if="invoice.state === 'INVOICE_STATE_SENT' || invoice.state === 'INVOICE_STATE_APPROVED'"
                              @click="voidInvoice(invoice)"
                              class="border border-gray-300 text-gray-700 py-1 px-3 rounded-md text-xs font-medium hover:bg-gray-100 transition-colors mt-1">
                        <i class="fas fa-ban mr-1"></i> Void
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </template>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Make table more compact */
table {
  border-collapse: collapse;
  width: 100%;
}

td, th {
  line-height: 1.25;
}

/* Ensure alternating row colors for better readability */
tbody tr:nth-child(even) {
  background-color: rgba(249, 250, 251, 0.5);
}
</style> 