import axios from 'axios';

// The base URL for your local network server.
const API_BASE_URL = '/api';

/**
 * A helper function to handle API requests and errors.
 * @param {Promise} request - The axios request promise.
 * @returns {Promise<any>} - The data from the response.
 */
const handleRequest = async (request) => {
  try {
    const response = await request;
    // If the status is 204 (No Content), there's no data to return.
    if (response.status === 204) {
      return;
    }
    return response.data; // For all other successful responses, return the data.
  } catch (error) {
    console.error("API call failed:", error.response ? error.response.data : error.message);
    throw error;
  }
};

// --- Inventory API ---

/**
 * Fetches all inventory items from the server.
 */
export const getInventory = () => {
  return handleRequest(axios.get(`${API_BASE_URL}/inventory`));
};

/**
 * Adds a new inventory item.
 * @param {object} item - The new inventory item data.
 */
export const addInventoryItem = (item) => {
  return handleRequest(axios.post(`${API_BASE_URL}/inventory`, item));
};

/**
 * Updates an existing inventory item by its ID.
 * @param {string} id - The ID of the item to update.
 * @param {object} item - The updated inventory item data.
 */
export const updateInventoryItem = (id, item) => {
  return handleRequest(axios.put(`${API_BASE_URL}/inventory/${id}`, item));
};

/**
 * Deletes an inventory item by its ID.
 * @param {string} id - The ID of the item to delete.
 */
export const deleteInventoryItem = (id) => {
  return handleRequest(axios.delete(`${API_BASE_URL}/inventory/${id}`));
};

/**
 * Adds multiple inventory items in bulk.
 * @param {Array<object>} items - An array of new inventory items.
 */
export const bulkAddInventory = (items) => {
  return handleRequest(axios.post(`${API_BASE_URL}/inventory/bulk`, items));
};

/**
 * Deletes all inventory items.
 */
export const clearInventory = () => {
  return handleRequest(axios.delete(`${API_BASE_URL}/inventory/all`));
};
// --- Bookings API ---

/**
 * Fetches all bookings from the server.
 */
export const getBookings = () => {
  return handleRequest(axios.get(`${API_BASE_URL}/bookings`));
};

/**
 * Adds one or more new bookings.
 * @param {Array<object>} bookings - An array of new booking objects.
 */
export const addBooking = (bookings) => {
  return handleRequest(axios.post(`${API_BASE_URL}/bookings`, bookings));
};

/**
 * Deletes a booking by its ID.
 * @param {string} id - The ID of the booking to delete.
 */
export const deleteBooking = (id) => {
  return handleRequest(axios.delete(`${API_BASE_URL}/bookings/${id}`));
};

// --- Settings API ---

/**
 * Fetches the schedule settings.
 */
export const getScheduleSettings = () => {
  return handleRequest(axios.get(`${API_BASE_URL}/settings/schedule`));
};

/**
 * Updates the schedule settings.
 * @param {object} settings - The new settings object.
 */
export const updateScheduleSettings = (settings) => {
  return handleRequest(axios.put(`${API_BASE_URL}/settings/schedule`, settings));
};

// --- Users API ---

/**
 * Fetches all users from the server.
 */
export const getUsers = () => {
  return handleRequest(axios.get(`${API_BASE_URL}/users`));
};

/**
 * Adds a new user.
 * @param {object} userData - The new user data, including password.
 */
export const addUser = (userData) => {
  return handleRequest(axios.post(`${API_BASE_URL}/users`, userData));
};