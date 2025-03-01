<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { type Invoice } from '../../types/Invoice';
import invoicesApi from '../../api/invoices';

// State
const invoices = ref<Invoice[]>([]);
const isLoading = ref(true);
const error = ref<string | null>(null);

// Fetch invoices on component mount
onMounted(async () => {
  await fetchInvoices();
});

// Fetch all invoices
const fetchInvoices = async () => {
  isLoading.value = true;
  error.value = null;
  
  try {
    // Placeholder for API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    invoices.value = await invoicesApi.getInvoices(); // This would be populated from an API
    
  } catch (err) {
    console.error('Error fetching invoices:', err);
    error.value = 'Failed to load invoices. Please try again.';
  } finally {
    isLoading.value = false;
  }
};

// Format date for display
const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString();
};
</script>

<template>
  <div class="px-4 sm:px-6 lg:px-8">
    <div class="sm:flex sm:items-center">
      <div class="sm:flex-auto">
        <h1 class="text-xl font-semibold text-blue">Invoices</h1>
        <p class="mt-2 text-sm text-gray">A list of all invoices including their status, amount, and date.</p>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="isLoading" class="flex flex-col items-center justify-center p-10 bg-white rounded-lg shadow mt-6">
      <i class="fas fa-spinner fa-spin text-4xl text-teal mb-4"></i>
      <span class="text-gray-dark">Loading invoices...</span>
    </div>
    
    <!-- Error state -->
    <div v-else-if="error" class="flex flex-col items-center justify-center p-10 bg-white rounded-lg shadow mt-6">
      <i class="fas fa-exclamation-circle text-4xl text-red mb-4"></i>
      <span class="text-gray-dark mb-2">{{ error }}</span>
      <button @click="fetchInvoices" class="btn-secondary mt-4">
        <i class="fas fa-sync mr-2"></i> Retry
      </button>
    </div>
    
    <!-- Empty state -->
    <div v-else-if="invoices.length === 0" class="flex flex-col items-center justify-center p-10 bg-white rounded-lg shadow mt-6">
      <i class="fas fa-file-invoice-dollar text-5xl text-teal mb-4"></i>
      <p class="text-lg font-medium text-gray-dark">No invoices found</p>
      <p class="text-gray mb-4">Invoices will appear here once they are created</p>
    </div>
    
    <!-- Invoices list placeholder -->
    <div v-else class="mt-6 bg-white shadow overflow-hidden sm:rounded-md">
      <table class="min-w-full divide-y divide-gray-300">
        <thead>
          <tr>
            <th scope="col" class="py-3.5 pl-4 pr-3 text-left text-sm font-medium text-gray-900">Invoice #</th>
            <th scope="col" class="px-3 py-3.5 text-left text-sm font-medium text-gray-900">Client</th>
            <th scope="col" class="px-3 py-3.5 text-left text-sm font-medium text-gray-900">Date</th>
            <th scope="col" class="px-3 py-3.5 text-left text-sm font-medium text-gray-900">Amount</th>
            <th scope="col" class="px-3 py-3.5 text-left text-sm font-medium text-gray-900">Status</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200 bg-white">
          <tr v-for="invoice in invoices" :key="invoice.ID">
            <td class="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">{{ invoice.invoice_number }}</td>
            <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{{ invoice.account_name }}</td>
            <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{{ formatDate(invoice.date_created) }}</td>
            <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">${{ invoice.total_amount.toFixed(2) }}</td>
            <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{{ invoice.state.replace('INVOICE_STATE_', '') }}</td>
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