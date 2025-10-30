import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';

const DetailRow = ({ label, value }) => (
  <div className="flex justify-between items-center py-3 border-b border-gray-700">
    <p className="text-sm text-gray-400">{label}</p>
    <p className="text-sm font-medium text-white text-right">{value}</p>
  </div>
);

const mBookingDetails = ({ isOpen, onClose, onUpdateStatus, booking, customers }) => {
  const [currentStatus, setCurrentStatus] = useState('');

  useEffect(() => {
    if (booking) {
      setCurrentStatus(booking.status || 'Booked');
    }
  }, [booking]);

  if (!isOpen || !booking) return null;

  const customerName = customers.find(c => c.id === booking.customer_id)?.name || 'N/A';
  const isAllDay = booking.startDateTime.endsWith('T00:00:00');
  const timeDisplay = isAllDay 
    ? 'All Day' 
    : `${new Date(booking.startDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(booking.endDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

  const inboundStatuses = ['Booked', 'Arrived', 'Completed'];
  const outboundStatuses = ['Booked', 'Allocated', 'Picked', 'Completed'];
  const statusOptions = booking.type === 'Inbound' ? inboundStatuses : outboundStatuses;

  const handleUpdate = () => {
    onUpdateStatus(booking.id, currentStatus);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-sm m-4 relative">
        <h3 className="text-xl font-bold text-white mb-4">Booking Details</h3>
        
        <div className="space-y-1">
          <DetailRow label="Customer" value={customerName} />
          {booking.contractName && <DetailRow label="Contract" value={booking.contractName} />}
          {booking.name && <DetailRow label="Reference" value={booking.name} />}
          <DetailRow label="Type" value={booking.type} />
          <DetailRow label="Time" value={timeDisplay} />
          {booking.expectedPallets > 0 && <DetailRow label="Pallets" value={booking.expectedPallets} />}
        </div>

        <div className="mt-6">
          <label htmlFor="status" className="block text-sm font-medium text-gray-300 mb-1">Change Status</label>
          <select 
            id="status" 
            value={currentStatus} 
            onChange={(e) => setCurrentStatus(e.target.value)}
            className="w-full p-2 rounded-lg bg-gray-900 text-gray-100 border border-gray-600 focus:ring-indigo-500 focus:border-indigo-500"
          >
            {statusOptions.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-700">
          <button type="button" onClick={onClose} className="px-4 py-2 text-gray-300 hover:text-white">
            Close
          </button>
          <button 
            type="button" 
            onClick={handleUpdate}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <Save size={16} className="mr-2" /> Update
          </button>
        </div>
      </div>
    </div>
  );
};

export default mBookingDetails;