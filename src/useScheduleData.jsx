import { useState, useEffect, useCallback, useMemo } from 'react';
import * as api from './api.jsx'; // Import the new API service

/**
 * Custom hook to manage booking data by fetching from the remote server.
 */
export const useScheduleData = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // Added for error handling

  const loadBookings = useCallback(async () => {
    try {
      const data = await api.getBookings();
      setBookings(data);
    } catch (error) {
      console.error("Failed to fetch bookings from server:", error);
      setError(error); // Set error state
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshBookings = useCallback(() => {
    setLoading(true); // Indicate loading when refreshing
    loadBookings();
  }, [loadBookings]);

  // Load from the API on mount
  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  // This function is now more of a "request update" function.
  // The front-end will optimistically update its state, and the back-end call will persist it.
  const updateBookings = useCallback((newBookings) => {
    setBookings(newBookings);
    // The individual add/delete/update functions will handle the API calls.
    console.log("Booking state updated. API calls are handled by add/delete/update functions.");
  }, []);

  const addBooking = useCallback(async (newEntries) => {
    try {
      await api.addBooking(newEntries);
      loadBookings(); // Refresh data from server after successful add
    } catch (error) {
      console.error("Failed to save new bookings to server:", error);
      setError(error); // Set error state
      // Optionally, re-fetch to ensure UI is consistent with DB if add failed
      // loadBookings();
    }
  }, []);

  const deleteBooking = useCallback(async (id) => {
    try {
      await api.deleteBooking(id);
      loadBookings(); // Refresh data from server after successful delete
    } catch (error) {
      console.error("Failed to delete booking on server:", error);
      setError(error); // Set error state
    }
  }, [bookings]);

  const updateBooking = useCallback(async (updatedBooking) => {
    const originalBookings = bookings;
    // Optimistic UI Update
    setBookings(prev => prev.map(b => b.id === updatedBooking.id ? updatedBooking : b));

    try {
      // The API call only needs the fields to be updated, not the whole object with calculated values.
      await api.updateBooking(updatedBooking.id, {
        name: updatedBooking.name,
        type: updatedBooking.type,
        startDateTime: updatedBooking.startDateTime,
        endDateTime: updatedBooking.endDateTime,
        expectedPallets: updatedBooking.expectedPallets,
        customer_id: updatedBooking.customer_id,
        supplier_id: updatedBooking.supplier_id,
        haulier_id: updatedBooking.haulier_id,
        status: updatedBooking.status,
        contract_id: updatedBooking.contract_id,
      });
      loadBookings(); // Refresh data from server after successful update
    } catch (error) {
      console.error("Failed to update booking on server:", error);
      setError(error); // Set error state
    }
  }, [bookings]);

  const sortedBookings = useMemo(() => {
    // The server will eventually handle sorting, but we'll keep it here for now.
    return [...bookings].sort((a, b) => new Date(a.startDateTime) - new Date(b.startDateTime));
  }, [bookings]);
  return { bookings: sortedBookings, loading, error, refreshBookings, updateBookings, addBooking, deleteBooking, updateBooking };
};