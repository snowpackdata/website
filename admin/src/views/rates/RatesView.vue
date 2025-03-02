<script setup lang="ts">
import { ref, onMounted } from 'vue';
import type { Rate } from '../../types/Rate';
import { fetchAll, fetchById, createWithFormData, updateWithFormData, remove } from '../../api/apiUtils';
// @ts-ignore - Ignore type issues with Vue components for now
import RateDrawer from '../../components/rates/RateDrawer.vue';
// @ts-ignore - Ignore type issues with Vue components for now
import ConfirmationModal from '../../components/ConfirmationModal.vue';
import { formatDate } from '../../utils/formatters';

// State
const rates = ref<Rate[]>([]);
const isLoading = ref(true);
const error = ref<string | null>(null);
const showDrawer = ref(false);
const selectedRate = ref<Rate | null>(null);
const showDeleteConfirm = ref(false);

// Mock API - This would be replaced with actual API calls
// Commented out as it's not being used
/*
const ratesApi = {
  async getRates(): Promise<Rate[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    return [
      // ... mock data ...
    ];
  }
};
*/

// Fetch rates on component mount
onMounted(async () => {
  await fetchRatesData();
});

// Fetch all rates
const fetchRatesData = async () => {
  isLoading.value = true;
  error.value = null;
  
  try {
    console.log('Fetching rates from API...');
    // Direct API call using fetchAll
    const response = await fetchAll<Rate>('rates');
    console.log('Raw API response:', response);
    
    if (!response || !Array.isArray(response)) {
      console.error('Invalid response format - expected array but got:', typeof response);
      error.value = 'Invalid response format from API';
      rates.value = [];
      return;
    }
    
    // Map the response to ensure it has the expected structure
    rates.value = response.map(rate => ({
      ID: rate.ID,
      name: rate.name || '',
      amount: Number(rate.amount) || 0,
      active_from: rate.active_from || new Date().toISOString().split('T')[0],
      active_to: rate.active_to || '',
      internal_only: !!rate.internal_only,
      // We don't need to map CreatedAt, UpdatedAt, DeletedAt as they're optional
    }));
    
    console.log('Processed rates:', rates.value);
  } catch (err) {
    console.error('Error fetching rates:', err);
    error.value = 'Failed to load rates. Please try again.';
    rates.value = [];
  } finally {
    isLoading.value = false;
  }
};

// Create a new rate
/*
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
*/

// Save rate
const saveRate = async (rateData: Rate) => {
  try {
    if (rateData.ID && rateData.ID > 0) {
      // Convert string ID to number before passing to API
      const preparedData = prepareRateData(rateData);
      await updateWithFormData<Rate>('rates', Number(rateData.ID), preparedData);
    } else {
      const preparedData = prepareRateData(rateData);
      await createWithFormData<Rate>('rates', preparedData);
    }
    
    // Refresh rates
    await fetchRatesData();
    
    // Close drawer
    closeDrawer();
  } catch (error) {
    console.error('Error saving rate:', error);
    alert('Failed to save rate. Please try again.');
  }
};

/**
 * Prepares rate data for the API
 * @param rate - Rate data to transform
 * @returns Formatted data for API requests
 */
const prepareRateData = (rate: Rate): FormData => {
  const formData = new FormData();
  
  // Set required fields
  formData.set("name", rate.name);
  formData.set("amount", rate.amount.toString());
  formData.set("active_from", rate.active_from);
  
  // Add optional fields
  if (rate.active_to) {
    formData.set("active_to", rate.active_to);
  }
  
  if (rate.internal_only !== undefined) {
    formData.set("internal_only", rate.internal_only ? "true" : "false");
  }
  
  return formData;
};

// Delete rate
/*
const confirmDelete = (rate: Rate) => {
  rateToDelete.value = rate;
  showDeleteConfirm.value = true;
};
*/

// Format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

// Drawer functions
const openDrawer = (rate: Rate | null = null) => {
  selectedRate.value = rate;
  showDrawer.value = true;
};

const closeDrawer = () => {
  showDrawer.value = false;
  selectedRate.value = null;
};

const handleDeleteFromDrawer = async (rate: Rate) => {
  if (!rate) return;
  
  try {
    // Convert string ID to number before passing to API
    await remove('rates', Number(rate.ID));
    
    // Refresh rates
    await fetchRatesData();
    // Close drawer
    closeDrawer();
  } catch (error) {
    console.error('Error deleting rate:', error);
    alert('Failed to delete rate. Please try again.');
  }
};

// Check if a rate is currently active
const isRateActive = (rate: Rate) => {
  const now = new Date();
  const activeFrom = new Date(rate.active_from);
  const activeTo = rate.active_to ? new Date(rate.active_to) : null;
  
  return now >= activeFrom && (!activeTo || now <= activeTo);
};
</script>

<template>
  <div class="px-4 py-6 sm:px-6 lg:px-8">
    <div class="sm:flex sm:items-center">
      <div class="sm:flex-auto">
        <h1 class="text-base font-semibold leading-6 text-gray-900">Rates</h1>
        <p class="mt-2 text-sm text-gray-700">
          A list of all rates including their name, type, amount, and effective dates.
        </p>
      </div>
      <div class="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
        <button
          type="button"
          @click="openDrawer()"
          class="block rounded-md bg-sage px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-sage-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage"
        >
          Create new rate
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
      <button @click="fetchRatesData" class="btn-secondary mt-4">
        <i class="fas fa-sync mr-2"></i> Retry
      </button>
    </div>
    
    <!-- Rate Table -->
    <div v-else class="mt-8 flow-root">
      <div class="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div class="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
          <div class="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
            <table class="min-w-full divide-y divide-gray-300">
              <thead class="bg-gray-50">
                <tr>
                  <th scope="col" class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Name</th>
                  <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Amount</th>
                  <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Start Date</th>
                  <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">End Date</th>
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
                  </td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                    {{ formatCurrency(rate.amount) }}
                  </td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {{ formatDate(rate.active_from) }}
                  </td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {{ formatDate(rate.active_to) }}
                  </td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm">
                    <span :class="[
                      isRateActive(rate) ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800',
                      'px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full'
                    ]">
                      {{ isRateActive(rate) ? 'Active' : 'Inactive' }}
                    </span>
                  </td>
                  <td class="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                    <button
                      @click="openDrawer(rate)"
                      class="text-sage hover:text-sage-dark rounded-full p-1 hover:bg-gray-100 transition-colors"
                      title="Edit Rate"
                    >
                      <i class="fas fa-pencil-alt"></i>
                    </button>
                  </td>
                </tr>
                <tr v-if="rates.length === 0">
                  <td colspan="6" class="px-3 py-4 text-sm text-gray-500 text-center">
                    No rates found. Click "Create new rate" to add one.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Rate Drawer -->
    <RateDrawer
      :is-open="showDrawer"
      :rate-data="selectedRate"
      @close="closeDrawer"
      @save="saveRate"
      @delete="handleDeleteFromDrawer"
    />
    
    <!-- Delete Confirmation Modal -->
    <ConfirmationModal
      :show="showDeleteConfirm"
      title="Delete Rate"
      message="Are you sure you want to delete this rate? This action cannot be undone and may affect billing codes that use this rate."
      @confirm="selectedRate && handleDeleteFromDrawer(selectedRate)"
      @cancel="showDeleteConfirm = false"
    />
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