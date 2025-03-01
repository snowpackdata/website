<script setup lang="ts">
import { computed } from 'vue';
import type { TimesheetEntry } from '../../types/Timesheet';
import type { CSSProperties } from 'vue';

// Define props
const props = defineProps<{
  entry: TimesheetEntry;
  dayIndex: number;
  day: Date;
  timeRangeStart?: number; // Starting hour (e.g., 8 for 8am)
  timeRangeEnd?: number;   // Ending hour (e.g., 22 for 10pm)
}>();

// Define emits
const emit = defineEmits<{
  (e: 'edit', entry: TimesheetEntry): void;
}>();

// Calculate grid row placement for the entry
const gridRowValues = computed(() => {
  if (!props.entry || !props.entry.start || !props.entry.end) {
    return { start: 0, span: 0 };
  }

  try {
    // Parse dates from ISO strings
    const startDate = new Date(props.entry.start);
    
    // Extract date parts for comparison using local date values
    const entryDateStr = startDate.toISOString().split('T')[0];
    const dayDateStr = props.day.toISOString().split('T')[0];
    
    // Check if entry belongs to this day (using date part only)
    if (entryDateStr !== dayDateStr) {
      console.log(`Entry ${props.entry.entry_id} doesn't match day (${entryDateStr} vs ${dayDateStr}), hiding`);
      return { start: 0, span: 0 };
    }
    
    // Handle times timezone-agnostically - extract hours and minutes directly from the ISO string
    const startTimeParts = props.entry.start.split('T')[1].split(':');
    const endTimeParts = props.entry.end.split('T')[1].split(':');
    
    const startHour = parseInt(startTimeParts[0], 10);
    const startMinute = parseInt(startTimeParts[1], 10);
    const endHour = parseInt(endTimeParts[0], 10);
    const endMinute = parseInt(endTimeParts[1], 10);
    
    // Time range settings (default to 8am-10pm if not provided)
    const timeRangeStart = props.timeRangeStart || 8;  // 8am
    
    // GRID POSITIONING CALCULATIONS
    
    // Each hour has 2 rows (for 30-min increments)
    // Grid starts with a header row (1.75rem) and 1-indexed, so add 2 to account for these
    const rowOffset = 2;
    
    // Calculate starting row based on time
    // For example: 8:00 = (8-8)*2 + 2 = 2, 8:30 = (8-8)*2 + 2 + 1 = 3
    const hourOffset = (startHour - timeRangeStart) * 2;
    const minuteOffset = startMinute >= 30 ? 1 : 0;
    const startRow = rowOffset + hourOffset + minuteOffset;
    
    // Calculate span (duration)
    const durationHours = endHour - startHour;
    const durationMinutes = endMinute - startMinute;
    // Convert to 30-minute blocks
    const totalHalfHours = (durationHours * 2) + (durationMinutes / 30);
    
    console.log(`Entry ${props.entry.entry_id} grid position:`, {
      startRow,
      span: totalHalfHours,
      startHour,
      startMinute,
      endHour,
      endMinute,
      timeRangeStart
    });
    
    return {
      start: startRow,
      span: Math.max(1, totalHalfHours) // Ensure minimum span of 1
    };
  } catch (error) {
    console.error('Error calculating grid position for entry:', props.entry, error);
    return { start: 0, span: 0 };
  }
});

// Get column start based on day index
const colStart = computed(() => {
  // Add 1 because grid is 1-indexed
  return props.dayIndex + 1;
});

// Get color based on entry state
const entryColor = computed(() => {
  if (!props.entry || !props.entry.state) {
    return 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200';
  }

  switch (props.entry.state) {
    case 'ENTRY_STATE_DRAFT':
      return 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200';
    case 'ENTRY_STATE_APPROVED':
      return 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200';
    case 'ENTRY_STATE_INVOICED':
      return 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200';
    case 'ENTRY_STATE_PAID':
      return 'bg-gray-50 text-gray-700 hover:bg-gray-200 border border-gray-300';
    case 'ENTRY_STATE_VOID':
      return 'bg-gray-50 text-gray-700 hover:bg-gray-200 border border-gray-300';
    default:
      return 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200';
  }
});

// Handle edit button click
const handleEdit = () => {
  emit('edit', props.entry);
};

// Calculate a subtle offset for entries based on time to help with overlapping entries
const entryOffset = computed(() => {
  if (!props.entry || !props.entry.start) {
    return { right: '0%', top: '0px' };
  }

  try {
    // Extract the entry ID - higher IDs should be wider and at the bottom
    const entryId = props.entry.entry_id || 0;
    
    // Invert logic: Higher IDs should be wider (at bottom), lower IDs narrower (at top)
    // Use modulo to cycle through different styles (0-4)
    const offsetIndex = entryId % 5;
    
    // Calculate offsets - higher offsetIndex (higher ID) means less offset
    const rightOffset = (4 - offsetIndex) * 6;  // 6% increments for width from right
    const topOffset = (4 - offsetIndex) * 4;    // 4px increments for top margin
    
    // Z-index calculation - LOWER values for higher IDs so they appear at bottom
    // Keep z-index below 30 to stay under the sticky nav (z-40)
    const calculatedZIndex = 25 - offsetIndex;
    
    return {
      right: `${rightOffset}%`,
      top: `${topOffset}px`,
      width: offsetIndex === 4 ? '100%' : `calc(100% - ${rightOffset}%)`, // Full width for highest offsetIndex
      boxShadow: `0 ${(4-offsetIndex) + 1}px ${(4-offsetIndex) * 2 + 2}px rgba(0, 0, 0, 0.0${(4-offsetIndex) + 1})`,
      zIndex: calculatedZIndex
    };
  } catch (error) {
    console.error('Error calculating entry offset:', error);
    return { right: '0%', top: '0px' };
  }
});

// Get grid styles for the entry with better z-index handling
const gridStyle = computed((): CSSProperties => {
  if (gridRowValues.value.start === 0 || gridRowValues.value.span === 0) {
    return { display: 'none' };
  }

  return {
    gridArea: `${gridRowValues.value.start} / ${colStart.value} / span ${gridRowValues.value.span} / span 1`,
    position: 'relative'
  };
});
</script>

<template>
  <li 
    v-if="gridRowValues.span > 0"
    class="relative mt-px flex timesheet-entry"
    :style="gridStyle"
  >
    <a 
      href="#" 
      @click.prevent="handleEdit"
      class="group absolute inset-1 flex flex-col overflow-y-auto rounded-lg p-2 text-xs/5 shadow-sm entry-link"
      :class="entryColor"
      :style="entryOffset"
    >
      <p class="font-semibold">{{ entry.billing_code_name }}</p>
      <p class="font-semibold">({{ entry.duration_hours }} hrs)</p>
      <div class="text-xs mt-1">
        <div class="text-xs line-clamp-2">{{ entry.notes }}</div>
      </div>
    </a>
  </li>
</template>

<style scoped>
/* Time entries hover effect */
a.entry-link {
  transition: all 0.2s ease;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  z-index: 20; /* Ensure entries appear above the grid */
  position: relative; /* Create stacking context */
  border-width: 2px !important; /* Thicker border for better visibility */
  margin: 2px !important; /* Increased margin for better separation */
}

a.entry-link:hover {
  box-shadow: 0 6px 10px -2px rgba(0, 0, 0, 0.2), 0 3px 6px -1px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
  z-index: 1000 !important; /* Much higher z-index to ensure it's above all other entries */
  margin: 0 !important; /* Remove margin on hover for full size */
  border-width: 2px !important;
}

/* Add a class for parent element to make z-index work */
.timesheet-entry:hover {
  z-index: 900 !important; /* Apply higher z-index to the parent element when hovering */
}
</style> 