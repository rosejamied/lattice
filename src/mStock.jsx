import React, { useState, useMemo } from 'react';
import { ChevronLeft, Boxes, Search } from 'lucide-react';
import LocationDetailModal from './LocationDetailModal';
import * as api from './api.jsx';

const MStock = ({ navigateBack, inventory, locations, customers }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const occupiedLocations = useMemo(() => {
    const locationMap = new Map();
    (inventory || [])
      .filter(item => item.status !== 'Dispatched')
      .forEach(item => {
        if (item.location) {
          const locName = item.location.toUpperCase();
          if (!locationMap.has(locName)) {
            locationMap.set(locName, []);
          }
          locationMap.get(locName).push(item);
        }
      });
    return locationMap;
  }, [inventory]);

  const filteredLocations = useMemo(() => {
    if (!locations) return [];
    const term = searchTerm.toUpperCase();
    return locations
      .filter(loc => loc.name.toUpperCase().includes(term))
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  }, [locations, searchTerm]);

  const handleLocationClick = (location) => {
    setSelectedLocation(location);
    setIsDetailModalOpen(true);
  };

  const handleSaveLocationSettings = async (locationId, settings) => {
    try {
      await api.updateLocation(locationId, settings);
      // For mobile, we can just close the modal. The data will refresh on next load.
      setIsDetailModalOpen(false);
    } catch (error) {
      alert("Failed to save location settings.");
    }
  };

  const LocationRow = ({ location }) => {
    const palletsInLocation = occupiedLocations.get(location.name.toUpperCase()) || [];
    const palletCount = palletsInLocation.length;
    const capacity = location.capacity || 1;
    const isEnabled = location.enabled !== 0;

    let bgColor = 'bg-blue-800/50'; // Empty
    if (!isEnabled) bgColor = 'bg-gray-700/50'; // Disabled
    else if (palletCount > 0) {
      if (palletCount > capacity) bgColor = 'bg-red-800/50'; // Over Capacity
      else if (palletCount === capacity) bgColor = 'bg-green-800/50'; // At Capacity
      else bgColor = 'bg-yellow-800/50'; // Partially Full
    }

    return (
      <div onClick={() => handleLocationClick(location)} className={`p-4 rounded-lg flex items-center justify-between ${bgColor}`}>
        <p className="font-mono font-bold text-lg text-white">{location.name}</p>
        <div className="text-right">
          <p className="font-semibold text-gray-200">{palletCount} / {capacity}</p>
          <p className="text-xs text-gray-400">Pallets</p>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="h-screen w-screen bg-gray-900 flex flex-col p-6 font-sans">
        <header className="flex items-center mb-8">
          <button onClick={navigateBack} className="p-2 mr-4 bg-gray-800 rounded-full hover:bg-gray-700"><ChevronLeft className="text-white" /></button>
          <h1 className="text-3xl font-bold text-white flex items-center"><Boxes className="mr-3 text-indigo-400" /> Locations</h1>
        </header>

        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search for a location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-3 pl-10 rounded-xl bg-gray-800 text-gray-100 border border-gray-700 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <main className="flex-grow overflow-y-auto space-y-2 pr-1">
          {filteredLocations.length > 0 ? (
            filteredLocations.map(loc => <LocationRow key={loc.id} location={loc} />)
          ) : (
            <p className="text-center text-gray-500 mt-10">No locations found.</p>
          )}
        </main>
      </div>
      <LocationDetailModal 
        isOpen={isDetailModalOpen} 
        onClose={() => setIsDetailModalOpen(false)} 
        location={selectedLocation}
        pallets={selectedLocation ? occupiedLocations.get(selectedLocation.name.toUpperCase()) || [] : []}
        onSaveSettings={handleSaveLocationSettings}
        customers={customers}
        showSettingsTab={false}
      />
    </>
  );
};

export default MStock;