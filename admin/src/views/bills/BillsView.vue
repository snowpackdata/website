<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import type { Bill } from '../../types/Bill';
import { createEmptyBill, BILL_STATES } from '../../types/Bill';
import { getBills, createBill, updateBill, deleteBill as deleteBillAPI } from '../../api';

// State
const bills = ref<Bill[]>([]);
const selectedBill = ref<Bill | null>(null);
const isLoading = ref(true);
const error = ref<string | null>(null);
const showModal = ref(false);

// Fetch bills on component mount
onMounted(async () => {
  await fetchBills();
});

// Fetch all bills
const fetchBills = async () => {
  isLoading.value = true;
  error.value = null;
  
  try {
    bills.value = await getBills();
  } catch (err) {
    console.error('Error fetching bills:', err);
    error.value = 'Failed to load bills. Please try again.';
  } finally {
    isLoading.value = false;
  }
};

// Create a new bill
const createNew = () => {
  selectedBill.value = createEmptyBill();
  showModal.value = true;
};

// View bill details
const viewBill = (bill: Bill) => {
  selectedBill.value = { ...bill };
  showModal.value = true;
};

// Close modal
const closeModal = () => {
  selectedBill.value = null;
  showModal.value = false;
};

// Save bill
const saveBill = async () => {
  if (!selectedBill.value) return;
  
  try {
    let savedBill;
    if (selectedBill.value.ID === 0) {
      savedBill = await createBill(selectedBill.value);
    } else {
      savedBill = await updateBill(selectedBill.value);
    }
    
    // Update local bills list
    const index = bills.value.findIndex(b => b.ID === savedBill.ID);
    if (index !== -1) {
      bills.value[index] = savedBill;
    } else {
      bills.value.unshift(savedBill);
    }
    
    closeModal();
  } catch (err) {
    console.error('Error saving bill:', err);
    error.value = 'Failed to save bill. Please try again.';
  }
};

// Delete bill
const deleteBill = async (id: number) => {
  try {
    await deleteBillAPI(id);
    bills.value = bills.value.filter(b => b.ID !== id);
    closeModal();
  } catch (err) {
    console.error('Error deleting bill:', err);
    error.value = 'Failed to delete bill. Please try again.';
  }
};

// Format currency for display
const formatCurrency = (amount: number) => {
  // Divide by 100 to convert from cents to dollars
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount / 100);
};

// Format date for display
const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

// Group bills by state
const billsByState = computed(() => {
  const groups: { name: string, displayName: string, bills: Bill[] }[] = [];
  
  // Create a group for each bill state
  BILL_STATES.forEach(state => {
    const stateBills = bills.value.filter(bill => bill.state === state);
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

// Get state color class
const getStateColorClass = (state: string) => {
  switch (state) {
    case 'BILL_STATE_DRAFT':
      return 'bg-yellow-100 text-yellow-800';
    case 'BILL_STATE_PAID':
      return 'bg-green-100 text-green-800';
    case 'BILL_STATE_VOID':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};
</script>

<template>
  <div class="px-4 sm:px-6 lg:px-8">
    <div class="sm:flex sm:items-center">
      <div class="sm:flex-auto">
        <h1 class="text-xl font-semibold text-blue">Bills Management</h1>
        <p class="mt-2 text-sm text-gray">Track and manage bills from vendors.</p>
      </div>
      <div class="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
        <button @click="createNew" type="button" class="btn-primary">
          <i class="fas fa-plus mr-2"></i> New Bill
        </button>
      </div>
    </div>
    
    <!-- Loading state -->
    <div v-if="isLoading" class="flex flex-col items-center justify-center p-10 bg-white rounded-lg shadow mt-6">
      <i class="fas fa-spinner fa-spin text-4xl text-teal mb-4"></i>
      <span class="text-gray-dark">Loading bills...</span>
    </div>
    
    <!-- Error state -->
    <div v-else-if="error" class="flex flex-col items-center justify-center p-10 bg-white rounded-lg shadow mt-6">
      <i class="fas fa-exclamation-circle text-4xl text-red mb-4"></i>
      <span class="text-gray-dark mb-2">{{ error }}</span>
      <button @click="fetchBills" class="btn-secondary mt-4">
        <i class="fas fa-sync mr-2"></i> Retry
      </button>
    </div>
    
    <!-- Empty state -->
    <div v-else-if="bills.length === 0" class="flex flex-col items-center justify-center p-10 bg-white rounded-lg shadow mt-6">
      <i class="fas fa-file-invoice text-5xl text-teal mb-4"></i>
      <p class="text-lg font-medium text-gray-dark">No bills found</p>
      <p class="text-gray mb-4">Create a new bill to get started</p>
      <button @click="createNew" class="btn-primary">
        <i class="fas fa-plus mr-2"></i> Create First Bill
      </button>
    </div>
    
    <!-- Bills Table with Grouped Headings -->
    <div v-else class="mt-8 flow-root">
      <div class="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div class="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
          <table class="min-w-full">
            <thead class="bg-white">
              <tr>
                <th scope="col" class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-3">Bill #</th>
                <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Vendor</th>
                <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Issue Date</th>
                <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Due Date</th>
                <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Amount</th>
                <th scope="col" class="relative py-3.5 pl-3 pr-4 sm:pr-3">
                  <span class="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody class="bg-white">
              <template v-for="group in billsByState" :key="group.name">
                <tr class="border-t border-gray-200">
                  <th 
                    colspan="6" 
                    scope="colgroup" 
                    :class="[getStateColorClass(group.name), 'py-2 pl-4 pr-3 text-left text-sm font-semibold sm:pl-3']"
                  >
                    {{ group.displayName }}
                  </th>
                </tr>
                <tr 
                  v-for="(bill, billIdx) in group.bills" 
                  :key="bill.ID" 
                  :class="[billIdx === 0 ? 'border-gray-300' : 'border-gray-200', 'border-t']"
                >
                  <td class="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-3">
                    {{ bill.bill_number }}
                  </td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {{ bill.vendor_name }}
                  </td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {{ formatDate(bill.date_issued) }}
                  </td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {{ formatDate(bill.date_due) }}
                  </td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-900">
                    {{ formatCurrency(bill.total_amount) }}
                  </td>
                  <td class="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-3">
                    <button 
                      @click="viewBill(bill)" 
                      class="text-indigo-600 hover:text-indigo-900"
                    >
                      <i class="fas fa-eye mr-1"></i> View
                    </button>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </div>
    </div>
    
    <!-- Bill Modal (for Create/Edit/View) -->
    <div v-if="showModal && selectedBill" class="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden">
        <div class="px-4 py-5 sm:px-6 border-b border-gray-200">
          <div class="flex justify-between">
            <h3 class="text-lg font-medium text-gray-900">
              {{ selectedBill.ID === 0 ? 'New Bill' : 'Bill Details' }}
            </h3>
            <button @click="closeModal" class="text-gray-400 hover:text-gray-500">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>
        <div class="px-4 py-5 sm:p-6">
          <div class="space-y-4">
            <div class="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div class="sm:col-span-3">
                <label for="vendor_name" class="block text-sm font-medium text-gray-700">Vendor Name</label>
                <input
                  type="text"
                  id="vendor_name"
                  v-model="selectedBill.vendor_name"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div class="sm:col-span-3">
                <label for="bill_number" class="block text-sm font-medium text-gray-700">Bill Number</label>
                <input
                  type="text"
                  id="bill_number"
                  v-model="selectedBill.bill_number"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div class="sm:col-span-3">
                <label for="date_issued" class="block text-sm font-medium text-gray-700">Issue Date</label>
                <input
                  type="date"
                  id="date_issued"
                  v-model="selectedBill.date_issued"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div class="sm:col-span-3">
                <label for="date_due" class="block text-sm font-medium text-gray-700">Due Date</label>
                <input
                  type="date"
                  id="date_due"
                  v-model="selectedBill.date_due"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div class="sm:col-span-3">
                <label for="state" class="block text-sm font-medium text-gray-700">State</label>
                <select
                  id="state"
                  v-model="selectedBill.state"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option v-for="state in BILL_STATES" :key="state" :value="state">
                    {{ state.replace('BILL_STATE_', '') }}
                  </option>
                </select>
              </div>
              <div class="sm:col-span-3">
                <label for="total_amount" class="block text-sm font-medium text-gray-700">Total Amount</label>
                <input
                  type="number"
                  id="total_amount"
                  v-model="selectedBill.total_amount"
                  step="0.01"
                  min="0"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div class="sm:col-span-6">
                <label for="description" class="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  id="description"
                  v-model="selectedBill.description"
                  rows="3"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                ></textarea>
              </div>
            </div>
          </div>
        </div>
        <div class="px-4 py-3 bg-gray-50 text-right sm:px-6 flex justify-between">
          <div v-if="selectedBill.ID !== 0">
            <button 
              type="button"
              @click="deleteBill(selectedBill.ID)"
              class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none"
            >
              Delete
            </button>
          </div>
          <div>
            <button
              type="button"
              @click="closeModal"
              class="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none mr-3"
            >
              Cancel
            </button>
            <button
              type="button"
              @click="saveBill"
              class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Buttons */
.btn-primary {
  display: inline-flex;
  align-items: center;
  padding: 0.5rem 1rem;
  border: 1px solid transparent;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: white;
  background-color: #2563eb;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

.btn-primary:hover {
  background-color: #1d4ed8;
}

.btn-secondary {
  display: inline-flex;
  align-items: center;
  padding: 0.5rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  background-color: white;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

.btn-secondary:hover {
  background-color: #f9fafb;
}
</style> 