import React, { useMemo, useState, useEffect } from 'react';
import { LayoutDashboard, ArrowRight, ArrowLeft, Clock, Package, Loader } from 'lucide-react';
import { useScheduleData } from './useScheduleData';
import * as api from './api.jsx';

// Helper to get status color classes
const getStatusClasses = (status) => {
  switch (status) {
    case 'Arrived':
      return 'border-l-cyan-500';
    case 'Allocated':
      return 'border-l-yellow-500';
    case 'Picked':
      return 'border-l-purple-500';
    case 'Booked':
    default:
      return 'border-l-gray-500';
  }
};

// A single booking item component
const BookingItem = ({ booking, customerName }) => (
  <div className={`p-3 bg-gray-800 rounded-lg shadow-md border-l-4 ${getStatusClasses(booking.status)}`}>
    <div className="flex justify-between items-start">
      <div className="truncate">
        <p className="font-bold text-white truncate">{customerName || 'No Customer'}</p>
        {booking.name && <p className="text-sm text-gray-400 truncate">{booking.name}</p>}
      </div>
      {booking.expectedPallets > 0 && (
        <span className="ml-2 flex-shrink-0 px-2 py-1 text-xs font-semibold rounded-full bg-gray-700">{booking.expectedPallets}</span>
      )}
    </div>
  </div>
);

// A column for Inbound or Outbound bookings
const BookingColumn = ({ title, icon: Icon, bookings, customers }) => (
  <div className="bg-gray-800/50 p-4 rounded-xl flex-1 space-y-6">
    <h2 className="text-xl font-bold text-white flex items-center">
      <Icon className="w-6 h-6 mr-3 text-indigo-400" />
      {title}
    </h2>
    <div className="space-y-3">
      {bookings.length > 0 ? (
        bookings.map(booking => (
          <div key={booking.id} className="flex items-center">
            <p className="w-20 text-center text-gray-400 font-mono text-sm">
              {booking.startDateTime.endsWith('T00:00:00') ? 'Open' : new Date(booking.startDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
            <div className="flex-grow">
              <BookingItem booking={booking} customerName={customers.find(c => c.id === booking.customer_id)?.name} />
            </div>
          </div>
        ))
      ) : (
        <p className="text-sm text-gray-500 text-center pt-4">No bookings for today.</p>
      )}
    </div>
  </div>
);

// Dashboard View
const Dashboard = () => {
  const { bookings, loading: bookingsLoading } = useScheduleData();
  const [customers, setCustomers] = useState([]);
  const [customersLoading, setCustomersLoading] = useState(true);

  useEffect(() => {
    api.getCustomers().then(setCustomers).finally(() => setCustomersLoading(false));
  }, []);

  const todaysBookings = useMemo(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const activeBookings = bookings.filter(b => b.status !== 'Completed');
    const filtered = activeBookings.filter(b => {
      const bookingDate = new Date(b.startDateTime);
      return bookingDate >= todayStart && bookingDate <= todayEnd;
    });

    const sortBookings = (a, b) => {
      if (a.startDateTime.endsWith('T00:00:00')) return -1; // Open bookings first
      if (b.startDateTime.endsWith('T00:00:00')) return 1;
      return new Date(a.startDateTime) - new Date(b.startDateTime); // Then sort by time
    };

    return {
      inbound: filtered.filter(b => b.type === 'Inbound').sort(sortBookings),
      outbound: filtered.filter(b => b.type === 'Outbound').sort(sortBookings),
    };
  }, [bookings]);

  const nextWorkingDayBookings = useMemo(() => {
    const getNextWorkingDay = (date) => {
      const newDate = new Date(date);
      const day = newDate.getDay(); // 0=Sun, 6=Sat
      if (day === 5) { // If it's Friday, next working day is Monday
        newDate.setDate(newDate.getDate() + 3);
      } else if (day === 6) { // If it's Saturday, next working day is Monday
        newDate.setDate(newDate.getDate() + 2);
      } else { // Otherwise, it's just the next day
        newDate.setDate(newDate.getDate() + 1);
      }
      return newDate;
    };

    const nextDay = getNextWorkingDay(new Date());
    const nextDayStart = new Date(nextDay);
    nextDayStart.setHours(0, 0, 0, 0);
    const nextDayEnd = new Date(nextDay);
    nextDayEnd.setHours(23, 59, 59, 999);

    const activeBookings = bookings.filter(b => b.status !== 'Completed');
    const filtered = activeBookings.filter(b => {
      const bookingDate = new Date(b.startDateTime);
      return bookingDate >= nextDayStart && bookingDate <= nextDayEnd;
    });

    const sortBookings = (a, b) => {
      if (a.startDateTime.endsWith('T00:00:00')) return -1;
      if (b.startDateTime.endsWith('T00:00:00')) return 1;
      return new Date(a.startDateTime) - new Date(b.startDateTime);
    };

    return {
      date: nextDay,
      inbound: filtered.filter(b => b.type === 'Inbound').sort(sortBookings),
      outbound: filtered.filter(b => b.type === 'Outbound').sort(sortBookings),
    };
  }, [bookings]);

  const isLoading = bookingsLoading || customersLoading;

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-3xl font-bold text-white flex items-center">
        <LayoutDashboard className="w-6 h-6 mr-2 text-indigo-400" />
        Lattice Warehouse Overview
      </h1>
      {isLoading ? (
        <div className="flex justify-center items-center h-64 text-indigo-400"><Loader className="w-12 h-12 animate-spin" /></div>
      ) : (
        <div className="space-y-8">
          <div className="flex gap-6">
            <BookingColumn title="Today's Inbounds" icon={ArrowLeft} bookings={todaysBookings.inbound} customers={customers} />
            <BookingColumn title="Today's Outbounds" icon={ArrowRight} bookings={todaysBookings.outbound} customers={customers} />
          </div>
          <div className="border-t-2 border-gray-700 pt-8">
            <div className="flex gap-6">
              <BookingColumn title={`Inbounds for ${nextWorkingDayBookings.date.toLocaleDateString('default', { weekday: 'short', day: 'numeric' })}`} icon={ArrowLeft} bookings={nextWorkingDayBookings.inbound} customers={customers} />
              <BookingColumn title={`Outbounds for ${nextWorkingDayBookings.date.toLocaleDateString('default', { weekday: 'short', day: 'numeric' })}`} icon={ArrowRight} bookings={nextWorkingDayBookings.outbound} customers={customers} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;