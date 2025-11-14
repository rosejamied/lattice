import React from 'react';

const BookingPanel = ({ title, bookings, customers, icon: Icon, color }) => {
  const colorClasses = {
    green: 'text-green-400',
    orange: 'text-orange-400',
  };

  const sortedBookings = [...bookings].sort((a, b) => {
    if (a.startDateTime.endsWith('T00:00:00')) return -1;
    if (b.startDateTime.endsWith('T00:00:00')) return 1;
    return new Date(a.startDateTime) - new Date(b.startDateTime);
  });

  return (
    <div className="bg-gray-800/50 p-6 rounded-2xl h-[80vh] flex flex-col">
      <h2 className={`text-3xl font-bold flex items-center mb-6 ${colorClasses[color]}`}>
        <Icon size={32} className="mr-4" />
        {title}
      </h2>
      <div className="overflow-y-auto space-y-3 pr-2">
        {sortedBookings.length > 0 ? (
          sortedBookings.map(booking => {
            const customerName = customers.find(c => c.id === booking.customer_id)?.name || 'N/A';
            const isAllDay = booking.startDateTime.endsWith('T00:00:00');
            const time = isAllDay ? 'All Day' : new Date(booking.startDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            return (
              <div key={booking.id} className="bg-gray-800 p-4 rounded-lg flex items-center gap-4">
                <div className="w-24 text-center text-lg font-semibold text-gray-300">{time}</div>
                <div className="flex-grow border-l-2 border-gray-600 pl-4">
                  <p className="text-xl font-bold text-white truncate">{customerName}</p>
                  <p className="text-md text-gray-400 truncate">{booking.name || 'No Reference'}</p>
                </div>
                {booking.expectedPallets > 0 && (
                  <div className="text-2xl font-bold text-indigo-400 bg-gray-900/50 px-4 py-2 rounded-lg">
                    {booking.expectedPallets}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <p className="text-center text-gray-500 text-lg pt-16">No bookings for today.</p>
        )}
      </div>
    </div>
  );
};

export default BookingPanel;