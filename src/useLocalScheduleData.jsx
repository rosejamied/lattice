import { useState, useEffect, useCallback, useMemo } from 'react';

/**
 * Custom hook to manage booking data using browser localStorage.
 */
export const useLocalScheduleData = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const storedBookings = localStorage.getItem('wms_bookings');
      if (storedBookings) {
        const items = JSON.parse(storedBookings);
        setBookings(items);
      }
      setLoading(false);
    } catch (e) {
      console.error("Failed to load bookings from local storage:", e);
      setLoading(false);
    }
  }, []);

  // Function to persist and update state
  const updateBookings = useCallback((newBookings) => {
    setBookings(newBookings);
    try {
      localStorage.setItem('wms_bookings', JSON.stringify(newBookings));
    } catch (e) {
      console.error("Failed to save bookings to local storage:", e);
    }
  }, []);

  const sortedBookings = useMemo(() => {
    return [...bookings].sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime));
  }, [bookings]);

  return { bookings: sortedBookings, loading, updateBookings };
};