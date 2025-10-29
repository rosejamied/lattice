import React, { useState, useMemo } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Loader } from 'lucide-react';
import { useScheduleData } from './useScheduleData';
import * as api from './api.jsx'; // Needed to fetch customer data

const MSchedule = ({ navigateBack, scheduleSettings }) => {
  const { bookings, loading: bookingsLoading } = useScheduleData();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [customers, setCustomers] = useState([]);
  const [customersLoading, setCustomersLoading] = useState(true);

  // Fetch customers for display names
  React.useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const data = await api.getCustomers();
        setCustomers(data);
      } catch (error) {
        console.error("Failed to fetch customers for mobile view:", error);
      } finally {
        setCustomersLoading(false);
      }
    };
    fetchCustomers();
  }, []);

  const goToPreviousDay = () => setCurrentDate(d => new Date(d.setDate(d.getDate() - 1)));
  const goToNextDay = () => setCurrentDate(d => new Date(d.setDate(d.getDate() + 1)));
  const goToToday = () => setCurrentDate(new Date());

  const { openBookings, timedBookings } = useMemo(() => {
    const startOfDay = new Date(currentDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(currentDate);
    endOfDay.setHours(23, 59, 59, 999);

    const dayBookings = bookings.filter(b => {
      const bookingDate = new Date(b.startDateTime);
      return bookingDate >= startOfDay && bookingDate <= endOfDay;
    });

    return {
      openBookings: dayBookings.filter(b => b.startDateTime.endsWith('T00:00:00')),
      timedBookings: dayBookings.filter(b => !b.startDateTime.endsWith('T00:00:00')).map(b => ({
        ...b,
        startDate: new Date(b.startDateTime),
        endDate: new Date(b.endDateTime)
      }))
    };
  }, [bookings, currentDate]);

  const timeSlots = Array.from({ length: scheduleSettings.endHour - scheduleSettings.startHour + 1 }).map((_, i) => {
    const hour = scheduleSettings.startHour + i;
    return `${hour.toString().padStart(2, '0')}:00`;
  });

  // Define the height of one hour slot in pixels for calculation
  const HOUR_HEIGHT_PX = 60;

  const isLoading = bookingsLoading || customersLoading;

  return (
    <div className="h-screen w-screen bg-gray-900 flex flex-col p-6 font-sans">
      <header className="flex items-center mb-8">
        <button onClick={navigateBack} className="p-2 mr-4 bg-gray-800 rounded-full hover:bg-gray-700"><ChevronLeft className="text-white" /></button>
        <h1 className="text-3xl font-bold text-white flex items-center"><Calendar className="mr-3 text-indigo-400" /> Schedule</h1>
      </header>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-white">{currentDate.toLocaleDateString('default', { weekday: 'long', month: 'long', day: 'numeric' })}</h2>
        <div className="flex items-center gap-2">
          <button onClick={goToPreviousDay} className="p-2 bg-gray-700 rounded-md hover:bg-gray-600"><ChevronLeft className="w-5 h-5" /></button>
          <button onClick={goToToday} className="px-4 py-2 text-sm bg-gray-700 rounded-md hover:bg-gray-600">Today</button>
          <button onClick={goToNextDay} className="p-2 bg-gray-700 rounded-md hover:bg-gray-600"><ChevronRight className="w-5 h-5" /></button>
        </div>
      </div>

      <main className="flex-grow overflow-y-auto bg-gray-800 rounded-xl shadow-lg p-4 space-y-4">
        {isLoading ? (
          <div className="flex justify-center items-center h-full text-indigo-400">
            <Loader className="w-8 h-8 animate-spin mr-2" /> Loading...
          </div>
        ) : (
          <>
            {/* Open Bookings */}
            <div>
              <h3 className="text-lg font-semibold text-gray-300 mb-2">Open Bookings</h3>
              <div className="space-y-2">
                {openBookings.length > 0 ? openBookings.map(booking => (
                  <div key={booking.id} className={`p-3 rounded-lg ${booking.type === 'Inbound' ? 'bg-green-800/80' : 'bg-orange-800/80'}`}>
                    <p className="font-bold text-white">{booking.name}</p>
                    <p className="text-sm text-gray-300">{customers.find(c => c.id === booking.customer_id)?.name || 'No Customer'}</p>
                  </div>
                )) : <p className="text-sm text-gray-500">No open bookings for this day.</p>}
              </div>
            </div>

            {/* Timed Bookings */}
            <div className="border-t border-gray-700 pt-4">
              <h3 className="text-lg font-semibold text-gray-300 mb-2">Timed Bookings</h3>
              <div className="relative">
                {/* Background Time Slots */}
                {timeSlots.map((time, index) => (
                  <div key={time} className="flex items-start" style={{ height: `${HOUR_HEIGHT_PX}px` }}>
                    <div className="w-16 text-sm text-gray-500 pt-[-4px]">{time}</div>
                    <div className="flex-grow border-t border-gray-700"></div>
                  </div>
                ))}

                {/* Absolutely Positioned Bookings */}
                {timedBookings.map(booking => {
                  const top = ((booking.startDate.getHours() - scheduleSettings.startHour) * HOUR_HEIGHT_PX) + (booking.startDate.getMinutes() / 60 * HOUR_HEIGHT_PX);
                  const durationMinutes = (booking.endDate - booking.startDate) / (1000 * 60);
                  const height = (durationMinutes / 60 * HOUR_HEIGHT_PX) - 2; // -2 for a small gap

                  return (
                    <div
                      key={booking.id}
                      className={`absolute left-20 right-0 p-2 rounded-lg overflow-hidden ${booking.type === 'Inbound' ? 'bg-green-900/80 border-l-2 border-green-500' : 'bg-orange-900/80 border-l-2 border-orange-500'}`}
                      style={{ top: `${top}px`, height: `${height}px` }}
                    >
                      <p className="font-bold text-white text-sm truncate">{booking.name}</p>
                      <p className="text-xs text-gray-300 truncate">{customers.find(c => c.id === booking.customer_id)?.name || 'No Customer'}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default MSchedule;