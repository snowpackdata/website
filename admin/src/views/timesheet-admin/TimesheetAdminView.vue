<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { getDraftInvoices } from '../../api/draftInvoices';
import { type DraftInvoice, type DraftEntry, type DraftAdjustment, formatDate, formatCurrency, getEntryStateClass, getEntryStateDisplayName } from '../../types/DraftInvoice';
import axios from 'axios';

// State for draft invoices
const draftInvoices = ref<DraftInvoice[]>([]);
const isLoading = ref(true);
const error = ref<string | null>(null);
const expandedInvoices = ref<Record<number, boolean>>({});
const editingNotes = ref<Record<number, boolean>>({});
const entryNotes = ref<Record<number, string>>({});

// Inline adjustment state
const inlineAdjustment = ref<{
  invoiceId: number | null;
  type: string;
  amount: number;
  notes: string;
}>({
  invoiceId: null,
  type: 'ADJUSTMENT_TYPE_CREDIT',
  amount: 0,
  notes: '',
});

// Replace modal state with inline editing state
const isAddingAdjustment = ref<Record<number, boolean>>({});

// Fetch draft invoices on component mount
onMounted(async () => {
  await fetchDraftInvoices();
});

// Fetch all draft invoices
const fetchDraftInvoices = async () => {
  isLoading.value = true;
  error.value = null;
  
  try {
    draftInvoices.value = await getDraftInvoices();
    
    // Initialize expansion state for each invoice
    draftInvoices.value.forEach(invoice => {
      expandedInvoices.value[invoice.ID] = false;
    });
    
  } catch (err) {
    console.error('Error fetching draft invoices:', err);
    error.value = 'Failed to load draft invoices. Please try again.';
  } finally {
    isLoading.value = false;
  }
};

// Toggle invoice details expansion
const toggleInvoiceExpansion = (invoiceId: number) => {
  expandedInvoices.value[invoiceId] = !expandedInvoices.value[invoiceId];
};

// Start editing entry notes
const handleEditEntryNotes = (entry: DraftEntry) => {
  editingNotes.value[entry.entry_id] = true;
  entryNotes.value[entry.entry_id] = entry.notes;
};

// Save edited entry notes
const handleSaveEntryNotes = async (entry: DraftEntry) => {
  try {
    // Create form data for the request
    const formData = new FormData();
    formData.append('notes', entryNotes.value[entry.entry_id]);
    
    // Use PUT form request as used elsewhere in the app
    await axios({
      method: 'put',
      url: `/api/entries/${entry.entry_id}`,
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    // Update the entry in the UI
    entry.notes = entryNotes.value[entry.entry_id];
    editingNotes.value[entry.entry_id] = false;
    
  } catch (err) {
    console.error('Error updating entry notes:', err);
    error.value = 'Failed to save notes. Please try again.';
  }
};

// Cancel editing entry notes
const handleCancelEditNotes = (entryId: number) => {
  editingNotes.value[entryId] = false;
};

// Handle entry void
const handleVoidEntry = async (entryId: number) => {
  try {
    // Use the correct updated endpoint for voiding entry
    await axios.post(`/api/entries/state/${entryId}/void`);
    await fetchDraftInvoices(); // Refresh data
  } catch (err) {
    console.error('Error voiding entry:', err);
    error.value = 'Failed to void entry. Please try again.';
  }
};

// Handle entry unvoid (restore to draft)
const handleUnvoidEntry = async (entryId: number) => {
  try {
    // Use the same state API pattern to set state back to draft
    await axios.post(`/api/entries/state/${entryId}/draft`);
    await fetchDraftInvoices(); // Refresh data
  } catch (err) {
    console.error('Error unvoiding entry:', err);
    error.value = 'Failed to restore entry. Please try again.';
  }
};

// Handle approve invoice
const handleApproveInvoice = async (invoiceId: number) => {
  try {
    // Use the correct endpoint for approving invoice with POST method
    await axios.post(`/api/invoices/${invoiceId}/approve`);
    await fetchDraftInvoices(); // Refresh data
  } catch (err) {
    console.error('Error approving invoice:', err);
    error.value = 'Failed to approve invoice. Please try again.';
  }
};

// Handle invoice void
const handleVoidInvoice = async (invoiceId: number) => {
  if (confirm('Are you sure you want to void this invoice? This action cannot be undone.')) {
    try {
      // Use the correct endpoint for voiding invoice with POST method
      await axios.post(`/api/invoices/${invoiceId}/void`);
      await fetchDraftInvoices(); // Refresh data
    } catch (err) {
      console.error('Error voiding invoice:', err);
      error.value = 'Failed to void invoice. Please try again.';
    }
  }
};

// New inline adjustment functions
const startAddingAdjustment = (invoiceId: number) => {
  // Reset form and set the current invoice
  inlineAdjustment.value = {
    invoiceId: invoiceId,
    type: 'ADJUSTMENT_TYPE_CREDIT',
    amount: 0,
    notes: '',
  };
  
  // Set this invoice to adjustment mode
  isAddingAdjustment.value[invoiceId] = true;
  
  // Make sure the invoice is expanded
  expandedInvoices.value[invoiceId] = true;
};

const cancelAddingAdjustment = (invoiceId: number) => {
  isAddingAdjustment.value[invoiceId] = false;
};

// Add adjustment to invoice - modified to use inline data
const handleAddAdjustment = async () => {
  const invoiceId = inlineAdjustment.value.invoiceId;
  if (!invoiceId) return;
  
  // Validate input
  if (inlineAdjustment.value.amount <= 0) {
    error.value = 'Amount must be greater than zero.';
    return;
  }
  
  try {
    error.value = null;
    
    // Create form data for the request
    const formData = new FormData();
    formData.append('invoice_id', invoiceId.toString());
    formData.append('type', inlineAdjustment.value.type);
    formData.append('amount', inlineAdjustment.value.amount.toString());
    formData.append('notes', inlineAdjustment.value.notes || '');
    
    // Use the correct API endpoint with FormData
    await axios({
      method: 'post',
      url: '/api/adjustments/0',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    // Close the inline form
    isAddingAdjustment.value[invoiceId] = false;
    
    await fetchDraftInvoices(); // Refresh data
  } catch (error: any) {
    console.error('Error adding adjustment:', error);
    // More detailed error message
    if (error.response) {
      // The server responded with an error
      error.value = `Failed to add adjustment (${error.response.status}): ${error.response.data?.message || 'Server error'}`;
    } else if (error.request) {
      // The request was made but no response was received
      error.value = 'Failed to add adjustment: No response from server. Please try again.';
    } else {
      // Something happened in setting up the request
      error.value = `Failed to add adjustment: ${error.message || 'Unknown error'}`;
    }
  }
};

// Format adjustment type for display
const formatAdjustmentType = (type: string): string => {
  return type.replace('ADJUSTMENT_TYPE_', '');
};

// Get color class for adjustment based on type
const getAdjustmentColorClass = (adjustment: DraftAdjustment): string => {
  if (adjustment.type === 'ADJUSTMENT_TYPE_CREDIT') {
    return 'text-green-600';
  } else {
    return 'text-red-600';
  }
};

// Check if entry is voided
const isVoidedEntry = (entry: DraftEntry): boolean => {
  return entry.state === 'ENTRY_STATE_VOID';
};

// Handle adjustment void
const handleVoidAdjustment = async (adjustmentId: number) => {
  try {
    // Use the correct endpoint for voiding adjustment
    await axios.post(`/api/adjustments/state/${adjustmentId}/void`);
    await fetchDraftInvoices(); // Refresh data
  } catch (err) {
    console.error('Error voiding adjustment:', err);
    error.value = 'Failed to void adjustment. Please try again.';
  }
};

// Handle adjustment unvoid (restore to draft)
const handleUnvoidAdjustment = async (adjustmentId: number) => {
  try {
    // Use the same state API pattern to set state back to draft
    await axios.post(`/api/adjustments/state/${adjustmentId}/draft`);
    await fetchDraftInvoices(); // Refresh data
  } catch (err) {
    console.error('Error unvoiding adjustment:', err);
    error.value = 'Failed to restore adjustment. Please try again.';
  }
};

// Check if adjustment is voided
const isVoidedAdjustment = (adjustment: DraftAdjustment): boolean => {
  return adjustment.state === 'ADJUSTMENT_STATE_VOID';
};

// Check if invoice period has ended (period_end is in the past)
const isInvoicePeriodEnded = (invoice: DraftInvoice): boolean => {
  const periodEnd = new Date(invoice.period_end);
  const now = new Date();
  
  // Set times to midnight for accurate date comparison
  periodEnd.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  
  return periodEnd < now;
};

// Get invoice status badge class based on period end date
const getInvoiceStatusBadgeClass = (invoice: DraftInvoice): string => {
  return isInvoicePeriodEnded(invoice) 
    ? 'bg-green-50 text-green-700' 
    : 'bg-blue-50 text-blue-700';
};
</script>

<template>
  <div class="px-4 sm:px-6 lg:px-8">
    <div class="sm:flex sm:items-center">
      <div class="sm:flex-auto">
        <h1 class="text-lg font-medium text-gray-900">Draft Invoices</h1>
        <p class="mt-2 text-sm text-gray-500">Review and approve draft invoices before sending them to clients.</p>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="isLoading" class="flex flex-col items-center justify-center p-10 bg-white rounded-lg shadow mt-6">
      <i class="fas fa-spinner fa-spin text-3xl text-blue-400 mb-4"></i>
      <span class="text-gray-700">Loading draft invoices...</span>
    </div>
    
    <!-- Error state -->
    <div v-else-if="error" class="flex flex-col items-center justify-center p-10 bg-white rounded-lg shadow mt-6">
      <i class="fas fa-exclamation-circle text-3xl text-red-400 mb-4"></i>
      <span class="text-gray-700 mb-2">{{ error }}</span>
      <button @click="fetchDraftInvoices" class="btn-secondary mt-4">
        <i class="fas fa-sync mr-2"></i> Retry
      </button>
    </div>
    
    <!-- Empty state -->
    <div v-else-if="draftInvoices.length === 0" class="flex flex-col items-center justify-center p-10 bg-white rounded-lg shadow mt-6">
      <i class="fas fa-file-invoice-dollar text-4xl text-blue-400 mb-4"></i>
      <p class="text-base font-medium text-gray-700">No draft invoices found</p>
      <p class="text-sm text-gray-500 mb-4">Draft invoices will appear here once they are generated</p>
    </div>
    
    <!-- Draft invoices list -->
    <div v-else class="mt-6 space-y-5">
      <!-- Invoice card for each draft invoice -->
      <div v-for="invoice in draftInvoices" :key="invoice.ID" class="bg-white rounded-lg shadow overflow-hidden">
        <!-- Invoice header -->
        <div class="px-4 py-4 sm:px-6 flex justify-between items-start border-b border-gray-200">
          <div>
            <div class="flex items-center">
              <h3 class="text-base font-medium text-gray-900">{{ invoice.invoice_name }}</h3>
              <span class="ml-2 px-2 py-0.5 rounded-full text-xs font-medium" :class="getInvoiceStatusBadgeClass(invoice)">
                {{ isInvoicePeriodEnded(invoice) ? 'Ready' : 'DRAFT' }}
              </span>
            </div>
            <div class="mt-1 text-xs text-gray-500 space-y-1">
              <div><span class="font-medium">Account:</span> {{ invoice.account_name }}</div>
              <div v-if="invoice.project_name"><span class="font-medium">Project:</span> {{ invoice.project_name }}</div>
              <div><span class="font-medium">Period:</span> {{ formatDate(invoice.period_start) }} - {{ formatDate(invoice.period_end) }}</div>
            </div>
          </div>
          <div class="text-right">
            <div class="text-xs text-gray-500">Total Hours</div>
            <div class="text-base font-medium text-gray-900">{{ invoice.total_hours.toFixed(2) }}</div>
            <div class="text-xs text-gray-500 mt-2">Total Amount</div>
            <div class="text-base font-medium text-gray-900">{{ formatCurrency(invoice.total_amount) }}</div>
          </div>
        </div>
        
        <!-- Invoice details toggle -->
        <div class="border-b border-gray-200 bg-gray-50 px-4 py-2 sm:px-6 flex justify-between items-center">
          <button 
            @click="toggleInvoiceExpansion(invoice.ID)" 
            class="text-xs font-medium text-blue-600 hover:text-blue-500 flex items-center"
          >
            {{ expandedInvoices[invoice.ID] ? 'Hide Details' : 'Show Details' }}
            <i 
              :class="[expandedInvoices[invoice.ID] ? 'fa-chevron-up' : 'fa-chevron-down', 'fas ml-1']"
              aria-hidden="true"
            ></i>
          </button>
          
          <div class="space-x-2">
            <button 
              @click="handleVoidInvoice(invoice.ID)"
              class="inline-flex items-center px-2.5 py-1 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-gray-500 hover:bg-gray-600 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-gray-400"
            >
              <i class="fas fa-ban mr-1"></i> Void
            </button>
            <button 
              @click="handleApproveInvoice(invoice.ID)"
              class="inline-flex items-center px-2.5 py-1 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-blue-400"
            >
              <i class="fas fa-check mr-1"></i> Approve
            </button>
          </div>
        </div>
        
        <!-- Expandable details section -->
        <div v-if="expandedInvoices[invoice.ID]" class="divide-y divide-gray-200">
          <!-- Line items section -->
          <div v-if="invoice.line_items && invoice.line_items.length > 0" class="px-4 py-3 sm:px-6">
            <h4 class="text-xs font-medium text-gray-700 mb-2">Line Items</h4>
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200 text-xs">
                <thead>
                  <tr class="bg-gray-50">
                    <th scope="col" class="px-3 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff</th>
                    <th scope="col" class="px-3 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Billing Code</th>
                    <th scope="col" class="px-3 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th scope="col" class="px-3 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                    <th scope="col" class="px-3 py-1.5 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Hours</th>
                    <th scope="col" class="px-3 py-1.5 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Fee</th>
                    <th scope="col" class="px-3 py-1.5 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th scope="col" class="px-3 py-1.5 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  <tr v-for="entry in invoice.line_items" :key="entry.entry_id" :class="{ 'voided-entry': isVoidedEntry(entry) }">
                    <td class="px-3 py-1.5 whitespace-nowrap">
                      <div class="font-medium text-gray-900">
                        {{ entry.user_name }}
                      </div>
                      <div v-if="entry.is_impersonated" class="text-xs text-gray-500">
                        <span class="italic">impersonated by {{ entry.created_by_name }}</span>
                      </div>
                    </td>
                    <td class="px-3 py-1.5 whitespace-nowrap text-gray-700">{{ entry.billing_code }}</td>
                    <td class="px-3 py-1.5 whitespace-nowrap text-gray-700">{{ formatDate(entry.start_date) }}</td>
                    <td class="px-3 py-1.5 text-gray-700 max-w-xs">
                      <template v-if="editingNotes[entry.entry_id]">
                        <textarea 
                          v-model="entryNotes[entry.entry_id]" 
                          class="w-full px-2 py-1 text-xxs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          rows="2"
                        ></textarea>
                      </template>
                      <template v-else>
                        <div class="truncate">{{ entry.notes }}</div>
                      </template>
                    </td>
                    <td class="px-3 py-1.5 whitespace-nowrap text-right text-gray-700">{{ entry.duration_hours.toFixed(2) }}</td>
                    <td class="px-3 py-1.5 whitespace-nowrap text-right text-gray-700">{{ formatCurrency(entry.fee) }}</td>
                    <td class="px-3 py-1.5 whitespace-nowrap text-center">
                      <span :class="[getEntryStateClass(entry.state), 'px-1.5 py-0.5 text-xs rounded-full inline-block']">
                        {{ getEntryStateDisplayName(entry.state) }}
                      </span>
                    </td>
                    <td class="px-3 py-1.5 whitespace-nowrap text-right">
                      <template v-if="entry.state === 'ENTRY_STATE_DRAFT'">
                        <template v-if="editingNotes[entry.entry_id]">
                          <button
                            @click="handleSaveEntryNotes(entry)"
                            class="text-xs text-blue-600 hover:text-blue-800"
                          >
                            <i class="fas fa-save mr-1"></i> Save
                          </button>
                          <button
                            @click="handleCancelEditNotes(entry.entry_id)"
                            class="text-xs text-gray-500 hover:text-gray-700 ml-2"
                          >
                            <i class="fas fa-times mr-1"></i> Cancel
                          </button>
                        </template>
                        <template v-else>
                          <button
                            @click="handleEditEntryNotes(entry)"
                            class="text-xs text-blue-600 hover:text-blue-800"
                          >
                            <i class="fas fa-edit mr-1"></i> Edit
                          </button>
                          <button
                            @click="handleVoidEntry(entry.entry_id)"
                            class="text-xs text-gray-500 hover:text-gray-700 ml-2"
                          >
                            <i class="fas fa-ban mr-1"></i> Void
                          </button>
                        </template>
                      </template>
                      <template v-else-if="entry.state === 'ENTRY_STATE_VOID'">
                        <button
                          @click="handleUnvoidEntry(entry.entry_id)"
                          class="text-xs text-blue-600 hover:text-blue-800"
                        >
                          <i class="fas fa-undo mr-1"></i> Restore
                        </button>
                      </template>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          <!-- Adjustments section -->
          <div class="px-4 py-3 sm:px-6">
            <h4 class="text-xs font-medium text-gray-700 mb-2">Adjustments</h4>
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200 text-xs">
                <thead>
                  <tr class="bg-gray-50">
                    <th scope="col" class="px-3 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th scope="col" class="px-3 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                    <th scope="col" class="px-3 py-1.5 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th scope="col" class="px-3 py-1.5 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  <!-- Existing adjustments -->
                  <tr v-for="adjustment in invoice.adjustments" :key="adjustment.ID" :class="{ 'voided-entry': isVoidedAdjustment(adjustment) }">
                    <td class="px-3 py-1.5 whitespace-nowrap font-medium" :class="getAdjustmentColorClass(adjustment)">
                      {{ formatAdjustmentType(adjustment.type) }}
                    </td>
                    <td class="px-3 py-1.5 text-gray-700">{{ adjustment.notes }}</td>
                    <td class="px-3 py-1.5 whitespace-nowrap text-right font-medium" :class="getAdjustmentColorClass(adjustment)">
                      {{ formatCurrency(adjustment.amount) }}
                    </td>
                    <td class="px-3 py-1.5 whitespace-nowrap text-right">
                      <template v-if="adjustment.state === 'ADJUSTMENT_STATE_DRAFT'">
                        <button
                          @click="handleVoidAdjustment(adjustment.ID)"
                          class="text-xs text-gray-500 hover:text-gray-700"
                        >
                          <i class="fas fa-ban mr-1"></i> Void
                        </button>
                      </template>
                      <template v-else-if="adjustment.state === 'ADJUSTMENT_STATE_VOID'">
                        <button
                          @click="handleUnvoidAdjustment(adjustment.ID)"
                          class="text-xs text-blue-600 hover:text-blue-800"
                        >
                          <i class="fas fa-undo mr-1"></i> Restore
                        </button>
                      </template>
                    </td>
                  </tr>
                  
                  <!-- Inline adjustment form -->
                  <tr v-if="isAddingAdjustment[invoice.ID]" class="bg-gray-50">
                    <td class="px-3 py-1.5">
                      <select 
                        v-model="inlineAdjustment.type"
                        class="w-full px-2 py-1 text-xxs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="ADJUSTMENT_TYPE_CREDIT" class="text-xxs">Credit</option>
                        <option value="ADJUSTMENT_TYPE_FEE" class="text-xxs">Fee</option>
                      </select>
                    </td>
                    <td class="px-3 py-1.5">
                      <textarea 
                        v-model="inlineAdjustment.notes"
                        rows="2"
                        placeholder="Enter notes"
                        class="w-full px-2 py-1 text-xxs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      ></textarea>
                    </td>
                    <td class="px-3 py-1.5">
                      <input 
                        type="number" 
                        v-model="inlineAdjustment.amount"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        class="w-full px-2 py-1 text-xxs border border-gray-300 rounded text-right focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </td>
                    <td class="px-3 py-1.5 whitespace-nowrap text-right">
                      <button
                        @click="handleAddAdjustment"
                        class="text-xs text-blue-600 hover:text-blue-800"
                      >
                        <i class="fas fa-save mr-1"></i> Save
                      </button>
                      <button
                        @click="cancelAddingAdjustment(invoice.ID)"
                        class="text-xs text-gray-500 hover:text-gray-700 ml-2"
                      >
                        <i class="fas fa-times mr-1"></i> Cancel
                      </button>
                    </td>
                  </tr>
                  
                  <!-- Empty state with add button -->
                  <tr v-if="!invoice.adjustments || invoice.adjustments.length === 0 && !isAddingAdjustment[invoice.ID]">
                    <td colspan="4" class="px-3 py-4 text-center text-gray-500">
                      <p class="text-xs">No adjustments found</p>
                      <button 
                        @click="startAddingAdjustment(invoice.ID)"
                        class="mt-2 inline-flex items-center px-2 py-1 text-xs text-blue-600 hover:text-blue-800"
                      >
                        <i class="fas fa-plus-circle mr-1"></i> Add Adjustment
                      </button>
                    </td>
                  </tr>
                </tbody>
                
                <!-- Add a button to add another adjustment if there are already some -->
                <tfoot v-if="(invoice.adjustments && invoice.adjustments.length > 0) || isAddingAdjustment[invoice.ID]">
                  <tr class="bg-gray-50">
                    <td colspan="2" class="px-3 py-1.5 text-right font-medium text-gray-700">Total Adjustments</td>
                    <td class="px-3 py-1.5 text-right font-medium text-gray-900">{{ formatCurrency(invoice.total_adjustments) }}</td>
                    <td class="px-3 py-1.5 text-right">
                      <button 
                        v-if="!isAddingAdjustment[invoice.ID]"
                        @click="startAddingAdjustment(invoice.ID)"
                        class="text-xs text-blue-600 hover:text-blue-800"
                      >
                        <i class="fas fa-plus-circle mr-1"></i> Add
                      </button>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
          
          <!-- Invoice summary -->
          <div class="bg-gray-50 px-4 py-3 sm:px-6">
            <div class="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span class="font-medium text-gray-500">Total Hours:</span>
                <span class="ml-2 font-medium text-gray-900">{{ invoice.total_hours.toFixed(2) }}</span>
              </div>
              <div class="text-right">
                <span class="font-medium text-gray-500">Fees:</span>
                <span class="ml-2 font-medium text-gray-900">{{ formatCurrency(invoice.total_fees) }}</span>
              </div>
              <div>
                <span class="font-medium text-gray-500">Adjustments:</span>
                <span class="ml-2 font-medium text-gray-900">{{ formatCurrency(invoice.total_adjustments) }}</span>
              </div>
              <div class="text-right">
                <span class="font-medium text-gray-500">Total Amount:</span>
                <span class="ml-2 font-medium text-gray-900">{{ formatCurrency(invoice.total_amount) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.btn-secondary {
  display: inline-flex;
  align-items: center;
  padding: 0.375rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: #374151;
  background-color: white;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

.btn-secondary:hover {
  background-color: #f9fafb;
}

.btn-secondary:focus {
  outline: none;
}

.voided-entry {
  text-decoration: line-through;
  opacity: 0.6;
}

/* Custom adjustment color classes with more subtle colors */
.text-green-600 {
  color: #059669;
}

.text-red-600 {
  color: #dc2626;
}

/* Custom extra small text size */
.text-xxs {
  font-size: 0.65rem !important;
}
</style> 