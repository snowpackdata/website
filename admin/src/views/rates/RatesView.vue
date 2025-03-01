<script setup lang="ts">
import { ref, onMounted } from 'vue';
import type { Rate } from '../../types/Rate';
import { createEmptyRate, RATE_TYPES, RATE_TYPE_NAMES } from '../../types/Rate';

// State
const rates = ref<Rate[]>([]);
const isLoading = ref(true);
const error = ref<string | null>(null);
const showModal = ref(false);
const editingRate = ref<Rate | null>(null);

// Mock API - This would be replaced with actual API calls
const ratesApi = {
  async getRates(): Promise<Rate[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    return [
      {
        ID: 1,
        type: 'RATE_TYPE_EXTERNAL_CLIENT_BILLABLE',
        name: 'Standard Rate',
        description: 'Standard hourly rate for most client work',
        amount: 150,
        internal: false,
        active: true
      },
      {
        ID: 2,
        type: 'RATE_TYPE_INTERNAL_PROJECT',
        name: 'Internal Project Rate',
        description: 'Rate for internal projects',
        amount: 75,
        internal: true,
        active: true
      }
    ];
  },
  async createRate(rate: Rate): Promise<Rate> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { ...rate, ID: Date.now() };
  },
  async updateRate(rate: Rate): Promise<Rate> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { ...rate };
  },
  async deleteRate(id: number): Promise<void> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
};

// Fetch rates on component mount
onMounted(async () => {
  await fetchRates();
});

// Fetch all rates
const fetchRates = async () => {
  isLoading.value = true;
  error.value = null;
  
  try {
    rates.value = await ratesApi.getRates();
  } catch (err) {
    console.error('Error fetching rates:', err);
    error.value = 'Failed to load rates. Please try again.';
  } finally {
    isLoading.value = false;
  }
};

// Create a new rate
const createNew = () => {
  editingRate.value = createEmptyRate();
  showModal.value = true;
};

// Edit rate
const editRate = (rate: Rate) => {
  editingRate.value = { ...rate };
  showModal.value = true;
};

// Close modal
const closeModal = () => {
  editingRate.value = null;
  showModal.value = false;
};

// Save rate
const saveRate = async () => {
  if (!editingRate.value) return;
  
  try {
    let savedRate;
    if (editingRate.value.ID === 0) {
      savedRate = await ratesApi.createRate(editingRate.value);
    } else {
      savedRate = await ratesApi.updateRate(editingRate.value);
    }
    
    // Update local rates list
    const index = rates.value.findIndex(r => r.ID === savedRate.ID);
    if (index !== -1) {
      rates.value[index] = savedRate;
    } else {
      rates.value.push(savedRate);
    }
    
    closeModal();
  } catch (err) {
    console.error('Error saving rate:', err);
    error.value = 'Failed to save rate. Please try again.';
  }
};

// Delete rate
const deleteRate = async (id: number) => {
  try {
    await ratesApi.deleteRate(id);
    rates.value = rates.value.filter(r => r.ID !== id);
    closeModal();
  } catch (err) {
    console.error('Error deleting rate:', err);
    error.value = 'Failed to delete rate. Please try again.';
  }
};

// Format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

// Get type display name
const getTypeDisplayName = (type: string) => {
  return RATE_TYPE_NAMES[type as keyof typeof RATE_TYPE_NAMES] || type;
};
</script>

<template>
  <div class="px-4 sm:px-6 lg:px-8">
    <div class="sm:flex sm:items-center">
      <div class="sm:flex-auto">
        <h1 class="text-xl font-semibold text-blue">Rates Management</h1>
        <p class="mt-2 text-sm text-gray">Define and manage billing rates.</p>
      </div>
      <div class="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
        <button @click="createNew" type="button" class="btn-primary">
          <i class="fas fa-plus mr-2"></i> New Rate
        </button>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="isLoading" class="flex flex-col items-center justify-center p-10 bg-white rounded-lg shadow mt-6">
      <i class="fas fa-spinner fa-spin text-4xl text-teal mb-4"></i>
      <span class="text-gray-dark">Loading rates...</span>
    </div>
    
    <!-- Error state -->
    <div v-else-if="error" class="flex flex-col items-center justify-center p-10 bg-white rounded-lg shadow mt-6">
      <i class="fas fa-exclamation-circle text-4xl text-red mb-4"></i>
      <span class="text-gray-dark mb-2">{{ error }}</span>
      <button @click="fetchRates" class="btn-secondary mt-4">
        <i class="fas fa-sync mr-2"></i> Retry
      </button>
    </div>
    
    <!-- Empty state -->
    <div v-else-if="rates.length === 0" class="flex flex-col items-center justify-center p-10 bg-white rounded-lg shadow mt-6">
      <i class="fas fa-calculator text-5xl text-teal mb-4"></i>
      <p class="text-lg font-medium text-gray-dark">No rates found</p>
      <p class="text-gray mb-4">Create a new rate to get started</p>
      <button @click="createNew" class="btn-primary">
        <i class="fas fa-plus mr-2"></i> Create First Rate
      </button>
    </div>
    
    <!-- Rates List -->
    <div v-else class="mt-8 flow-root">
      <div class="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div class="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
          <div class="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
            <table class="min-w-full divide-y divide-gray-300">
              <thead class="bg-gray-50">
                <tr>
                  <th scope="col" class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Name</th>
                  <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Type</th>
                  <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Amount</th>
                  <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                  <th scope="col" class="relative py-3.5 pl-3 pr-4 sm:pr-6">
                    <span class="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 bg-white">
                <tr v-for="rate in rates" :key="rate.ID" class="hover:bg-gray-50">
                  <td class="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                    {{ rate.name }}
                    <div class="text-xs text-gray-500">{{ rate.description }}</div>
                  </td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {{ getTypeDisplayName(rate.type) }}
                  </td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                    {{ formatCurrency(rate.amount) }}
                  </td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm">
                    <span :class="[
                      rate.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800',
                      'px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full'
                    ]">
                      {{ rate.active ? 'Active' : 'Inactive' }}
                    </span>
                  </td>
                  <td class="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                    <button @click="editRate(rate)" class="text-blue-600 hover:text-blue-900">
                      <i class="fas fa-edit mr-1"></i> Edit
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Rate Edit Modal -->
    <div v-if="showModal && editingRate" class="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
        <div class="px-4 py-5 sm:px-6 border-b border-gray-200">
          <div class="flex justify-between">
            <h3 class="text-lg font-medium text-gray-900">
              {{ editingRate.ID === 0 ? 'New Rate' : 'Edit Rate' }}
            </h3>
            <button @click="closeModal" class="text-gray-400 hover:text-gray-500">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>
        <div class="px-4 py-5 sm:p-6">
          <div class="space-y-4">
            <div>
              <label for="name" class="block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                id="name"
                v-model="editingRate.name"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label for="type" class="block text-sm font-medium text-gray-700">Type</label>
              <select
                id="type"
                v-model="editingRate.type"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option v-for="type in RATE_TYPES" :key="type" :value="type">
                  {{ getTypeDisplayName(type) }}
                </option>
              </select>
            </div>
            <div>
              <label for="amount" class="block text-sm font-medium text-gray-700">Amount</label>
              <div class="mt-1 relative rounded-md shadow-sm">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span class="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  type="number"
                  id="amount"
                  v-model="editingRate.amount"
                  step="0.01"
                  min="0"
                  class="pl-7 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
            </div>
            <div>
              <label for="description" class="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                id="description"
                v-model="editingRate.description"
                rows="3"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              ></textarea>
            </div>
            <div class="flex items-center">
              <input
                id="active"
                type="checkbox"
                v-model="editingRate.active"
                class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label for="active" class="ml-2 block text-sm text-gray-900">Active</label>
            </div>
          </div>
        </div>
        <div class="px-4 py-3 bg-gray-50 text-right sm:px-6 flex justify-between">
          <div v-if="editingRate.ID !== 0">
            <button 
              type="button"
              @click="deleteRate(editingRate.ID)"
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
              @click="saveRate"
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

.btn-danger {
  display: inline-flex;
  align-items: center;
  padding: 0.5rem 1rem;
  border: 1px solid transparent;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: white;
  background-color: #dc2626;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

.btn-danger:hover {
  background-color: #b91c1c;
}
</style> 