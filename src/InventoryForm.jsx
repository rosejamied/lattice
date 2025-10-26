import React, { useState, useEffect } from 'react';
import { Edit, X, Zap } from 'lucide-react';

// Add/Edit Form View
const InventoryForm = ({ itemToEdit, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    quantity: 0,
    location: '',
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    if (itemToEdit) {
      setFormData({
        name: itemToEdit.name || '',
        sku: itemToEdit.sku || '',
        quantity: itemToEdit.quantity || 0,
        location: itemToEdit.location || '',
      });
    } else {
      setFormData({ name: '', sku: '', quantity: 0, location: 'A-01' });
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
    if (!formData.name || !formData.sku || formData.quantity < 0 || !formData.location) {
      setError("All fields are required and quantity must be non-negative.");
      return;
    }
    onSave(itemToEdit ? { ...itemToEdit, ...formData } : formData);
  };

  const formTitle = itemToEdit ? `Edit Pallet: ${itemToEdit.name}` : 'Add New Pallet';

  const InputField = ({ label, name, type = 'text', min = null }) => (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-300 mb-1">
        {label}
      </label>
      <input
        type={type}
        id={name}
        name={name}
        value={formData[name]}
        onChange={handleChange}
        min={min}
        className="w-full p-3 rounded-xl bg-gray-800 text-gray-100 border border-gray-700 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
        required
      />
    </div>
  );

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-3xl font-bold text-white flex items-center">
        <Edit className="w-6 h-6 mr-2 text-indigo-400" />
        {formTitle}
      </h1>

      <form onSubmit={handleSubmit} className="bg-gray-800 p-6 rounded-xl shadow-lg space-y-4 max-w-lg mx-auto">
        {error && <div className="p-3 text-sm text-red-400 bg-red-900/50 rounded-lg">{error}</div>}

        <InputField label="Pallet Name/Contents" name="name" />
        <InputField label="Pallet SKU / Identifier" name="sku" />
        <InputField label="Location (e.g., A-01, B-Shelf)" name="location" />
        <InputField label="Quantity (Pallets)" name="quantity" type="number" min="0" />

        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors font-medium"
          >
            <X className="w-5 h-5 mr-1" /> Cancel
          </button>
          <button
            type="submit"
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors font-medium shadow-md shadow-indigo-500/50"
          >
            <Zap className="w-5 h-5 mr-1" /> {itemToEdit ? 'Update Pallet' : 'Add Pallet'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default InventoryForm;