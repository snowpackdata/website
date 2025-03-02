<template>
  <div class="px-4 py-6 sm:px-6 lg:px-8">
    <div class="sm:flex sm:items-center">
      <div class="sm:flex-auto">
        <h1 class="text-base font-semibold leading-6 text-gray-900">Accounts</h1>
        <p class="mt-2 text-sm text-gray-700">
          A list of all accounts including their name, type, email, and billing information.
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
      <ul role="list" class="divide-y divide-gray-200">
        <li v-for="account in accounts" :key="account.id" class="py-5">
          <div class="overflow-hidden bg-white shadow sm:rounded-lg">
            <div class="px-4 py-4 sm:px-6 flex justify-between items-start">
              <div>
                <h3 class="text-lg font-semibold text-gray-900">{{ account.name }}</h3>
                <p class="mt-1 max-w-2xl text-sm text-gray-500">{{ formatAccountType(account.type) }}</p>
              </div>
              <button
                @click="openAccountDrawer(account)"
                class="text-sage hover:text-sage-dark rounded-full p-2 hover:bg-gray-100 transition-colors"
                title="Edit Account"
              >
                <i class="fas fa-pencil-alt"></i>
              </button>
            </div>
            <div class="border-t border-gray-100">
              <dl class="divide-y divide-gray-100">
                <div class="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt class="text-sm font-medium text-gray-900">Email</dt>
                  <dd class="mt-1 text-sm text-gray-700 sm:col-span-2 sm:mt-0">{{ account.email || 'Not specified' }}</dd>
                </div>
                <div class="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt class="text-sm font-medium text-gray-900">Address</dt>
                  <dd class="mt-1 text-sm text-gray-700 sm:col-span-2 sm:mt-0 whitespace-pre-line">{{ account.address || 'Not specified' }}</dd>
                </div>
                <div class="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt class="text-sm font-medium text-gray-900">Billing Frequency</dt>
                  <dd class="mt-1 text-sm text-gray-700 sm:col-span-2 sm:mt-0">{{ formatBillingFrequency(account.billing_frequency) }}</dd>
                </div>
                <div class="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt class="text-sm font-medium text-gray-900">Invoice Type</dt>
                  <dd class="mt-1 text-sm text-gray-700 sm:col-span-2 sm:mt-0">
                    {{ account.projects_single_invoice ? 'Combined (all projects in one invoice)' : 'Separate (one invoice per project)' }}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </li>
        <li v-if="accounts.length === 0" class="py-5">
          <div class="flex flex-col items-center justify-center p-10 bg-white rounded-lg shadow">
            <i class="fas fa-building text-5xl text-teal mb-4"></i>
            <p class="text-lg font-medium text-gray-dark">No accounts found</p>
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
import { ref, onMounted } from 'vue';
import { accountsAPI, fetchAccounts, createAccount, updateAccount, deleteAccount as deleteAccountAPI } from '../../api';
import AccountDrawer from '../../components/accounts/AccountDrawer.vue';
import ConfirmationModal from '../../components/ConfirmationModal.vue';

// State
const accounts = ref([]);
const isAccountDrawerOpen = ref(false);
const selectedAccount = ref(null);
const showDeleteModal = ref(false);
const accountToDelete = ref(null);

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

// Drawer functions
const openAccountDrawer = (account = null) => {
  selectedAccount.value = account;
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
      await updateAccount(accountData.id, accountData);
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