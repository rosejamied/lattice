/**
 * Formats a date string or Date object into DD-MM-YYYY format.
 * @param {string | Date} dateInput - The date to format.
 * @returns {string} The formatted date string or 'N/A' if invalid.
 */
export const formatDate = (dateInput) => {
  if (!dateInput) return 'N/A';

  let date;
  // If the string is just a date (YYYY-MM-DD), it's treated as UTC.
  // To avoid timezone shifts, we need to adjust it by creating the date with a time component.
  if (typeof dateInput === 'string' && dateInput.length === 10 && dateInput.includes('-')) {
    date = new Date(`${dateInput}T00:00:00`);
  } else {
    date = new Date(dateInput);
  }

  if (isNaN(date.getTime())) return 'N/A';

  // Use the 'en-GB' locale for DD/MM/YYYY format and replace slashes with dashes.
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).replace(/\//g, '-');
};