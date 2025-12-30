// Utility functions for consistent time formatting across the app

/**
 * Format time consistently as 24-hour format (e.g., "14:30")
 * Handles various input formats: "2:30 PM", "14:30", "2:30pm", etc.
 */
export const formatTime = (timeStr: string | Date): string => {
  if (!timeStr) return 'Unknown time';
  
  try {
    let date: Date;
    
    if (timeStr instanceof Date) {
      date = timeStr;
    } else if (typeof timeStr === 'string') {
      const timeString = timeStr.trim();
      
      // Handle 12-hour format with AM/PM
      const ampmRegex = /^(\d{1,2}):(\d{2})\s*(am|pm)$/i;
      const ampmMatch = timeString.match(ampmRegex);
      
      if (ampmMatch) {
        let hours = parseInt(ampmMatch[1]);
        const minutes = parseInt(ampmMatch[2]);
        const period = ampmMatch[3].toLowerCase();
        
        // Convert to 24-hour format
        if (period === 'pm' && hours !== 12) {
          hours += 12;
        } else if (period === 'am' && hours === 12) {
          hours = 0;
        }
        
        const today = new Date();
        date = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes);
      } 
      // Handle 24-hour format or simple HH:MM
      else if (timeString.includes(':')) {
        const parts = timeString.split(':');
        const hours = parseInt(parts[0]);
        const minutes = parseInt(parts[1]) || 0;
        
        // Validate hours and minutes
        if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
          const today = new Date();
          date = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes);
        } else {
          // Invalid time, try parsing as full date
          date = new Date(timeString);
        }
      } 
      // Try to parse as a full date string
      else {
        date = new Date(timeString);
      }
    } else {
      return 'Unknown time';
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      // If all parsing fails, return the original string
      return timeStr.toString();
    }
    
    // Format consistently as 24-hour format
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  } catch (error) {
    console.error('Error formatting time:', error);
    return timeStr.toString();
  }
};

/**
 * Get current time in consistent 24-hour format for new entries
 */
export const getCurrentTime = (): string => {
  const now = new Date();
  return now.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });
};

/**
 * Get current time in HH:MM format for form inputs (same as display now)
 */
export const getCurrentTimeForInput = (): string => {
  const now = new Date();
  return now.toLocaleTimeString([], { 
    hour12: false, 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

/**
 * Convert any time format to consistent 24-hour display format
 */
export const formatInputTimeToDisplay = (inputTime: string): string => {
  if (!inputTime || !inputTime.includes(':')) return inputTime;
  
  try {
    const [hours, minutes] = inputTime.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes);
    
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  } catch (error) {
    return inputTime;
  }
};