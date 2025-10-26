import React, { useState } from 'react';
import { Plus, Loader, Trash, X, Calendar } from 'lucide-react';
import { useLocalScheduleData } from './useLocalScheduleData';

// Schedule View (Updated Component)
const ScheduleView = () => {
  const { bookings, loading, updateBookings } = useLocalScheduleData();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [newBooking, setNewBooking] = useState({
    name: '',
    type: 'Inbound',
    dateTime: new Date().toISOString().substring(0, 16), // YYYY-MM-DDThh:mm format
  });

  const handleBookingChange = (e) => {
    const { name, value } = e.target;
    setNewBooking(prev => ({ ...prev, [name]: value }));
  };

  const handleAddBooking = (e) => {
    e.preventDefault();
    if (!newBooking.name || !newBooking.dateTime) {
      // In a real app, show an error message instead of console.error
      console.error("Missing required fields.");
      return;
    }

    const newEntry = {
      id: Date.now().toString(),
      ...newBooking,
      status: 'Scheduled',
    };

    updateBookings([newEntry, ...bookings]);
    setNewBooking({
      name: '',
      type: 'Inbound',
      dateTime: new Date().toISOString().substring(0, 16),
    });
    setIsFormOpen(false);
  };

  const handleDeleteBooking = (id) => {
    // Custom modal UI is preferred, but using window.confirm for now
    if (!window.confirm("Are you sure you want to delete this booking?")) return;
    const filtered = bookings.filter(b => b.id !== id);
    updateBookings(filtered);
  };

  const BookingForm = () => (
    <form onSubmit={handleAddBooking} className="bg-gray-700/50 p-6 rounded-xl space-y-4 border border-indigo-700">
      <h3 className="text-xl font-semibold text-white">Add New Booking</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Pallet Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">Client Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={newBooking.name}
            onChange={handleBookingChange}
            className="w-full p-2 rounded-lg bg-gray-800 text-gray-100 border border-gray-600 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="e.g., Q4 Shipment / Vendor A"
            required
          />
        </div>

        {/* Type */}
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-300 mb-1">Booking Type</label>
          <select
            id="type"
            name="type"
            value={newBooking.type}
            onChange={handleBookingChange}
            className="w-full p-2 rounded-lg bg-gray-800 text-gray-100 border border-gray-600 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="Inbound">Inbound (Receiving)</option>
            <option value="Outbound">Outbound (Shipping)</option>
          </select>
        </div>

        {/* Date/Time */}
        <div>
          <label htmlFor="dateTime" className="block text-sm font-medium text-gray-300 mb-1">Date & Time</label>
          <input
            type="datetime-local"
            id="dateTime"
            name="dateTime"
            value={newBooking.dateTime}
            onChange={handleBookingChange}
            className="w-full p-2 rounded-lg bg-gray-800 text-gray-100 border border-gray-600 focus:ring-indigo-500 focus:border-indigo-500"
            required
          />
        </div>
      </div>
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={() => setIsFormOpen(false)}
          className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors font-medium"
        >
          <X className="w-4 h-4 mr-1" /> Close
        </button>
        <button
          type="submit"
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors font-medium shadow-md shadow-indigo-500/50"
        >
          <Plus className="w-4 h-4 mr-1" /> Schedule Booking
        </button>
      </div>
    </form>
  );

  const BookingList = () => (
    <div className="mt-6 space-y-3">
        {bookings.length === 0 ? (
            <div className="p-6 text-center text-gray-400 bg-gray-800 rounded-xl border border-dashed border-gray-700">
                No bookings scheduled yet. Click "New Booking" to add one.
            </div>
        ) : (
            <div className="bg-gray-800 rounded-xl shadow-lg divide-y divide-gray-700">
                {bookings.map(booking => {
                    const dateObj = new Date(booking.dateTime);
                    const date = dateObj.toLocaleDateString();
                    const time = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    const typeClass = booking.type === 'Inbound' ? 'bg-green-600/20 text-green-400 border-green-700' : 'bg-orange-600/20 text-orange-400 border-orange-700';

                    return (
                        <div key={booking.id} className="flex items-center justify-between p-4 hover:bg-gray-700 transition-colors">
                            <div className="flex items-center space-x-4">
                                <div className={`px-3 py-1 text-xs font-semibold rounded-full border ${typeClass}`}>
                                    {booking.type}
                                </div>
                                <div>
                                    <p className="font-semibold text-white">{booking.name}</p>
                                    <p className="text-sm text-gray-400 flex items-center">
                                        <Calendar className="w-3 h-3 mr-1" /> {date} at {time}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => handleDeleteBooking(booking.id)}
                                className="text-red-400 hover:text-red-300 p-2 rounded-full hover:bg-gray-600 transition-colors"
                                title="Delete Booking"
                            >
                                <Trash className="w-5 h-5" />
                            </button>
                        </div>
                    );
                })}
            </div>
        )}
    </div>
  );

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-3xl font-bold text-white flex items-center">
        <Calendar className="w-6 h-6 mr-2 text-indigo-400" />
        Pallet Scheduling Board
      </h1>

      <div className="flex justify-end">
        <button
          onClick={() => setIsFormOpen(prev => !prev)}
          className={`flex items-center px-4 py-2 text-white rounded-xl font-medium transition-colors ${
            isFormOpen ? 'bg-gray-600 hover:bg-gray-500' : 'bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-500/50'
          }`}
        >
          {isFormOpen ? (
            <>
              <X className="w-5 h-5 mr-2" /> Hide Form
            </>
          ) : (
            <>
              <Plus className="w-5 h-5 mr-2" /> New Booking
            </>
          )}
        </button>
      </div>

      {isFormOpen && <BookingForm />}

      <h2 className="text-xl font-semibold text-white pt-4 border-t border-gray-700">Upcoming Bookings ({bookings.length})</h2>

      {loading ? (
        <div className="flex justify-center items-center py-10 text-indigo-400">
          <Loader className="w-8 h-8 animate-spin mr-2" /> Loading Schedule Data...
        </div>
      ) : (
        <BookingList />
      )}
    </div>
  );
};

export default ScheduleView;