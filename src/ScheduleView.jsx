import React, { useState } from 'react';
import { Plus, Loader, Trash, X, Calendar, ChevronLeft, ChevronRight, Dot } from 'lucide-react';
import { useScheduleData } from './useScheduleData';
import * as api from './api.jsx';
import BookingForm from './BookingForm.jsx';

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Schedule View (Updated Component)
const ScheduleView = ({ scheduleSettings }) => {
  const { bookings, loading, addBooking, deleteBooking, updateBooking, updateBookings } = useScheduleData();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [hauliers, setHauliers] = useState([]);
  const [bookingToEdit, setBookingToEdit] = useState(null);
  const [newBooking, setNewBooking] = useState({
    name: '',
    type: 'Inbound',
    expectedPallets: '',
    isOpenBooking: false,
    // Repeat options
    customer_id: null,
    supplier_id: null,
    haulier_id: null,
    repeat: 'none',
    repeatCount: 1,
    repeatOnDays: [], // Sunday: 0, Monday: 1, etc.
  });
  const [bookingFormData, setBookingFormData] = useState({
    date: '',
    startTime: '',
    endTime: '',
  });
  
  // Fetch related data for forms
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const [custData, suppData, haulData] = await Promise.all([
          api.getCustomers(), api.getSuppliers(), api.getHauliers()
        ]);
        setCustomers(custData);
        setSuppliers(suppData);
        setHauliers(haulData);
      } catch (error) { console.error("Failed to fetch form data:", error); }
    };
    fetchData();
  }, []);
  // --- Calendar Logic ---
  const getWeekDays = (date) => {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay()); // Start from Sunday
    const fullWeek = Array.from({ length: 7 }).map((_, i) => {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      return day;
    });
    return fullWeek.filter(day => scheduleSettings.visibleDays.includes(day.getDay()));
  };

  const weekDays = getWeekDays(currentDate);
  const timeSlots = Array.from({ length: scheduleSettings.endHour - scheduleSettings.startHour }).map((_, i) => `${(scheduleSettings.startHour + i).toString().padStart(2, '0')}:00`);

  const goToPreviousWeek = () => setCurrentDate(d => new Date(d.setDate(d.getDate() - 7)));
  const goToNextWeek = () => setCurrentDate(d => new Date(d.setDate(d.getDate() + 7)));
  const goToToday = () => setCurrentDate(new Date());

  const bookingsBySlot = React.useMemo(() => {
    const map = {};
    bookings.forEach(booking => {
      const date = new Date(booking.startDateTime);
      const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}`;
      if (!map[key]) {
        map[key] = [];
      }
      map[key].push({ ...booking, startDate: date, endDate: new Date(booking.endDateTime) });
    });
    return map;
  }, [bookings]);
  
  const openBookingsByDay = React.useMemo(() => {
    const map = {};
    bookings.forEach(booking => {
      if (booking.startDateTime.endsWith('T00:00:00')) { // Identifier for open bookings
        const date = new Date(booking.startDateTime);
        const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
        if (!map[key]) map[key] = [];
        map[key].push(booking);
      }
    });
    return map;
  }, [bookings]);

  // --- Form and CRUD Logic ---
  const handleFormChange = (e) => {
    const { name, value } = e.target;

    if (['name', 'type', 'repeat', 'repeatCount', 'expectedPallets', 'customer_id', 'supplier_id', 'haulier_id'].includes(name)) {
      setNewBooking(prev => ({ ...prev, [name]: value }));
      return;
    }

    if (name === 'isOpenBooking') {
      setNewBooking(prev => ({ ...prev, isOpenBooking: e.target.checked }));
      return;
    }

    if (name === 'day_toggle') {
      setNewBooking(prev => ({
        ...prev,
        repeatOnDays: prev.repeatOnDays.includes(value) ? prev.repeatOnDays.filter(d => d !== value) : [...prev.repeatOnDays, value]
      }));
      return;
    }

    setBookingFormData(prev => {
      const updated = { ...prev, [name]: value };
      // If start time changes, ensure end time is at least the same
      if (name === 'startTime' && updated.startTime >= updated.endTime) {
        updated.endTime = updated.startTime;
      }
      // If date changes, it's just a date change.
      return updated;
    });
  };

  const openFormForSlot = (date, hour) => {
    const slotDate = new Date(date);
    slotDate.setHours(hour, 0, 0, 0);
    const endDate = new Date(slotDate.getTime() + 60 * 60 * 1000);

    setBookingToEdit(null); // Ensure we are in "add" mode

    setBookingFormData({
      date: slotDate.toISOString().substring(0, 10),
      startTime: slotDate.toTimeString().substring(0, 5),
      endTime: endDate.toTimeString().substring(0, 5),
    });
    setNewBooking({
      name: '',
      type: 'Inbound',
      expectedPallets: '',
      isOpenBooking: false,
      customer_id: null,
      supplier_id: null,
      haulier_id: null,
      repeat: 'none',
      repeatCount: 1,
      repeatOnDays: [slotDate.getDay()], // Default to the day clicked
    });
    setIsFormOpen(true);
  };
  
  const openFormForNewOpenBooking = () => {
    const today = new Date();
    setBookingToEdit(null);
    
    setBookingFormData({
      date: today.toISOString().substring(0, 10),
      startTime: '09:00', // Default disabled time
      endTime: '17:00',   // Default disabled time
    });
    setNewBooking({
      name: '',
      type: 'Inbound',
      expectedPallets: '',
      isOpenBooking: true, // Default to open booking
      customer_id: null,
      supplier_id: null,
      haulier_id: null,
      repeat: 'none',
      repeatCount: 1,
      repeatOnDays: [today.getDay()],
    });
    setIsFormOpen(true);
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
  };

  const handleAddBooking = async (e) => {
    e.preventDefault();
    const { date, startTime, endTime } = bookingFormData;
    // For open bookings, we use a specific time format as an identifier
    const finalStartDateTime = newBooking.isOpenBooking ? `${date}T00:00:00` : `${date}T${startTime}`;
    const finalEndDateTime = newBooking.isOpenBooking ? `${date}T00:00:01` : `${date}T${endTime}`;

    if (!newBooking.name || !finalStartDateTime || !finalEndDateTime || new Date(finalEndDateTime) < new Date(finalStartDateTime)) {
      console.error("Missing required fields.");
      return;
    }

    if (bookingToEdit) {
      // Update existing booking
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
      // Use the new updateBooking function from the hook
      updateBooking(bookingToUpdate);
    } else {
      // Add new booking (and potentially recurring ones)
      const newEntries = [];
      const seriesId = Date.now().toString(); // Unique ID for the series
      const repeatWeeks = newBooking.repeat === 'weekly' ? parseInt(newBooking.repeatCount) || 1 : 1;
      const daysToRepeatOn = newBooking.repeat === 'weekly' && newBooking.repeatOnDays.length > 0
        ? newBooking.repeatOnDays
        : [new Date(date).getDay()];

      const firstDate = new Date(date);

      for (let week = 0; week < repeatWeeks; week++) {
        for (const dayIndex of daysToRepeatOn) {
          const targetDate = new Date(firstDate);
          targetDate.setDate(targetDate.getDate() + (week * 7) + (dayIndex - firstDate.getDay()));

          const entryDateStr = targetDate.toISOString().substring(0, 10);

          newEntries.push({
            id: `${seriesId}-${week}-${dayIndex}`, // Unique ID for each instance
            seriesId: seriesId,
            name: newBooking.name, type: newBooking.type, status: 'Scheduled',
            expectedPallets: parseInt(newBooking.expectedPallets, 10) || 0,
            customer_id: newBooking.customer_id || null,
            supplier_id: newBooking.type === 'Inbound' ? newBooking.supplier_id || null : null,
            haulier_id: newBooking.type === 'Outbound' ? newBooking.haulier_id || null : null,
            startDateTime: newBooking.isOpenBooking ? `${entryDateStr}T00:00:00` : `${entryDateStr}T${startTime}`,
            endDateTime: newBooking.isOpenBooking ? `${entryDateStr}T00:00:01` : `${entryDateStr}T${endTime}`,
          });
        }
      }
      // Use the addBooking function from the hook
      addBooking(newEntries);
    }
    setIsFormOpen(false);
  };

  const handleDeleteBooking = async (id) => {
    if (!window.confirm("Are you sure you want to delete this booking?")) return;
    // Use the deleteBooking function from the hook
    deleteBooking(id);
  };

  return (
    <div className="w-1/2 mx-auto">
      <div className="p-4 space-y-4 flex flex-col h-full">
        {/* Header and Navigation */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white flex items-center">
            <Calendar className="w-6 h-6 mr-3 text-indigo-400" />
            Weekly Schedule
          </h1>
          <div className="flex items-center gap-2">
            <button onClick={goToPreviousWeek} className="p-1.5 bg-gray-700 rounded-md hover:bg-gray-600 transition"><ChevronLeft className="w-5 h-5" /></button>
            <button onClick={goToToday} className="px-3 py-1.5 text-sm bg-gray-700 rounded-md hover:bg-gray-600 transition">Today</button>
            <button onClick={goToNextWeek} className="p-1.5 bg-gray-700 rounded-md hover:bg-gray-600 transition"><ChevronRight className="w-5 h-5" /></button>
            <span className="text-lg font-semibold text-gray-300 w-48 text-center">
              {weekDays[0].toLocaleString('default', { month: 'long', year: 'numeric' })}
            </span>
            <button
              onClick={openFormForNewOpenBooking}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 transition-colors font-medium shadow-md shadow-indigo-500/50"
            >
              <Plus className="w-5 h-5 mr-2" /> New Booking
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="flex-grow overflow-auto bg-gray-800 rounded-xl shadow-lg">
          <div
            className="grid"
            style={{ gridTemplateColumns: `repeat(${weekDays.length || 1}, 1fr)` }}
          >
            {/* Header Row */}
            {weekDays.map(day => (
              <div key={day.toISOString()} className="sticky top-0 bg-gray-800 z-10 border-b border-l border-gray-700">
                <div className="text-center p-2">
                  <p className="text-xs text-gray-400">{day.toLocaleDateString('default', { weekday: 'short' }).toUpperCase()}</p>
                  <p className="text-lg font-bold">{day.getDate()}</p>
                </div>
                {/* Open Bookings Area */}
                <div className="border-t border-gray-700 p-1 space-y-1 min-h-[2rem]">
                  {(openBookingsByDay[`${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`] || []).map(booking => (
                    <div key={booking.id}
                      onClick={(e) => { e.stopPropagation(); handleEditBooking(booking); }}
                      className={`p-1.5 rounded-md text-xs cursor-pointer overflow-hidden text-center ${booking.type === 'Inbound' ? 'bg-green-800/80 border-green-600 hover:bg-green-800' : 'bg-orange-800/80 border-orange-600 hover:bg-orange-800'}`}
                    >
                      <div className="flex justify-between items-center">
                        <div className="truncate">
                          <p className="font-bold truncate">{booking.name}</p>
                          <p className="text-gray-300 truncate text-left">{customers.find(c => c.id === booking.customer_id)?.name || 'No Customer'}</p>
                        </div>
                        {booking.expectedPallets > 0 && <span className="ml-2 px-1.5 py-0.5 text-xs rounded bg-gray-900/50">{booking.expectedPallets}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Time Slots and Bookings */}
            {timeSlots.map(time => (
              <React.Fragment key={time}>
                {weekDays.map(day => {
                  const slotKey = `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}-${parseInt(time)}`;
                  const slotBookings = bookingsBySlot[slotKey] || [];
                  return (
                    <div
                      key={`${day.toISOString()}-${time}`}
                      onClick={() => openFormForSlot(day, parseInt(time))}
                      className="relative border-b border-l border-gray-700 h-14 p-1 hover:bg-gray-700/50 transition-colors cursor-pointer"
                    >
                      <span className="absolute top-0 left-1 text-xs text-gray-600">{time.split(':')[0]}</span>
                      {slotBookings.map((booking, index) => {
                        const durationHours = (booking.endDate - booking.startDate) / (1000 * 60 * 60);
                        const height = `calc(${durationHours * 100}% - 4px)`; // 4px for padding
                        const top = `${(booking.startDate.getMinutes() / 60) * 100}%`;

                        // Indent overlapping bookings
                        const width = `calc(${100 - index * 10}% - 4px)`;
                        const left = `${index * 5}%`;

                        return (
                        <div
                          key={booking.id}
                          onClick={(e) => { e.stopPropagation(); handleEditBooking(booking); }}
                          className={`absolute p-1.5 rounded-md text-xs cursor-pointer overflow-hidden ${booking.type === 'Inbound' ? 'bg-green-900/70 border-l-2 border-green-400 hover:bg-green-900' : 'bg-orange-900/70 border-l-2 border-orange-400 hover:bg-orange-900'}`}
                          style={{ height, top, width, left }}
                        >
                          <div className="flex justify-between items-start">
                            <div className="truncate">
                              <p className="font-bold truncate">{booking.name}</p>
                              <p className="text-gray-300 truncate">{customers.find(c => c.id === booking.customer_id)?.name || 'No Customer'}</p>
                            </div>
                            {booking.expectedPallets > 0 && <span className="ml-2 px-1.5 py-0.5 text-xs rounded bg-gray-900/50">{booking.expectedPallets}</span>}
                          </div>
                          <div className="flex justify-between items-center">
                            <p className="text-gray-400">{booking.startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {booking.endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDeleteBooking(booking.id); }}
                              className="text-red-400 hover:text-red-200 opacity-50 hover:opacity-100"
                            >
                              <Trash className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        );
                      })}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Modal Form */}
        {isFormOpen && <BookingForm
          bookingToEdit={bookingToEdit}
          newBooking={newBooking}
          bookingFormData={bookingFormData}
          onClose={() => setIsFormOpen(false)}
          onSubmit={handleAddBooking}
          onChange={handleFormChange}
          customers={customers}
          suppliers={suppliers}
          hauliers={hauliers}
        />
        }

        {loading ? (
          <div className="flex justify-center items-center py-10 text-indigo-400">
            <Loader className="w-8 h-8 animate-spin mr-2" /> Loading Schedule Data...
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default ScheduleView;