import React from 'react';
import { X, Package, ArrowLeft, ArrowRight } from 'lucide-react';
 
const DetailRow = ({ label, value }) => {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div className="grid grid-cols-3 gap-4 py-2 border-b border-gray-700/50">
      <p className="text-sm text-gray-400 col-span-1">{label}</p>
      <p className="text-sm font-medium text-white col-span-2 break-words">{String(value)}</p>
    </div>
  );
};

const InventoryDetailModal = ({ isOpen, onClose, item, customers }) => {
  if (!isOpen || !item) return null;

  const formatDate = (isoString) => {
    if (!isoString) return 'N/A';
    return new Date(isoString).toLocaleDateString('en-GB');
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 w-full max-w-2xl p-6 rounded-xl space-y-6 border border-indigo-700 shadow-2xl">
        <div className="flex flex-col justify-between items-start">
          <h3 className="text-xl font-semibold text-white flex items-center">
            <Package className="w-6 h-6 mr-2 text-indigo-400" />
            Pallet Details - {item.stockNumber} - {customers.find(c => c.id === item.customer_id)?.name || 'N/A'}
          </h3>
          <button type="button" onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-700"><X size={20} /></button>
        </div>

        {/* Description spanning across */}
        {item.description && (
          <p className="text-sm text-gray-300 mb-4 px-2">
            <span className="font-semibold text-gray-400">Description: </span>{item.description}
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-h-[55vh] overflow-y-auto pr-2">
          {/* Left Column: Inbound Details */}
          <div className="space-y-1">
            <h4 className="text-lg font-semibold text-white mb-2 flex items-center"><ArrowLeft size={20} className="mr-2 text-green-400"/>Inbound</h4>
            <DetailRow label="Inbound Date" value={formatDate(item.inboundDate)} />
            <DetailRow label="Inbound Reference" value={item.inboundReference} />
            <DetailRow label="Inbound Order #" value={item.inboundOrderNumber} />
            <DetailRow label="RHD In" value={item.rhdIn ? `£${item.rhdIn.toFixed(2)}` : null} />
          </div>

          {/* Middle Column: Pallet Info */}
          <div className="space-y-1">
            <h4 className="text-md font-semibold text-gray-400 mb-2">Pallet Info</h4>
            <DetailRow label="Quantity" value={item.quantity} />
            <DetailRow label="Location" value={item.location} />
            <DetailRow label="Status" value={item.status} />
            <DetailRow label="Storage Cost/Week" value={item.storageCostPerWeek ? `£${item.storageCostPerWeek.toFixed(2)}` : null} />
          </div>

          {/* Right Column: Outbound Details */}
          <div className="space-y-1">
            <h4 className="text-lg font-semibold text-white mb-2 flex items-center"><ArrowRight size={20} className="mr-2 text-orange-400"/>Outbound</h4>
            <DetailRow label="Date Booked" value={formatDate(item.originalOrderDate)} />
            <DetailRow label="Time Booked" value={item.originalTimeBooked} />
            <DetailRow label="Booking Ref" value={item.originalBookingReference} />
            <DetailRow label="Trailer Number" value="[Future Feature]" />
            <DetailRow label="RHD Out" value={item.rhdOut ? `£${item.rhdOut.toFixed(2)}` : null} />
            {/* Placeholder for future outbound details */}
            {(item.status === 'Allocated' || item.status === 'Shipped') && <p className="text-xs text-gray-500 pt-2">More outbound order details will be shown here in the future.</p>}
          </div>
        </div>
        
        <div className="border-t border-gray-700 pt-4 text-xs text-gray-500">
          Last Updated: {item.updatedAt ? new Date(item.updatedAt).toLocaleString('en-GB') : 'N/A'}
        </div>

        <div className="flex justify-end pt-4 border-t border-gray-700">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default InventoryDetailModal;