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
    
    <!-- Project Filter -->
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
    
    <!-- Billing Codes Table -->
    <div class="mt-8 flow-root">
      <div class="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div class="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
          <div class="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
            <table class="min-w-full divide-y divide-gray-300">
              <thead class="bg-gray-50">
                <tr>
                  <th scope="col" class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Name</th>
                  <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Project</th>
                  <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Rate</th>
                  <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                  <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Description</th>
                  <th scope="col" class="relative py-3.5 pl-3 pr-4 sm:pr-6">
                    <span class="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 bg-white">
                <tr v-for="billingCode in billingCodes" :key="billingCode.id" class="hover:bg-gray-50">
                  <td class="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                    {{ billingCode.name }}
                  </td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {{ getProjectName(billingCode.projectId) }}
                  </td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {{ getRateName(billingCode.rateId) }}
                  </td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    <span 
                      :class="[
                        'inline-flex items-center rounded-md px-2 py-1 text-xs font-medium',
                        billingCode.isActive 
                          ? 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20' 
                          : 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20'
                      ]"
                    >
                      {{ billingCode.isActive ? 'Active' : 'Inactive' }}
                    </span>
                  </td>
                  <td class="px-3 py-4 text-sm text-gray-500 max-w-md truncate">
                    {{ billingCode.description }}
                  </td>
                  <td class="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                    <button
                      @click="openBillingCodeDrawer(billingCode)"
                      class="text-sage hover:text-sage-dark mr-4"
                    >
                      Edit
                    </button>
                    <button
                      @click="confirmDelete(billingCode)"
                      class="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
                <tr v-if="billingCodes.length === 0">
                  <td colspan="6" class="px-3 py-4 text-sm text-gray-500 text-center">
                    No billing codes found. Click "Create new billing code" to add one.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Billing Code Drawer -->
    <BillingCodeDrawer
      :is-open="isBillingCodeDrawerOpen"
      :billing-code-data="selectedBillingCode"
      @close="closeBillingCodeDrawer"
      @save="saveBillingCode"
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

// State
const billingCodes = ref([]);
const projects = ref([]);
const rates = ref([]);
const isBillingCodeDrawerOpen = ref(false);
const selectedBillingCode = ref(null);
const showDeleteModal = ref(false);
const billingCodeToDelete = ref(null);
const selectedProjectId = ref('');

// Fetch data
onMounted(async () => {
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
  } catch (error) {
    console.error('Error loading data:', error);
  }
});

// Helper functions
const getProjectName = (projectId) => {
  const project = projects.value.find(p => p.id === projectId);
  return project ? project.name : 'Unknown';
};

const getRateName = (rateId) => {
  const rate = rates.value.find(r => r.id === rateId);
  if (!rate) return 'Unknown';
  return `${rate.name} (${formatCurrency(rate.amount)})`;
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

// Project filter
const handleProjectChange = async () => {
  try {
    const billingCodesData = await getBillingCodes(selectedProjectId.value || undefined);
    billingCodes.value = billingCodesData || [];
  } catch (error) {
    console.error('Error filtering billing codes:', error);
  }
};

// Drawer functions
const openBillingCodeDrawer = (billingCode = null) => {
  // If a project is selected and we're creating a new billing code,
  // pre-populate the project ID
  if (!billingCode && selectedProjectId.value) {
    selectedBillingCode.value = { projectId: selectedProjectId.value };
  } else {
    selectedBillingCode.value = billingCode;
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
    if (billingCodeData.id) {
      await updateBillingCode(billingCodeData.id, billingCodeData);
    } else {
      await createBillingCode(billingCodeData);
    }
    
    // Refresh billing codes with current filter
    const updatedBillingCodes = await getBillingCodes(selectedProjectId.value || undefined);
    billingCodes.value = updatedBillingCodes;
    
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
};

const deleteBillingCode = async () => {
  if (!billingCodeToDelete.value) return;
  
  try {
    await deleteBillingCodeAPI(billingCodeToDelete.value.id);
    
    // Refresh billing codes with current filter
    const updatedBillingCodes = await getBillingCodes(selectedProjectId.value || undefined);
    billingCodes.value = updatedBillingCodes;
    
    // Close modal
    showDeleteModal.value = false;
    billingCodeToDelete.value = null;
  } catch (error) {
    console.error('Error deleting billing code:', error);
    alert('Failed to delete billing code. Please try again.');
  }
};
</script> 