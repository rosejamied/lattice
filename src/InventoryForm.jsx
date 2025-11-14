import React, { useState, useEffect } from 'react';
import { Edit, X, Zap } from 'lucide-react'; // X is now used for the modal close button

// Add/Edit Form View
const InventoryForm = ({ isOpen, onClose, itemToEdit, onSave }) => { // Added isOpen and onClose props
  const [formData, setFormData] = useState({
    stockNumber: '',
    inboundOrderNumber: '',
    description: '',
    quantity: 0,
    location: '',
    status: 'In Stock',
    inboundDate: new Date().toISOString().split('T')[0], // Default to today
    inboundReference: '',
    storageCostPerWeek: 0,
    rhdIn: 0,
    rhdOut: 0,
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    if (itemToEdit) {
      setFormData({
        stockNumber: itemToEdit.stockNumber || '',
        inboundOrderNumber: itemToEdit.inboundOrderNumber || '',
        description: itemToEdit.description || '',
        quantity: itemToEdit.quantity || 0,
        location: itemToEdit.location || '',
        status: itemToEdit.status || 'In Stock',
        inboundDate: itemToEdit.inboundDate ? (() => {
          const d = new Date(itemToEdit.inboundDate);
          const year = d.getFullYear();
          const month = (d.getMonth() + 1).toString().padStart(2, '0');
          const day = d.getDate().toString().padStart(2, '0');
          return `${year}-${month}-${day}`;
        })() : (() => { // Default to today's date in YYYY-MM-DD local format
          const today = new Date();
          const year = today.getFullYear();
          const month = (today.getMonth() + 1).toString().padStart(2, '0');
          const day = today.getDate().toString().padStart(2, '0');
          return `${year}-${month}-${day}`;
        })(),
        inboundReference: itemToEdit.inboundReference || '',
        storageCostPerWeek: itemToEdit.storageCostPerWeek || 0,
        rhdIn: itemToEdit.rhdIn || 0,
        rhdOut: itemToEdit.rhdOut || 0,
      });
    } else {
      // Reset for new item
      setFormData({ stockNumber: '', inboundOrderNumber: '', description: '', quantity: 0, location: 'A-01', status: 'In Stock', inboundDate: new Date().toISOString().split('T')[0], inboundReference: '', storageCostPerWeek: 0, rhdIn: 0, rhdOut: 0 });
    }
    setError(null);
  }, [itemToEdit]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 0 : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.stockNumber || !formData.description || !formData.inboundReference) {
      setError("Stock Number, Description, and Inbound Reference are required.");
      return;
    }
    onSave(itemToEdit ? { ...itemToEdit, ...formData } : formData); // onSave will also close the modal
  };

  const formTitle = itemToEdit ? `Edit Pallet: ${itemToEdit.description}` : 'Add New Pallet';  

  const InputField = ({ label, name, type = 'text', step = null }) => (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-300 mb-1">
        {label}
      </label>
      <div className="relative">
        {(name.toLowerCase().includes('cost') || name.toLowerCase().includes('rhd')) && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <span className="text-gray-400 sm:text-sm">£</span>
          </div>
        )}
        <input
          type={type}
          id={name}
          name={name}
          value={formData[name]}
          onChange={handleChange}
          step={step}
          className={`w-full p-3 rounded-xl bg-gray-800 text-gray-100 border border-gray-700 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
            (name.toLowerCase().includes('cost') || name.toLowerCase().includes('rhd')) ? 'pl-7' : ''
          }`}
          required
        />
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl shadow-2xl p-8 w-full max-w-lg m-4 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
          <X size={24} />
        </button>
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
          <Edit className="w-6 h-6 mr-2 text-indigo-400" />
          {formTitle}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="p-3 text-sm text-red-400 bg-red-900/50 rounded-lg">{error}</div>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField label="Stock Number" name="stockNumber" />
            <InputField label="Inbound Reference" name="inboundReference" />
          </div>
          <InputField label="Description" name="description" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField label="Quantity" name="quantity" type="number" />
            <InputField label="Location" name="location" />
          </div>
          <InputField label="Inbound Date" name="inboundDate" type="date" />
          <InputField label="Inbound Order Number" name="inboundOrderNumber" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <InputField label="Storage Cost/Week" name="storageCostPerWeek" type="number" step="0.01" />
            <InputField label="RHD In" name="rhdIn" type="number" step="0.01" />
            <InputField label="RHD Out" name="rhdOut" type="number" step="0.01" />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={onClose} className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors font-medium">
              <X className="w-5 h-5 mr-1" /> Cancel
            </button>
            <button type="submit" className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors font-medium shadow-md shadow-indigo-500/50">
              <Zap className="w-5 h-5 mr-1" /> {itemToEdit ? 'Update Pallet' : 'Add Pallet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InventoryForm;