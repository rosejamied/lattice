import React, { useState } from 'react';
import { Plus, Loader, Trash, X, Calendar, ChevronLeft, ChevronRight, Dot } from 'lucide-react';
import { useScheduleData } from './useScheduleData';
import * as api from './api.jsx';

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const BookingForm = ({
  bookingToEdit,
  newBooking,
  bookingFormData,
  onClose,
  onSubmit,
  onChange,
  customers,
  suppliers,
  hauliers
}) => (
  <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
    <form onSubmit={onSubmit} className="bg-gray-800 w-full max-w-2xl p-6 rounded-xl space-y-4 border border-indigo-700 shadow-2xl">
      <h3 className="text-xl font-semibold text-white">{bookingToEdit ? 'Update Booking' : 'Schedule a Booking'}</h3>
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">Client Name</label>
          <input
            type="text" id="name" name="name" value={newBooking.name} onChange={onChange}
            className="w-full p-2 rounded-lg bg-gray-900 text-gray-100 border border-gray-600 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="e.g., Q4 Shipment, Vendor A Pickup" required
          />
        </div>
        <div>
          <label htmlFor="expectedPallets" className="block text-sm font-medium text-gray-300 mb-1">Expected Pallets</label>
          <input
            type="number" id="expectedPallets" name="expectedPallets" value={newBooking.expectedPallets} onChange={onChange}
            min="0"
            className="w-full p-2 rounded-lg bg-gray-900 text-gray-100 border border-gray-600 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="e.g., 10"
          />
        </div>
        <div>
          <label htmlFor="customer_id" className="block text-sm font-medium text-gray-300 mb-1">Customer</label>
          <select id="customer_id" name="customer_id" value={newBooking.customer_id || ''} onChange={onChange} className="w-full p-2 rounded-lg bg-gray-900 text-gray-100 border border-gray-600 focus:ring-indigo-500 focus:border-indigo-500">
            <option value="">-- Select Customer --</option>
            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        {newBooking.type === 'Inbound' && (
          <div>
            <label htmlFor="supplier_id" className="block text-sm font-medium text-gray-300 mb-1">Supplier</label>
            <select id="supplier_id" name="supplier_id" value={newBooking.supplier_id || ''} onChange={onChange} className="w-full p-2 rounded-lg bg-gray-900 text-gray-100 border border-gray-600 focus:ring-indigo-500 focus:border-indigo-500">
              <option value="">-- Select Supplier --</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        )}
        {newBooking.type === 'Outbound' && (
          <div>
            <label htmlFor="haulier_id" className="block text-sm font-medium text-gray-300 mb-1">Haulier</label>
            <select id="haulier_id" name="haulier_id" value={newBooking.haulier_id || ''} onChange={onChange} className="w-full p-2 rounded-lg bg-gray-900 text-gray-100 border border-gray-600 focus:ring-indigo-500 focus:border-indigo-500">
              <option value="">-- Select Haulier --</option>
              {hauliers.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
          </div>
        )}
      </div>
      <div className="flex items-center">
        <input
          type="checkbox"
          id="isOpenBooking"
          name="isOpenBooking"
          checked={newBooking.isOpenBooking}
          onChange={onChange}
          className="h-4 w-4 rounded bg-gray-900 border-gray-600 text-indigo-600 focus:ring-indigo-500"
        />
        <label htmlFor="isOpenBooking" className="ml-2 text-sm font-medium text-gray-300">Open Booking (All Day)</label>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-300 mb-1">Booking Type</label>
            <select
              id="type" name="type" value={newBooking.type} onChange={onChange}
              className="w-full p-2 rounded-lg bg-gray-900 text-gray-100 border border-gray-600 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="Inbound">Inbound</option>
              <option value="Outbound">Outbound</option>
            </select>
          </div>
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-300 mb-1">Date</label>
            <input
              type="date" id="date" name="date" value={bookingFormData.date} onChange={onChange}
              className="w-full p-2 rounded-lg bg-gray-900 text-gray-100 border border-gray-600 focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="startTime" className={`block text-sm font-medium mb-1 ${newBooking.isOpenBooking ? 'text-gray-500' : 'text-gray-300'}`}>Start Time</label>
            <input
              type="time" id="startTime" name="startTime" value={bookingFormData.startTime} onChange={onChange}
              className={`w-full p-2 rounded-lg bg-gray-900 text-gray-100 border border-gray-600 focus:ring-indigo-500 focus:border-indigo-500 ${newBooking.isOpenBooking ? 'disabled:bg-gray-700 disabled:cursor-not-allowed' : ''}`}
              disabled={newBooking.isOpenBooking}
              required
            />
          </div>
          <div>
            <label htmlFor="endTime" className={`block text-sm font-medium mb-1 ${newBooking.isOpenBooking ? 'text-gray-500' : 'text-gray-300'}`}>End Time</label>
            <input
              type="time" id="endTime" name="endTime" value={bookingFormData.endTime} onChange={onChange}
              className={`w-full p-2 rounded-lg bg-gray-900 text-gray-100 border border-gray-600 focus:ring-indigo-500 focus:border-indigo-500 ${newBooking.isOpenBooking ? 'disabled:bg-gray-700 disabled:cursor-not-allowed' : ''}`}
              min={bookingFormData.startTime}
              disabled={newBooking.isOpenBooking}
              required
            />
          </div>
        </div>
      {!bookingToEdit && (
        <div className="border-t border-gray-700 pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="repeat" className="block text-sm font-medium text-gray-300 mb-1">Repeat</label>
            <select
              id="repeat" name="repeat" value={newBooking.repeat} onChange={onChange}
              className="w-full p-2 rounded-lg bg-gray-900 text-gray-100 border border-gray-600 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="none">Does not repeat</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>
          {newBooking.repeat !== 'none' && (
            <div className="md:col-span-1">
              <label htmlFor="repeatCount" className="block text-sm font-medium text-gray-300 mb-1">For how many weeks?</label>
              <input
                type="number" id="repeatCount" name="repeatCount" value={newBooking.repeatCount} onChange={onChange}
                min="1" max="52"
                className="w-full p-2 rounded-lg bg-gray-900 text-gray-100 border border-gray-600 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          )}
        </div>
      )}
      {!bookingToEdit && newBooking.repeat === 'weekly' && (
        <div className="border-t border-gray-700 pt-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">On these days</label>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                {dayNames.map((day, index) => (
                    <label key={day} className={`flex items-center justify-center space-x-2 p-2 rounded-lg cursor-pointer text-center ${newBooking.repeatOnDays.includes(index) ? 'bg-indigo-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>
                        <input
                            type="checkbox"
                            checked={newBooking.repeatOnDays.includes(index)}
                            onChange={() => onChange({ target: { name: 'day_toggle', value: index } })}
                            className="sr-only"
                        />
                        <span>{day}</span>
                    </label>
                ))}
            </div>
        </div>
      )}
      <div className="flex justify-end space-x-3">
        <button
          type="button" onClick={onClose}
          className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors font-medium"
        >
          <X className="w-4 h-4 mr-1" /> Close
        </button>
        <button
          type="submit"
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors font-medium shadow-md shadow-indigo-500/50"
        >
          <Plus className="w-4 h-4 mr-1" /> {bookingToEdit ? 'Update Booking' : 'Schedule Booking'}
        </button>
      </div>
    </form>
    </div>
);

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