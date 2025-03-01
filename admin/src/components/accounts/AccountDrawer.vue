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
                    <div class="bg-gray-50 px-4 py-6 sm:px-6">
                      <div class="flex items-start justify-between space-x-3">
                        <div class="space-y-1">
                          <DialogTitle class="text-base font-semibold text-gray-900">{{ isEditing ? 'Edit Account' : 'New Account' }}</DialogTitle>
                          <p class="text-sm text-gray-500">
                            {{ isEditing ? 'Update the account details below.' : 'Get started by filling in the information below to create a new account.' }}
                          </p>
                        </div>
                        <div class="flex h-7 items-center">
                          <button type="button" class="relative text-gray-400 hover:text-gray-500" @click="handleClose">
                            <span class="absolute -inset-2.5" />
                            <span class="sr-only">Close panel</span>
                            <XMarkIcon class="h-6 w-6" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <!-- Divider container -->
                    <div class="space-y-6 py-6 sm:space-y-0 sm:divide-y sm:divide-gray-200 sm:py-0">
                      <!-- Account name -->
                      <div class="space-y-2 px-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:space-y-0 sm:px-6 sm:py-5">
                        <div>
                          <label for="account-name" class="block text-sm/6 font-medium text-gray-900 sm:mt-1.5">Account name</label>
                        </div>
                        <div class="sm:col-span-2">
                          <input 
                            type="text" 
                            name="account-name" 
                            id="account-name" 
                            v-model="account.name"
                            class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-sage sm:text-sm/6" 
                          />
                        </div>
                      </div>

                      <!-- Account type -->
                      <div class="space-y-2 px-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:space-y-0 sm:px-6 sm:py-5">
                        <div>
                          <label for="account-type" class="block text-sm/6 font-medium text-gray-900 sm:mt-1.5">Account Type</label>
                        </div>
                        <div class="sm:col-span-2">
                          <select 
                            id="account-type" 
                            name="account-type" 
                            v-model="account.type"
                            class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-sage sm:text-sm/6"
                          >
                            <option value="ACCOUNT_TYPE_CLIENT">Client</option>
                            <option value="ACCOUNT_TYPE_INTERNAL">Internal</option>
                          </select>
                        </div>
                      </div>
                      
                      <!-- Email -->
                      <div class="space-y-2 px-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:space-y-0 sm:px-6 sm:py-5">
                        <div>
                          <label for="account-email" class="block text-sm/6 font-medium text-gray-900 sm:mt-1.5">Email</label>
                        </div>
                        <div class="sm:col-span-2">
                          <input 
                            type="email" 
                            name="account-email" 
                            id="account-email" 
                            v-model="account.email"
                            class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-sage sm:text-sm/6" 
                          />
                        </div>
                      </div>

                      <!-- Phone number -->
                      <div class="space-y-2 px-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:space-y-0 sm:px-6 sm:py-5">
                        <div>
                          <label for="account-phone" class="block text-sm/6 font-medium text-gray-900 sm:mt-1.5">Phone Number</label>
                        </div>
                        <div class="sm:col-span-2">
                          <input 
                            type="tel" 
                            name="account-phone" 
                            id="account-phone" 
                            v-model="account.phone"
                            class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-sage sm:text-sm/6" 
                          />
                        </div>
                      </div>

                      <!-- Address -->
                      <div class="space-y-2 px-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:space-y-0 sm:px-6 sm:py-5">
                        <div>
                          <label for="account-address" class="block text-sm/6 font-medium text-gray-900 sm:mt-1.5">Address</label>
                        </div>
                        <div class="sm:col-span-2">
                          <textarea 
                            rows="3" 
                            name="account-address" 
                            id="account-address" 
                            v-model="account.address"
                            class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-sage sm:text-sm/6" 
                          />
                        </div>
                      </div>

                      <!-- Billing Frequency -->
                      <div class="space-y-2 px-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:space-y-0 sm:px-6 sm:py-5">
                        <div>
                          <label for="account-billing-frequency" class="block text-sm/6 font-medium text-gray-900 sm:mt-1.5">Billing Frequency</label>
                        </div>
                        <div class="sm:col-span-2">
                          <select 
                            id="account-billing-frequency" 
                            name="account-billing-frequency" 
                            v-model="account.billingFrequency"
                            class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-sage sm:text-sm/6"
                          >
                            <option value="BILLING_TYPE_WEEKLY">Weekly</option>
                            <option value="BILLING_TYPE_BIWEEKLY">Bi-Weekly</option>
                            <option value="BILLING_TYPE_MONTHLY">Monthly</option>
                            <option value="BILLING_TYPE_BIMONTHLY">Bi-Monthly</option>
                            <option value="BILLING_TYPE_PROJECT">Project-Based</option>
                          </select>
                        </div>
                      </div>

                      <!-- Projects Single Invoice -->
                      <div class="space-y-2 px-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:space-y-0 sm:px-6 sm:py-5">
                        <div>
                          <label for="account-projects-single-invoice" class="block text-sm/6 font-medium text-gray-900 sm:mt-1.5">Invoice Type</label>
                        </div>
                        <div class="sm:col-span-2 flex items-center">
                          <div class="flex items-center">
                            <input 
                              type="checkbox" 
                              id="account-projects-single-invoice" 
                              name="account-projects-single-invoice" 
                              v-model="account.projectsSingleInvoice"
                              class="h-4 w-4 text-sage focus:ring-sage border-gray-300 rounded"
                            />
                            <label for="account-projects-single-invoice" class="ml-2 block text-sm text-gray-900">
                              Combine all projects into a single invoice
                            </label>
                          </div>
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
import { ref, computed, watch } from 'vue';
import { Dialog, DialogPanel, DialogTitle, TransitionChild, TransitionRoot } from '@headlessui/vue';
import { XMarkIcon } from '@heroicons/vue/24/outline';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  accountData: {
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
const isEditing = computed(() => !!props.accountData?.id);

// Initialize account with default values or provided data
const account = ref({
  id: props.accountData?.id || null,
  name: props.accountData?.name || '',
  type: props.accountData?.type || 'ACCOUNT_TYPE_CLIENT',
  email: props.accountData?.email || '',
  phone: props.accountData?.phone || '',
  address: props.accountData?.address || '',
  billingFrequency: props.accountData?.billingFrequency || 'BILLING_TYPE_MONTHLY',
  projectsSingleInvoice: props.accountData?.projectsSingleInvoice || false
});

// Update account data when accountData prop changes
watch(() => props.accountData, (newVal) => {
  if (newVal) {
    account.value = {
      id: newVal.id || null,
      name: newVal.name || '',
      type: newVal.type || 'ACCOUNT_TYPE_CLIENT',
      email: newVal.email || '',
      phone: newVal.phone || '',
      address: newVal.address || '',
      billingFrequency: newVal.billingFrequency || 'BILLING_TYPE_MONTHLY',
      projectsSingleInvoice: newVal.projectsSingleInvoice || false
    };
  }
}, { deep: true });

// Handle form submission
const handleSubmit = () => {
  // Validate form
  if (!account.value.name || !account.value.type) {
    alert('Please fill in all required fields');
    return;
  }

  // Emit save event with account data
  emit('save', account.value);
  
  // Close the drawer
  handleClose();
};
</script> 