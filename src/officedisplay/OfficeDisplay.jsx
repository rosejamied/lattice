import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, ArrowRight, LayoutGrid, Wifi, WifiOff } from 'lucide-react';
import * as api from '../api';
import BookingPanel from './BookingPanel';
import SpacesPanel from './SpacesPanel';

const OfficeDisplay = () => {
  const [data, setData] = useState({ bookings: [], locations: [], inventory: [], customers: [] });
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const [bookings, locations, inventory, customers] = await Promise.all([
        api.getBookings(),
        api.getLocations(),
        api.getInventory(),
        api.getCustomers(),
      ]);
      setData({ bookings, locations, inventory, customers });
      setError(null); // Clear previous errors on successful fetch
    } catch (err) {
      console.error("Office Display Error: Failed to fetch data.", err);
      setError("Connection to server lost. Retrying...");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(); // Fetch data on initial load
    
    // Set up a timer that ticks every second
    const timerId = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      // Check if it's time to refresh data (at 0 or 30 seconds)
      if (now.getSeconds() === 0 || now.getSeconds() === 30) {
        fetchData();
      }
    }, 1000);
    return () => clearInterval(timerId); // Cleanup on unmount
  }, [fetchData]);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const todaysBookings = data.bookings.filter(b => {
    const bookingDate = new Date(b.startDateTime);
    return bookingDate >= todayStart && bookingDate <= todayEnd;
  });

  const inbounds = todaysBookings.filter(b => b.type === 'Inbound');
  const outbounds = todaysBookings.filter(b => b.type === 'Outbound');

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 font-sans">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-5xl font-bold">Warehouse Overview</h1>
        <div className="text-right">
          <p className="text-3xl font-mono">{currentTime.toLocaleTimeString()}</p>
          <p className="text-lg text-gray-400">{currentTime.toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </header>

      {error && (
        <div className="absolute top-4 right-4 flex items-center p-2 bg-red-800/80 text-white rounded-lg">
          <WifiOff size={20} className="mr-2" /> {error}
        </div>
      )}

      <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Column 1: Inbounds */}
        <BookingPanel title="Today's Inbounds" bookings={inbounds} customers={data.customers} icon={ArrowLeft} color="green" />

        {/* Column 2: Spaces */}
        <SpacesPanel locations={data.locations} inventory={data.inventory} />

        {/* Column 3: Outbounds */}
        <BookingPanel title="Today's Outbounds" bookings={outbounds} customers={data.customers} icon={ArrowRight} color="orange" />
      </main>
    </div>
  );
};

export default OfficeDisplay;