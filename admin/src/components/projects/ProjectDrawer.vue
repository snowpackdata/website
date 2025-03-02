<template>
  <TransitionRoot as="template" :show="isOpen">
    <Dialog class="relative z-10" @close="handleClose">
      <div class="fixed inset-0" />

      <div class="fixed inset-0 overflow-hidden">
        <div class="absolute inset-0 overflow-hidden">
          <div class="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10 sm:pl-16">
            <TransitionChild as="template" enter="transform transition ease-in-out duration-500 sm:duration-700" enter-from="translate-x-full" enter-to="translate-x-0" leave="transform transition ease-in-out duration-500 sm:duration-700" leave-from="translate-x-0" leave-to="translate-x-full">
              <DialogPanel class="pointer-events-auto w-screen max-w-2xl">
                <form class="flex h-full flex-col overflow-y-scroll bg-white shadow-xl" @submit.prevent="handleSubmit">
                  <div class="flex-1">
                    <!-- Header -->
                    <div class="bg-sage-dark px-4 py-6 sm:px-6">
                      <div class="flex items-start justify-between space-x-3">
                        <div class="space-y-1">
                          <DialogTitle class="text-base font-semibold text-white">{{ isEditing ? 'Edit Project' : 'New Project' }}</DialogTitle>
                          <p class="text-sm text-gray-100">
                            {{ isEditing ? 'Update the project details below.' : 'Get started by filling in the information below to create your new project.' }}
                          </p>
                        </div>
                        <div class="flex h-7 items-center">
                          <button type="button" class="relative text-white hover:text-gray-200" @click="handleClose">
                            <span class="absolute -inset-2.5" />
                            <span class="sr-only">Close panel</span>
                            <XMarkIcon class="h-6 w-6" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <!-- Divider container -->
                    <div class="space-y-6 py-6 sm:space-y-0 sm:divide-y sm:divide-gray-200 sm:py-0">
                      <!-- Project name -->
                      <div class="space-y-2 px-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:space-y-0 sm:px-6 sm:py-5">
                        <div>
                          <label for="project-name" class="block text-sm/6 font-medium text-gray-900 sm:mt-1.5">Project name</label>
                        </div>
                        <div class="sm:col-span-2">
                          <input 
                            type="text" 
                            name="project-name" 
                            id="project-name" 
                            v-model="project.name"
                            class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6" 
                          />
                        </div>
                      </div>

                      <!-- Account selection -->
                      <div class="space-y-2 px-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:space-y-0 sm:px-6 sm:py-5">
                        <div>
                          <label for="project-account" class="block text-sm/6 font-medium text-gray-900 sm:mt-1.5">Account</label>
                        </div>
                        <div class="sm:col-span-2">
                          <select 
                            id="project-account" 
                            name="project-account" 
                            v-model="project.accountId"
                            class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                          >
                            <option value="">Select an account</option>
                            <option v-for="account in accounts" :key="account.id" :value="account.id">
                              {{ account.name }}
                            </option>
                          </select>
                        </div>
                      </div>

                      <!-- Project type -->
                      <div class="space-y-2 px-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:space-y-0 sm:px-6 sm:py-5">
                        <div>
                          <label for="project-type" class="block text-sm/6 font-medium text-gray-900 sm:mt-1.5">Project Type</label>
                        </div>
                        <div class="sm:col-span-2">
                          <select 
                            id="project-type"
                            name="project-type"
                            v-model="project.project_type"
                            class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-sage sm:text-sm/6"
                          >
                            <option value="PROJECT_TYPE_NEW">New Project</option>
                            <option value="PROJECT_TYPE_EXISTING">Existing Project</option>
                          </select>
                        </div>
                      </div>

                      <!-- Start date -->
                      <div class="space-y-2 px-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:space-y-0 sm:px-6 sm:py-5">
                        <div>
                          <label for="project-start-date" class="block text-sm/6 font-medium text-gray-900 sm:mt-1.5">Start Date</label>
                        </div>
                        <div class="sm:col-span-2">
                          <input 
                            type="date" 
                            name="project-start-date" 
                            id="project-start-date" 
                            v-model="project.startDate"
                            class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6" 
                          />
                        </div>
                      </div>

                      <!-- End date -->
                      <div class="space-y-2 px-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:space-y-0 sm:px-6 sm:py-5">
                        <div>
                          <label for="project-end-date" class="block text-sm/6 font-medium text-gray-900 sm:mt-1.5">End Date</label>
                        </div>
                        <div class="sm:col-span-2">
                          <input 
                            type="date" 
                            name="project-end-date" 
                            id="project-end-date" 
                            v-model="project.endDate"
                            class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6" 
                          />
                        </div>
                      </div>

                      <!-- Internal project -->
                      <div class="space-y-2 px-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:space-y-0 sm:px-6 sm:py-5">
                        <div>
                          <label for="project-internal" class="block text-sm/6 font-medium text-gray-900 sm:mt-1.5">Internal Project</label>
                        </div>
                        <div class="sm:col-span-2 flex items-center">
                          <input 
                            type="checkbox" 
                            name="project-internal" 
                            id="project-internal" 
                            v-model="project.internal"
                            class="h-4 w-4 rounded border-gray-300 text-sage focus:ring-sage" 
                          />
                          <label for="project-internal" class="ml-2 text-sm text-gray-600">
                            Mark this project as internal
                          </label>
                        </div>
                      </div>

                      <!-- Billing Frequency -->
                      <div class="space-y-2 px-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:space-y-0 sm:px-6 sm:py-5">
                        <div>
                          <label for="billing-frequency" class="block text-sm/6 font-medium text-gray-900 sm:mt-1.5">Billing Frequency</label>
                        </div>
                        <div class="sm:col-span-2">
                          <select 
                            id="billing-frequency"
                            name="billing-frequency"
                            v-model="project.billing_frequency"
                            class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-sage sm:text-sm/6"
                          >
                            <option value="BILLING_TYPE_MONTHLY">Monthly</option>
                            <option value="BILLING_TYPE_PROJECT">Project</option>
                            <option value="BILLING_TYPE_BIWEEKLY">Bi-Weekly</option>
                            <option value="BILLING_TYPE_WEEKLY">Weekly</option>
                            <option value="BILLING_TYPE_BIMONTHLY">Bi-Monthly</option>
                          </select>
                        </div>
                      </div>

                      <!-- Budget Hours -->
                      <div class="space-y-2 px-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:space-y-0 sm:px-6 sm:py-5">
                        <div>
                          <label for="budget-hours" class="block text-sm/6 font-medium text-gray-900 sm:mt-1.5">Budget Hours</label>
                        </div>
                        <div class="sm:col-span-2">
                          <input 
                            type="number" 
                            name="budget-hours" 
                            id="budget-hours" 
                            v-model="project.budget_hours"
                            min="0"
                            class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-sage sm:text-sm/6" 
                          />
                        </div>
                      </div>

                      <!-- Budget Dollars -->
                      <div class="space-y-2 px-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:space-y-0 sm:px-6 sm:py-5">
                        <div>
                          <label for="budget-dollars" class="block text-sm/6 font-medium text-gray-900 sm:mt-1.5">Budget Dollars</label>
                        </div>
                        <div class="sm:col-span-2">
                          <input 
                            type="number" 
                            name="budget-dollars" 
                            id="budget-dollars" 
                            v-model="project.budget_dollars"
                            min="0"
                            class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-sage sm:text-sm/6" 
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Action buttons -->
                  <div class="shrink-0 border-t border-gray-200 px-4 py-5 sm:px-6">
                    <div class="flex justify-end space-x-3">
                      <button 
                        type="button" 
                        class="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50" 
                        @click="handleClose"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        class="inline-flex justify-center rounded-md bg-sage px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sage-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage"
                      >
                        {{ isEditing ? 'Update' : 'Create' }}
                      </button>
                    </div>
                  </div>
                </form>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { Dialog, DialogPanel, DialogTitle, TransitionChild, TransitionRoot } from '@headlessui/vue';
import { XMarkIcon } from '@heroicons/vue/24/outline';
import { fetchAccounts } from '../../api';
import { formatDate, parseServerDate, formatDateForServer } from '../../utils/dateUtils';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  projectData: {
    type: Object,
    default: () => ({})
  }
});

const emit = defineEmits(['close', 'save']);

// Handle close events
const handleClose = () => {
  emit('close');
};

// Determine if editing or creating new
const isEditing = computed(() => !!props.projectData?.id);

// Initialize project with default values or provided data
const project = ref({
  id: props.projectData?.id || null,
  name: props.projectData?.name || '',
  accountId: props.projectData?.account_id || '',
  project_type: props.projectData?.project_type || 'PROJECT_TYPE_NEW',
  internal: props.projectData?.internal || false,
  startDate: parseServerDate(props.projectData?.active_start),
  endDate: parseServerDate(props.projectData?.active_end),
  billing_frequency: props.projectData?.billing_frequency || 'BILLING_TYPE_MONTHLY',
  budget_hours: props.projectData?.budget_hours || 0,
  budget_dollars: props.projectData?.budget_dollars || 0
});

// Update project data when projectData prop changes
watch(() => props.projectData, (newVal) => {
  if (newVal) {
    project.value = {
      id: newVal.id || null,
      name: newVal.name || '',
      accountId: newVal.account_id || '',
      project_type: newVal.project_type || 'PROJECT_TYPE_NEW',
      internal: newVal.internal || false,
      startDate: parseServerDate(newVal.active_start),
      endDate: parseServerDate(newVal.active_end),
      billing_frequency: newVal.billing_frequency || 'BILLING_TYPE_MONTHLY',
      budget_hours: newVal.budget_hours || 0,
      budget_dollars: newVal.budget_dollars || 0
    };
  }
}, { deep: true });

// Fetch accounts for dropdown
const accounts = ref([]);

onMounted(async () => {
  try {
    const data = await fetchAccounts();
    accounts.value = data || [];
  } catch (error) {
    console.error('Failed to fetch accounts:', error);
  }
});

// Handle form submission
const handleSubmit = () => {
  // Validate the form
  if (!project.value.name || !project.value.accountId) {
    alert('Please fill in all required fields');
    return;
  }

  // Convert dates back to ISO strings and map fields to match API
  const formattedProject = {
    id: project.value.id,
    name: project.value.name,
    account_id: parseInt(project.value.accountId),
    project_type: project.value.project_type,
    active_start: formatDateForServer(project.value.startDate),
    active_end: formatDateForServer(project.value.endDate),
    billing_frequency: project.value.billing_frequency,
    budget_hours: project.value.budget_hours,
    budget_dollars: project.value.budget_dollars,
    internal: project.value.internal
  };

  emit('save', formattedProject);
  
  // Close the drawer
  handleClose();
};
</script> 