<script setup lang="ts">
import { ref, onMounted } from 'vue';

// Define BillingCode interface
interface BillingCode {
  id: number;
  code: string;
  name: string;
  description: string;
  rate_amount: number;
  active: boolean;
}

// State
const billingCodes = ref<BillingCode[]>([]);
const isLoading = ref(true);
const error = ref<string | null>(null);

// Fetch billing codes on component mount
onMounted(async () => {
  await fetchBillingCodes();
});

// Fetch all billing codes
const fetchBillingCodes = async () => {
  isLoading.value = true;
  error.value = null;
  
  try {
    // Placeholder for API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    billingCodes.value = []; // This would be populated from an API
    
  } catch (err) {
    console.error('Error fetching billing codes:', err);
    error.value = 'Failed to load billing codes. Please try again.';
  } finally {
    isLoading.value = false;
  }
};

// Get status color based on active state
const getStatusColor = (active: boolean) => {
  return active 
    ? 'bg-green-100 text-green-800'
    : 'bg-red-100 text-red-800';
};
</script>

<template>
  <div class="px-4 sm:px-6 lg:px-8">
    <div class="sm:flex sm:items-center">
      <div class="sm:flex-auto">
        <h1 class="text-xl font-semibold text-blue">Billing Codes</h1>
        <p class="mt-2 text-sm text-gray">Manage billing codes used for time tracking and invoicing.</p>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="isLoading" class="flex flex-col items-center justify-center p-10 bg-white rounded-lg shadow mt-6">
      <i class="fas fa-spinner fa-spin text-4xl text-teal mb-4"></i>
      <span class="text-gray-dark">Loading billing codes...</span>
    </div>
    
    <!-- Error state -->
    <div v-else-if="error" class="flex flex-col items-center justify-center p-10 bg-white rounded-lg shadow mt-6">
      <i class="fas fa-exclamation-circle text-4xl text-red mb-4"></i>
      <span class="text-gray-dark mb-2">{{ error }}</span>
      <button @click="fetchBillingCodes" class="btn-secondary mt-4">
        <i class="fas fa-sync mr-2"></i> Retry
      </button>
    </div>
    
    <!-- Empty state -->
    <div v-else-if="billingCodes.length === 0" class="flex flex-col items-center justify-center p-10 bg-white rounded-lg shadow mt-6">
      <i class="fas fa-tags text-5xl text-teal mb-4"></i>
      <p class="text-lg font-medium text-gray-dark">No billing codes found</p>
      <p class="text-gray mb-4">Billing codes will appear here once they are created</p>
    </div>
    
    <!-- Billing codes list -->
    <div v-else class="mt-6 bg-white shadow overflow-hidden sm:rounded-md">
      <table class="min-w-full divide-y divide-gray-300">
        <thead>
          <tr>
            <th scope="col" class="py-3.5 pl-4 pr-3 text-left text-sm font-medium text-gray-900">Code</th>
            <th scope="col" class="px-3 py-3.5 text-left text-sm font-medium text-gray-900">Name</th>
            <th scope="col" class="px-3 py-3.5 text-left text-sm font-medium text-gray-900">Description</th>
            <th scope="col" class="px-3 py-3.5 text-left text-sm font-medium text-gray-900">Rate</th>
            <th scope="col" class="px-3 py-3.5 text-left text-sm font-medium text-gray-900">Status</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200 bg-white">
          <tr v-for="code in billingCodes" :key="code.id">
            <td class="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">{{ code.code }}</td>
            <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{{ code.name }}</td>
            <td class="px-3 py-4 text-sm text-gray-500">{{ code.description }}</td>
            <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">${{ code.rate_amount.toFixed(2) }}</td>
            <td class="whitespace-nowrap px-3 py-4 text-sm">
              <span :class="[getStatusColor(code.active), 'px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full']">
                {{ code.active ? 'Active' : 'Inactive' }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
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

.btn-secondary:focus {
  outline: none;
}
</style> 