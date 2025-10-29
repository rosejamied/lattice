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

  const sortedBookings = useMemo(() => {
    // The server will eventually handle sorting, but we'll keep it here for now.
    return [...bookings].sort((a, b) => new Date(a.startDateTime) - new Date(b.startDateTime));
  }, [bookings]);

  return { bookings: sortedBookings, loading, updateBookings };
};