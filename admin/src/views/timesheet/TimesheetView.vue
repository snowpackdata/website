<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import type { TimesheetEntry } from '../../types/Timesheet';
import { createEmptyTimesheetEntry } from '../../types/Timesheet';
import timesheetApi from '../../api/timesheet';

// State
const weeklyEntries = ref<TimesheetEntry[]>([]);
const isLoading = ref(true);
const error = ref<string | null>(null);
const showModal = ref(false);
const currentDate = ref(new Date());
const currentWeek = ref<Date[]>([]);

// Modal form state
const formEntry = ref<TimesheetEntry>(createEmptyTimesheetEntry());

// Computed properties
const daysOfWeek = computed(() => {
  return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
});

const formattedDates = computed(() => {
  return currentWeek.value.map(date => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  });
});

const hours = computed(() => {
  return [
    { hour: 8, display: '8:00 AM' },
    { hour: 9, display: '9:00 AM' },
    { hour: 10, display: '10:00 AM' },
    { hour: 11, display: '11:00 AM' },
    { hour: 12, display: '12:00 PM' },
    { hour: 13, display: '1:00 PM' },
    { hour: 14, display: '2:00 PM' },
    { hour: 15, display: '3:00 PM' },
    { hour: 16, display: '4:00 PM' },
    { hour: 17, display: '5:00 PM' },
    { hour: 18, display: '6:00 PM' },
    { hour: 19, display: '7:00 PM' }
  ];
});

// Initialize component
onMounted(async () => {
  initializeCurrentWeek();
  await fetchWeeklyEntries();
});

// Initialize the current week dates
const initializeCurrentWeek = () => {
  const now = new Date(currentDate.value);
  const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday
  
  // Find the start of the week (Sunday)
  const startDate = new Date(now);
  startDate.setDate(now.getDate() - dayOfWeek);
  
  // Create array of dates for the week
  const weekDates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    weekDates.push(date);
  }
  
  currentWeek.value = weekDates;
};

// Navigate to previous week
const previousWeek = () => {
  const firstDay = new Date(currentWeek.value[0]);
  firstDay.setDate(firstDay.getDate() - 7);
  currentDate.value = firstDay;
  initializeCurrentWeek();
  fetchWeeklyEntries();
};

// Navigate to next week
const nextWeek = () => {
  const firstDay = new Date(currentWeek.value[0]);
  firstDay.setDate(firstDay.getDate() + 7);
  currentDate.value = firstDay;
  initializeCurrentWeek();
  fetchWeeklyEntries();
};

// Fetch weekly timesheet entries
const fetchWeeklyEntries = async () => {
  isLoading.value = true;
  error.value = null;
  
  try {
    // For now, we'll simulate this with the regular getEntries
    // In a real implementation, you would pass the week dates to filter
    weeklyEntries.value = await timesheetApi.getEntries();
  } catch (err) {
    console.error('Error fetching timesheet entries:', err);
    error.value = 'Failed to load timesheet entries. Please try again.';
  } finally {
    isLoading.value = false;
  }
};

// Open modal to create a new entry
const createNewEntry = (day: Date, hourStart: number) => {
  formEntry.value = createEmptyTimesheetEntry();
  
  // Set up start and end times based on the day and hour clicked
  const startDate = new Date(day);
  startDate.setHours(hourStart, 0, 0, 0);
  
  const endDate = new Date(day);
  endDate.setHours(hourStart + 1, 0, 0, 0);
  
  formEntry.value.start = startDate.toISOString();
  formEntry.value.end = endDate.toISOString();
  
  showModal.value = true;
};

// Open modal to edit an existing entry
const editEntry = (entry: TimesheetEntry) => {
  formEntry.value = { ...entry };
  showModal.value = true;
};

// Close the modal
const closeModal = () => {
  showModal.value = false;
  formEntry.value = createEmptyTimesheetEntry();
};

// Save an entry (create or update)
const saveEntry = async () => {
  try {
    if (formEntry.value.entry_id === 0) {
      // Create new entry
      await timesheetApi.createEntry(formEntry.value);
    } else {
      // Update existing entry
      await timesheetApi.updateEntry(formEntry.value);
    }
    
    // Refresh entries after save
    await fetchWeeklyEntries();
    closeModal();
  } catch (err) {
    console.error('Error saving timesheet entry:', err);
    error.value = 'Failed to save entry. Please try again.';
  }
};

// Delete an entry
const deleteEntry = async () => {
  if (!formEntry.value || formEntry.value.entry_id === 0) return;
  
  try {
    await timesheetApi.deleteEntry(formEntry.value.entry_id);
    await fetchWeeklyEntries();
    closeModal();
  } catch (err) {
    console.error('Error deleting timesheet entry:', err);
    error.value = 'Failed to delete entry. Please try again.';
  }
};

// Get entries for a specific day and hour
const getEntriesForTimeSlot = (day: number, hour: number) => {
  if (!weeklyEntries.value.length) return [];
  
  const date = currentWeek.value[day];
  const entriesForDay = weeklyEntries.value.filter(entry => {
    const entryDate = new Date(entry.start);
    return entryDate.toDateString() === date.toDateString();
  });
  
  return entriesForDay.filter(entry => {
    const startTime = new Date(entry.start);
    const startHour = startTime.getHours();
    const endTime = new Date(entry.end);
    const endHour = endTime.getHours();
    
    return (startHour <= hour && endHour > hour) || startHour === hour;
  });
};

// Get total hours for a specific day
const getTotalHoursForDay = (day: number) => {
  if (!weeklyEntries.value.length) return 0;
  
  const date = currentWeek.value[day];
  const entriesForDay = weeklyEntries.value.filter(entry => {
    const entryDate = new Date(entry.start);
    return entryDate.toDateString() === date.toDateString();
  });
  
  return entriesForDay.reduce((total, entry) => {
    return total + entry.duration_hours;
  }, 0).toFixed(1);
};

// Get total hours for the week
const getTotalWeeklyHours = () => {
  if (!weeklyEntries.value.length) return 0;
  return weeklyEntries.value.reduce((total, entry) => {
    return total + entry.duration_hours;
  }, 0).toFixed(1);
};

// Helper to calculate the position and size of an entry in the calendar
const calculateEntryStyle = (entry: TimesheetEntry) => {
  // Basic calculation - this would need to be refined in a real implementation
  const startTime = new Date(entry.start);
  const startMinutes = startTime.getMinutes();
  const durationHours = entry.duration_hours;
  
  const topOffset = startMinutes / 60 * 100; // % of hour based on minutes
  const height = durationHours * 100; // % height based on duration
  
  return {
    top: `${topOffset}%`,
    height: `${height}%`,
    width: '95%',
    position: 'absolute' as const,
    backgroundColor: getEntryColor(entry.state),
    border: '1px solid #ccc',
    borderRadius: '4px',
    padding: '4px',
    fontSize: '12px',
    overflow: 'hidden',
    cursor: 'pointer',
    zIndex: 10
  };
};

// Get a color based on entry state
const getEntryColor = (state: string) => {
  switch (state) {
    case 'ENTRY_STATE_DRAFT':
      return 'rgba(255, 251, 235, 0.8)'; // Light yellow
    case 'ENTRY_STATE_APPROVED':
      return 'rgba(236, 253, 245, 0.8)'; // Light green
    case 'ENTRY_STATE_INVOICED':
      return 'rgba(239, 246, 255, 0.8)'; // Light blue
    case 'ENTRY_STATE_PAID':
      return 'rgba(243, 244, 246, 0.8)'; // Light gray
    case 'ENTRY_STATE_VOID':
      return 'rgba(254, 226, 226, 0.8)'; // Light red
    default:
      return 'rgba(255, 255, 255, 0.8)'; // White
  }
};

</script>

<template>
  <div>
    <div class="sm:flex sm:items-center mb-6">
      <div class="sm:flex-auto">
        <h1 class="text-xl font-semibold text-blue">Timesheet</h1>
        <p class="mt-2 text-sm text-gray">Manage your work hours and track time for projects.</p>
      </div>
      <div class="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
        <button @click="createNewEntry(new Date(), 9)" type="button" class="btn-primary">
          <i class="fas fa-plus mr-2"></i> New Entry
        </button>
      </div>
    </div>
    
    <!-- Week navigation -->
    <div class="flex justify-between items-center mb-4">
      <button @click="previousWeek" class="btn-icon">
        <i class="fas fa-chevron-left"></i>
      </button>
      
      <div class="text-center">
        <span class="text-lg font-medium">
          {{ currentWeek[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) }} - 
          {{ currentWeek[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }}
        </span>
      </div>
      
      <button @click="nextWeek" class="btn-icon">
        <i class="fas fa-chevron-right"></i>
      </button>
    </div>
    
    <!-- Loading state -->
    <div v-if="isLoading" class="flex flex-col items-center justify-center p-10 bg-white rounded-lg shadow">
      <i class="fas fa-spinner fa-spin text-4xl text-teal mb-4"></i>
      <span class="text-gray-dark">Loading timesheet...</span>
    </div>
    
    <!-- Error state -->
    <div v-else-if="error" class="flex flex-col items-center justify-center p-10 bg-white rounded-lg shadow">
      <i class="fas fa-exclamation-circle text-4xl text-red mb-4"></i>
      <span class="text-gray-dark mb-2">{{ error }}</span>
      <button @click="fetchWeeklyEntries" class="btn-secondary mt-4">
        <i class="fas fa-sync mr-2"></i> Retry
      </button>
    </div>
    
    <!-- Calendar -->
    <div v-else class="bg-white rounded-lg shadow overflow-auto">
      <table class="min-w-full">
        <thead>
          <tr>
            <th class="w-20 px-2 py-2 text-left text-xs font-medium text-gray uppercase tracking-wider">
              Time
            </th>
            <th v-for="(day, index) in daysOfWeek" :key="index" class="px-2 py-2 text-center text-xs font-medium text-gray uppercase tracking-wider">
              {{ day }} <br>
              {{ formattedDates[index] }}
            </th>
          </tr>
        </thead>
        <tbody>
          <!-- Daily totals row -->
          <tr class="bg-gray-50">
            <td class="px-2 py-2 text-xs font-medium">
              Total: {{ getTotalWeeklyHours() }} hrs
            </td>
            <td v-for="dayIndex in daysOfWeek.length" :key="dayIndex-1" class="px-2 py-2 text-center text-xs font-medium">
              {{ getTotalHoursForDay(dayIndex-1) }} hrs
            </td>
          </tr>
          
          <!-- Hours grid -->
          <tr v-for="(hour, hourIndex) in hours" :key="hourIndex" class="border-t border-gray-200">
            <td class="px-2 py-2 text-sm text-gray-900 align-top">
              {{ hour.display }}
            </td>
            <td v-for="dayIndex in daysOfWeek.length" :key="dayIndex-1" 
                class="px-1 py-1 text-sm text-gray-500 border-l border-gray-200 h-16 align-top relative"
                @click="createNewEntry(currentWeek[dayIndex-1], hour.hour)">
              
              <!-- Display entries for this time slot -->
              <div v-for="entry in getEntriesForTimeSlot(dayIndex-1, hour.hour)" 
                  :key="entry.entry_id"
                  :style="calculateEntryStyle(entry)"
                  @click.stop="editEntry(entry)"
                  class="timesheet-entry">
                <div class="font-medium text-xs">{{ entry.billing_code_name }}</div>
                <div class="text-xs truncate">{{ entry.notes }}</div>
                <div class="text-xs">{{ entry.duration_hours }} hrs</div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <!-- Entry modal -->
    <div v-if="showModal" class="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-lg">
        <div class="px-4 py-3 border-b border-gray-200">
          <h3 class="text-lg font-medium text-gray-900">
            {{ formEntry.entry_id ? 'Edit Timesheet Entry' : 'New Timesheet Entry' }}
          </h3>
        </div>
        
        <div class="p-4">
          <div class="space-y-4">
            <!-- Billing code selector (in a real app, this would be populated from an API) -->
            <div>
              <label class="block text-sm font-medium text-gray-700">Billing Code</label>
              <select v-model="formEntry.billing_code_id" class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md">
                <option value="1">Example Billing Code</option>
              </select>
            </div>
            
            <!-- Start time -->
            <div>
              <label class="block text-sm font-medium text-gray-700">Start Time</label>
              <input 
                type="datetime-local" 
                v-model="formEntry.start"
                class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            
            <!-- End time -->
            <div>
              <label class="block text-sm font-medium text-gray-700">End Time</label>
              <input 
                type="datetime-local" 
                v-model="formEntry.end"
                class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            
            <!-- Notes -->
            <div>
              <label class="block text-sm font-medium text-gray-700">Notes</label>
              <textarea 
                v-model="formEntry.notes"
                rows="3"
                class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              ></textarea>
            </div>
          </div>
        </div>
        
        <div class="px-4 py-3 bg-gray-50 flex justify-between rounded-b-lg">
          <div>
            <button 
              v-if="formEntry.entry_id !== 0"
              @click="deleteEntry" 
              type="button" 
              class="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none"
            >
              Delete
            </button>
          </div>
          <div class="flex space-x-3">
            <button 
              @click="closeModal" 
              type="button" 
              class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
            >
              Cancel
            </button>
            <button 
              @click="saveEntry" 
              type="button" 
              class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.timesheet-entry {
  transition: all 0.2s;
}

.timesheet-entry:hover {
  transform: scale(1.02);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.btn-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  border-radius: 9999px;
  color: #2563eb;
}

.btn-icon:hover {
  background-color: #dbeafe;
}

.btn-icon:focus {
  outline: none;
}
</style> 