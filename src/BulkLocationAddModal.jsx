import React, { useState } from 'react';
import { X, Save } from 'lucide-react';

const BulkLocationAddModal = ({ isOpen, onClose, onSave }) => {
  const [locationText, setLocationText] = useState('');

  const handleSave = () => {
    // Split by new lines, trim whitespace, and filter out empty lines
    const locations = locationText
      .split('\n')
      .map(loc => loc.trim())
      .filter(loc => loc !== '');
    
    if (locations.length > 0) {
      onSave(locations);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl shadow-2xl p-8 w-full max-w-md m-4 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
          <X size={24} />
        </button>
        <h2 className="text-2xl font-bold text-white mb-4">Bulk Add Locations</h2>
        <p className="text-sm text-gray-400 mb-6">
          Enter one location name per line. Duplicates will be ignored.
        </p>
        <textarea
          value={locationText}
          onChange={(e) => setLocationText(e.target.value)}
          className="w-full h-48 p-3 rounded-lg bg-gray-900 text-gray-100 border border-gray-600 focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="A-01-A&#10;A-01-B&#10;A-01-C"
          autoFocus
        />
        <div className="flex justify-end space-x-3 pt-6">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 font-medium">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
          >
            <Save size={16} className="mr-2" /> Save Locations
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkLocationAddModal;