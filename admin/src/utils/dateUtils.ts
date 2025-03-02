/**
 * Utility functions for handling date and time values consistently across the application.
 * These functions ensure consistent handling of dates regardless of timezone.
 */

/**
 * Formats a date for display in the UI
 * @param dateValue - The date to format (string, Date, or null/undefined)
 * @param format - The format to use ('short', 'long', or 'input')
 * @returns Formatted date string or empty string if input is invalid
 */
export function formatDate(dateValue: string | Date | null | undefined, format: 'short' | 'long' | 'input' = 'short'): string {
  if (!dateValue) return '';
  
  try {
    // Convert to Date object if it's a string
    let date: Date;
    if (typeof dateValue === 'string') {
      // For YYYY-MM-DD strings, ensure we're parsing in local timezone
      if (dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = dateValue.split('-').map(Number);
        date = new Date(year, month - 1, day);
      } else {
        // For other date strings, use the default parser
        date = new Date(dateValue);
      }
    } else {
      date = dateValue;
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.warn('Invalid date value:', dateValue);
      return '';
    }
    
    // Format based on requested format
    switch (format) {
      case 'input':
        // Format for HTML input fields (YYYY-MM-DD)
        // Use local timezone values to avoid date shifts
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
        
      case 'short':
        // Format as MM/DD/YYYY using local timezone
        return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}/${date.getFullYear()}`;
        
      case 'long':
        // Format as Month DD, YYYY
        return date.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric'
        });
      
      default:
        return date.toLocaleDateString();
    }
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
}

/**
 * Parses a date string from the server into a standard format
 * Ensures dates are handled in local timezone to prevent off-by-one errors
 * @param dateString - The date string from the server
 * @returns Normalized date string in YYYY-MM-DD format
 */
export function parseServerDate(dateString: string | null | undefined): string {
  if (!dateString) return '';
  
  try {
    // If the string already looks like YYYY-MM-DD, just return it
    if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return dateString;
    }
    
    // Parse the date and extract components in local timezone
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.warn('Invalid server date value:', dateString);
      return '';
    }
    
    // Format in YYYY-MM-DD using local timezone components
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error('Error parsing server date:', error);
    return '';
  }
}

/**
 * Formats a date for sending to the server
 * Ensures date is normalized to midnight UTC
 * @param dateStr - The date string in YYYY-MM-DD format
 * @returns ISO date string with time set to T00:00:00.000Z
 */
export function formatDateForServer(dateStr: string): string {
  if (!dateStr) return '';
  
  try {
    // Parse the YYYY-MM-DD date in local timezone
    const [year, month, day] = dateStr.split('-').map(Number);
    
    // Set time to midnight UTC (which may change the day depending on timezone)
    const utcDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
    
    return utcDate.toISOString();
  } catch (error) {
    console.error('Error formatting date for server:', error);
    return '';
  }
}

/**
 * Returns today's date in YYYY-MM-DD format
 */
export function getTodayFormatted(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Returns the current date in YYYY-MM-DD format
 * Alias for getTodayFormatted for better semantic clarity
 */
export function getCurrentDate(): string {
  return getTodayFormatted();
}

/**
 * Returns a date that is a certain number of days in the future or past
 * @param days - Number of days to add (positive) or subtract (negative)
 * @returns Date string in YYYY-MM-DD format
 */
export function getRelativeDate(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Determines if a date is in the past
 * @param dateValue - The date to check
 * @returns Boolean indicating if the date is in the past
 */
export function isDateInPast(dateValue: string | Date | null | undefined): boolean {
  if (!dateValue) return false;
  
  try {
    let date: Date;
    
    if (typeof dateValue === 'string') {
      // For YYYY-MM-DD strings, ensure we're parsing in local timezone
      if (dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = dateValue.split('-').map(Number);
        date = new Date(year, month - 1, day);
      } else {
        date = new Date(dateValue);
      }
    } else {
      date = dateValue;
    }
    
    // Set to midnight for comparison
    date.setHours(0, 0, 0, 0);
    
    // Get today at midnight
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return date < today;
  } catch (error) {
    console.error('Error checking if date is in past:', error);
    return false;
  }
} 