import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { LayoutGrid, Plus, Settings, Loader, Package, Zap } from 'lucide-react';
import BulkGenerateLocationsModal from './BulkGenerateLocationsModal';
import LocationFormatModal from './LocationFormatModal';
import LocationDetailModal from './LocationDetailModal';
import * as api from './api.jsx';

const WarehouseVisualizer = () => {
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isFormatModalOpen, setIsFormatModalOpen] = useState(false);
  const [locations, setLocations] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [locationFormat, setLocationFormat] = useState({
    aisle: { type: 'Letter', padding: '' },
    separator1: '-',
    row: { type: 'Number', padding: '00' },
    separator2: '-',
    bin: { type: 'Number', padding: '00' },
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [locationsData, inventoryData, customersData] = await Promise.all([
        api.getLocations(),
        api.getInventory(),
        api.getCustomers()
      ]);
      setLocations(locationsData);
      setInventory(inventoryData);
      setCustomers(customersData);
    } catch (error) {
      console.error("Failed to fetch warehouse data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    api.getLocationFormat().then(settings => {
      if (settings && settings.format) {
        setLocationFormat(settings.format);
      }
    }).catch(err => console.log("No location format setting found, using default."));
  }, [fetchData]);

  const occupiedLocations = useMemo(() => {
    const locationMap = new Map();
    (inventory || [])
      .filter(item => item.status !== 'Dispatched') // Only consider active inventory
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

  const locationsByAisle = useMemo(() => {
    const aisleData = new Map();

    locations.forEach(loc => {
      const sep1 = locationFormat.separator1 || '';
      const sep2 = locationFormat.separator2 || '';
      
      // This regex is designed to be flexible based on the format.
      // It's a bit complex, but it tries to capture aisle, row, and bin.
      const aisleRegex = locationFormat.aisle?.type === 'Letter' ? `([A-Z]+)` : `(\\d+)`;
      const rowRegex = locationFormat.row?.type === 'Letter' ? `([A-Z]+)` : `(\\d+)`;
      const binRegex = locationFormat.bin?.type === 'Letter' ? `([A-Z]+)` : `(\\d+)`;
      
      const fullRegex = new RegExp(`^${aisleRegex}${sep1}${rowRegex}${sep2}${binRegex}$`);
      const parts = loc.name.match(fullRegex);

      if (parts) {
        const [, aisle, row, bin] = parts;
        if (!aisleData.has(aisle)) {
          aisleData.set(aisle, new Map());
        }
        const aisleMap = aisleData.get(aisle);
        if (!aisleMap.has(row)) {
          aisleMap.set(row, []);
        }
        aisleMap.get(row).push(loc);
      }
    });

    // Sort rows and bins within each aisle
    for (const [aisle, rows] of aisleData.entries()) {
      const sortedRows = new Map([...rows.entries()].sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true })));
      for (const [row, bins] of sortedRows.entries()) {
        bins.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
      }
      aisleData.set(aisle, sortedRows);
    }

    // Sort the aisles themselves
    return new Map([...aisleData.entries()].sort());
  }, [locations, locationFormat]);

  const handleGenerateLocations = async ({ aisle, rows, bins }) => {
    const toLetter = (num) => String.fromCharCode(64 + num);
    const locations = [];

    for (let r = 1; r <= rows; r++) {
      for (let b = 1; b <= bins; b++) {
        const aislePart = aisle;
        const rowPart = locationFormat.row?.type === 'Letter' 
          ? toLetter(r) 
          : String(r).padStart(locationFormat.row?.padding?.length || 0, '0');
        const binPart = locationFormat.bin?.type === 'Letter' 
          ? toLetter(b) 
          : String(b).padStart(locationFormat.bin?.padding?.length || 0, '0');
        
        const locationName = `${aislePart}${locationFormat.separator1 || ''}${rowPart}${locationFormat.separator2 || ''}${binPart}`;
        
        locations.push(locationName);
      }
    }

    try {
      await api.addBulkLocations(locations);
      alert(`${locations.length} locations processed successfully!`);
      fetchData(); // Re-fetch all data after generating new ones
    } catch (error) {
      console.error("Failed to save locations:", error);
      alert("Failed to save locations. Please check the console for details.");
    }
  };

  const handleSaveFormat = async (newFormat) => {
    try {
      await api.updateLocationFormat({ format: newFormat });
      setLocationFormat(newFormat);
      setIsFormatModalOpen(false); // Correctly close the modal using state
      alert("Location format saved!");
    } catch (error) {
      console.error("Failed to save location format:", error);
      alert("Failed to save format.");
    }
  };

  const handleLocationClick = (location) => {
    setSelectedLocation(location);
    setIsDetailModalOpen(true);
  };

  const handleSaveLocationSettings = async (locationId, settings) => {
    try {
      await api.updateLocation(locationId, settings);
      // Optimistically update the local state
      setLocations(prev => prev.map(loc => loc.id === locationId ? { ...loc, ...settings } : loc));
      setIsDetailModalOpen(false);
    } catch (error) {
      alert("Failed to save location settings.");
    }
  };

  const handleQuickSetCapacity = async () => {
    if (!window.confirm("This will set the capacity of all locations in rows A and B to 2 pallets. Are you sure?")) {
      return;
    }

    const locationIdsToUpdate = [];
    const sep1 = locationFormat.separator1 || '';
    const sep2 = locationFormat.separator2 || '';

    // Build a regex to parse location names based on the current format
    const aisleRegex = locationFormat.aisle?.type === 'Letter' ? `([A-Z]+)` : `(\\d+)`;
    const rowRegex = locationFormat.row?.type === 'Letter' ? `([A-Z]+)` : `(\\d+)`;
    const binRegex = locationFormat.bin?.type === 'Letter' ? `([A-Z]+)` : `(\\d+)`;
    const fullRegex = new RegExp(`^${aisleRegex}${sep1}${rowRegex}${sep2}${binRegex}$`);

    locations.forEach(loc => {
      const parts = loc.name.match(fullRegex);
      if (parts) {
        const [, aisle, row, bin] = parts;
        if (row === 'A' || row === 'B') {
          locationIdsToUpdate.push(loc.id);
        }
      }
    });

    if (locationIdsToUpdate.length === 0) {
      alert("No locations found in rows A or B with the current format.");
      return;
    }

    try {
      await api.updateBulkLocationCapacity(locationIdsToUpdate, 2);
      alert(`Successfully updated ${locationIdsToUpdate.length} locations to a capacity of 2.`);
      fetchData(); // Refresh the view
    } catch (error) {
      alert("Failed to update location capacities.");
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium text-white">Warehouse Layout Visualizer</h3>
            <p className="text-sm text-gray-400">Design and view your warehouse layout.</p>
          </div>
          <div className="flex space-x-3">
            <button onClick={() => setIsFormatModalOpen(true)} className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500">
              <Settings size={18} className="mr-2" /> Layout Settings
            </button>
            <button onClick={handleQuickSetCapacity} className="flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700">
              <Zap size={18} className="mr-2" /> Set A/B Row Capacity
            </button>
            <button onClick={() => setIsGenerateModalOpen(true)} className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
              <Plus size={18} className="mr-2" /> Generate Locations
            </button>
          </div>
        </div>
        <div className="border-t border-gray-700 pt-6">
          <div className="bg-gray-900/50 rounded-lg p-4">
            {loading ? (
              <div className="flex justify-center items-center h-48 text-indigo-400">
                <Loader className="animate-spin mr-2" /> Loading Locations...
              </div>
            ) : (
              <div className="flex flex-wrap gap-8">
                {Array.from(locationsByAisle.entries()).map(([aisle, rows]) => (
                  <div key={aisle} className="p-3 bg-gray-800/50 rounded-lg">
                    <h4 className="text-lg font-bold text-center text-white mb-3">Aisle {aisle}</h4>
                    <div className="flex flex-col-reverse gap-1">
                      {Array.from(rows.entries()).map(([row, bins]) => (
                        <div key={row} className="flex gap-1">
                          {bins.map(loc => {
                            const palletsInLocation = occupiedLocations.get(loc.name.toUpperCase()) || [];
                            const palletCount = palletsInLocation.length;
                            const capacity = loc.capacity || 1;
                            const isEnabled = loc.enabled !== 0;
                            
                            let bgColor = 'bg-blue-800/80'; // Empty
                            let title = `Location: ${loc.name}\nStatus: Empty`;

                            if (!isEnabled) {
                              bgColor = 'bg-gray-700/50'; // Disabled
                              title = `Location: ${loc.name}\nStatus: Disabled`;
                            } else if (palletCount > 0) {
                              if (palletCount > capacity) bgColor = 'bg-red-800/80'; // Over Capacity
                              else if (palletCount === capacity) bgColor = 'bg-green-800/80'; // At Capacity
                              else bgColor = 'bg-yellow-800/80'; // Partially Full

                              const palletDetails = palletsInLocation.map(p => ` - ${p.stockNumber}`).join('\n');
                              title = `Location: ${loc.name} (${palletCount}/${capacity})\nPallets:\n${palletDetails}`;
                            }

                            return <div 
                              key={loc.id} 
                              title={title} 
                              onClick={() => handleLocationClick(loc)} 
                              className={`w-4 h-4 rounded-sm cursor-pointer ${bgColor}`} 
                            />;
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <BulkGenerateLocationsModal isOpen={isGenerateModalOpen} onClose={() => setIsGenerateModalOpen(false)} onGenerate={handleGenerateLocations} />
      <LocationFormatModal isOpen={isFormatModalOpen} onClose={() => setIsFormatModalOpen(false)} onSave={handleSaveFormat} currentFormat={locationFormat} />
      <LocationDetailModal 
        isOpen={isDetailModalOpen} 
        onClose={() => setIsDetailModalOpen(false)} 
        location={selectedLocation}
        pallets={selectedLocation ? occupiedLocations.get(selectedLocation.name.toUpperCase()) || [] : []}
        onSaveSettings={handleSaveLocationSettings}
      />
    </>
  );
};

export default WarehouseVisualizer;