/**
 * Returns the current date as a 'YYYY-MM-DD' string based on the user's local timezone.
 * This avoids timezone conversion issues that can arise from using .toISOString().
 * @returns {string} The formatted date string.
 */
export function getTodayDateString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = (today.getMonth() + 1).toString().padStart(2, '0'); // Months are 0-indexed
  const day = today.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formats a number as a standard CNY currency string (e.g., ¥1,234.56).
 * @param {number | null | undefined} value - The number to format.
 * @returns {string} The formatted currency string.
 */
export function formatCurrency(value) {
  if (value === null || typeof value === 'undefined') return '';
  return new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' }).format(value);
}
