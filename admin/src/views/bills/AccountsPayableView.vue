<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import type { Bill } from '../../types/Bill';
import { getBills } from '../../api';

// State
const bills = ref<Bill[]>([]);
const isLoading = ref(true);
const error = ref<string | null>(null);

// Fetch bills on component mount
onMounted(async () => {
  await fetchBills();
});

// Fetch all bills
const fetchBills = async () => {
  isLoading.value = true;
  error.value = null;
  
  try {
    const result = await getBills();
    
    // Process bills to add state based on ClosedAt field
    const processedBills = result.map(bill => {
      // Add state property based on ClosedAt
      // If ClosedAt is null, it's a draft bill
      // If ClosedAt is not null, it's a paid bill
      // The backend doesn't explicitly set a state, but we need it for our UI
      const processedBill = {
        ...bill,
        state: bill.closed_at ? 'BILL_STATE_PAID' : 'BILL_STATE_DRAFT'
      };
      return processedBill;
    });
    
    bills.value = processedBills;
  } catch (err) {
    console.error('Error fetching bills:', err);
    error.value = 'Failed to load bills. Please try again.';
  } finally {
    isLoading.value = false;
  }
};

// Format date for display
const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString();
};

// Format bill number as YYYYNNNN where YYYY is the year of accepted_at date
// and NNNN is the zero-padded 4-digit bill ID
const formatBillNumber = (bill: Bill): string => {
  // Default to current year if no accepted_at date
  let year = new Date().getFullYear();
  
  // If bill has an accepted_at date, use its year 
  if (bill.accepted_at) {
    year = new Date(bill.accepted_at).getFullYear();
  } else if (bill.date_created) {
    // Fall back to date_created if needed
    year = new Date(bill.date_created).getFullYear();
  }
  
  // Zero pad the bill ID to 4 digits
  const paddedId = bill.ID.toString().padStart(4, '0');
  
  return `${year}${paddedId}`;
};

// Format currency for display
const formatCurrency = (amount: number) => {
  // Divide by 100 to convert from cents to dollars
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount / 100);
};

// Check if bill has a PDF file attached
const hasBillFile = (bill: Bill): boolean => {
  return !!bill.file;
};

// Get file URL for the bill
const getBillFileUrl = (bill: Bill): string => {
  return bill.file || '';
};

// Calculate summary statistics for the dashboard
const billStats = computed(() => {
  if (!bills.value.length) {
    return [
      { name: 'Total Draft Bills', value: '$0.00' },
      { name: 'Total Paid', value: '$0.00' },
      { name: 'Total Hours', value: '0', unit: 'hrs' },
      { name: 'Avg Rate', value: '$0.00', unit: '/hr' }
    ];
  }
  
  let totalDraft = 0;
  let totalPaid = 0;
  let totalHours = 0;
  let totalAmount = 0;
  
  bills.value.forEach(bill => {
    totalHours += bill.total_hours || 0;
    totalAmount += bill.total_amount;
    
    if (bill.state === 'BILL_STATE_DRAFT') {
      totalDraft += bill.total_amount;
    } else if (bill.state === 'BILL_STATE_PAID') {
      totalPaid += bill.total_amount;
    }
  });
  
  // Calculate average hourly rate across all bills
  const avgRate = totalHours > 0 ? totalAmount / totalHours : 0;
  
  return [
    { name: 'Total Draft Bills', value: formatCurrency(totalDraft) },
    { name: 'Total Paid', value: formatCurrency(totalPaid) },
    { name: 'Total Hours', value: totalHours.toFixed(1), unit: 'hrs' },
    { name: 'Avg Rate', value: formatCurrency(avgRate), unit: '/hr' }
  ];
});

// Group bills by state
const billsByState = computed(() => {
  // Define the order of states we want to display
  const stateOrder = [
    'BILL_STATE_DRAFT',
    'BILL_STATE_PAID',
    'BILL_STATE_VOID'
  ];
  
  const groups: { name: string, displayName: string, bills: Bill[] }[] = [];
  
  // Create a group for each bill state in our preferred order
  stateOrder.forEach(state => {
    const stateBills = bills.value
      .filter(bill => {
        return bill.state === state;
      })
      .sort((a, b) => {
        // Sort by period end date (newest first)
        return new Date(b.period_end).getTime() - new Date(a.period_end).getTime();
      });
    
    if (stateBills.length > 0) {
      groups.push({
        name: state,
        displayName: state.replace('BILL_STATE_', ''),
        bills: stateBills
      });
    }
  });
  
  return groups;
});

// Mark bill as paid
const markBillPaid = async (bill: Bill) => {
  try {
    const response = await fetch(`/api/bills/${bill.ID}/paid`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to mark bill as paid');
    }
    
    // Update the local state
    bill.state = 'BILL_STATE_PAID';
    await fetchBills(); // Refresh data from the backend
    
    // Show success message
    alert('Bill marked as paid successfully.');
  } catch (error) {
    console.error('Error marking bill as paid:', error);
    alert('Error marking bill as paid. Please try again.');
  }
};

// Void bill
const voidBill = async (bill: Bill) => {
  // Ask for confirmation before voiding
  if (!confirm('Are you sure you want to void this bill? This action cannot be undone.')) {
    return;
  }
  
  try {
    const response = await fetch(`/api/bills/${bill.ID}/void`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to void bill');
    }
    
    // Update the local state
    bill.state = 'BILL_STATE_VOID';
    await fetchBills(); // Refresh data from the backend
    
    // Show success message
    alert('Bill voided successfully.');
  } catch (error) {
    console.error('Error voiding bill:', error);
    alert('Error voiding bill. Please try again.');
  }
};
</script>

<template>
  <div class="px-3 sm:px-4 lg:px-6">
    <div class="sm:flex sm:items-center">
      <div class="sm:flex-auto">
        <h1 class="text-lg font-semibold text-blue">Accounts Payable</h1>
        <p class="mt-1 text-xs text-gray">Track and manage all payments to staff and vendors.</p>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="isLoading" class="flex flex-col items-center justify-center p-6 bg-white rounded-lg shadow mt-4">
      <i class="fas fa-spinner fa-spin text-3xl text-teal mb-3"></i>
      <span class="text-sm text-gray-dark">Loading accounts payable data...</span>
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
    
    <!-- Empty state -->
    <div v-if="bills.length === 0 && !isLoading" class="flex flex-col items-center justify-center p-6 bg-white rounded-lg shadow mt-4">
      <i class="fas fa-file-invoice text-4xl text-teal mb-3"></i>
      <p class="text-base font-medium text-gray-dark">No payables found</p>
      <p class="text-xs text-gray mb-3">Your accounts payable will appear here once they are created</p>
    </div>

    <!-- Stats dashboard -->
    <div v-if="bills.length > 0 && !isLoading" class="mt-4 mb-6">
      <div class="bg-gray-900 rounded-lg shadow">
        <div class="mx-auto max-w-7xl">
          <div class="grid grid-cols-1 gap-px bg-white/5 sm:grid-cols-2 lg:grid-cols-4 rounded-lg overflow-hidden">
            <div v-for="stat in billStats" :key="stat.name" class="bg-gray-900 px-3 py-4 sm:px-4 lg:px-6">
              <p class="text-xs font-medium text-gray-400">{{ stat.name }}</p>
              <p class="mt-1 flex items-baseline gap-x-2">
                <span class="text-3xl font-semibold tracking-tight text-white">{{ stat.value }}</span>
                <span v-if="stat.unit" class="text-xs text-gray-400">{{ stat.unit }}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Bills by state -->
    <div v-if="bills.length > 0 && !isLoading" class="mt-6 flow-root">
      <div class="-mx-3 -my-2 overflow-x-auto sm:-mx-4 lg:-mx-6">
        <div class="inline-block min-w-full py-2 align-middle sm:px-4 lg:px-6">
          <table class="min-w-full divide-y divide-gray-200">
            <template v-for="group in billsByState" :key="group.name">
              <thead>
                <tr>
                  <th colspan="6" scope="colgroup" class="bg-gray-50 py-1.5 pl-3 pr-2 text-left text-xs font-semibold text-gray-900 sm:pl-2">
                    {{ group.displayName }} ({{ group.bills.length }})
                  </th>
                </tr>
                <tr class="border-b border-gray-100">
                  <th scope="col" class="py-2 pl-3 pr-2 text-left text-xs font-medium text-gray-700 sm:pl-2">Bill #</th>
                  <th scope="col" class="px-2 py-2 text-left text-xs font-medium text-gray-700">Staff/Vendor</th>
                  <th scope="col" class="px-2 py-2 text-left text-xs font-medium text-gray-700">Period</th>
                  <th scope="col" class="px-2 py-2 text-left text-xs font-medium text-gray-700">Hours</th>
                  <th scope="col" class="px-2 py-2 text-right text-xs font-medium text-gray-700">Amount</th>
                  <th scope="col" class="px-2 py-2 text-center text-xs font-medium text-gray-700">PDF</th>
                  <th scope="col" class="px-2 py-2 text-center text-xs font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-100">
                <tr v-for="bill in group.bills" :key="bill.ID" 
                    class="hover:bg-gray-50 transition-colors duration-150">
                  <td class="whitespace-nowrap py-1.5 pl-3 pr-2 text-xs font-medium text-gray-900 sm:pl-2">
                    {{ formatBillNumber(bill) }}
                  </td>
                  <td class="whitespace-nowrap px-2 py-1.5 text-xs text-gray-600">
                    {{ bill.user?.first_name }} {{ bill.user?.last_name }}
                    <div v-if="bill.vendor_name" class="text-xs text-gray-400">
                      {{ bill.vendor_name }}
                    </div>
                  </td>
                  <td class="whitespace-nowrap px-2 py-1.5 text-xs text-gray-600">
                    {{ formatDate(bill.period_start) }} - {{ formatDate(bill.period_end) }}
                  </td>
                  <td class="whitespace-nowrap px-2 py-1.5 text-xs text-gray-600">
                    {{ bill.total_hours.toFixed(1) }}
                  </td>
                  <td class="whitespace-nowrap px-2 py-1.5 text-xs text-right font-medium">
                    {{ formatCurrency(bill.total_amount) }}
                  </td>
                  <td class="whitespace-nowrap px-2 py-1.5 text-xs text-center">
                    <a v-if="hasBillFile(bill)" 
                       :href="getBillFileUrl(bill)" 
                       target="_blank" 
                       class="text-blue-600 hover:text-blue-800">
                      <i class="fas fa-file-pdf"></i>
                    </a>
                    <span v-else class="text-gray-300">
                      <i class="fas fa-file-pdf"></i>
                    </span>
                  </td>
                  <td class="whitespace-nowrap px-2 py-1.5 text-xs text-center">
                    <!-- Action buttons for DRAFT state -->
                    <div v-if="bill.state === 'BILL_STATE_DRAFT'" class="flex flex-col space-y-1">
                      <button 
                        @click="markBillPaid(bill)"
                        class="bg-green-600 text-white py-1 px-3 rounded-md text-xs font-medium hover:bg-green-700 transition-colors w-24 mx-auto"
                      >
                        <i class="fas fa-check mr-1"></i> Mark Paid
                      </button>
                      <button 
                        @click="voidBill(bill)"
                        class="border border-gray-300 text-gray-700 py-1 px-3 rounded-md text-xs font-medium hover:bg-gray-100 transition-colors mt-1 w-24 mx-auto"
                      >
                        <i class="fas fa-ban mr-1"></i> Void
                      </button>
                    </div>
                    <!-- For other states, show only relevant actions -->
                    <div v-else-if="bill.state === 'BILL_STATE_PAID'">
                      <button 
                        @click="voidBill(bill)"
                        class="border border-gray-300 text-gray-700 py-1 px-3 rounded-md text-xs font-medium hover:bg-gray-100 transition-colors w-24 mx-auto"
                      >
                        <i class="fas fa-ban mr-1"></i> Void
                      </button>
                    </div>
                    <div v-else>
                      <!-- No actions for voided bills -->
                      <span class="text-xs text-gray-400">No actions available</span>
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