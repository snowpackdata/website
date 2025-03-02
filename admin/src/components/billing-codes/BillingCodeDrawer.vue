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
                          <DialogTitle class="text-base font-semibold text-white">{{ isEditing ? 'Edit Billing Code' : 'New Billing Code' }}</DialogTitle>
                          <p class="text-sm text-gray-100">
                            {{ isEditing ? 'Update the billing code details below.' : 'Get started by filling in the information below to create a new billing code.' }}
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
                      <!-- Billing Code name -->
                      <div class="space-y-2 px-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:space-y-0 sm:px-6 sm:py-5">
                        <div>
                          <label for="billing-code-name" class="block text-sm/6 font-medium text-gray-900 sm:mt-1.5">Billing Code Name</label>
                        </div>
                        <div class="sm:col-span-2">
                          <input 
                            type="text" 
                            name="billing-code-name" 
                            id="billing-code-name" 
                            v-model="billingCode.name"
                            class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-sage sm:text-sm/6" 
                          />
                        </div>
                      </div>

                      <!-- Project selection -->
                      <div class="space-y-2 px-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:space-y-0 sm:px-6 sm:py-5">
                        <div>
                          <label for="billing-code-project" class="block text-sm/6 font-medium text-gray-900 sm:mt-1.5">Project</label>
                        </div>
                        <div class="sm:col-span-2">
                          <select 
                            id="billing-code-project" 
                            name="billing-code-project" 
                            v-model="billingCode.projectId"
                            class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                          >
                            <option value="">Select a project</option>
                            <option v-for="project in projects" :key="project.id" :value="project.id">
                              {{ project.name }}
                            </option>
                          </select>
                        </div>
                      </div>
                      
                      <!-- Rate selection -->
                      <div class="space-y-2 px-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:space-y-0 sm:px-6 sm:py-5">
                        <div>
                          <label for="billing-code-rate" class="block text-sm/6 font-medium text-gray-900 sm:mt-1.5">Rate</label>
                        </div>
                        <div class="sm:col-span-2">
                          <select 
                            id="billing-code-rate" 
                            name="billing-code-rate" 
                            v-model="billingCode.rateId"
                            class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-sage sm:text-sm/6"
                          >
                            <option value="">Select a rate</option>
                            <option v-for="rate in rates" :key="rate.id" :value="rate.id">
                              {{ rate.name }} ({{ formatCurrency(rate.amount) }})
                            </option>
                          </select>
                        </div>
                      </div>

                      <!-- Is Active -->
                      <div class="space-y-2 px-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:space-y-0 sm:px-6 sm:py-5">
                        <div>
                          <label for="billing-code-active" class="block text-sm/6 font-medium text-gray-900 sm:mt-1.5">Status</label>
                        </div>
                        <div class="sm:col-span-2 flex items-center">
                          <div class="flex items-center">
                            <input 
                              type="checkbox" 
                              id="billing-code-active" 
                              name="billing-code-active" 
                              v-model="billingCode.isActive"
                              class="h-4 w-4 text-sage focus:ring-sage border-gray-300 rounded"
                            />
                            <label for="billing-code-active" class="ml-2 block text-sm text-gray-900">
                              Active
                            </label>
                          </div>
                        </div>
                      </div>

                      <!-- Description -->
                      <div class="space-y-2 px-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:space-y-0 sm:px-6 sm:py-5">
                        <div>
                          <label for="billing-code-description" class="block text-sm/6 font-medium text-gray-900 sm:mt-1.5">Description</label>
                        </div>
                        <div class="sm:col-span-2">
                          <textarea 
                            rows="3" 
                            name="billing-code-description" 
                            id="billing-code-description" 
                            v-model="billingCode.description"
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
import { fetchProjects } from '../../api/projects';
import { fetchRates } from '../../api/rates';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  billingCodeData: {
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
const isEditing = computed(() => !!props.billingCodeData?.id);

// Initialize billing code with default values or provided data
const billingCode = ref({
  id: props.billingCodeData?.id || null,
  name: props.billingCodeData?.name || '',
  description: props.billingCodeData?.description || '',
  projectId: props.billingCodeData?.projectId || '',
  rateId: props.billingCodeData?.rateId || '',
  isActive: props.billingCodeData?.isActive !== undefined ? props.billingCodeData.isActive : true
});

// Update billing code data when billingCodeData prop changes
watch(() => props.billingCodeData, (newVal) => {
  if (newVal) {
    billingCode.value = {
      id: newVal.id || null,
      name: newVal.name || '',
      description: newVal.description || '',
      projectId: newVal.projectId || '',
      rateId: newVal.rateId || '',
      isActive: newVal.isActive !== undefined ? newVal.isActive : true
    };
  }
}, { deep: true });

// Fetch projects and rates for dropdowns
const projects = ref([]);
const rates = ref([]);

onMounted(async () => {
  try {
    const projectsData = await fetchProjects();
    projects.value = projectsData || [];
    
    const ratesData = await fetchRates();
    rates.value = ratesData || [];
  } catch (error) {
    console.error('Failed to fetch data:', error);
  }
});

// Format currency helper
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

// Handle form submission
const handleSubmit = () => {
  // Validate form
  if (!billingCode.value.name || !billingCode.value.projectId || !billingCode.value.rateId) {
    alert('Please fill in all required fields');
    return;
  }

  // Emit save event with billing code data
  emit('save', billingCode.value);
  
  // Close the drawer
  handleClose();
};
</script> 