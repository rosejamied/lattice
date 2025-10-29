import React, { useState, useMemo } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Loader, Trash } from 'lucide-react';
import { useScheduleData } from './useScheduleData';
import * as api from './api.jsx'; // Needed to fetch customer data
import BookingForm from './BookingForm.jsx';

const MSchedule = ({ navigateBack, scheduleSettings }) => {
  const { bookings, loading: bookingsLoading, addBooking, deleteBooking, updateBooking } = useScheduleData();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [hauliers, setHauliers] = useState([]);
  const [customersLoading, setCustomersLoading] = useState(true);

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isFormEditable, setIsFormEditable] = useState(false);
  const [bookingToEdit, setBookingToEdit] = useState(null);
  const [newBooking, setNewBooking] = useState({
    name: '', type: 'Inbound', expectedPallets: '', isOpenBooking: false,
    customer_id: null, supplier_id: null, haulier_id: null,
    repeat: 'none', repeatCount: 1, repeatOnDays: [],
  });
  const [bookingFormData, setBookingFormData] = useState({
    date: '', startTime: '', endTime: '',
  });

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

  // --- Form and CRUD Logic ---
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    if (['name', 'type', 'repeat', 'repeatCount', 'expectedPallets', 'customer_id', 'supplier_id', 'haulier_id'].includes(name)) {
      setNewBooking(prev => ({ ...prev, [name]: value }));
    } else if (name === 'isOpenBooking') {
      setNewBooking(prev => ({ ...prev, isOpenBooking: e.target.checked }));
    } else {
      setBookingFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleEditBooking = (booking) => {
    setBookingToEdit(booking);
    const startDate = new Date(booking.startDateTime);
    const endDate = new Date(booking.endDateTime);

    setBookingFormData({
      date: startDate.toISOString().substring(0, 10),
      startTime: startDate.toTimeString().substring(0, 5),
      endTime: endDate.toTimeString().substring(0, 5),
    });

    setNewBooking({
      name: booking.name,
      type: booking.type,
      expectedPallets: booking.expectedPallets || '',
      customer_id: booking.customer_id,
      supplier_id: booking.supplier_id,
      haulier_id: booking.haulier_id,
      isOpenBooking: booking.startDateTime.endsWith('T00:00:00'),
      repeatCount: 1,
      repeatOnDays: [],
    });
    setIsFormOpen(true);
    setIsFormEditable(false); // Open in read-only mode
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const { date, startTime, endTime } = bookingFormData;
    const finalStartDateTime = newBooking.isOpenBooking ? `${date}T00:00:00` : `${date}T${startTime}`;
    const finalEndDateTime = newBooking.isOpenBooking ? `${date}T00:00:01` : `${date}T${endTime}`;

    if (bookingToEdit) {
      const bookingToUpdate = {
        ...bookingToEdit, 
        name: newBooking.name, 
        type: newBooking.type, 
        startDateTime: finalStartDateTime, 
        endDateTime: finalEndDateTime, 
        expectedPallets: parseInt(newBooking.expectedPallets, 10) || 0, 
        customer_id: newBooking.customer_id || null,
        supplier_id: newBooking.type === 'Inbound' ? newBooking.supplier_id || null : null,
        haulier_id: newBooking.type === 'Outbound' ? newBooking.haulier_id || null : null,
      };
      updateBooking(bookingToUpdate);
    } else {
      // Add new booking logic would go here if needed for mobile
    }
    setIsFormOpen(false);
  };

  const handleDeleteBooking = (id) => {
    if (window.confirm("Are you sure you want to delete this booking?")) {
      deleteBooking(id);
      setBookingToEdit(null);
      setIsFormOpen(false); // Close form if open
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
                    onClick={() => handleEditBooking(booking)}
                    className={`p-3 rounded-lg flex justify-between items-start cursor-pointer ${booking.type === 'Inbound' ? 'bg-green-800/80 hover:bg-green-800' : 'bg-orange-800/80 hover:bg-orange-800'}`}
                  >
                    <div className="truncate flex-grow">
                      <p className="font-bold text-white truncate">{booking.name || 'No Reference'}</p>
                      <p className="text-sm text-gray-300 truncate">{customers.find(c => c.id === booking.customer_id)?.name || 'No Customer'}</p>
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
                      onClick={() => handleEditBooking(booking)}
                      key={booking.id}
                      className={`absolute left-20 right-0 p-2 rounded-lg overflow-hidden cursor-pointer ${booking.type === 'Inbound' ? 'bg-green-900/80 hover:bg-green-900 border-l-2 border-green-500' : 'bg-orange-900/80 hover:bg-orange-900 border-l-2 border-orange-500'}`}
                      style={{ top: `${top}px`, height: `${height}px` }}
                    >
                      <div className="flex justify-between items-start">
                        <div className="truncate">
                          <p className="font-bold text-white text-sm truncate">{booking.name || 'No Reference'}</p>
                          <p className="text-xs text-gray-300 truncate">{customers.find(c => c.id === booking.customer_id)?.name || 'No Customer'}</p>
                          {!booking.startDateTime.endsWith('T00:00:00') && (
                            <p className="text-xs text-gray-400 mt-1">{booking.startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {booking.endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                          )}
                        </div>
                        {booking.expectedPallets > 0 && <span className="ml-1 px-1.5 py-0.5 text-xs rounded bg-gray-900/50">{booking.expectedPallets}</span>}
                      </div>
                      <div className="absolute bottom-1 right-1">
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteBooking(booking.id); }} className="p-1 text-red-400 hover:text-red-200 opacity-50 hover:opacity-100 rounded-full bg-black/20">
                          <Trash className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </main>
      {isFormOpen && (
        <BookingForm
          bookingToEdit={bookingToEdit}
          newBooking={newBooking}
          bookingFormData={bookingFormData}
          onClose={() => setIsFormOpen(false)}
          onSubmit={handleFormSubmit}
          onChange={handleFormChange}
          customers={customers}
          suppliers={suppliers}
          hauliers={hauliers}
          isEditable={isFormEditable}
          onSetEditable={() => setIsFormEditable(true)}
        />
      )}
    </div>
  );
};

export default MSchedule;