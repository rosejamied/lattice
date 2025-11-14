/**
 * Formats a date string or Date object into DD-MM-YYYY format.
 * @param {string | Date} dateInput - The date to format.
 * @returns {string} The formatted date string or 'N/A' if invalid.
 */
export const formatDate = (dateInput) => {
  if (!dateInput) return 'N/A';

  let date;
  // If the string is just a date (YYYY-MM-DD), it's treated as UTC.
  // To avoid timezone shifts, we need to parse it carefully as a local date.
  if (typeof dateInput === 'string' && dateInput.includes('-')) {
    // Extract 'YYYY-MM-DD' part from either 'YYYY-MM-DD' or 'YYYY-MM-DDTHH:mm:ss.sssZ'
    const datePart = dateInput.split('T')[0];
    const parts = datePart.split('-').map(Number);
    date = new Date(parts[0], parts[1] - 1, parts[2]); // Year, Month (0-indexed), Day
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