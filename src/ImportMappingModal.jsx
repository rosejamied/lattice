import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';

const STAGES = {
  inventory: {
    title: 'Inventory Details',
    fields: ['customerName', 'stockNumber', 'description', 'quantity', 'location'],
  },
  orders: {
    title: 'Order Details',
    fields: ['inboundOrderNumber', 'inboundDate', 'inboundReference', 'orderDate', 'timeBooked', 'bookingReference', 'notes'],
  },
  costing: {
    title: 'Costing Details',
    fields: ['storageCostPerWeek', 'rhdIn', 'rhdOut'],
  },
};

const STAGE_KEYS = Object.keys(STAGES);

const ImportMappingModal = ({ isOpen, onClose, onConfirm, csvHeaders, initialMappings, savedMaps, onSaveMap }) => {
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [mappings, setMappings] = useState({});
  const [newMapName, setNewMapName] = useState('');
  const [selectedMap, setSelectedMap] = useState('');

  useEffect(() => {
    // Reset state when modal opens or initialMappings change
    if (isOpen) {
      setCurrentStageIndex(0);
      // If initialMappings are provided, use them. Otherwise, initialize to empty.
      if (initialMappings && Object.keys(initialMappings).length > 0) {
        setMappings(initialMappings);
      } else {
        const allFields = STAGE_KEYS.flatMap(key => STAGES[key].fields);
        setMappings(allFields.reduce((acc, field) => ({ ...acc, [field]: '' }), {}));
      }
      setNewMapName('');
      setSelectedMap('');
    }
  }, [isOpen, initialMappings]);

  const handleMappingChange = (appField, csvHeader) => {
    setMappings(prev => ({ ...prev, [appField]: csvHeader }));
  };

  const handleSubmit = () => {
    onConfirm(mappings);
    onClose();
  };

  const handleSaveMap = () => {
    if (!newMapName.trim()) {
      alert('Please enter a name for the map.');
      return;
    }
    onSaveMap({ name: newMapName, mappings });
    alert(`Map "${newMapName}" saved!`);
  };

  const handleLoadMap = (e) => {
    const mapName = e.target.value;
    const mapToLoad = savedMaps.find(m => m.name === mapName);
    if (mapToLoad) setMappings(mapToLoad.mappings);
  };
  const currentStageKey = STAGE_KEYS[currentStageIndex];
  const currentStage = STAGES[currentStageKey];
  const isLastStage = currentStageIndex === STAGE_KEYS.length - 1;

  // Check if all fields in the *current* stage are mapped
  const isCurrentStageMappingComplete = currentStage.fields.every(field => mappings[field]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
      <div className="bg-gray-800 rounded-xl shadow-2xl p-8 w-full max-w-2xl m-4 relative flex flex-col max-h-[90vh]">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
          <X size={24} />
        </button>
        <h2 className="text-2xl font-bold text-white mb-2">Map Spreadsheet Columns</h2>
        <p className="text-gray-400 mb-6">
          Stage {currentStageIndex + 1} of {STAGE_KEYS.length}: <span className="font-semibold text-white">{currentStage.title}</span>
        </p>

        {/* --- Save/Load Map Section --- */}
        <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700 space-y-3">
          <h4 className="text-md font-semibold text-gray-300">Saved Maps</h4>
          <div className="grid grid-cols-2 gap-4">
            <select onChange={handleLoadMap} value={selectedMap} className="w-full p-2 rounded-lg bg-gray-700 text-gray-100 border border-gray-600 focus:ring-indigo-500 focus:border-indigo-500">
              <option value="" disabled>-- Load a Saved Map --</option>
              {savedMaps.map(map => (
                <option key={map.name} value={map.name}>{map.name}</option>
              ))}
            </select>
            <div className="flex">
              <input
                type="text"
                value={newMapName}
                onChange={(e) => setNewMapName(e.target.value)}
                placeholder="New map name..."
                className="flex-grow p-2 text-sm rounded-l-lg bg-gray-700 text-gray-100 border border-gray-600 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <button type="button" onClick={handleSaveMap} className="flex items-center p-2 bg-indigo-600 text-white rounded-r-lg hover:bg-indigo-700" title="Save Current Map">
                <Save size={16} className="mr-1" /> Save
              </button>
            </div>
          </div>
        </div>
        <div className="overflow-y-auto space-y-4 pr-4 flex-grow">
          {currentStage.fields.map(field => (
            <div key={field} className="grid grid-cols-2 items-center gap-4 p-3 bg-gray-900/50 rounded-lg">
              <div className="font-medium text-gray-200">
                <span className="capitalize">{field.replace(/([A-Z])/g, ' $1')}</span>
              </div>
              <select
                value={mappings[field]}
                onChange={(e) => handleMappingChange(field, e.target.value)}
                className="w-full p-2 rounded-lg bg-gray-700 text-gray-100 border border-gray-600 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="" disabled>-- Select a CSV Column --</option>
                {Array.isArray(csvHeaders) && csvHeaders.map(header => (
                  <option key={header} value={header}>{header}</option>
                ))}
              </select>
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-8 mt-4 border-t border-gray-700">
          <button type="button" onClick={onClose} className="px-4 py-2 text-gray-300 hover:text-white">
            Cancel
          </button>
          {currentStageIndex > 0 && (
            <button type="button" onClick={() => setCurrentStageIndex(prev => prev - 1)} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500">
              Back
            </button>
          )}
          {isLastStage ? (
            <button type="button" onClick={handleSubmit} disabled={!isCurrentStageMappingComplete} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400/50 disabled:cursor-not-allowed">
              Confirm Import
            </button>
          ) : (
            <button type="button" onClick={() => setCurrentStageIndex(prev => prev + 1)} disabled={!isCurrentStageMappingComplete} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400/50 disabled:cursor-not-allowed">
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportMappingModal;