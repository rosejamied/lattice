import React, { useState } from 'react';
import { X, Zap } from 'lucide-react';

const BulkGenerateLocationsModal = ({ isOpen, onClose, onGenerate }) => {
  const [aisle, setAisle] = useState('');
  const [rows, setRows] = useState(1);
  const [bins, setBins] = useState(1);

  const handleGenerate = () => {
    if (!aisle.trim() || rows < 1 || bins < 1) {
      alert('Please fill in all fields with valid values.');
      return;
    }
    onGenerate({
      aisle: aisle.trim().toUpperCase(),
      rows: parseInt(rows, 10),
      bins: parseInt(bins, 10),
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl shadow-2xl p-8 w-full max-w-md m-4 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
          <X size={24} />
        </button>
        <h2 className="text-2xl font-bold text-white mb-4">Generate Locations</h2>
        <p className="text-sm text-gray-400 mb-6">
          Create a set of locations for a single aisle.
        </p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Aisle Letter/Identifier</label>
            <input
              value={aisle}
              onChange={(e) => setAisle(e.target.value)}
              className="w-full p-3 rounded-lg bg-gray-900 text-gray-100 border border-gray-600 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="e.g., A"
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Number of Rows</label>
              <input
                type="number"
                value={rows}
                onChange={(e) => setRows(e.target.value)}
                min="1"
                className="w-full p-3 rounded-lg bg-gray-900 text-gray-100 border border-gray-600 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Number of Bins per Row</label>
              <input
                type="number"
                value={bins}
                onChange={(e) => setBins(e.target.value)}
                min="1"
                className="w-full p-3 rounded-lg bg-gray-900 text-gray-100 border border-gray-600 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end space-x-3 pt-6">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 font-medium">Cancel</button>
          <button type="button" onClick={handleGenerate} className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">
            <Zap size={16} className="mr-2" /> Generate & Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkGenerateLocationsModal;