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
    
    <!-- Account Table -->
    <div class="mt-8 flow-root">
      <div class="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div class="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
          <div class="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
            <table class="min-w-full divide-y divide-gray-300">
              <thead class="bg-gray-50">
                <tr>
                  <th scope="col" class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Name</th>
                  <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Type</th>
                  <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Email</th>
                  <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Phone</th>
                  <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Billing Frequency</th>
                  <th scope="col" class="relative py-3.5 pl-3 pr-4 sm:pr-6">
                    <span class="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 bg-white">
                <tr v-for="account in accounts" :key="account.id" class="hover:bg-gray-50">
                  <td class="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                    {{ account.name }}
                  </td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {{ formatAccountType(account.type) }}
                  </td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {{ account.email }}
                  </td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {{ account.phone }}
                  </td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {{ formatBillingFrequency(account.billingFrequency) }}
                  </td>
                  <td class="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                    <button
                      @click="openAccountDrawer(account)"
                      class="text-sage hover:text-sage-dark mr-4"
                    >
                      Edit
                    </button>
                    <button
                      @click="confirmDelete(account)"
                      class="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
                <tr v-if="accounts.length === 0">
                  <td colspan="6" class="px-3 py-4 text-sm text-gray-500 text-center">
                    No accounts found. Click "Create new account" to add one.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Account Drawer -->
    <AccountDrawer
      :is-open="isAccountDrawerOpen"
      :account-data="selectedAccount"
      @close="closeAccountDrawer"
      @save="saveAccount"
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
import { fetchAccounts, createAccount, updateAccount, deleteAccount as apiDeleteAccount } from '../../api/accounts';
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
    await apiDeleteAccount(accountToDelete.value.id);
    
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
</script> 