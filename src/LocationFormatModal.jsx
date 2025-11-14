import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';

const defaultFormat = {
  aisle: { type: 'Letter', padding: '' },
  separator1: '-',
  row: { type: 'Number', padding: '00' },
  separator2: '-',
  bin: { type: 'Number', padding: '00' },
};

const LocationFormatModal = ({ isOpen, onClose, onSave, currentFormat }) => {
  const [format, setFormat] = useState(defaultFormat);

  useEffect(() => {
    // If the saved format is an object, use it. Otherwise, stick to the default.
    if (typeof currentFormat === 'object' && currentFormat !== null) {
      setFormat(currentFormat);
    } else {
      setFormat(defaultFormat);
    }
  }, [currentFormat]);

  const handleSave = () => {
    onSave(format);
  };

  const handlePartChange = (part, key, value) => {
    setFormat(prev => ({
      ...prev,
      [part]: { ...prev[part], [key]: value }
    }));
  };

  const handleSeparatorChange = (sep, value) => {
    setFormat(prev => ({ ...prev, [sep]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl shadow-2xl p-8 w-full max-w-2xl m-4 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
          <X size={24} />
        </button>
        <h2 className="text-2xl font-bold text-white mb-4">Location Format Settings</h2>
        <p className="text-sm text-gray-400 mb-6">
          Define the naming convention for your locations.
        </p>
        
        <div className="flex items-end space-x-2">
          {/* Aisle */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-300 mb-1">Aisle</label>
            <select value={format.aisle.type} onChange={e => handlePartChange('aisle', 'type', e.target.value)} className="w-full p-2 rounded-lg bg-gray-900 border-gray-600">
              <option>Letter</option>
              <option>Number</option>
            </select>
          </div>

          {/* Separator 1 */}
          <div className="w-16">
            <label className="block text-sm font-medium text-gray-300 mb-1">Sep.</label>
            <input value={format.separator1} onChange={e => handleSeparatorChange('separator1', e.target.value)} className="w-full p-2 rounded-lg bg-gray-900 border-gray-600 text-center" />
          </div>

          {/* Row */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-300 mb-1">Row</label>
            <select value={format.row.type} onChange={e => handlePartChange('row', 'type', e.target.value)} className="w-full p-2 rounded-lg bg-gray-900 border-gray-600">
              <option>Number</option>
              <option>Letter</option>
            </select>
          </div>
          <div className="w-24">
            <label className="block text-sm font-medium text-gray-300 mb-1">Padding</label>
            <input value={format.row.padding} onChange={e => handlePartChange('row', 'padding', e.target.value)} placeholder="e.g. 00" className="w-full p-2 rounded-lg bg-gray-900 border-gray-600 text-center" />
          </div>

          {/* Separator 2 */}
          <div className="w-16">
            <label className="block text-sm font-medium text-gray-300 mb-1">Sep.</label>
            <input value={format.separator2} onChange={e => handleSeparatorChange('separator2', e.target.value)} className="w-full p-2 rounded-lg bg-gray-900 border-gray-600 text-center" />
          </div>

          {/* Bin */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-300 mb-1">Bin</label>
            <select value={format.bin.type} onChange={e => handlePartChange('bin', 'type', e.target.value)} className="w-full p-2 rounded-lg bg-gray-900 border-gray-600">
              <option>Number</option>
              <option>Letter</option>
            </select>
          </div>
          <div className="w-24">
            <label className="block text-sm font-medium text-gray-300 mb-1">Padding</label>
            <input value={format.bin.padding} onChange={e => handlePartChange('bin', 'padding', e.target.value)} placeholder="e.g. 00" className="w-full p-2 rounded-lg bg-gray-900 border-gray-600 text-center" />
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-6">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 font-medium">Cancel</button>
          <button type="button" onClick={handleSave} className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium" >
            <Save size={16} className="mr-2" /> Save Format
          </button>
        </div>
      </div>
    </div>
  );
};

export default LocationFormatModal;