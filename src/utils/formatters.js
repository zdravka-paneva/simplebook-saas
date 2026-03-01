/**
 * Format a date to readable string (e.g., "Mar 1, 2026")
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date
 */
export function formatDate(date) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(new Date(date))
}

/**
 * Format a date with time (e.g., "Mar 1, 2026 2:30 PM")
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted datetime
 */
export function formatDateTime(date) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date))
}

/**
 * Format currency (USD)
 * @param {number} amount - Amount to format
 * @returns {string} Formatted currency (e.g., "$99.99")
 */
export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}

/**
 * Truncate text to specified length
 * @param {string} text - Text to truncate
 * @param {number} length - Max length
 * @returns {string} Truncated text with ellipsis
 */
export function truncateText(text, length = 50) {
  return text.length > length ? text.substring(0, length) + '...' : text
}

/**
 * Capitalize first letter of string
 * @param {string} text - Text to capitalize
 * @returns {string} Capitalized text
 */
export function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1)
}
