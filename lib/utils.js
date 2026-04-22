/**
 * Merges multiple class strings, filtering out falsy values.
 * Lightweight alternative to clsx for simple use cases.
 */
export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

/**
 * Formats a date string into a human-readable format.
 * @param {string|Date} date
 * @returns {string}
 */
export function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Truncates a string to a given length, appending "..." if needed.
 * @param {string} str
 * @param {number} length
 * @returns {string}
 */
export function truncate(str, length = 100) {
  if (!str) return '';
  return str.length > length ? str.slice(0, length) + '...' : str;
}

/**
 * Formats a job budget into a human-readable string.
 * @param {number|null} min
 * @param {number|null} max
 * @param {'Fixed'|'Hourly'|'Monthly'} type
 * @returns {string}
 */
export function formatBudget(min, max, type) {
  if (!min && !max) return 'Budget negotiable';
  const suffix = type === 'Hourly' ? '/hr' : type === 'Monthly' ? '/mo' : ' fixed';
  const fmt = (n) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
  if (min && max) return `${fmt(min)} – ${fmt(max)}${suffix}`;
  if (min) return `From ${fmt(min)}${suffix}`;
  return `Up to ${fmt(max)}${suffix}`;
}

/**
 * Returns a relative time string (e.g. "3 hours ago").
 * @param {string|Date} date
 * @returns {string}
 */
export function formatTimeAgo(date) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60)  return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hr ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} day${Math.floor(seconds / 86400) === 1 ? '' : 's'} ago`;
  return formatDate(date);
}
