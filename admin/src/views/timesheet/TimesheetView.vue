<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { ClockIcon, XMarkIcon } from '@heroicons/vue/24/outline';
import { Dialog, DialogPanel, DialogTitle, TransitionChild, TransitionRoot, Switch, SwitchGroup, SwitchLabel } from '@headlessui/vue';
import type { TimesheetEntry } from '../../types/Timesheet';
import { createEmptyTimesheetEntry } from '../../types/Timesheet';
import timesheetApi from '../../api/timesheet';
import TimesheetEntryComponent from '../../components/timesheet/TimesheetEntry.vue';

// DOM refs for calendar positioning
const container = ref<HTMLElement | null>(null);
const containerNav = ref<HTMLElement | null>(null);
const containerOffset = ref<HTMLElement | null>(null);

// State
const weeklyEntries = ref<TimesheetEntry[]>([]);
const isLoading = ref(true);
const error = ref<string | null>(null);
const showModal = ref(false);
const currentDate = ref(new Date());
const currentWeek = ref<Date[]>([]);
const billingCodes = ref<any[]>([]);
const users = ref<any[]>([]);
const showImpersonation = ref(false);

// Drag state
const isDragging = ref(false);
const dragDay = ref<Date | null>(null);
const dragStartHour = ref<number | null>(null);
const dragEndHour = ref<number | null>(null);
const dragColumnIndex = ref<number | null>(null);

// Modal form state
const formEntry = ref<TimesheetEntry>(createEmptyTimesheetEntry());

// Watch for impersonation toggle changes
watch(showImpersonation, (newValue) => {
  if (!newValue) {
    // Reset impersonation data when toggled off
    formEntry.value.impersonate_as_user_id = 0;
    formEntry.value.is_being_impersonated = false;
  }
});

// Initialize component
onMounted(async () => {
  initializeCurrentWeek();
  await fetchWeeklyEntries();
  await fetchBillingCodes();
  await fetchUsers();
  
  // Set the container scroll position based on the current time
  setTimeout(() => {
    if (container.value && containerNav.value && containerOffset.value) {
      const currentHour = new Date().getHours();
      
      // Only scroll if the current time is within our display range (8am-10pm)
      if (currentHour >= 8 && currentHour <= 22) {
        // Calculate relative position within our time range (8am-10pm)
        // Each hour has 2 rows (for 30-min increments), and we skip the header row
        const targetRow = ((currentHour - 8) * 2) + 1;
        // Each row is 2rem tall (32px)
        const scrollPosition = targetRow * 32; // 2rem = 32px
        
        container.value.scrollTop = scrollPosition;
      }
    }
  }, 100); // Small delay to ensure the DOM is fully rendered
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

// Go to today
const goToToday = () => {
  currentDate.value = new Date();
  initializeCurrentWeek();
  fetchWeeklyEntries();
};

// Fetch weekly timesheet entries
const fetchWeeklyEntries = async () => {
  isLoading.value = true;
  error.value = null;
  
  try {
    // Fetch all entries
    const allEntries = await timesheetApi.getEntries();
    
    // Filter entries to only include those in the current week
    weeklyEntries.value = allEntries.filter(entry => {
      const entryDate = new Date(entry.start);
      
      // Get start and end of current week
      const weekStart = new Date(currentWeek.value[0]);
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date(currentWeek.value[6]);
      weekEnd.setHours(23, 59, 59, 999);
      
      // Check if entry is within the current week range
      return entryDate >= weekStart && entryDate <= weekEnd;
    });
  } catch (err) {
    console.error('Error fetching timesheet entries:', err);
    error.value = 'Failed to load timesheet entries. Please try again.';
  } finally {
    isLoading.value = false;
  }
};

// Fetch billing codes
const fetchBillingCodes = async () => {
  try {
    billingCodes.value = await timesheetApi.getActiveBillingCodes();
    console.log('Fetched billing codes:', billingCodes.value);
  } catch (err) {
    console.error('Error fetching billing codes:', err);
  }
};

// Fetch users for impersonation
const fetchUsers = async () => {
  try {
    users.value = await timesheetApi.getUsers();
    console.log('Fetched users for impersonation:', users.value);
  } catch (err) {
    console.error('Error fetching users:', err);
  }
};

// Open modal to create a new entry
const createNewEntry = (day: Date, hour: number) => {
  // Create a clean, empty entry
  formEntry.value = {
    ...createEmptyTimesheetEntry(),
    billing_code_id: 0 // Explicitly set to numeric zero
  };
  
  console.log('New entry created with billing_code_id:', formEntry.value.billing_code_id, 'type:', typeof formEntry.value.billing_code_id);
  
  // Set up start and end times based on the day and hour clicked
  // We need to carefully handle timezone conversion to avoid time shifts
  console.log(`Creating new entry with day ${day.toDateString()} and hour ${hour}`);
  
  // Get the date part in local timezone format
  const dateStr = day.toISOString().split('T')[0];
  
  // For direct clicks on the calendar cell
  if (hour >= 8 && hour <= 22) {
    // Create start time string - format: "2023-01-01T08:00:00"
    // Construct time string directly to avoid timezone conversion issues
    const startHourInt = Math.floor(hour);
    const startMinInt = hour % 1 === 0 ? 0 : 30;
    
    // Format hours and minutes with leading zeros
    const startHour = startHourInt.toString().padStart(2, '0');
    const startMin = startMinInt.toString().padStart(2, '0');
    
    // Calculate end time (1 hour later)
    let endHourInt = startHourInt + 1;
    const endMinInt = startMinInt;
    
    // Format end hours and minutes
    const endHour = endHourInt.toString().padStart(2, '0');
    const endMin = endMinInt.toString().padStart(2, '0');
    
    // Create direct ISO strings with the correct time (no timezone conversion)
    formEntry.value.start = `${dateStr}T${startHour}:${startMin}:00.000Z`;
    formEntry.value.end = `${dateStr}T${endHour}:${endMin}:00.000Z`;
    
    console.log('Direct time string creation:', {
      dateStr,
      hour,
      startTime: `${startHour}:${startMin}`,
      endTime: `${endHour}:${endMin}`,
      startFull: formEntry.value.start,
      endFull: formEntry.value.end
    });
  } 
  // For header clicks, we use a fixed time (noon)
  else {
    const startTime = '12:00:00';
    const endTime = '13:00:00';
    
    formEntry.value.start = `${dateStr}T${startTime}.000Z`;
    formEntry.value.end = `${dateStr}T${endTime}.000Z`;
  }
  
  showModal.value = true;
};

// Drag functionality for calendar
const startDrag = (day: Date, hour: number, event: MouseEvent) => {
  // Get the column index directly from the element with more robust error handling
  const target = event.currentTarget as HTMLElement;
  
  if (!target) {
    console.error('No target element found for drag start');
    return;
  }
  
  // Get and verify both attributes
  const dayAttr = target.getAttribute('data-day');
  const hourAttr = target.getAttribute('data-hour');
  
  console.log('DRAG START - Raw Attributes:', { 
    'data-day': dayAttr, 
    'data-hour': hourAttr,
    'hourParam': hour,
    'dayObject': day
  });
  
  // Safe parsing with fallbacks
  const columnIndex = parseInt(dayAttr || '-1', 10);
  const hourValue = parseFloat(hourAttr || '-1');
  
  // Log what we're actually using
  console.log('DRAG START - Parsed Values:', {
    columnIndex,
    hourValue,
    'using function params instead?': hour !== hourValue
  });
  
  // Verify we have a valid column index before proceeding
  if (columnIndex === -1) {
    console.error('Invalid column index, cannot start drag');
    return;
  }
  
  // Initialize drag state - use the attribute values directly
  isDragging.value = true;
  dragDay.value = new Date(day);
  dragStartHour.value = hourValue; // Use the attribute value
  dragEndHour.value = hourValue;   // Use the attribute value
  dragColumnIndex.value = columnIndex;
  
  // Prevent text selection during drag
  document.body.style.userSelect = 'none';
  
  // Highlight the starting cell
  highlightDragRange();
  
  // Add mousemove handler for tracking drag within the column
  document.addEventListener('mousemove', handleMouseMove);
  
  // Stop event propagation
  event.stopPropagation();
  event.preventDefault();
};

// Handle mouse movement during drag
const handleMouseMove = (event: MouseEvent) => {
  if (!isDragging.value || dragColumnIndex.value === null) return;
  
  // Get the elements under the cursor
  const elementsUnderCursor = document.elementsFromPoint(event.clientX, event.clientY);
  
  // Find calendar cells - with explicit class check to ensure we get actual cells
  const calendarCells = elementsUnderCursor.filter(el => 
    el.classList.contains('calendar-cell')
  );
  
  console.log(`Found ${calendarCells.length} calendar cells under cursor at (${event.clientX}, ${event.clientY})`);
  
  if (calendarCells.length === 0) return;
  
  // Focus on the first calendar cell (should be the top-most one)
  const cell = calendarCells[0] as HTMLElement;
  
  // Get cell attributes with explicit parsing to avoid any issues
  const cellDayAttr = cell.getAttribute('data-day');
  const cellHourAttr = cell.getAttribute('data-hour');
  
  console.log('Cell under cursor attributes:', { 
    cellDayAttr, 
    cellHourAttr,
    cell: cell.outerHTML,
    dragColumnIndex: dragColumnIndex.value
  });
  
  // Skip if we couldn't get valid attributes
  if (cellDayAttr === null || cellHourAttr === null) {
    console.warn('Cell is missing data attributes');
    return;
  }
  
  // Parse with safety checks
  const cellDay = parseInt(cellDayAttr, 10);
  const cellHour = parseFloat(cellHourAttr);
  
  if (isNaN(cellDay) || isNaN(cellHour)) {
    console.warn('Invalid data attributes:', { cellDayAttr, cellHourAttr });
    return;
  }
  
  // Only process if this cell is in the column where we started the drag
  if (cellDay === dragColumnIndex.value) {
    console.log(`Updating drag to hour ${cellHour} in column ${cellDay}`);
    dragEndHour.value = cellHour;
    highlightDragRange();
  }
};


const endDrag = (event?: MouseEvent) => {
  if (!isDragging.value || !dragDay.value || dragStartHour.value === null || 
      dragEndHour.value === null || dragColumnIndex.value === null) return;
  
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  
  console.log(`End drag in column ${dragColumnIndex.value}, from ${Math.min(dragStartHour.value, dragEndHour.value)} to ${Math.max(dragStartHour.value, dragEndHour.value)}`);
  
  // Remove the mousemove handler
  document.removeEventListener('mousemove', handleMouseMove);
  
  // Sort hours to ensure start <= end
  const startHour = Math.min(dragStartHour.value, dragEndHour.value);
  const endHour = Math.max(dragStartHour.value, dragEndHour.value);
  
  // Create entry from drag selection
  formEntry.value = {
    ...createEmptyTimesheetEntry(),
    billing_code_id: 0 // Explicitly set to numeric zero
  };
  
  console.log('New entry from drag with billing_code_id:', formEntry.value.billing_code_id, 'type:', typeof formEntry.value.billing_code_id);
  
  // Use the day from the stored column index for consistency
  const day = currentWeek.value[dragColumnIndex.value];
  if (!day) {
    console.error('Could not find day for column index', dragColumnIndex.value);
    return;
  }
  
  console.log('Creating entry for day:', day.toISOString().split('T')[0]);
  
  // Get the date part in local timezone format
  const dateStr = day.toISOString().split('T')[0];
  
  // Create start time string - format: "2023-01-01T08:00:00"
  // Construct time string directly to avoid timezone conversion issues
  const startHourInt = Math.floor(startHour);
  const startMinInt = startHour % 1 === 0 ? 0 : 30;
  
  // Format hours and minutes with leading zeros
  const startHour_str = startHourInt.toString().padStart(2, '0');
  const startMin_str = startMinInt.toString().padStart(2, '0');
  
  // Calculate end time
  const endHourInt = Math.floor(endHour);
  const endMinInt = endHour % 1 === 0 ? 0 : 30;
  
  // Add 30 minutes to end time to make it exclusive
  let finalEndHourInt = endHourInt;
  let finalEndMinInt = endMinInt + 30;
  
  // Handle minute overflow
  if (finalEndMinInt >= 60) {
    finalEndHourInt += 1;
    finalEndMinInt -= 60;
  }
  
  // Format end hours and minutes
  const endHour_str = finalEndHourInt.toString().padStart(2, '0');
  const endMin_str = finalEndMinInt.toString().padStart(2, '0');
  
  // Create direct ISO strings with the correct time (no timezone conversion)
  formEntry.value.start = `${dateStr}T${startHour_str}:${startMin_str}:00.000Z`;
  formEntry.value.end = `${dateStr}T${endHour_str}:${endMin_str}:00.000Z`;
  
  console.log('Drag time creation:', {
    dateStr,
    startHour, 
    endHour,
    startTime: `${startHour_str}:${startMin_str}`,
    endTime: `${endHour_str}:${endMin_str}`,
    startFull: formEntry.value.start,
    endFull: formEntry.value.end,
    dayOfWeek: day.toLocaleDateString('en-US', { weekday: 'long' }),
    formattedDay: day.toLocaleDateString()
  });
  
  // Reset drag state
  isDragging.value = false;
  dragDay.value = null;
  dragStartHour.value = null;
  dragEndHour.value = null;
  dragColumnIndex.value = null;
  
  // Clean up
  removeHighlighting();
  document.body.style.userSelect = '';
  
  // Open modal
  showModal.value = true;
};

const removeHighlighting = () => {
  // Remove highlight classes from all calendar cells
  const cells = document.querySelectorAll('.calendar-cell');
  cells.forEach(cell => {
    cell.classList.remove('bg-sage-pale');
  });
};

// Highlights all cells in the selected range
const highlightDragRange = () => {
  if (!isDragging.value || dragStartHour.value === null || 
      dragEndHour.value === null || dragColumnIndex.value === null) return;
  
  // First, clear all highlighting
  removeHighlighting();
  
  // Get the min and max hours to ensure we highlight in either direction (up or down)
  const startHour = Math.min(dragStartHour.value, dragEndHour.value);
  const endHour = Math.max(dragStartHour.value, dragEndHour.value);
  
  console.log(`Highlighting range in column ${dragColumnIndex.value} from ${startHour} to ${endHour}`);
  
  // Get all calendar cells with an explicit selector
  const allCells = document.querySelectorAll('.calendar-cell');
  let highlightedCount = 0;
  
  // Now explicitly check each cell's data attributes
  allCells.forEach(cell => {
    // Skip elements without proper data attributes
    const cellDayAttr = cell.getAttribute('data-day');
    const cellHourAttr = cell.getAttribute('data-hour');
    
    if (cellDayAttr === null || cellHourAttr === null) return;
    
    // Parse with safety checks
    const cellDay = parseInt(cellDayAttr, 10);
    const cellHour = parseFloat(cellHourAttr);
    
    if (isNaN(cellDay) || isNaN(cellHour)) return;
    
    // Check if this cell is in our column and time range
    if (cellDay === dragColumnIndex.value && cellHour >= startHour && cellHour <= endHour) {
      cell.classList.add('bg-sage-pale');
      // Force a reflow to ensure the style is applied
      void (cell as HTMLElement).offsetHeight;
      highlightedCount++;
      console.debug(`Highlighted cell: day=${cellDay}, hour=${cellHour}`);
    }
  });
  
  console.log(`Highlighted ${highlightedCount} cells in column ${dragColumnIndex.value}`);
};

// Setup mouse handlers for drag end detection
onMounted(() => {
  document.addEventListener('mouseup', endDrag);
  
  // Add mouseleave handler to end drag if mouse leaves the calendar
  if (container.value) {
    container.value.addEventListener('mouseleave', endDrag);
  }
  
  return () => {
    document.removeEventListener('mouseup', endDrag);
    document.removeEventListener('mousemove', handleMouseMove);
    if (container.value) {
      container.value.removeEventListener('mouseleave', endDrag);
    }
  };
});

// Open modal to edit an existing entry
const editEntry = (entry: TimesheetEntry) => {
  // Create a deep copy to avoid reference issues
  formEntry.value = JSON.parse(JSON.stringify(entry));
  
  // Ensure billing_code_id is a number
  formEntry.value.billing_code_id = Number(formEntry.value.billing_code_id) || 0;
  
  // Make sure user can interact immediately with the form
  showModal.value = true;
  
  // If the entry has impersonation, show the impersonation UI
  if (entry.impersonate_as_user_id && entry.impersonate_as_user_id > 0) {
    showImpersonation.value = true;
  } else {
    showImpersonation.value = false;
  }
  
  // Log to help with debugging
  console.log('Editing entry:', formEntry.value);
  console.log('Using billing code ID:', formEntry.value.billing_code_id);
};

// Close the modal
const closeModal = () => {
  showModal.value = false;
  formEntry.value = createEmptyTimesheetEntry();
  showImpersonation.value = false; // Reset impersonation flag when closing
};

// Save an entry (create or update)
const saveEntry = async () => {
  error.value = null; // Clear previous errors
  
  // Add detailed debugging for the billing code issue
  console.log('Raw formEntry data:', formEntry.value);
  console.log('Billing code ID (raw):', formEntry.value.billing_code_id);
  console.log('Billing code ID type:', typeof formEntry.value.billing_code_id);
  
  try {
    // Ensure billing_code_id is a number and has a value
    const billingCodeId = Number(formEntry.value.billing_code_id);
    console.log('Billing code ID after Number conversion:', billingCodeId, 'isNaN:', isNaN(billingCodeId));
    formEntry.value.billing_code_id = isNaN(billingCodeId) ? 0 : billingCodeId;
    
    // Validate required fields
    if (!formEntry.value.billing_code_id || formEntry.value.billing_code_id === 0) {
      error.value = 'Please select a billing code';
      console.error('Missing billing code');
      return;
    }
    
    if (!formEntry.value.start || !formEntry.value.end) {
      error.value = 'Please select both start and end times';
      console.error('Missing start or end time');
      return;
    }
    
    // Validate times - end must be after start
    const startDate = new Date(formEntry.value.start);
    const endDate = new Date(formEntry.value.end);
    if (endDate <= startDate) {
      error.value = 'End time must be after start time';
      console.error('Invalid time range: end time is before or equal to start time');
      return;
    }
    
    // Ensure impersonation fields are properly set
    if (showImpersonation.value && formEntry.value.impersonate_as_user_id) {
      formEntry.value.is_being_impersonated = true;
      console.log('Setting impersonation fields:', {
        impersonate_as_user_id: formEntry.value.impersonate_as_user_id,
        is_being_impersonated: formEntry.value.is_being_impersonated
      });
    } else {
      formEntry.value.impersonate_as_user_id = 0;
      formEntry.value.is_being_impersonated = false;
    }
    
    // Make sure notes is always a string
    formEntry.value.notes = formEntry.value.notes || '';
    
    // Create or update entry
    if (formEntry.value.entry_id === 0) {
      console.log('Creating new entry');
      const result = await timesheetApi.createEntry(formEntry.value);
      console.log('Created entry:', result);
    } else {
      console.log('Updating existing entry with ID:', formEntry.value.entry_id);
      const result = await timesheetApi.updateEntry(formEntry.value);
      console.log('Updated entry:', result);
    }
    
    // Refresh entries after save
    await fetchWeeklyEntries();
    closeModal();
  } catch (err: any) {
    console.error('Error saving timesheet entry:', err);
    
    // Extract error message for better user feedback
    if (err.response && err.response.data && err.response.data.error) {
      error.value = err.response.data.error;
    } else {
      error.value = 'Failed to save entry. Please try again.';
    }
  }
};

// Delete an entry
const deleteEntry = async () => {
  if (!formEntry.value || formEntry.value.entry_id === 0) return;
  
  error.value = null; // Clear previous errors
  console.log('Deleting entry with ID:', formEntry.value.entry_id);
  
  try {
    const result = await timesheetApi.deleteEntry(formEntry.value.entry_id);
    console.log('Deleted entry result:', result);
    
    // Refresh entries after delete
    await fetchWeeklyEntries();
    closeModal();
  } catch (err: any) {
    console.error('Error deleting timesheet entry:', err);
    
    // Extract error message for better user feedback
    if (err.response && err.response.data && err.response.data.error) {
      error.value = err.response.data.error;
    } else {
      error.value = 'Failed to delete entry. Please try again.';
    }
  }
};

// Computed properties
const monthAndYear = computed(() => {
  if (!currentWeek.value.length) return '';
  const startDate = currentWeek.value[0];
  if (!startDate) return '';
  return startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
});

const weekRangeText = computed(() => {
  if (!currentWeek.value.length) return '';
  
  const startDate = currentWeek.value[0];
  const endDate = currentWeek.value[6];
  
  if (!startDate || !endDate) return '';
  
  const startMonth = startDate.toLocaleDateString('en-US', { month: 'short' });
  const endMonth = endDate.toLocaleDateString('en-US', { month: 'short' });
  
  const startDay = startDate.getDate();
  const endDay = endDate.getDate();
  
  // If the week spans two months
  if (startMonth !== endMonth) {
    return `${startMonth} ${startDay} - ${endMonth} ${endDay}`;
  }
  
  // If the week is within the same month
  return `${startMonth} ${startDay} - ${endDay}`;
});

const dayHeaders = computed(() => {
  if (!currentWeek.value.length) return [];
  
  return currentWeek.value.map(date => {
    if (!date) return { dayName: '', dayNum: '', date: new Date(), isToday: false };
    
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
    const dayNum = date.getDate();
    const isToday = isDateToday(date);
    
    return { dayName, dayNum, date, isToday };
  });
});

// Helper functions
const isDateToday = (date: Date) => {
  const today = new Date();
  return date.getDate() === today.getDate() && 
         date.getMonth() === today.getMonth() && 
         date.getFullYear() === today.getFullYear();
};

// Get entries for a specific day
const getEntriesForDay = (day: Date) => {
  if (!day || !weeklyEntries.value) return [];
  
  // Format the day to YYYY-MM-DD for comparison
  const dayDateStr = day.toISOString().split('T')[0];
  
  return weeklyEntries.value.filter(entry => {
    if (!entry.start) return false;
    
    // Extract just the date part from the entry's ISO timestamp without timezone conversion
    // This treats dates as specified in the entry regardless of local timezone
    const entryDateStr = entry.start.split('T')[0];
    
    // Compare just the date parts (YYYY-MM-DD) without timezone influence
    return entryDateStr === dayDateStr;
  });
};

// Get total hours for the week
const totalWeeklyHours = computed(() => {
  if (!weeklyEntries.value || !currentWeek.value.length) return '0.0';
  
  return weeklyEntries.value.reduce((total, entry) => {
    if (!entry.start || !entry.duration_hours) return total;
    
    // Check if entry is in the current week
    const entryDate = new Date(entry.start);
    const isInCurrentWeek = currentWeek.value.some(date => 
      date && date.toDateString() === entryDate.toDateString()
    );
    
    return isInCurrentWeek ? total + entry.duration_hours : total;
  }, 0).toFixed(1);
});

// Update the updateDateTime function to format times correctly
const updateDateTime = (field: 'start' | 'end', dateStr: string, timeStr: string) => {
  // Ensure we have default values
  if (!dateStr) dateStr = new Date().toISOString().split('T')[0];
  if (!timeStr) timeStr = '00:00';
  
  // Create a proper date object to handle the conversion correctly
  const date = new Date(`${dateStr}T${timeStr}:00`);
  
  // Convert to ISO string with Z for UTC
  const isoString = date.toISOString();
  
  // Update the form entry
  if (field === 'start') {
    formEntry.value.start = isoString;
  } else {
    formEntry.value.end = isoString;
  }
};
</script>

<template>
  <div class="timesheet-view">
    <div class="flex justify-between items-center p-4 bg-white border-b border-gray-200">
      <div class="text-lg font-semibold text-gray-900">
        {{ monthAndYear }}
        <span class="ml-2 text-sm text-gray-500">
          {{ weekRangeText }}
        </span>
        <span class="ml-4 text-sm font-medium text-[#58837e]">
          Total: {{ totalWeeklyHours }} hours
        </span>
      </div>
      
      <div class="flex space-x-2">
        <button 
          @click="previousWeek"
          class="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
        >
          Previous
        </button>
        <button 
          @click="goToToday"
          class="inline-flex items-center rounded-md bg-[#58837e] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#476b67] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#58837e]"
        >
          Today
        </button>
        <button 
          @click="nextWeek"
          class="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
        >
          Next
        </button>
      </div>
    </div>
    
    <div v-if="isLoading" class="loading-indicator">
      <div class="animate-spin h-6 w-6 text-primary"></div>
      <span>Loading timesheet...</span>
    </div>
    
    <div v-else-if="error" class="error-message">
      {{ error }}
    </div>
    
    <div v-else class="timesheet-container h-[calc(100vh-9rem)]">
      <div class="flex h-full flex-col">
        <!-- Loading state -->
        <div v-if="isLoading" class="flex flex-col items-center justify-center p-10 bg-white flex-grow">
          <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mb-4"></div>
          <span class="text-gray-700">Loading timesheet...</span>
        </div>
        
        <!-- Error state -->
        <div v-else-if="error" class="flex flex-col items-center justify-center p-10 bg-white flex-grow">
          <i class="fas fa-exclamation-circle text-4xl text-red-600 mb-4"></i>
          <span class="text-gray-700 mb-2">{{ error }}</span>
          <button @click="fetchWeeklyEntries" class="mt-4 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Retry
          </button>
        </div>
        
        <!-- Calendar View -->
        <div v-else ref="container" class="isolate flex flex-auto flex-col overflow-auto bg-white">
          <div style="width: 165%" class="flex max-w-full flex-none flex-col sm:max-w-none md:max-w-full">
            <div ref="containerNav" class="flex-none bg-white shadow ring-1 ring-black/5 sm:pr-8">
              <!-- Mobile day headers -->
              <div class="grid grid-cols-7 text-sm/6 text-gray-500 sm:hidden">
                <button 
                  v-for="(header, index) in dayHeaders" 
                  :key="index" 
                  type="button" 
                  class="flex flex-col items-center pb-3 pt-2"
                  @click="createNewEntry(header.date, 12)" 
                >
                  {{ header.dayName.charAt(0) }}
                  <span 
                    :class="[
                      'mt-1 flex size-8 items-center justify-center font-semibold', 
                      header.isToday 
                        ? 'rounded-full bg-[#58837e] text-white' 
                        : 'text-gray-900'
                    ]"
                  >
                    {{ header.dayNum }}
                  </span>
                </button>
              </div>

              <!-- Desktop day headers -->
              <div class="-mr-px hidden grid-cols-7 divide-x divide-gray-100 border-r border-gray-100 text-sm/6 text-gray-500 sm:grid">
                <div class="col-end-1 w-14" />
                <div 
                  v-for="(header, index) in dayHeaders" 
                  :key="index" 
                  class="flex items-center justify-center py-3"
                  @click="createNewEntry(header.date, 12)"
                  style="cursor: pointer;"
                >
                  <span :class="{ 'flex items-baseline': header.isToday }">
                    {{ header.dayName }}
                    <span 
                      :class="[
                        header.isToday 
                          ? 'ml-1.5 flex size-8 items-center justify-center rounded-full bg-[#58837e] font-semibold text-white' 
                          : 'items-center justify-center font-semibold text-gray-900'
                      ]"
                    >
                      {{ header.dayNum }}
                    </span>
                  </span>
                </div>
              </div>
            </div>
            
            <div class="flex flex-auto">
              <!-- Time gutter -->
              <div class="sticky left-0 z-10 w-14 flex-none bg-white ring-1 ring-gray-100" />
              
              <!-- Calendar grid -->
              <div class="grid flex-auto grid-cols-1 grid-rows-1">
                <!-- Horizontal lines (time slots) -->
                <div 
                  class="col-start-1 col-end-2 row-start-1 grid divide-y divide-gray-100" 
                  style="grid-template-rows: repeat(30, minmax(2rem, 1fr))"
                >
                  <div ref="containerOffset" class="row-end-1 h-7" />
                  
                  <!-- Generate time slots (8am to 10pm, 30-minute increments) -->
                  <template v-for="hour in 15" :key="hour-1">
                    <!-- Hour marker (shows on the hour) -->
                    <div>
                      <div class="sticky left-0 z-20 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs/5 text-gray-400">
                        {{ (hour+7) < 12 ? `${hour+7}AM` : (hour+7 === 12 ? '12PM' : `${hour+7 - 12}PM`) }}
                      </div>
                    </div>
                    <!-- Half-hour increment (no text) -->
                    <div />
                  </template>
                </div>

                <!-- Vertical lines (days of week) -->
                <div class="col-start-1 col-end-2 row-start-1 hidden grid-cols-7 grid-rows-1 divide-x divide-gray-100 sm:grid sm:grid-cols-7">
                  <div v-for="i in 7" :key="i" :class="`col-start-${i} row-span-full`" />
                  <div class="col-start-8 row-span-full w-8" />
                </div>

                <!-- Events display -->
                <ol 
                  class="col-start-1 col-end-2 row-start-1 grid grid-cols-1 sm:grid-cols-7 sm:pr-8 relative" 
                  style="grid-template-rows: 1.75rem repeat(30, minmax(0, 1fr)) auto"
                >
                  <!-- First, generate complete calendar grid with explicit positioning to prevent indexing issues -->
                  <template v-for="hourIncrement in 30" :key="`row-${hourIncrement}`">
                    <template v-for="(day, dayIndex) in currentWeek" :key="`cell-${hourIncrement}-${dayIndex}`">
                      <div 
                        class="calendar-cell transition-colors duration-100"
                        :style="{
                          gridRow: `${hourIncrement + 1}`,
                          gridColumn: `${dayIndex + 1}`,
                          height: '2rem'
                        }"
                        :data-hour="8 + (hourIncrement - 1) / 2"
                        :data-day="dayIndex"
                        @mousedown="startDrag(day, 8 + (hourIncrement - 1) / 2, $event)"
                        style="cursor: pointer;"
                      >
                        <!-- Debug display showing both the data attributes and coordinates -->
                        <span v-if="false" class="text-xs text-gray-400 select-none opacity-30 hover:opacity-100">
                          {{ (8 + (hourIncrement - 1) / 2).toFixed(1) }}
                        </span>
                      </div>
                    </template>
                  </template>
                  
                  <!-- Timesheet entries with custom positioning layer to avoid affecting the grid -->
                  <template v-for="(day, dayIndex) in currentWeek" :key="`entries-${dayIndex}`">
                    <TimesheetEntryComponent
                      v-for="entry in getEntriesForDay(day)"
                      :key="`${entry.entry_id}-${dayIndex}`"
                      :entry="entry"
                      :day="day"
                      :dayIndex="dayIndex"
                      :timeRangeStart="8"
                      :timeRangeEnd="22"
                      @edit="editEntry"
                    />
                  </template>
                </ol>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Entry modal using Headless UI -->
        <TransitionRoot as="template" :show="showModal">
          <Dialog as="div" class="relative z-50" @close="closeModal">
            <TransitionChild as="template" enter="ease-out duration-300" enter-from="opacity-0" enter-to="opacity-100" leave="ease-in duration-200" leave-from="opacity-100" leave-to="opacity-0">
              <div class="fixed inset-0 bg-gray-500/75 transition-opacity" />
            </TransitionChild>

            <div class="fixed inset-0 z-10 w-screen overflow-y-auto">
              <div class="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
                <TransitionChild as="template" enter="ease-out duration-300" enter-from="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95" enter-to="opacity-100 translate-y-0 sm:scale-100" leave="ease-in duration-200" leave-from="opacity-100 translate-y-0 sm:scale-100" leave-to="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95">
                  <DialogPanel class="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                    <div class="bg-white px-6 pb-4 pt-5 sm:p-6 sm:pb-4">
                      <div class="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                        <button type="button" class="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2" @click="closeModal">
                          <span class="sr-only">Close</span>
                          <XMarkIcon class="h-6 w-6" aria-hidden="true" />
                        </button>
                      </div>
                      
                      <div>
                        <div class="w-full text-center sm:text-left">
                          <DialogTitle as="h3" class="text-base font-semibold leading-6 text-gray-900">
                            {{ formEntry.entry_id ? 'Edit Timesheet Entry' : 'New Timesheet Entry' }}
                          </DialogTitle>
                          
                          <div class="mt-4 space-y-3">
                            <!-- Impersonation switch -->
                            <div class="flex items-center justify-between">
                              <SwitchGroup as="div" class="flex items-center">
                                <SwitchLabel as="span" class="mr-3 text-xs">
                                  <span class="font-medium text-gray-900">Impersonation Mode</span>
                                </SwitchLabel>
                                <Switch
                                  v-model="showImpersonation"
                                  :class="[
                                    showImpersonation ? 'bg-[#58837e]' : 'bg-gray-200',
                                    'relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#58837e] focus:ring-offset-2'
                                  ]"
                                >
                                  <span
                                    aria-hidden="true"
                                    :class="[
                                      showImpersonation ? 'translate-x-5' : 'translate-x-0',
                                      'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out'
                                    ]"
                                  />
                                </Switch>
                              </SwitchGroup>
                            </div>
                            
                            <!-- Impersonation warning and user selection -->
                            <div v-if="showImpersonation" class="bg-yellow-50 border-l-4 border-yellow-400 p-2 mb-4">
                              <div class="flex items-start">
                                <div class="flex-shrink-0">
                                  <svg class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                    <path fill-rule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
                                  </svg>
                                </div>
                                <div class="ml-3">
                                  <p class="text-xs text-yellow-700">
                                    <strong>Warning:</strong> You are creating an entry on behalf of another user. This action will be logged.
                                  </p>
                                </div>
                              </div>
                            </div>
                            
                            <!-- User selection for impersonation -->
                            <div v-if="showImpersonation">
                              <label class="block text-xs font-medium text-gray-700">Select User</label>
                              <select 
                                v-model="formEntry.impersonate_as_user_id" 
                                @change="formEntry.is_being_impersonated = (formEntry.impersonate_as_user_id ?? 0) > 0"
                                class="mt-1 block w-full rounded-md border-gray-300 py-1.5 pl-3 pr-10 text-xs focus:border-[#58837e] focus:outline-none focus:ring-[#58837e]"
                              >
                                <option :value="0">Select a user</option>
                                <option v-for="user in users" :key="user.id" :value="user.id">
                                  {{ user.name || user.email || `User #${user.id}` }}
                                </option>
                              </select>
                            </div>
                            
                            <!-- Billing code selector -->
                            <div>
                              <label class="block text-xs font-medium text-gray-700">Billing Code</label>
                              <select 
                                v-model="formEntry.billing_code_id"
                                class="mt-1 block w-full rounded-md border-gray-300 py-1.5 pl-3 pr-10 text-xs focus:border-[#58837e] focus:outline-none focus:ring-[#58837e]"
                              >
                                <option :value="0">Select a billing code</option>
                                <option v-for="code in billingCodes" :key="code.id" :value="Number(code.id)">
                                  {{ code.name }}
                                </option>
                              </select>
                            </div>
                            
                            <!-- Time inputs - updated to match Tailwind example -->
                            <div class="grid grid-cols-2 gap-4">
                              <div>
                                <label for="start-time" class="block text-xs font-medium text-gray-700">Start Time</label>
                                <div class="mt-1 grid grid-cols-2 gap-2">
                                  <!-- Date input -->
                                  <div class="relative">
                                    <input 
                                      type="date" 
                                      id="start-date"
                                      :value="formEntry.start ? formEntry.start.split('T')[0] : ''"
                                      @input="e => updateDateTime('start', (e.target as HTMLInputElement).value, formEntry.start ? formEntry.start.split('T')[1].split(':').slice(0, 2).join(':') : '00:00')"
                                      class="bg-gray-50 border h-8 border-gray-300 text-gray-900 text-xs rounded-lg focus:ring-[#58837e] focus:border-[#58837e] block w-full p-1.5 date-input"
                                      required 
                                    />
                                  </div>
                                  <!-- Time input -->
                                  <div class="relative">
                                    <div class="absolute inset-y-0 end-0 top-0 flex items-center pe-3.5 pointer-events-none">
                                    </div>
                                    <input 
                                      type="time" 
                                      id="start-time"
                                      :value="formEntry.start ? formEntry.start.split('T')[1].split(':').slice(0, 2).join(':') : ''"
                                      @input="e => updateDateTime('start', formEntry.start ? formEntry.start.split('T')[0] : new Date().toISOString().split('T')[0], (e.target as HTMLInputElement).value)"
                                      class="bg-gray-50 border h-8 border-gray-300 text-gray-900 text-xs rounded-lg focus:ring-[#58837e] focus:border-[#58837e] block w-full p-1.5"
                                      required 
                                    />
                                  </div>
                                </div>
                              </div>
                              
                              <div>
                                <label for="end-time" class="block text-xs font-medium text-gray-700">End Time</label>
                                <div class="mt-1 grid grid-cols-2 gap-2">
                                  <!-- Date input -->
                                  <div class="relative">
                                    <input 
                                      type="date" 
                                      id="end-date"
                                      :value="formEntry.end ? formEntry.end.split('T')[0] : ''"
                                      @input="e => updateDateTime('end', (e.target as HTMLInputElement).value, formEntry.end ? formEntry.end.split('T')[1].split(':').slice(0, 2).join(':') : '00:00')"
                                      class="bg-gray-50 border h-8 border-gray-300 text-gray-900 text-xs rounded-lg focus:ring-[#58837e] focus:border-[#58837e] block w-full p-1.5 date-input"
                                      required 
                                    />
                                  </div>
                                  <!-- Time input -->
                                  <div class="relative">
                                    <div class="absolute inset-y-0 end-0 top-0 flex items-center pe-3.5 pointer-events-none">
                                    </div>
                                    <input 
                                      type="time" 
                                      id="end-time"
                                      :value="formEntry.end ? formEntry.end.split('T')[1].split(':').slice(0, 2).join(':') : ''"
                                      @input="e => updateDateTime('end', formEntry.end ? formEntry.end.split('T')[0] : new Date().toISOString().split('T')[0], (e.target as HTMLInputElement).value)"
                                      class="bg-gray-50 border h-8 border-gray-300 text-gray-900 text-xs rounded-lg focus:ring-[#58837e] focus:border-[#58837e] block w-full p-1.5"
                                      required 
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            <!-- Notes -->
                            <div>
                              <label class="block text-xs font-medium text-gray-700">Notes</label>
                              <textarea 
                                v-model="formEntry.notes"
                                rows="2"
                                class="mt-1 block w-full rounded-md border border-gray-300 py-1.5 px-3 shadow-sm focus:border-[#58837e] focus:outline-none focus:ring-[#58837e] text-xs"
                              ></textarea>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div class="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                      <button 
                        type="button" 
                        class="inline-flex w-full justify-center rounded-md bg-[#58837e] px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#476b67] sm:ml-3 sm:w-auto"
                        @click="saveEntry"
                      >
                        {{ formEntry.entry_id ? 'Update' : 'Create' }}
                      </button>
                      <button 
                        type="button" 
                        class="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                        @click="closeModal"
                      >
                        Cancel
                      </button>
                      <div class="sm:flex-grow"></div>
                      <button 
                        v-if="formEntry.entry_id !== 0"
                        type="button" 
                        class="mt-3 inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-red-500 sm:mt-0 sm:w-auto"
                        @click="deleteEntry"
                      >
                        Delete
                      </button>
                    </div>
                  </DialogPanel>
                </TransitionChild>
              </div>
            </div>
          </Dialog>
        </TransitionRoot>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Ensure the calendar takes full height of the parent container */
.flex-auto {
  flex: 1 1 auto;
}

/* Styling for calendar cells during drag */
.calendar-cell {
  position: relative;
  z-index: 1;
  min-height: 2rem;
  /* Prevent text selection during drag operations */
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

.calendar-cell:hover {
  background-color: rgba(88, 131, 126, 0.05);
}

/* Make the highlight class more specific and forceful */
.calendar-cell.bg-sage-pale,
div.calendar-cell.bg-sage-pale,
.timesheet-container .calendar-cell.bg-sage-pale {
  background-color: rgba(88, 131, 126, 0.3) !important;
  z-index: 15;
  position: relative;
}

/* Custom color variables for the muted green */
:root {
  --sage-green-primary: #58837e;
  --sage-green-dark: #476b67;
  --sage-green-light: #76a19c;
  --sage-green-pale: #e6efee;
}

/* Fix for calendar container height */
.timesheet-container {
  height: calc(100vh - 9rem);
  overflow: hidden;
}

@media (min-width: 1024px) {
  .timesheet-container {
    height: calc(100vh - 6.5rem); /* Adjusted for the top padding on desktop */
  }
}

/* Allow entries to be positioned absolutely within calendar grid */
.timesheet-container .relative {
  position: relative;
}

/* Style for date inputs to make text size consistent with time inputs */
.date-input {
  font-size: 0.75rem !important;
}

/* Override browser-specific date picker text size */
.date-input::-webkit-datetime-edit {
  font-size: 0.75rem;
}

.date-input::-webkit-calendar-picker-indicator {
  font-size: 0.75rem;
  padding: 0;
  margin-left: 2px;
  width: 14px;
  height: 14px;
}
</style> 