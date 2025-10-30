import React, { useState } from 'react';
import { X } from 'lucide-react';

const REQUIRED_FIELDS = [
  'stockNumber',
  'inboundOrderNumber',
  'description',
  'quantity',
  'location',
  'status',
  'inboundDate',
  'inboundReference',
  'storageCostPerWeek',
  'rhdIn',
  'rhdOut'];

const ImportMappingModal = ({ isOpen, onClose, onConfirm, csvHeaders }) => {
  const [mappings, setMappings] = useState(
    REQUIRED_FIELDS.reduce((acc, field) => ({ ...acc, [field]: '' }), {})
  );

  const handleMappingChange = (appField, csvHeader) => {
    setMappings(prev => ({ ...prev, [appField]: csvHeader }));
  };

  const handleSubmit = () => {
    onConfirm(mappings);
    onClose();
  };

  const isMappingComplete = REQUIRED_FIELDS.every(field => mappings[field]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
      <div className="bg-gray-800 rounded-xl shadow-2xl p-8 w-full max-w-2xl m-4 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
          <X size={24} />
        </button>
        <h2 className="text-2xl font-bold text-white mb-2">Map CSV Columns</h2>
        <p className="text-gray-400 mb-6">Match your CSV columns to the required inventory fields.</p>

        <div className="space-y-4">
          {REQUIRED_FIELDS.map(field => (
            <div key={field} className="grid grid-cols-2 items-center gap-4 p-3 bg-gray-900/50 rounded-lg">
              <div className="font-medium text-gray-200">
                <span className="capitalize">{field}</span>
                <span className="text-red-400 ml-1">*</span>
              </div>
              <select
                value={mappings[field]}
                onChange={(e) => handleMappingChange(field, e.target.value)}
                className="w-full p-2 rounded-lg bg-gray-700 text-gray-100 border border-gray-600 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="" disabled>-- Select a CSV Column --</option>
                {csvHeaders.map(header => (
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
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isMappingComplete}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400/50 disabled:cursor-not-allowed"
          >
            Confirm Import
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportMappingModal;