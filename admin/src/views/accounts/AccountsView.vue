<script setup lang="ts">
import { ref, onMounted } from 'vue';
import type { Account } from '../../types/Account';
import { createEmptyAccount } from '../../types/Account';
import AccountCard from '../../components/accounts/AccountCard.vue';
import accountsApi from '../../api/accounts';

// State
const accounts = ref<Account[]>([]);
const selectedAccountId = ref<string | number | null>(null);
const isLoading = ref(true);
const error = ref<string | null>(null);

// Fetch accounts on component mount
onMounted(async () => {
  await fetchAccounts();
});

// Fetch all accounts
const fetchAccounts = async () => {
  isLoading.value = true;
  error.value = null;
  
  try {
    accounts.value = await accountsApi.getAccounts();
  } catch (err) {
    console.error('Error fetching accounts:', err);
    error.value = 'Failed to load accounts. Please try again.';
  } finally {
    isLoading.value = false;
  }
};

// Create a new account
const createNew = () => {
  const newAccount = createEmptyAccount();
  accounts.value.unshift(newAccount);
  selectedAccountId.value = newAccount.ID;
};

// Toggle account selection (for inline editing)
const toggleAccountSelection = (account: Account) => {
  if (selectedAccountId.value === account.ID) {
    selectedAccountId.value = null;
  } else {
    selectedAccountId.value = account.ID;
  }
};

// Handle account save
const handleSave = (account: Account) => {
  const index = accounts.value.findIndex(a => a.ID === account.ID);
  if (index !== -1) {
    accounts.value[index] = account;
  }
  selectedAccountId.value = null;
};

// Handle account delete
const handleDelete = (account: Account) => {
  accounts.value = accounts.value.filter(a => a.ID !== account.ID);
  selectedAccountId.value = null;
};

// Check if an account is being edited
const isEditing = (accountId: string | number) => {
  return selectedAccountId.value === accountId;
};
</script>

<template>
  <div>
    <div class="sm:flex sm:items-center mb-6">
      <div class="sm:flex-auto">
        <h1 class="text-xl font-semibold text-blue">Accounts Management</h1>
      </div>
      <div class="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
        <button @click="createNew" type="button" class="btn-primary">
          <i class="fas fa-plus mr-2"></i> New Account
        </button>
      </div>
    </div>
    
    <!-- Loading state -->
    <div v-if="isLoading" class="flex flex-col items-center justify-center p-10 bg-white rounded-lg shadow">
      <i class="fas fa-spinner fa-spin text-4xl text-teal mb-4"></i>
      <span class="text-gray-dark">Loading accounts...</span>
    </div>
    
    <!-- Error state -->
    <div v-else-if="error" class="flex flex-col items-center justify-center p-10 bg-white rounded-lg shadow">
      <i class="fas fa-exclamation-circle text-4xl text-red mb-4"></i>
      <span class="text-gray-dark mb-2">{{ error }}</span>
      <button @click="fetchAccounts" class="btn-secondary mt-4">
        <i class="fas fa-sync mr-2"></i> Retry
      </button>
    </div>
    
    <!-- Empty state -->
    <div v-else-if="accounts.length === 0" class="flex flex-col items-center justify-center p-10 bg-white rounded-lg shadow">
      <i class="fas fa-users-slash text-5xl text-teal mb-4"></i>
      <p class="text-lg font-medium text-gray-dark">No accounts found</p>
      <p class="text-gray mb-4">Create a new account to get started</p>
      <button @click="createNew" class="btn-primary">
        <i class="fas fa-plus mr-2"></i> Create First Account
      </button>
    </div>
    
    <!-- Account grid -->
    <div v-else class="account-grid">
      <AccountCard 
        v-for="account in accounts" 
        :key="account.ID" 
        :account="account"
        :is-editing="isEditing(account.ID)"
        @edit="toggleAccountSelection"
        @save="handleSave"
        @delete="handleDelete"
      />
    </div>
  </div>
</template>

<style scoped>
/* Use a grid layout for the accounts with responsive sizing */
.account-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
  width: 100%;
}

/* Ensure the account cards have a consistent height */
:deep(.card) {
  height: 100%;
  display: flex;
  flex-direction: column;
}

:deep(.card > div) {
  height: 100%;
  display: flex;
  flex-direction: column;
}

:deep(.card .p-5) {
  flex-grow: 1;
}
</style> 