<script setup lang="ts">
import { ref, defineProps, defineEmits, computed } from 'vue';
import type { Account } from '../../types/Account';
import { ACCOUNT_TYPES, BILLING_FREQUENCIES } from '../../types/Account';

// Define props and emits
const props = defineProps<{
  account: Account,
  isEditing: boolean
}>();

const emit = defineEmits<{
  (e: 'edit', account: Account): void,
  (e: 'save', account: Account): void,
  (e: 'delete', account: Account): void
}>();

// Local editable copy of the account
const editableAccount = ref<Account>({ ...props.account });

// Reset editable account when props change or editing is toggled
const resetForm = () => {
  editableAccount.value = JSON.parse(JSON.stringify(props.account));
};

// Format account type for display
const accountType = computed(() => {
  const type = props.account.type;
  return type.replace('ACCOUNT_TYPE_', '').toLowerCase();
});

// Format billing frequency for display
const billingFrequency = computed(() => {
  const freq = props.account.billing_frequency;
  return freq.replace('BILLING_TYPE_', '').toLowerCase();
});

// Handle edit button click
const handleEdit = () => {
  resetForm();
  emit('edit', props.account);
};

// Handle save button click
const handleSave = () => {
  emit('save', editableAccount.value);
};

// Handle delete button click
const handleDelete = () => {
  if (confirm('Are you sure you want to delete this account?')) {
    emit('delete', props.account);
  }
};

// Handle cancel button click
const handleCancel = () => {
  resetForm();
  emit('edit', props.account); // This will toggle off editing mode
};

// Check if the account has an ID (is not new)
const hasId = computed(() => {
  const id = editableAccount.value.ID;
  return id !== null && id !== undefined && id !== 0;
});

// Initialize form when component is created
resetForm();
</script>

<template>
  <div class="card">
    <!-- View Mode -->
    <div v-if="!isEditing" class="h-full flex flex-col border border-gray rounded-lg shadow-sm hover:shadow-md transition-shadow">
      <div class="p-5 pb-3 border-b border-gray-light">
        <div class="flex justify-between">
          <h3 class="text-lg font-semibold text-blue">{{ account.name }}</h3>
          <div class="flex gap-2">
            <span class="bg-blue-light-blue text-blue text-xs px-2 py-1 rounded-full capitalize">
              {{ accountType }}
            </span>
            <span class="bg-green-light-green text-green text-xs px-2 py-1 rounded-full capitalize">
              {{ billingFrequency }}
            </span>
          </div>
        </div>
      </div>
      
      <div class="p-5 flex-grow">
        <div v-if="account.legal_name" class="mb-3">
          <span class="text-sm text-teal font-medium">Legal Name:</span>
          <p class="text-gray-dark">{{ account.legal_name }}</p>
        </div>
        
        <div v-if="account.website" class="mb-3">
          <span class="text-sm text-teal font-medium">Website:</span>
          <p class="text-gray-dark">
            <a :href="account.website" target="_blank" class="text-blue hover:underline">
              {{ account.website.replace(/^https?:\/\//, '') }}
            </a>
          </p>
        </div>
        
        <div v-if="account.email" class="mb-3">
          <span class="text-sm text-teal font-medium">Email:</span>
          <p class="text-gray-dark">
            <a :href="`mailto:${account.email}`" class="text-blue hover:underline">
              {{ account.email }}
            </a>
          </p>
        </div>
        
        <div v-if="account.address" class="mb-3">
          <span class="text-sm text-teal font-medium">Address:</span>
          <p class="text-gray-dark whitespace-pre-line">{{ account.address }}</p>
        </div>
        
        <div class="flex flex-wrap gap-4 mt-4">
          <div class="flex items-center gap-2">
            <i class="fas fa-money-bill text-teal text-sm"></i>
            <span class="text-sm text-gray-dark">Budget: ${{ account.budget_dollars || 0 }}</span>
          </div>
          
          <div class="flex items-center gap-2">
            <i class="fas fa-clock text-teal text-sm"></i>
            <span class="text-sm text-gray-dark">Hours: {{ account.budget_hours || 0 }}</span>
          </div>
        </div>
      </div>
      
      <div class="p-4 bg-neutral border-t border-gray-light flex justify-between items-center mt-auto">
        <span class="text-xs text-gray-dark flex items-center gap-1">
          <i class="fas fa-users"></i> 
          {{ account.clients?.length || 0 }} Clients
        </span>
        
        <button @click="handleEdit" class="btn-outline text-sm py-1 px-3">
          <i class="fas fa-edit mr-1"></i> Edit
        </button>
      </div>
    </div>
    
    <!-- Edit Mode -->
    <div v-else class="h-full flex flex-col border border-blue rounded-lg shadow-md">
      <div class="p-5 border-b border-gray-light bg-blue-light-blue bg-opacity-10">
        <h3 class="text-lg font-semibold text-blue mb-4">
          {{ hasId ? 'Edit Account' : 'New Account' }}
        </h3>
        
        <div class="mb-3">
          <label class="block text-sm font-medium mb-1">Name</label>
          <input
            v-model="editableAccount.name"
            type="text"
            class="w-full border rounded px-3 py-2"
            placeholder="Account name"
          />
        </div>
        
        <div class="mb-3">
          <label class="block text-sm font-medium mb-1">Legal Name</label>
          <input
            v-model="editableAccount.legal_name"
            type="text"
            class="w-full border rounded px-3 py-2"
            placeholder="Legal name"
          />
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div class="mb-3">
            <label class="block text-sm font-medium mb-1">Type</label>
            <select
              v-model="editableAccount.type"
              class="w-full border rounded px-3 py-2"
            >
              <option v-for="type in ACCOUNT_TYPES" :key="type" :value="type">
                {{ type.replace('ACCOUNT_TYPE_', '') }}
              </option>
            </select>
          </div>
          
          <div class="mb-3">
            <label class="block text-sm font-medium mb-1">Billing Frequency</label>
            <select
              v-model="editableAccount.billing_frequency"
              class="w-full border rounded px-3 py-2"
            >
              <option v-for="freq in BILLING_FREQUENCIES" :key="freq" :value="freq">
                {{ freq.replace('BILLING_TYPE_', '') }}
              </option>
            </select>
          </div>
        </div>
        
        <div class="mb-3">
          <label class="block text-sm font-medium mb-1">Website</label>
          <input
            v-model="editableAccount.website"
            type="url"
            class="w-full border rounded px-3 py-2"
            placeholder="Website URL"
          />
        </div>
        
        <div class="mb-3">
          <label class="block text-sm font-medium mb-1">Email</label>
          <input
            v-model="editableAccount.email"
            type="email"
            class="w-full border rounded px-3 py-2"
            placeholder="Email address"
          />
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div class="mb-3">
            <label class="block text-sm font-medium mb-1">Budget Hours</label>
            <input
              v-model.number="editableAccount.budget_hours"
              type="number"
              min="0"
              class="w-full border rounded px-3 py-2"
              placeholder="Budget hours"
            />
          </div>
          
          <div class="mb-3">
            <label class="block text-sm font-medium mb-1">Budget Dollars</label>
            <input
              v-model.number="editableAccount.budget_dollars"
              type="number"
              min="0"
              class="w-full border rounded px-3 py-2"
              placeholder="Budget dollars"
            />
          </div>
        </div>
      </div>
      
      <div class="flex justify-between p-4 bg-neutral border-t border-gray-light mt-auto">
        <div class="flex gap-2">
          <button @click="handleSave" class="btn-primary text-sm px-3 py-1">
            <i class="fas fa-save mr-1"></i>
            <span>Save</span>
          </button>
          <button @click="handleCancel" class="btn-secondary text-sm px-3 py-1">
            <i class="fas fa-times mr-1"></i>
            <span>Cancel</span>
          </button>
        </div>
        
        <button v-if="hasId" @click="handleDelete" class="btn-danger text-sm px-3 py-1">
          <i class="fas fa-trash mr-1"></i>
          <span>Delete</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Base card styling is already set in the global styles */
</style> 