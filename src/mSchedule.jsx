import React, { useState, useMemo } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Loader, Trash } from 'lucide-react';
import { useScheduleData } from './useScheduleData';
import * as api from './api.jsx'; // Needed to fetch customer data
import mBookingDetails from './mBookingDetails.jsx';

const getStatusClasses = (status, type) => {
  switch (status) {
    case 'Arrived':
      return 'bg-cyan-800/80';
    case 'Allocated':
      return 'bg-yellow-800/80';
    case 'Picked':
      return 'bg-purple-800/80';
    case 'Completed':
      return 'bg-gray-700/80 text-gray-400';
    case 'Booked':
    default:
      return type === 'Inbound' ? 'bg-green-800/80' : 'bg-orange-800/80';
  }
};

const MSchedule = ({ navigateBack, scheduleSettings }) => {
  const { bookings, loading: bookingsLoading, addBooking, deleteBooking, updateBooking } = useScheduleData();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState([]);
  const [hauliers, setHauliers] = useState([]);
  const [filteredHauliers, setFilteredHauliers] = useState([]);
  const [customerContracts, setCustomerContracts] = useState([]);
  const [customersLoading, setCustomersLoading] = useState(true);

  // Modal State
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [bookingToEdit, setBookingToEdit] = useState(null);

  // Fetch customers for display names
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setCustomersLoading(true);
        const [custData, suppData, haulData] = await Promise.all([
          api.getCustomers(), api.getSuppliers(), api.getHauliers()
        ]);
        setCustomers(custData);
        setSuppliers(suppData);
        setHauliers(haulData);
      } catch (error) {
        console.error("Failed to fetch form data for mobile view:", error);
      } finally {
        setCustomersLoading(false);
      }
    };
    fetchData();
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

  const handleOpenDetails = (booking) => {
    setBookingToEdit(booking);
    setIsDetailsModalOpen(true);
  };

  const handleUpdateStatus = (bookingId, newStatus) => {
    const bookingToUpdate = bookings.find(b => b.id === bookingId);
    if (bookingToUpdate) {
      updateBooking({ ...bookingToUpdate, status: newStatus });
    }
  };

  const handleDeleteBooking = (id) => {
    if (window.confirm("Are you sure you want to delete this booking?")) {
      deleteBooking(id);
      setBookingToEdit(null);
      setIsDetailsModalOpen(false); // Close details modal if open
    }
  };

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
                  <div 
                    key={booking.id}
                    onClick={() => handleOpenDetails(booking)}
                    className={`p-3 rounded-lg flex justify-between items-start cursor-pointer ${getStatusClasses(booking.status, booking.type)}`}
                  >
                    <div className="flex-grow min-w-0 mr-2">
                      <p className="break-words">
                        <span className="font-bold text-white">{customers.find(c => c.id === booking.customer_id)?.name || 'No Customer'}</span>
                        {booking.contractName && <span className="text-gray-300"> - {booking.contractName}</span>}
                        {booking.name && <span className="text-gray-300"> - {booking.name}</span>}
                      </p>
                      {/* Times are hidden for open bookings */}
                    </div>
                    <div className="flex-shrink-0 flex flex-col items-end ml-2">
                      {booking.expectedPallets > 0 && (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-900/50">{booking.expectedPallets}</span>
                      )}
                    </div>
                  </div>
                )) : <p className="text-sm text-gray-500">No open bookings for this day.</p>}
              </div>
            </div>

            {/* Timed Bookings */}
            <div className="border-t border-gray-700 pt-4">
              <h3 className="text-lg font-semibold text-gray-300 mb-2">Timed Bookings</h3>
              <div className="space-y-2">
                {timedBookings.length > 0 ? timedBookings.map(booking => (
                  <div key={booking.id} className="flex items-center gap-3" onClick={() => handleOpenDetails(booking)}>
                    <div className="w-20 text-center text-gray-400 font-mono text-sm">
                      <p>{booking.startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      <p>-</p>
                      <p>{booking.endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <div className={`flex-grow p-3 rounded-lg cursor-pointer ${getStatusClasses(booking.status, booking.type)}`}>
                      <div className="flex-grow min-w-0 mr-2">
                        <p className="break-words">
                          <span className="font-bold text-white">{customers.find(c => c.id === booking.customer_id)?.name || 'No Customer'}</span>
                          {booking.contractName && <span className="text-gray-300"> - {booking.contractName}</span>}
                          {booking.name && <span className="text-gray-300"> - {booking.name}</span>}
                        </p>
                      </div>
                    </div>
                  </div>
                )) : <p className="text-sm text-gray-500">No timed bookings for this day.</p>}
              </div>
            </div>
          </>
        )}
      </main>
      {isDetailsModalOpen && (
        <mBookingDetails
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          onUpdateStatus={handleUpdateStatus}
          booking={bookingToEdit}
          customers={customers}
        />
      )}
    </div>
  );
};

export default MSchedule;