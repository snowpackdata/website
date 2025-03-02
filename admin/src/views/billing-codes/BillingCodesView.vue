<template>
  <div class="px-4 py-6 sm:px-6 lg:px-8">
    <div class="sm:flex sm:items-center">
      <div class="sm:flex-auto">
        <h1 class="text-base font-semibold leading-6 text-gray-900">Billing Codes</h1>
        <p class="mt-2 text-sm text-gray-700">
          A list of all billing codes associated with projects and rates.
        </p>
      </div>
      <div class="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
        <button
          type="button"
          @click="openBillingCodeDrawer()"
          class="block rounded-md bg-sage px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-sage-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage"
        >
          Create new billing code
        </button>
      </div>
    </div>
    
    <!-- Project Filter (Commented out for now, can be re-enabled if needed) -->
    <!-- <div class="mt-4">
      <label for="project-filter" class="block text-sm font-medium text-gray-700">Filter by Project</label>
      <select
        id="project-filter"
        v-model="selectedProjectId"
        class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-sage focus:border-sage sm:text-sm rounded-md"
        @change="handleProjectChange"
      >
        <option value="">All Projects</option>
        <option v-for="project in projects" :key="project.id" :value="project.id">
          {{ project.name }}
        </option>
      </select>
    </div> -->
    
    <!-- Loading state -->
    <div v-if="isLoading" class="flex flex-col items-center justify-center p-10 bg-white rounded-lg shadow mt-6">
      <i class="fas fa-spinner fa-spin text-4xl text-teal mb-4"></i>
      <span class="text-gray-dark">Loading billing codes...</span>
    </div>
    
    <!-- Error state -->
    <div v-else-if="error" class="flex flex-col items-center justify-center p-10 bg-white rounded-lg shadow mt-6">
      <i class="fas fa-exclamation-circle text-4xl text-red mb-4"></i>
      <span class="text-gray-dark mb-2">{{ error }}</span>
      <button @click="fetchBillingCodesData" class="btn-secondary mt-4">
        <i class="fas fa-sync mr-2"></i> Retry
      </button>
    </div>
    
    <!-- Billing Codes List (New Design, similar to RatesView) -->
    <div v-else class="bg-white shadow rounded-lg mt-8">
      <ul role="list" class="divide-y divide-gray-100">
        <li v-for="billingCode in billingCodes" :key="billingCode.ID" class="flex items-center justify-between gap-x-6 py-5 px-4 hover:bg-gray-50">
          <div class="min-w-0 flex-1">
            <div class="flex items-start gap-x-3">
              <p class="text-sm/6 font-semibold text-gray-900">{{ billingCode.name }}</p>
              <p :class="[
                billingCode.active ? 'text-green-700 bg-green-50 ring-green-600/20' : 'text-red-700 bg-red-50 ring-red-600/20',
                'mt-0.5 whitespace-nowrap rounded-md px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset'
              ]">
                {{ billingCode.active ? 'Active' : 'Inactive' }}
              </p>
              <p class="mt-0.5 whitespace-nowrap rounded-md px-1.5 py-0.5 text-xs font-medium bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-600/20">
                {{ formatCategory(billingCode.type) }}
              </p>
            </div>
            <div class="mt-1 flex items-center gap-x-2 text-xs/5 text-gray-500">
              <p class="whitespace-nowrap">
                <span class="font-medium">Code: {{ billingCode.code }}</span>
              </p>
              <svg viewBox="0 0 2 2" class="size-0.5 fill-current">
                <circle cx="1" cy="1" r="1" />
              </svg>
              <p class="whitespace-nowrap">
                Project: <span class="font-medium">{{ getProjectName(billingCode.project) }}</span>
              </p>
              <svg viewBox="0 0 2 2" class="size-0.5 fill-current">
                <circle cx="1" cy="1" r="1" />
              </svg>
              <p class="whitespace-nowrap">
                Rate: <span class="font-medium">{{ getRateName(billingCode.rate_id) }}</span>
              </p>
            </div>
            <div v-if="billingCode.active_start || billingCode.active_end" class="mt-1 flex items-center gap-x-2 text-xs/5 text-gray-500">
              <p v-if="billingCode.active_start" class="whitespace-nowrap">
                Active from <time :datetime="billingCode.active_start">{{ formatDate(billingCode.active_start) }}</time>
              </p>
              <svg v-if="billingCode.active_start && billingCode.active_end" viewBox="0 0 2 2" class="size-0.5 fill-current">
                <circle cx="1" cy="1" r="1" />
              </svg>
              <p v-if="billingCode.active_end" class="whitespace-nowrap">
                to <time :datetime="billingCode.active_end">{{ formatDate(billingCode.active_end) }}</time>
              </p>
            </div>
          </div>
          <div class="flex flex-none items-center gap-x-4">
            <button
              @click="openBillingCodeDrawer(billingCode)"
              class="rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              <i class="fas fa-pencil-alt mr-1"></i> Edit
            </button>
          </div>
        </li>
        <li v-if="billingCodes.length === 0" class="py-5 px-4">
          <div class="flex flex-col items-center justify-center p-10">
            <i class="fas fa-tags text-5xl text-gray-300 mb-4"></i>
            <p class="text-lg font-medium text-gray-dark">No billing codes found</p>
            <p class="text-gray mb-4">Click "Create new billing code" to add one</p>
          </div>
        </li>
      </ul>
    </div>
    
    <!-- Billing Code Drawer -->
    <BillingCodeDrawer
      :is-open="isBillingCodeDrawerOpen"
      :billing-code-data="selectedBillingCode"
      @close="closeBillingCodeDrawer"
      @save="saveBillingCode"
      @delete="confirmDelete"
    />
    
    <!-- Delete Confirmation Modal -->
    <ConfirmationModal
      :show="showDeleteModal"
      title="Delete Billing Code"
      message="Are you sure you want to delete this billing code? This action cannot be undone."
      @confirm="deleteBillingCode"
      @cancel="showDeleteModal = false"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { 
  billingCodesAPI,
  getBillingCodes, 
  fetchProjects, 
  fetchRates, 
  createBillingCode, 
  updateBillingCode, 
  deleteBillingCode as deleteBillingCodeAPI 
} from '../../api';
import BillingCodeDrawer from '../../components/billing-codes/BillingCodeDrawer.vue';
import ConfirmationModal from '../../components/ConfirmationModal.vue';
import { formatDate, parseServerDate, getCurrentDate } from '../../utils/dateUtils';

// State
const billingCodes = ref([]);
const projects = ref([]);
const rates = ref([]);
const isBillingCodeDrawerOpen = ref(false);
const selectedBillingCode = ref(null);
const showDeleteModal = ref(false);
const billingCodeToDelete = ref(null);
const selectedProjectId = ref('');
const isLoading = ref(true);
const error = ref(null);

// Fetch data
onMounted(async () => {
  await fetchBillingCodesData();
});

// Fetch billing codes data
const fetchBillingCodesData = async () => {
  isLoading.value = true;
  error.value = null;
  
  try {
    // Fetch billing codes, projects, and rates
    const [billingCodesData, projectsData, ratesData] = await Promise.all([
      getBillingCodes(),
      fetchProjects(),
      fetchRates()
    ]);
    
    billingCodes.value = billingCodesData || [];
    projects.value = projectsData || [];
    rates.value = ratesData || [];
  } catch (err) {
    console.error('Error loading data:', err);
    error.value = 'Failed to load billing codes. Please try again.';
  } finally {
    isLoading.value = false;
  }
};

// Helper functions
const getProjectName = (projectId) => {
  if (!projects.value || !Array.isArray(projects.value)) {
    return 'Unknown';
  }
  const project = projects.value.find(p => p.ID === projectId);
  return project ? project.name : 'Unknown';
};

const getRateName = (rateId) => {
  if (!rates.value || !Array.isArray(rates.value)) {
    return 'Unknown';
  }
  const rate = rates.value.find(r => r.ID === rateId);
  if (!rate) return 'Unknown';
  return `${rate.name} (${formatCurrency(rate.amount)})`;
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

const formatCategory = (type) => {
  if (!type) return 'Unknown';
  
  // Format the category string (convert from enum-like format to human-readable)
  const formattedType = type.replace('BILLING_CODE_', '').replace(/_/g, ' ').toLowerCase();
  return formattedType.charAt(0).toUpperCase() + formattedType.slice(1);
};

// Project filter
const handleProjectChange = async () => {
  try {
    isLoading.value = true;
    const billingCodesData = await getBillingCodes(selectedProjectId.value || undefined);
    billingCodes.value = billingCodesData || [];
  } catch (error) {
    console.error('Error filtering billing codes:', error);
  } finally {
    isLoading.value = false;
  }
};

// Drawer functions
const openBillingCodeDrawer = (billingCode = null) => {
  if (billingCode) {
    selectedBillingCode.value = {
      id: billingCode.id,
      ID: billingCode.ID,
      name: billingCode.name,
      code: billingCode.code || '',
      type: billingCode.type,
      project: billingCode.project,
      projectId: billingCode.project,
      rate_id: billingCode.rate_id,
      rateId: billingCode.rate_id,
      active: billingCode.active,
      isActive: billingCode.active,
      active_start: billingCode.active_start || getCurrentDate(),
      active_end: billingCode.active_end || '',
      internal_rate_id: billingCode.internal_rate_id || ''
    };
    
    console.log('Opening billing code drawer with data:', selectedBillingCode.value);
  } else {
    selectedBillingCode.value = null;
  }
  
  isBillingCodeDrawerOpen.value = true;
};

const closeBillingCodeDrawer = () => {
  isBillingCodeDrawerOpen.value = false;
  selectedBillingCode.value = null;
};

// Save billing code
const saveBillingCode = async (billingCodeData) => {
  try {
    // Transform the form data to match the API structure
    const apiData = {
      ID: billingCodeData.id || 0,
      name: billingCodeData.name,
      code: billingCodeData.code || '',
      type: billingCodeData.category || '',
      project: billingCodeData.projectId,
      rate_id: billingCodeData.rateId,
      active: billingCodeData.isActive,
      active_start: billingCodeData.active_start,
      active_end: billingCodeData.active_end,
      internal_rate_id: billingCodeData.internal_rate_id
    };
    
    if (apiData.ID) {
      await updateBillingCode(apiData);
    } else {
      await createBillingCode(apiData);
    }
    
    // Refresh billing codes
    await fetchBillingCodesData();
    
    // Close drawer
    closeBillingCodeDrawer();
  } catch (error) {
    console.error('Error saving billing code:', error);
    alert('Failed to save billing code. Please try again.');
  }
};

// Delete billing code
const confirmDelete = (billingCode) => {
  billingCodeToDelete.value = billingCode;
  showDeleteModal.value = true;
  // Close the drawer when confirming delete
  isBillingCodeDrawerOpen.value = false;
};

const deleteBillingCode = async () => {
  if (!billingCodeToDelete.value) return;
  
  try {
    await deleteBillingCodeAPI(billingCodeToDelete.value.ID);
    
    // Refresh billing codes
    await fetchBillingCodesData();
    
    // Close modal
    showDeleteModal.value = false;
    billingCodeToDelete.value = null;
  } catch (error) {
    console.error('Error deleting billing code:', error);
    alert('Failed to delete billing code. Please try again.');
  }
};
</script>

<style scoped>
.btn-secondary {
  display: inline-flex;
  align-items: center;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-gray-700);
  background-color: white;
  border: 1px solid var(--color-gray-300);
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background-color: var(--color-gray-50);
}
</style> 