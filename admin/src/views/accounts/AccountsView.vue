<template>
  <div class="px-4 py-6 sm:px-6 lg:px-8">
    <div class="sm:flex sm:items-center">
      <div class="sm:flex-auto">
        <h1 class="text-base font-semibold leading-6 text-gray-900">Client Accounts</h1>
        <p class="mt-2 text-sm text-gray-700">
          A list of all client accounts including their contact and billing information.
        </p>
      </div>
      <div class="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
        <button
          type="button"
          @click="openAccountDrawer()"
          class="block rounded-md bg-sage px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-sage-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage"
        >
          Create new account
        </button>
      </div>
    </div>
    
    <!-- Account Cards -->
    <div class="mt-8 flow-root">
      <ul role="list" class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <li v-for="account in filteredAccounts" :key="account.id" class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow transition hover:shadow-md">
          <div class="p-6">
            <div class="flex items-start justify-between">
              <div>
                <div class="flex items-center gap-x-2">
                  <h3 class="text-lg font-semibold text-gray-900">{{ account.name }}</h3>
                  <span class="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                    Client
                  </span>
                </div>
                <p class="mt-1 text-sm text-gray-500">{{ account.legal_name || 'No legal name provided' }}</p>
              </div>
              <button
                @click="openAccountDrawer(account)"
                class="text-sage hover:text-sage-dark rounded-full p-2 hover:bg-gray-100 transition-colors"
                title="Edit Account"
              >
                <i class="fas fa-pencil-alt"></i>
              </button>
            </div>
            
            <div class="mt-4 border-t border-gray-100 pt-4">
              <dl class="grid grid-cols-1 gap-y-3 text-sm">
                <!-- Budget Information -->
                <div v-if="account.budget_dollars || account.budget_hours">
                  <div class="mb-2 font-medium text-gray-500">Budget:</div>
                  <div class="flex flex-col gap-y-1">
                    <div v-if="account.budget_dollars" class="flex items-center">
                      <span class="inline-flex items-center rounded-md bg-sage-50 px-2 py-1 text-xs font-medium text-sage-700 ring-1 ring-inset ring-sage-600/20">
                        <i class="fas fa-dollar-sign mr-1.5"></i>
                        {{ formatCurrency(account.budget_dollars) }}{{ formatBudgetFrequency(account.billing_frequency) }}
                      </span>
                    </div>
                    <div v-if="account.budget_hours" class="flex items-center">
                      <span class="inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-600/20">
                        <i class="fas fa-clock mr-1.5"></i>
                        {{ account.budget_hours }} hours{{ formatBudgetFrequency(account.billing_frequency) }}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div class="flex justify-between">
                  <dt class="font-medium text-gray-500">Billing Frequency:</dt>
                  <dd class="text-gray-900">{{ formatBillingFrequency(account.billing_frequency) }}</dd>
                </div>
                <div class="flex justify-between">
                  <dt class="font-medium text-gray-500">Invoice Type:</dt>
                  <dd class="text-gray-900">
                    <span class="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset"
                      :class="account.projects_single_invoice ? 
                        'bg-green-50 text-green-700 ring-green-600/20' : 
                        'bg-amber-50 text-amber-700 ring-amber-600/20'">
                      {{ account.projects_single_invoice ? 'Combined' : 'Separate' }}
                    </span>
                  </dd>
                </div>
                <div class="flex justify-between">
                  <dt class="font-medium text-gray-500">Email:</dt>
                  <dd class="text-gray-900">{{ account.email || 'Not provided' }}</dd>
                </div>
                <div v-if="account.address" class="pt-2 border-t border-gray-100">
                  <dt class="font-medium text-gray-500">Address:</dt>
                  <dd class="mt-1 text-gray-900 whitespace-pre-line">{{ account.address }}</dd>
                </div>
              </dl>
            </div>
          </div>
        </li>
        <li v-if="filteredAccounts.length === 0" class="col-span-full py-5">
          <div class="flex flex-col items-center justify-center p-10 bg-white rounded-lg shadow">
            <i class="fas fa-building text-5xl text-gray-300 mb-4"></i>
            <p class="text-lg font-medium text-gray-dark">No client accounts found</p>
            <p class="text-gray mb-4">Click "Create new account" to add one</p>
          </div>
        </li>
      </ul>
    </div>
    
    <!-- Account Drawer -->
    <AccountDrawer
      :is-open="isAccountDrawerOpen"
      :account-data="selectedAccount"
      @close="closeAccountDrawer"
      @save="saveAccount"
      @delete="handleDeleteFromDrawer"
    />
    
    <!-- Delete Confirmation Modal -->
    <ConfirmationModal
      :show="showDeleteModal"
      title="Delete Account"
      message="Are you sure you want to delete this account? This action cannot be undone and will also remove all projects associated with this account."
      @confirm="deleteAccount"
      @cancel="showDeleteModal = false"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { accountsAPI, fetchAccounts, createAccount, updateAccount, deleteAccount as deleteAccountAPI } from '../../api';
import AccountDrawer from '../../components/accounts/AccountDrawer.vue';
import ConfirmationModal from '../../components/ConfirmationModal.vue';

// State
const accounts = ref([]);
const isAccountDrawerOpen = ref(false);
const selectedAccount = ref(null);
const showDeleteModal = ref(false);
const accountToDelete = ref(null);

// Filter accounts to show only clients (non-internal)
const filteredAccounts = computed(() => {
  return accounts.value.filter(account => account.type !== 'ACCOUNT_TYPE_INTERNAL');
});

// Fetch data
onMounted(async () => {
  try {
    const accountsData = await fetchAccounts();
    accounts.value = accountsData || [];
  } catch (error) {
    console.error('Error loading accounts:', error);
  }
});

// Helper functions
const formatAccountType = (type) => {
  const types = {
    'ACCOUNT_TYPE_CLIENT': 'Client',
    'ACCOUNT_TYPE_INTERNAL': 'Internal'
  };
  return types[type] || type;
};

const formatBillingFrequency = (frequency) => {
  const frequencies = {
    'BILLING_TYPE_WEEKLY': 'Weekly',
    'BILLING_TYPE_BIWEEKLY': 'Bi-Weekly',
    'BILLING_TYPE_MONTHLY': 'Monthly',
    'BILLING_TYPE_BIMONTHLY': 'Bi-Monthly',
    'BILLING_TYPE_PROJECT': 'Project-Based'
  };
  return frequencies[frequency] || frequency;
};

// Format budget frequency suffix based on billing frequency
const formatBudgetFrequency = (frequency) => {
  switch (frequency) {
    case 'BILLING_TYPE_WEEKLY':
      return '/wk';
    case 'BILLING_TYPE_BIWEEKLY':
      return '/2wk';
    case 'BILLING_TYPE_MONTHLY':
      return '/mo';
    case 'BILLING_TYPE_BIMONTHLY':
      return '/2mo';
    case 'BILLING_TYPE_PROJECT':
      return ' total';
    default:
      return '';
  }
};

// Format currency
const formatCurrency = (amount) => {
  if (!amount) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(amount);
};

// Drawer functions
const openAccountDrawer = (account = null) => {
  if (account) {
    // Make sure we include both id and ID properties
    selectedAccount.value = {
      ...account,
      id: account.ID, // Include lowercase 'id' for compatibility with the drawer
    };
  } else {
    selectedAccount.value = account;
  }
  isAccountDrawerOpen.value = true;
};

const closeAccountDrawer = () => {
  isAccountDrawerOpen.value = false;
  selectedAccount.value = null;
};

// Save account
const saveAccount = async (accountData) => {
  try {
    if (accountData.id) {
      // Create a copy of the account data with both id and ID properties
      const accountToUpdate = {
        ...accountData,
        ID: accountData.id // Ensure ID property is set for API compatibility
      };
      await updateAccount(accountToUpdate); // Pass the full object instead of id, accountData
    } else {
      await createAccount(accountData);
    }
    
    // Refresh accounts
    const updatedAccounts = await fetchAccounts();
    accounts.value = updatedAccounts;
    
    // Close drawer
    closeAccountDrawer();
  } catch (error) {
    console.error('Error saving account:', error);
    alert('Failed to save account. Please try again.');
  }
};

// Delete account
const confirmDelete = (account) => {
  accountToDelete.value = account;
  showDeleteModal.value = true;
};

const deleteAccount = async () => {
  if (!accountToDelete.value) return;
  
  try {
    await deleteAccountAPI(accountToDelete.value.id);
    
    // Refresh accounts
    const updatedAccounts = await fetchAccounts();
    accounts.value = updatedAccounts;
    
    // Close modal
    showDeleteModal.value = false;
    accountToDelete.value = null;
  } catch (error) {
    console.error('Error deleting account:', error);
    alert('Failed to delete account. Please try again.');
  }
};

const handleDeleteFromDrawer = (account) => {
  confirmDelete(account);
};
</script>

<style scoped>
.bg-sage-50 {
  background-color: #F0F4F0;
}
.text-sage-700 {
  color: #2E6E32;
}
</style> 