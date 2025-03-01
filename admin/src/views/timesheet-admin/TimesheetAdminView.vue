<script setup lang="ts">
import { ref, onMounted } from 'vue';

// Define TimesheetEntry interface
interface TimesheetEntry {
  id: number;
  user_name: string;
  project_name: string;
  date: string;
  hours: number;
  status: string;
}

// State
const entries = ref<TimesheetEntry[]>([]);
const isLoading = ref(true);
const error = ref<string | null>(null);

// Fetch timesheet entries on component mount
onMounted(async () => {
  await fetchTimesheetEntries();
});

// Fetch all timesheet entries
const fetchTimesheetEntries = async () => {
  isLoading.value = true;
  error.value = null;
  
  try {
    // Placeholder for API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock data for demonstration
    entries.value = [
      {
        id: 1,
        user_name: 'John Doe',
        project_name: 'Project Alpha',
        date: '2023-05-15',
        hours: 8,
        status: 'Approved'
      },
      {
        id: 2,
        user_name: 'Jane Smith',
        project_name: 'Project Beta',
        date: '2023-05-15',
        hours: 6.5,
        status: 'Pending'
      }
    ];
    
  } catch (err) {
    console.error('Error fetching timesheet entries:', err);
    error.value = 'Failed to load timesheet entries. Please try again.';
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

// Get status color
const getStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'approved':
      return 'bg-green-100 text-green-800';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'rejected':
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
        <h1 class="text-xl font-semibold text-blue">Timesheet Administration</h1>
        <p class="mt-2 text-sm text-gray">Review and manage timesheet entries across all users.</p>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="isLoading" class="flex flex-col items-center justify-center p-10 bg-white rounded-lg shadow mt-6">
      <i class="fas fa-spinner fa-spin text-4xl text-teal mb-4"></i>
      <span class="text-gray-dark">Loading timesheet entries...</span>
    </div>
    
    <!-- Error state -->
    <div v-else-if="error" class="flex flex-col items-center justify-center p-10 bg-white rounded-lg shadow mt-6">
      <i class="fas fa-exclamation-circle text-4xl text-red mb-4"></i>
      <span class="text-gray-dark mb-2">{{ error }}</span>
      <button @click="fetchTimesheetEntries" class="btn-secondary mt-4">
        <i class="fas fa-sync mr-2"></i> Retry
      </button>
    </div>
    
    <!-- Empty state -->
    <div v-else-if="entries.length === 0" class="flex flex-col items-center justify-center p-10 bg-white rounded-lg shadow mt-6">
      <i class="fas fa-clock text-5xl text-teal mb-4"></i>
      <p class="text-lg font-medium text-gray-dark">No timesheet entries found</p>
      <p class="text-gray mb-4">Timesheet entries will appear here once they are submitted</p>
    </div>
    
    <!-- Timesheet entries list -->
    <div v-else class="mt-6 bg-white shadow overflow-hidden sm:rounded-md">
      <table class="min-w-full divide-y divide-gray-300">
        <thead>
          <tr>
            <th scope="col" class="py-3.5 pl-4 pr-3 text-left text-sm font-medium text-gray-900">Employee</th>
            <th scope="col" class="px-3 py-3.5 text-left text-sm font-medium text-gray-900">Project</th>
            <th scope="col" class="px-3 py-3.5 text-left text-sm font-medium text-gray-900">Date</th>
            <th scope="col" class="px-3 py-3.5 text-left text-sm font-medium text-gray-900">Hours</th>
            <th scope="col" class="px-3 py-3.5 text-left text-sm font-medium text-gray-900">Status</th>
            <th scope="col" class="relative py-3.5 pl-3 pr-4 sm:pr-6">
              <span class="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200 bg-white">
          <tr v-for="entry in entries" :key="entry.id">
            <td class="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">{{ entry.user_name }}</td>
            <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{{ entry.project_name }}</td>
            <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{{ formatDate(entry.date) }}</td>
            <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{{ entry.hours }}</td>
            <td class="whitespace-nowrap px-3 py-4 text-sm">
              <span :class="[getStatusColor(entry.status), 'px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full']">
                {{ entry.status }}
              </span>
            </td>
            <td class="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
              <button class="text-indigo-600 hover:text-indigo-900">
                <i class="fas fa-check-circle mr-1"></i> Approve
              </button>
              <button class="text-red-600 hover:text-red-900 ml-3">
                <i class="fas fa-times-circle mr-1"></i> Reject
              </button>
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