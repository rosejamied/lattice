const API_BASE_URL = 'http://192.168.1.248:4000/api';

/**
 * A helper function to handle fetch responses.
 * @param {Response} response - The response from a fetch call.
 * @returns {Promise<any>}
 */
const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Network response was not ok' }));
    throw new Error(error.message || 'An unknown error occurred');
  }
  if (response.status === 204) { // No Content
    return;
  }
  return response.json();
};

/**
 * A generic fetch wrapper for API calls.
 * @param {string} endpoint - The API endpoint to call (e.g., '/bookings').
 * @param {RequestInit} [options] - The options for the fetch call.
 * @returns {Promise<any>}
 */
const apiFetch = (endpoint, options = {}) => {
  return fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  }).then(handleResponse);
};

// --- Bookings API ---
export const getBookings = () => apiFetch('/bookings');
export const addBookings = (newBookings) => apiFetch('/bookings', { method: 'POST', body: JSON.stringify(newBookings) });
export const updateBooking = (id, bookingData) => apiFetch(`/bookings/${id}`, { method: 'PUT', body: JSON.stringify(bookingData) });
export const deleteBooking = (id) => apiFetch(`/bookings/${id}`, { method: 'DELETE' });

// --- Inventory API ---
export const getInventory = () => apiFetch('/inventory');
export const addInventoryItem = (itemData) => apiFetch('/inventory', { method: 'POST', body: JSON.stringify(itemData) });
export const updateInventoryItem = (id, itemData) => apiFetch(`/inventory/${id}`, { method: 'PUT', body: JSON.stringify(itemData) });
export const deleteInventoryItem = (id) => apiFetch(`/inventory/${id}`, { method: 'DELETE' });

// --- Settings API ---
export const getScheduleSettings = () => apiFetch('/settings/schedule');
export const updateScheduleSettings = (settingsData) => apiFetch('/settings/schedule', { method: 'PUT', body: JSON.stringify(settingsData) });