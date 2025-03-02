<template>
  <div class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow transition hover:shadow-md p-6">
    <!-- Project Header - Full Width -->
    <div class="flex items-start justify-between mb-4">
      <div>
        <div class="flex items-center gap-x-2">
          <h3 class="text-lg font-semibold text-gray-900">{{ project.name }}</h3>
          
          <!-- Project Status Badge -->
          <span 
            class="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset"
            :class="getProjectStatus(project).color">
            {{ getProjectStatus(project).label }}
          </span>
          
          <!-- Internal Badge if applicable -->
          <span 
            v-if="project.internal"
            class="inline-flex items-center rounded-md bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700 ring-1 ring-inset ring-purple-700/10">
            Internal
          </span>
        </div>
        <p class="mt-1 text-sm text-gray-500">{{ project.account ? project.account.name : 'No Account' }}</p>
      </div>
      <button
        @click="$emit('edit', project)"
        class="inline-flex items-center rounded-md bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 hover:bg-blue-100 transition-colors"
        title="Edit Project"
      >
        <i class="fas fa-pencil-alt mr-1.5"></i>
        Edit
      </button>
    </div>
    
    <!-- Two-Column Layout for Card Body -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 border-t border-gray-100 pt-4">
      <!-- Left Column - Project Information -->
      <div class="space-y-6">
        <!-- Budget Information -->
        <div v-if="project.budget_dollars || project.budget_hours" class="mb-4">
          <div class="mb-2 font-medium text-gray-500">Budget:</div>
          <div class="flex flex-wrap gap-2">
            <div v-if="project.budget_dollars" class="flex items-center">
              <span class="inline-flex items-center rounded-md bg-sage-50 px-2 py-1 text-xs font-medium text-sage-700 ring-1 ring-inset ring-sage-600/20">
                <i class="fas fa-dollar-sign mr-1.5"></i>
                {{ formatCurrency(project.budget_dollars) }}{{ formatBudgetFrequency(project.billing_frequency) }}
              </span>
            </div>
            <div v-if="project.budget_hours" class="flex items-center">
              <span class="inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-600/20">
                <i class="fas fa-clock mr-1.5"></i>
                {{ project.budget_hours }} hours{{ formatBudgetFrequency(project.billing_frequency) }}
              </span>
            </div>
          </div>
        </div>
        
        <!-- Timeframe Information -->
        <dl class="grid grid-cols-1 gap-y-3 text-sm">
          <div class="flex justify-between">
            <dt class="font-medium text-gray-500">Timeframe:</dt>
            <dd class="text-gray-900">
              {{ formatDate(project.active_start) }} to {{ formatDate(project.active_end) }}
            </dd>
          </div>
          <div class="flex justify-between">
            <dt class="font-medium text-gray-500">Status:</dt>
            <dd class="text-gray-900">{{ getProjectTimeframe(project) }}</dd>
          </div>
          <div class="flex justify-between">
            <dt class="font-medium text-gray-500">Type:</dt>
            <dd class="text-gray-900">{{ formatProjectType(project.project_type) }}</dd>
          </div>
          <div class="flex justify-between">
            <dt class="font-medium text-gray-500">Billing:</dt>
            <dd class="text-gray-900">{{ formatBillingFrequency(project.billing_frequency) }}</dd>
          </div>
        </dl>
        
        <!-- Account Team Information -->
        <div>
          <h5 class="font-medium text-gray-900 mb-3">Account Team</h5>
          <div class="space-y-0 divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden">
            <div class="flex items-center justify-between py-3 px-4 hover:bg-gray-50">
              <div class="min-w-0 flex-1">
                <div class="flex items-start">
                  <p class="text-sm font-semibold text-gray-900">Account Executive</p>
                </div>
                <div class="mt-1 text-xs text-gray-500">
                  <p>{{ getStaffName(project.ae_id) }}</p>
                </div>
              </div>
            </div>
            <div class="flex items-center justify-between py-3 px-4 hover:bg-gray-50">
              <div class="min-w-0 flex-1">
                <div class="flex items-start">
                  <p class="text-sm font-semibold text-gray-900">Sales Development Rep</p>
                </div>
                <div class="mt-1 text-xs text-gray-500">
                  <p>{{ getStaffName(project.sdr_id) }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Right Column - Billing Codes -->
      <div>
        <!-- Billing Codes Section -->
        <div>
          <h5 class="font-medium text-gray-900 mb-3">Billing Codes</h5>
          <div v-if="project.billing_codes && project.billing_codes.length > 0" class="space-y-0 divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden">
            <div v-for="code in project.billing_codes" :key="code.ID" 
                  class="flex items-center justify-between gap-x-6 py-3 px-4 hover:bg-gray-50">
              <div class="min-w-0 flex-1">
                <div class="flex items-start gap-x-3">
                  <p class="text-sm font-semibold text-gray-900">{{ code.name }}</p>
                  <p v-if="code.active" class="text-green-700 bg-green-50 ring-green-600/20 mt-0.5 whitespace-nowrap rounded-md px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset">
                    Active
                  </p>
                  <p v-else class="text-red-700 bg-red-50 ring-red-600/20 mt-0.5 whitespace-nowrap rounded-md px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset">
                    Inactive
                  </p>
                </div>
                <div class="mt-1 flex items-center gap-x-2 text-xs text-gray-500">
                  <p class="whitespace-nowrap">
                    <span class="font-medium">{{ code.code }}</span>
                  </p>
                  <svg viewBox="0 0 2 2" class="h-0.5 w-0.5 fill-current">
                    <circle cx="1" cy="1" r="1" />
                  </svg>
                  <!-- Rates Section -->
                  <p v-if="isLoadingRates" class="whitespace-nowrap italic">
                    Loading rates...
                  </p>
                  <div v-else class="flex flex-row items-center divide-x divide-gray-200">
                    <!-- Client rate -->
                    <div class="pr-2">
                      <p v-if="getRateById(code.rate_id)" class="whitespace-nowrap">
                        <span class="font-medium text-green-700">{{ formatCurrency(getRateById(code.rate_id)?.amount || 0) }}</span>
                        <span class="ml-1 text-xs text-gray-500">(client)</span>
                      </p>
                      <p v-else class="whitespace-nowrap italic">
                        No client rate
                      </p>
                    </div>
                    
                    <!-- Internal rate (cost) -->
                    <div class="px-2">
                      <p v-if="getRateById(code.internal_rate_id)" class="whitespace-nowrap">
                        <span class="font-medium text-blue-700">{{ formatCurrency(getRateById(code.internal_rate_id)?.amount || 0) }}</span>
                        <span class="ml-1 text-xs text-gray-500">(internal)</span>
                      </p>
                      <p v-else-if="code.internal_rate_id" class="whitespace-nowrap italic">
                        Internal rate not found
                      </p>
                      <p v-else class="whitespace-nowrap italic">
                        No internal rate
                      </p>
                    </div>
                    
                    <!-- Profit margin (if both rates exist) -->
                    <div class="pl-2">
                      <p v-if="getRateById(code.rate_id) && getRateById(code.internal_rate_id)" class="whitespace-nowrap">
                        <span 
                          class="font-medium" 
                          :class="getMarginClass(getRateById(code.rate_id)?.amount || 0, getRateById(code.internal_rate_id)?.amount || 0)"
                        >
                          {{ formatProfit(getRateById(code.rate_id)?.amount || 0, getRateById(code.internal_rate_id)?.amount || 0) }}
                        </span>
                        <span class="ml-1 text-xs text-gray-500">(margin)</span>
                      </p>
                      <p v-else class="whitespace-nowrap italic">
                        No margin data
                      </p>
                    </div>
                  </div>
                  <svg v-if="code.type" viewBox="0 0 2 2" class="h-0.5 w-0.5 fill-current">
                    <circle cx="1" cy="1" r="1" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="text-gray-700 italic bg-gray-50 p-4 rounded-lg border border-gray-200 text-center">
            <p>No billing codes available for this project.</p>
          </div>
        </div>
      </div>
    </div>
    
    <!-- View Details Button - Full Width -->
    <div class="mt-6 pt-3 border-t border-gray-100">
      <button 
        @click="toggleExpanded"
        class="text-sm flex items-center justify-center w-full px-3 py-2 font-medium rounded-md bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors"
      >
        <span>{{ isExpanded ? 'Hide details' : 'View details' }}</span>
        <i :class="[isExpanded ? 'fa-chevron-up' : 'fa-chevron-down', 'fas ml-2']"></i>
      </button>
    </div>
    
    <!-- Expandable Details Section - Full Width -->
    <div 
      v-if="isExpanded" 
      class="mt-4 border-t border-gray-100 pt-4 text-sm"
    >
      <h4 class="font-medium text-gray-900 mb-3">Billable Details</h4>
      
      <!-- Loading State -->
      <div v-if="isLoading" class="py-3 flex justify-center">
        <i class="fas fa-circle-notch fa-spin text-teal"></i>
        <span class="ml-2 text-gray-700">Loading details...</span>
      </div>
      
      <!-- Error State -->
      <div v-else-if="analyticsError" class="py-3 text-center">
        <div class="text-red-500 mb-2">{{ analyticsError }}</div>
        <button 
          @click="fetchAnalyticsData" 
          class="text-sm inline-flex items-center px-3 py-1.5 rounded bg-gray-100 text-gray-700 hover:bg-gray-200"
        >
          <i class="fas fa-sync-alt mr-1.5"></i> Retry
        </button>
      </div>
      
      <!-- Details Content -->
      <div v-else-if="analytics" class="space-y-6">
        <!-- Project Totals -->
        <div>
          <h5 class="text-sm font-medium text-gray-900 mb-2">Project Totals</h5>
          <div class="grid grid-cols-2 gap-4">
            <div class="bg-gray-50 p-3 rounded-lg">
              <div class="text-xs text-gray-500">Total Hours</div>
              <div class="text-lg font-semibold text-gray-900">{{ analytics.total_hours.toFixed(2) }}</div>
            </div>
            <div class="bg-gray-50 p-3 rounded-lg">
              <div class="text-xs text-gray-500">Total Fees</div>
              <div class="text-lg font-semibold text-gray-900">{{ formatCurrency(analytics.total_fees) }}</div>
            </div>
          </div>
        </div>
        
        <!-- Current Billing Period -->
        <div>
          <h5 class="text-sm font-medium text-gray-900 mb-2">Current Billing Period</h5>
          <div class="grid grid-cols-2 gap-4">
            <div class="bg-gray-50 p-3 rounded-lg">
              <div class="text-xs text-gray-500">Period Hours</div>
              <div class="text-lg font-semibold text-gray-900">{{ analytics.period_hours.toFixed(2) }}</div>
            </div>
            <div class="bg-gray-50 p-3 rounded-lg">
              <div class="text-xs text-gray-500">Period Fees</div>
              <div class="text-lg font-semibold text-gray-900">{{ formatCurrency(analytics.period_fees) }}</div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- No Data State -->
      <div v-else class="py-3 text-center text-gray-500">
        <p>No analytics data available for this project.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, defineProps, defineEmits, onMounted } from 'vue';
import { formatDate } from '../../utils/dateUtils';
import { getProjectAnalytics } from '../../api/projects';
import { fetchRates } from '../../api/rates';
import type { Project } from '../../types/Project';
import type { Rate } from '../../types/Rate';

// Define proper types for props
const props = defineProps({
  project: {
    type: Object as () => Project,
    required: true
  },
  staffMembers: {
    type: Array as () => Array<{
      ID: number;
      first_name: string;
      last_name: string;
      [key: string]: any;
    }>,
    default: () => []
  }
});

defineEmits(['edit']);

const isExpanded = ref(false);
const isLoading = ref(false);
const rates = ref<Rate[]>([]);
const isLoadingRates = ref(false);

// Fetch rates on component mount
onMounted(async () => {
  isLoadingRates.value = true;
  try {
    rates.value = await fetchRates();
    console.log('Fetched rates:', rates.value);
  } catch (error) {
    console.error('Failed to fetch rates:', error);
  } finally {
    isLoadingRates.value = false;
  }
});

// Helper function to get rate by ID
const getRateById = (rateId: number | null | undefined) => {
  if (!rateId) return null;
  return rates.value.find(rate => rate.ID === rateId);
};

const analytics = ref<{
  total_hours: number;
  total_fees: number;
  period_hours: number;
  period_fees: number;
} | null>(null);
const analyticsError = ref<string | null>(null);

// Toggle expanded state
const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value;
  
  if (isExpanded.value) {
    fetchAnalyticsData();
  }
};

// Fetch analytics data
const fetchAnalyticsData = async () => {
  if (!props.project.ID) return;
  
  isLoading.value = true;
  analyticsError.value = null;
  
  try {
    const data = await getProjectAnalytics(props.project.ID);
    analytics.value = data;
  } catch (error) {
    console.error('Failed to fetch analytics:', error);
    analyticsError.value = 'Failed to load analytics data';
  } finally {
    isLoading.value = false;
  }
};

// Format project type for display
const formatProjectType = (type: string) => {
  const types: Record<string, string> = {
    'PROJECT_TYPE_NEW': 'New',
    'PROJECT_TYPE_EXISTING': 'Existing'
  };
  return types[type] || type;
};

// Format billing frequency for display
const formatBillingFrequency = (frequency: string) => {
  const frequencies: Record<string, string> = {
    'BILLING_TYPE_WEEKLY': 'Weekly',
    'BILLING_TYPE_BIWEEKLY': 'Bi-Weekly',
    'BILLING_TYPE_MONTHLY': 'Monthly',
    'BILLING_TYPE_BIMONTHLY': 'Bi-Monthly',
    'BILLING_TYPE_PROJECT': 'Project-Based'
  };
  return frequencies[frequency] || frequency;
};

// Format budget frequency suffix based on billing frequency
const formatBudgetFrequency = (frequency: string) => {
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
const formatCurrency = (amount: number) => {
  if (!amount) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(amount);
};

// Calculate project status
const getProjectStatus = (project: Project) => {
  const now = new Date();
  const startDate = new Date(project.active_start);
  const endDate = new Date(project.active_end);
  
  if (now < startDate) {
    return { status: 'upcoming', label: 'Upcoming', color: 'bg-blue-50 text-blue-700 ring-blue-700/10' };
  } else if (now > endDate) {
    return { status: 'completed', label: 'Completed', color: 'bg-gray-100 text-gray-700 ring-gray-700/10' };
  } else {
    return { status: 'active', label: 'Active', color: 'bg-green-50 text-green-700 ring-green-700/10' };
  }
};

// Calculate days remaining or days overdue
const getProjectTimeframe = (project: Project) => {
  const now = new Date();
  const endDate = new Date(project.active_end);
  const diffTime = endDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays > 0) {
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} remaining`;
  } else if (diffDays < 0) {
    return `${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''} overdue`;
  } else {
    return 'Ends today';
  }
};

// Get staff name by ID
const getStaffName = (staffId: number | undefined) => {
  if (!staffId) return 'Not Assigned';
  const staff = props.staffMembers.find(s => s.ID === staffId);
  return staff ? `${staff.first_name} ${staff.last_name}` : 'Unknown';
};

// Calculate profit margin
const getMarginClass = (clientRate: number, internalRate: number) => {
  const margin = clientRate - internalRate;
  if (margin > 0) {
    return 'text-green-700';
  } else if (margin < 0) {
    return 'text-red-700';
  } else {
    return 'text-gray-700';
  }
};

// Calculate profit percentage
const formatProfit = (clientRate: number, internalRate: number) => {
  const margin = clientRate - internalRate;
  
  // Handle edge cases
  if (clientRate === 0) {
    return margin === 0 ? "0%" : "-∞%";
  }
  
  const percentage = (margin / clientRate) * 100;
  const formattedPercentage = percentage.toFixed(1);
  
  // Format the output with $ amount and percentage
  return `$${Math.abs(margin)} (${formattedPercentage}%)`;
};
</script> 