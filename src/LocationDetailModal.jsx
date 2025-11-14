import React, { useState, useEffect } from 'react';
import { X, Save, Settings, Package } from 'lucide-react';
import { formatDate } from './dateFormatter'; // Import the date formatter

const DetailRow = ({ label, value }) => (
  <div className="flex justify-between items-center py-2 border-b border-gray-700/50 overflow-hidden">
    <p className="text-sm text-gray-400 whitespace-nowrap">{label}</p>
    <p className="text-sm font-medium text-white text-right whitespace-nowrap overflow-hidden text-ellipsis ml-4">{String(value)}</p>
  </div>
);

const LocationDetailModal = ({ isOpen, onClose, location, pallets, onSaveSettings, showSettingsTab = true, customers = [] }) => {
  const [activeTab, setActiveTab] = useState('details');
  const [capacity, setCapacity] = useState(1);
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    if (location) {
      setCapacity(location.capacity || 1);
      setEnabled(location.enabled !== 0); // Default to true if undefined
      setActiveTab('details'); // Reset to details tab on open
    }
  }, [location]);

  const handleSave = () => {
    onSaveSettings(location.id, {
      capacity: parseInt(capacity, 10),
      enabled: enabled ? 1 : 0,
    });
  };

  if (!isOpen || !location) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4">
      <div className={`bg-gray-800 rounded-xl shadow-2xl p-8 w-full m-4 relative ${pallets.length <= 1 ? 'max-w-lg' : 'max-w-4xl'}`}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
          <X size={24} />
        </button>
        <h2 className="text-2xl font-bold text-white mb-4">Location: {location.name}</h2>

        {/* Tabs */}
        {showSettingsTab && (
          <div className="flex border-b border-gray-700 mb-6">
            <button onClick={() => setActiveTab('details')} className={`flex items-center px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'details' ? 'border-b-2 border-indigo-500 text-white' : 'text-gray-400 hover:text-white'}`}>
              <Package size={16} className="mr-2" /> Pallet Details
            </button>
            <button onClick={() => setActiveTab('settings')} className={`flex items-center px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'settings' ? 'border-b-2 border-indigo-500 text-white' : 'text-gray-400 hover:text-white'}`}>
              <Settings size={16} className="mr-2" /> Location Settings
            </button>
          </div>
        )}

        {/* Tab Content */}
        <div>
          {activeTab === 'details' && (
            pallets.length > 0 ? (
              // This single div is now scrollable, with a custom class to hide the scrollbar.
              <div className="flex flex-wrap gap-4 max-h-[60vh] overflow-y-auto hide-scrollbar">
                {pallets.map((pallet, index) => (
                  <div key={pallet.id} className="p-3 bg-gray-900/50 rounded-lg border border-gray-700 flex-1 min-w-[280px]">
                    {pallets.length > 1 && <h4 className="font-semibold text-indigo-300 mb-2">Pallet {index + 1}</h4>}
                    <DetailRow label="Customer" value={customers.find(c => c.id === pallet.customer_id)?.name || 'N/A'} />
                    <DetailRow label="Stock Number" value={pallet.stockNumber || 'N/A'} />
                    <DetailRow label="Order Number" value={pallet.inboundOrderNumber || 'N/A'} />
                    <DetailRow label="Pallet Quantity" value={pallet.quantity || 0} />
                    <DetailRow label="Received Date" value={formatDate(pallet.inboundDate)} />
                    <DetailRow label="Inbound Reference" value={pallet.inboundReference || 'N/A'} />
                    <DetailRow label="Pick Reference" value={pallet.originalBookingReference || 'N/A'} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-400 py-8">This location is empty.</p>
            )
          )}

          {activeTab === 'settings' && showSettingsTab && (
            <div className="space-y-6">
              <div>
                <label htmlFor="capacity" className="block text-sm font-medium text-gray-300 mb-1">Pallet Capacity</label>
                <input
                  id="capacity"
                  type="number"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  min="1"
                  className="w-full p-2 rounded-lg bg-gray-900 text-gray-100 border border-gray-600"
                />
                <p className="text-xs text-gray-500 mt-1">Number of pallets this location can hold.</p>
              </div>
              <div className="flex items-center">
                <input
                  id="enabled"
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                  className="h-5 w-5 rounded bg-gray-900 border-gray-600 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="enabled" className="ml-3 text-sm font-medium text-gray-300">Location Enabled</label>
              </div>
              <p className="text-xs text-gray-500">Uncheck to block this location for walkways, damage, etc. It will appear grayed out.</p>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3 pt-6 mt-6 border-t border-gray-700">
          {/* Close button removed as per request */}
          {activeTab === 'settings' && showSettingsTab && (
            <button type="button" onClick={handleSave} className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">
              <Save size={16} className="mr-2" /> Save Settings
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default LocationDetailModal;