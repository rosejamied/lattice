import React, { useState } from 'react';
import { Plus, Loader, Trash, X, Calendar, ChevronLeft, ChevronRight, Dot } from 'lucide-react';
import { useScheduleData } from './useScheduleData';
import * as api from './api.jsx';
import BookingForm from './BookingForm.jsx';

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const getStatusClasses = (status, type) => {
  switch (status) {
    case 'Arrived':
      return 'bg-cyan-800/80 border-cyan-600 hover:bg-cyan-800'; // Web: 'bg-cyan-900/70 border-l-2 border-cyan-400 hover:bg-cyan-900'
    case 'Allocated':
      return 'bg-yellow-800/80 border-yellow-600 hover:bg-yellow-800'; // Web: 'bg-yellow-900/70 border-l-2 border-yellow-400 hover:bg-yellow-900'
    case 'Picked':
      return 'bg-purple-800/80 border-purple-600 hover:bg-purple-800';
    case 'Completed':
      return 'bg-gray-700/80 border-gray-500 hover:bg-gray-700 text-gray-400'; // Web: 'bg-gray-800/70 border-l-2 border-gray-600 hover:bg-gray-800'
    case 'Booked':
    default:
      return type === 'Inbound' ? 'bg-green-800/80 border-green-600 hover:bg-green-800' : 'bg-orange-800/80 border-orange-600 hover:bg-orange-800';
  }
};

// Schedule View (Updated Component)
const ScheduleView = ({ scheduleSettings }) => {
  const { bookings, loading, addBooking, deleteBooking, updateBooking, updateBookings } = useScheduleData();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [hauliers, setHauliers] = useState([]);
  const [customerContracts, setCustomerContracts] = useState([]);
  const [bookingToEdit, setBookingToEdit] = useState(null);
  const [isFormEditable, setIsFormEditable] = useState(false);
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

  // Fetch contracts when a customer is selected in the form
  React.useEffect(() => {
    if (newBooking.customer_id) {
      api.getCustomerContracts(newBooking.customer_id)
        .then(setCustomerContracts)
        .catch(err => {
          console.error("Failed to fetch customer contracts:", err);
          setCustomerContracts([]); // Reset on error
        });
    } else {
      setCustomerContracts([]); // Clear contracts if no customer is selected
    }
  }, [newBooking.customer_id]);

  // --- Calendar Logic ---
  const getWeekDays = (date) => {
    // Guard clause to prevent crash on initial render before settings are loaded
    if (!scheduleSettings || !scheduleSettings.visibleDays) {
      return [];
    }

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
  // Guard against scheduleSettings being undefined on initial render
  const timeSlots = (scheduleSettings && scheduleSettings.endHour && scheduleSettings.startHour)
    ? Array.from({ length: scheduleSettings.endHour - scheduleSettings.startHour }).map((_, i) => 
        `${(scheduleSettings.startHour + i).toString().padStart(2, '0')}:00`
      )
    : [];

  const goToPreviousWeek = () => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setDate(newDate.getDate() - 7);
      return newDate;
    });
  };
  const goToNextWeek = () => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setDate(newDate.getDate() + 7);
      return newDate;
    });
  };
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
  
  const rowMultipliers = React.useMemo(() => {
    const multipliers = {};
    timeSlots.forEach(time => {
      let maxBookingsInRow = 1; // Default to 1 booking height
      const hour = parseInt(time);
      weekDays.forEach(day => {
        const slotKey = `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}-${hour}`;
        const bookingsInSlot = bookingsBySlot[slotKey] || [];
        if (bookingsInSlot.length > maxBookingsInRow) {
          maxBookingsInRow = bookingsInSlot.length;
        }
      });
      multipliers[time] = maxBookingsInRow;
    });
    return multipliers;
  }, [timeSlots, weekDays, bookingsBySlot]);

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

  const followingMondayOpenOutbound = React.useMemo(() => {
    const nextMonday = new Date(currentDate);
    const day = nextMonday.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
    
    // Calculate days to add to get to the *next* Monday.
    // If today is Sunday (0), add 1 day. If today is Monday (1), add 7 days. If today is Saturday (6), add 2 days.
    const addDays = (7 - day + 1) % 7;
    nextMonday.setDate(nextMonday.getDate() + addDays + (addDays === 0 ? 7 : 0) ); // Add 7 if it's Monday to get next Monday

    const nextMondayKey = `${nextMonday.getFullYear()}-${nextMonday.getMonth()}-${nextMonday.getDate()}`;
    const allOpenBookingsForNextMonday = openBookingsByDay[nextMondayKey] || [];

    return {
      date: nextMonday,
      bookings: allOpenBookingsForNextMonday.filter(b => b.type === 'Outbound')
    };
  }, [currentDate, openBookingsByDay]);


  // --- Form and CRUD Logic ---
  const handleFormChange = (e) => {
    const { name, value } = e.target;

    if (['name', 'type', 'repeat', 'repeatCount', 'expectedPallets', 'customer_id', 'supplier_id', 'haulier_id', 'status', 'contract_id'].includes(name)) {
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
    setIsFormEditable(true); // New bookings are editable by default
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
    setIsFormEditable(true); // New bookings are editable by default
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
      status: booking.status,
      expectedPallets: booking.expectedPallets || '',
      customer_id: booking.customer_id,
      supplier_id: booking.supplier_id,
      haulier_id: booking.haulier_id,
      contract_id: booking.contract_id,
      isOpenBooking: booking.startDateTime.endsWith('T00:00:00'),
      repeatCount: 1,
      repeatOnDays: [],
    });
    setIsFormOpen(true);
    setIsFormEditable(false); // Open in read-only mode first
  };

  const handleAddBooking = async (e) => {
    e.preventDefault();
    const { date, startTime, endTime } = bookingFormData;
    // For open bookings, we use a specific time format as an identifier
    const finalStartDateTime = newBooking.isOpenBooking ? `${date}T00:00:00` : `${date}T${startTime}`;
    const finalEndDateTime = newBooking.isOpenBooking ? `${date}T00:00:01` : `${date}T${endTime}`;

    if (!finalStartDateTime || !finalEndDateTime || new Date(finalEndDateTime) < new Date(finalStartDateTime)) {
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
        status: newBooking.status || 'Booked',
        contract_id: newBooking.contract_id || null,
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
            customer_id: newBooking.customer_id || null, status: 'Booked',
            supplier_id: newBooking.type === 'Inbound' ? newBooking.supplier_id || null : null,
            contract_id: newBooking.contract_id || null,
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
    <div className="flex h-full">
      {/* Main Schedule Area */}
      <div className="flex-grow p-4 space-y-4 flex flex-col h-full">
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
                {weekDays.length > 0 && weekDays[0].toLocaleString('default', { month: 'long', year: 'numeric' })}
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
              {/* Header Row (without open bookings) */}
              {weekDays.map(day => (
                <div key={day.toISOString()} className="sticky top-0 bg-gray-800 z-10 border-b border-l border-gray-700">
                  <div className="text-center p-2">
                    <p className="text-xs text-gray-400">{day.toLocaleDateString('default', { weekday: 'short' }).toUpperCase()}</p>
                    <p className="text-lg font-bold">{day.getDate()}</p>
                  </div>
                </div>
              ))}

              {/* Time Slots and Bookings */}
              {timeSlots.map(time => (
                <React.Fragment key={time}>
                  {weekDays.map(day => {
                    const slotKey = `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}-${parseInt(time)}`;
                    const slotBookings = bookingsBySlot[slotKey] || [];
                    const rowMultiplier = rowMultipliers[time] || 1;
                    const slotHeight = 40 * rowMultiplier; // 40px (h-10) * multiplier

                    return (
                      <div
                        key={`${day.toISOString()}-${time}`}
                        onClick={() => openFormForSlot(day, parseInt(time))}
                        className="relative border-b border-l border-gray-700 p-1 hover:bg-gray-700/50 transition-colors cursor-pointer"
                        style={{ height: `${slotHeight}px` }}
                      >
                        <span className="absolute top-0 left-1 text-xs text-gray-600">{time.split(':')[0]}</span>
                        {slotBookings.map((booking, index) => {
                          let top, height;
                          const baseSlotHeight = 40; // Corresponds to h-10

                          if (rowMultiplier > 1) {
                            // If there are multiple bookings, stack them vertically
                            height = 36; // h-9, slightly less than the base slot height
                            top = (index * height) + 2; // Stack with a small gap
                          } else {
                            // If it's a single booking, calculate height based on duration
                            const durationMinutes = (booking.endDate - booking.startDate) / (1000 * 60);
                            height = (durationMinutes / 60) * baseSlotHeight - 4; // -4 for padding
                            top = (booking.startDate.getMinutes() / 60) * baseSlotHeight;
                          }

                          return (
                          <div
                            key={booking.id}
                            onClick={(e) => { e.stopPropagation(); handleEditBooking(booking); }}
                            className={`group absolute left-1 right-1 p-1.5 rounded-md text-xs cursor-pointer overflow-hidden ${getStatusClasses(booking.status, booking.type).replace('border-l-2', 'border-l-4')}`}
                            style={{ height: `${height}px`, top: `${top}px` }}
                          >
                            <p className="truncate">
                              <span className="font-bold">{customers.find(c => c.id === booking.customer_id)?.name || 'No Customer'}</span>
                              {booking.name && <span className="text-gray-300"> - {booking.name}</span>}
                              {booking.contractName && <span className="text-gray-300"> - {booking.contractName}</span>}
                              {booking.expectedPallets > 0 && <span className="ml-2 px-1.5 py-0.5 text-xs rounded bg-gray-900/50">{booking.expectedPallets}</span>}
                            </p>
                            <button onClick={(e) => { e.stopPropagation(); handleDeleteBooking(booking.id); }} className="absolute bottom-1 right-1 text-red-400 hover:text-red-200 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Trash className="w-3 h-3" />
                            </button>
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

          {loading && (
            <div className="flex justify-center items-center py-10 text-indigo-400">
              <Loader className="w-8 h-8 animate-spin mr-2" /> Loading Schedule Data...
            </div>
          )}
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
        contracts={customerContracts}
        hauliers={hauliers}
        isEditable={isFormEditable}
        onSetEditable={(e) => {
          e.preventDefault();
          setIsFormEditable(true);
        }}
      />
      }

      {/* Open Bookings Sidebar */}
      <div className="w-1/4 flex-shrink-0 bg-gray-800/50 p-4 border-l border-gray-700 overflow-y-auto">
        <h2 className="text-xl font-bold text-white mb-4">Open Bookings</h2>
        <div className="space-y-4">
          {weekDays.map(day => {
            const dayKey = `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`;
            const dayOpenBookings = openBookingsByDay[dayKey] || [];
            return (
              <div key={dayKey}>
                <h3 className="font-semibold text-gray-300 border-b border-gray-600 pb-1 mb-2">
                  {day.toLocaleDateString('default', { weekday: 'long', day: 'numeric' })}
                </h3>
                {dayOpenBookings.length > 0 ? (
                  <div className="space-y-2">
                    {dayOpenBookings.map(booking => (
                      <div key={booking.id} onClick={() => handleEditBooking(booking)} className={`p-2 rounded-md text-sm cursor-pointer ${getStatusClasses(booking.status, booking.type)}`}>
                        <p className="truncate">
                          <span className="font-bold">{customers.find(c => c.id === booking.customer_id)?.name || 'No Customer'}</span>
                          {booking.contractName && <span className="text-gray-200"> - {booking.contractName}</span>}
                          {booking.name && <span className="text-gray-200"> - {booking.name}</span>}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">No open bookings.</p>
                )}
              </div>
            );
          })}

          {/* Following Monday's Open Outbound Bookings */}
          <div className="border-t-2 border-dashed border-gray-600 pt-4 mt-4">
            <h3 className="font-semibold text-gray-300 mb-2">
              {followingMondayOpenOutbound.date.toLocaleDateString('default', { weekday: 'long', day: 'numeric' })}
            </h3>
            {followingMondayOpenOutbound.bookings.length > 0 ? (
              <div className="space-y-2">
                {followingMondayOpenOutbound.bookings.map(booking => (
                  <div key={booking.id} onClick={() => handleEditBooking(booking)} className={`p-2 rounded-md text-sm cursor-pointer ${getStatusClasses(booking.status, booking.type)}`}>
                    <p className="truncate">
                      <span className="font-bold">{customers.find(c => c.id === booking.customer_id)?.name || 'No Customer'}</span>
                      {booking.contractName && <span className="text-gray-200"> - {booking.contractName}</span>}
                      {booking.name && <span className="text-gray-200"> - {booking.name}</span>}
                    </p>
                  </div>
                ))}
              </div>
            ) : (<p className="text-xs text-gray-500">No open outbound bookings for next Monday.</p>)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleView;