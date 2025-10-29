import React from 'react';
import { Plus, X, ArrowRightLeft } from 'lucide-react';

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
  hauliers,
  isEditable,
  onSetEditable
}) => {
  const inboundStatuses = ['Booked', 'Arrived', 'Completed'];
  const outboundStatuses = ['Booked', 'Allocated', 'Picked', 'Completed'];
  const statusOptions = newBooking.type === 'Inbound' ? inboundStatuses : outboundStatuses;

  return (
  <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
    <form onSubmit={onSubmit} className="bg-gray-800 w-full max-w-2xl p-6 rounded-xl space-y-6 border border-indigo-700 shadow-2xl overflow-y-auto max-h-full">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-white">{bookingToEdit ? 'Booking Details' : 'Schedule a Booking'}</h3>
        {/* Date input moved to the title bar */}
        <div className="flex-grow flex justify-center px-4">
          <input
            type="date" id="date" name="date" value={bookingFormData.date} onChange={onChange}
            className="p-2 rounded-lg bg-gray-900 text-gray-100 border border-gray-600 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-700 disabled:cursor-not-allowed" disabled={!isEditable}
            required
          />
        </div>
        <div className="flex items-center p-1 bg-gray-900 rounded-lg">
          <button
            type="button"
            onClick={() => isEditable && onChange({ target: { name: 'type', value: 'Inbound' } })}
            disabled={!isEditable}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${newBooking.type === 'Inbound' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}
          >
            Inbound
          </button>
          <button
            type="button"
            onClick={() => isEditable && onChange({ target: { name: 'type', value: 'Outbound' } })}
            disabled={!isEditable}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${newBooking.type === 'Outbound' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}
          >
            Outbound
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label htmlFor="customer_id" className="block text-sm font-medium text-gray-300 mb-1">Customer</label>
          <select id="customer_id" name="customer_id" value={newBooking.customer_id || ''} onChange={onChange} disabled={!isEditable} className="w-full p-2 rounded-lg bg-gray-900 text-gray-100 border border-gray-600 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-700 disabled:cursor-not-allowed">
            <option value="">-- Select Customer --</option>
            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        {newBooking.type === 'Inbound' && (
          <div>
            <label htmlFor="supplier_id" className="block text-sm font-medium text-gray-300 mb-1">Supplier</label>
            <select id="supplier_id" name="supplier_id" value={newBooking.supplier_id || ''} onChange={onChange} disabled={!isEditable} className="w-full p-2 rounded-lg bg-gray-900 text-gray-100 border border-gray-600 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-700 disabled:cursor-not-allowed">
              <option value="">-- Select Supplier --</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        )}
        {newBooking.type === 'Outbound' && (
          <div>
            <label htmlFor="haulier_id" className="block text-sm font-medium text-gray-300 mb-1">Haulier</label>
            <select id="haulier_id" name="haulier_id" value={newBooking.haulier_id || ''} onChange={onChange} disabled={!isEditable} className="w-full p-2 rounded-lg bg-gray-900 text-gray-100 border border-gray-600 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-700 disabled:cursor-not-allowed">
              <option value="">-- Select Haulier --</option>
              {hauliers.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
          </div>
        )}
        <div>
          <label htmlFor="expectedPallets" className="block text-sm font-medium text-gray-300 mb-1">Expected Pallets</label>
          <input
            type="number" id="expectedPallets" name="expectedPallets" value={newBooking.expectedPallets} onChange={onChange}
            min="0"
            className="w-full p-2 rounded-lg bg-gray-900 text-gray-100 border border-gray-600 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="e.g., 10"
            disabled={!isEditable}
          />
        </div>
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">Booking Reference / Name</label>
          <input
            type="text" id="name" name="name" value={newBooking.name} onChange={onChange}
            className="w-full p-2 rounded-lg bg-gray-900 text-gray-100 border border-gray-600 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="e.g., PO-12345, ASN-67890"
            disabled={!isEditable}
          />
        </div>
        {bookingToEdit && (
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-300 mb-1">Status</label>
            <select id="status" name="status" value={newBooking.status || 'Booked'} onChange={onChange} disabled={!isEditable} className="w-full p-2 rounded-lg bg-gray-900 text-gray-100 border border-gray-600 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-700 disabled:cursor-not-allowed">
              {statusOptions.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
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
          onChange={onChange} disabled={!isEditable}
          className="h-4 w-4 rounded bg-gray-900 border-gray-600 text-indigo-600 focus:ring-indigo-500"
        />
        <label htmlFor="isOpenBooking" className="ml-2 text-sm font-medium text-gray-300">Open Booking (All Day)</label>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {!newBooking.isOpenBooking && (
          <>
            <div>
              <label htmlFor="startTime" className={`block text-sm font-medium mb-1 ${!isEditable ? 'text-gray-500' : 'text-gray-300'}`}>Start Time</label>
              <input
                type="time" id="startTime" name="startTime" value={bookingFormData.startTime} onChange={onChange}
                className={`w-full p-2 rounded-lg bg-gray-900 text-gray-100 border border-gray-600 focus:ring-indigo-500 focus:border-indigo-500 ${!isEditable ? 'disabled:bg-gray-700 disabled:cursor-not-allowed' : ''}`}
                disabled={!isEditable}
                required
              />
            </div>
            <div>
              <label htmlFor="endTime" className={`block text-sm font-medium mb-1 ${!isEditable ? 'text-gray-500' : 'text-gray-300'}`}>End Time</label>
              <input
                type="time" id="endTime" name="endTime" value={bookingFormData.endTime} onChange={onChange}
                className={`w-full p-2 rounded-lg bg-gray-900 text-gray-100 border border-gray-600 focus:ring-indigo-500 focus:border-indigo-500 ${!isEditable ? 'disabled:bg-gray-700 disabled:cursor-not-allowed' : ''}`}
                min={bookingFormData.startTime}
                disabled={!isEditable}
                required
              />
            </div>
          </>
        )}
      </div>
      {!bookingToEdit && (
        <div className="border-t border-gray-700 pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="repeat" className="block text-sm font-medium text-gray-300 mb-1">Repeat</label>
            <select
              id="repeat" name="repeat" value={newBooking.repeat} onChange={onChange}
              className="w-full p-2 rounded-lg bg-gray-900 text-gray-100 border border-gray-600 focus:ring-indigo-500 focus:border-indigo-500" disabled={!isEditable}
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
                className="w-full p-2 rounded-lg bg-gray-900 text-gray-100 border border-gray-600 focus:ring-indigo-500 focus:border-indigo-500" disabled={!isEditable}
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
                            onChange={() => isEditable && onChange({ target: { name: 'day_toggle', value: index } })}
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
        {isEditable ? (
          <button
            type="submit"
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors font-medium shadow-md shadow-indigo-500/50"
          >
            <Plus className="w-4 h-4 mr-1" /> {bookingToEdit ? 'Save Changes' : 'Schedule Booking'}
          </button>
        ) : (
          <button
            type="button" onClick={onSetEditable}
            className="flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-500 transition-colors font-medium"
          >
            Update Booking
          </button>
        )}
      </div>
    </form>
    </div>
  );
};

export default BookingForm;