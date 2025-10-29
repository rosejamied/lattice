import { useState, useEffect, useCallback, useMemo } from 'react';
import * as api from './api.jsx'; // Import the new API service

/**
 * Custom hook to manage booking data by fetching from the remote server.
 */
export const useScheduleData = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load from the API on mount
  useEffect(() => {
    const loadBookings = async () => {
      try {
        const data = await api.getBookings();
        setBookings(data);
      } catch (error) {
        console.error("Failed to fetch bookings from server:", error);
      } finally {
        setLoading(false);
      }
    };
    loadBookings();
  }, []);

  // This function is now more of a "request update" function.
  // The front-end will optimistically update its state, and the back-end call will persist it.
  const updateBookings = useCallback((newBookings) => {
    setBookings(newBookings);
    // The individual add/delete/update functions will handle the API calls.
    console.log("Booking state updated. API calls are handled by add/delete/update functions.");
  }, []);

  const addBooking = useCallback(async (newEntries) => {
    // Optimistic UI Update
    setBookings(prev => [...newEntries, ...prev]);

    try {
      await api.addBooking(newEntries);
    } catch (error) {
      console.error("Failed to save new bookings to server:", error);
      // Revert optimistic update on failure
      setBookings(prev => prev.filter(b => !newEntries.some(nb => nb.id === b.id)));
    }
  }, []);

  const deleteBooking = useCallback(async (id) => {
    const originalBookings = bookings;
    // Optimistic UI Update
    setBookings(prev => prev.filter(b => b.id !== id));

    try {
      await api.deleteBooking(id);
    } catch (error) {
      console.error("Failed to delete booking on server:", error);
      // Revert optimistic update on failure
      setBookings(originalBookings);
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
      });
    } catch (error) {
      console.error("Failed to update booking on server:", error);
      setBookings(originalBookings); // Revert on failure
    }
  }, [bookings]);

  const sortedBookings = useMemo(() => {
    // The server will eventually handle sorting, but we'll keep it here for now.
    return [...bookings].sort((a, b) => new Date(a.startDateTime) - new Date(b.startDateTime));
  }, [bookings]);

  return { bookings: sortedBookings, loading, updateBookings, addBooking, deleteBooking, updateBooking };
};