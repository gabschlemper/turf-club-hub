/**
 * Utility functions for handling dates consistently across the application.
 * 
 * The database stores timestamps with timezone (timestamptz).
 * When we use datetime-local inputs, they return strings without timezone info.
 * We need to handle this conversion carefully to avoid timezone shifts.
 */

/**
 * Parse a datetime string from the database for display.
 * The database returns ISO strings with timezone info.
 * We create a Date object directly which handles the timezone correctly.
 */
export function parseEventDateTime(dateString: string): Date {
  return new Date(dateString);
}

/**
 * Format a datetime string for the datetime-local input.
 * The input expects format: YYYY-MM-DDTHH:MM
 * We need to convert from the UTC ISO string to local time representation.
 */
export function formatForDateTimeInput(dateString: string): string {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Convert a datetime-local input value to ISO string for the database.
 * The input gives us YYYY-MM-DDTHH:MM in local time.
 * We need to convert it to an ISO string that includes timezone offset.
 */
export function formatForDatabase(dateTimeLocalValue: string): string {
  const date = new Date(dateTimeLocalValue);
  return date.toISOString();
}

/**
 * Parse a UTC date string and return a Date object.
 * Alias for parseEventDateTime for semantic clarity.
 */
export function parseUTCDate(dateString: string): Date {
  return new Date(dateString);
}

/**
 * Format a date to Brazilian full format (e.g., "segunda-feira, 15 de janeiro")
 */
export function formatDateFullBR(date: Date): string {
  return date.toLocaleDateString('pt-BR', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long' 
  });
}

/**
 * Format a date with time in Brazilian format (e.g., "15/01/2026 às 08:00")
 */
export function formatDateTimeBR(date: Date): string {
  const dateStr = date.toLocaleDateString('pt-BR');
  const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return `${dateStr} às ${timeStr}`;
}
