import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const EditSupplierModal = ({ isOpen, onClose, onUpdateSupplier, supplier }) => {
  const [name, setName] = useState('');
  const [status, setStatus] = useState('Active');

  useEffect(() => {
    if (supplier) {
      setName(supplier.name);
      setStatus(supplier.status);
    }
  }, [supplier]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Supplier name cannot be empty.');
      return;
    }
    onUpdateSupplier(supplier.id, { name, status });
    onClose();
  };

  if (!isOpen || !supplier) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
      <div className="bg-gray-800 rounded-xl shadow-2xl p-8 w-full max-w-md m-4 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
          <X size={24} />
        </button>
        <h2 className="text-2xl font-bold text-white mb-6">Edit Supplier</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1" htmlFor="supplierName">Supplier Name</label>
            <input
              id="supplierName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 rounded-lg bg-gray-900 text-gray-100 border border-gray-600 focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1" htmlFor="supplierStatus">Status</label>
            <select
              id="supplierStatus"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full p-2 rounded-lg bg-gray-900 text-gray-100 border border-gray-600 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option>Active</option>
              <option>Archived</option>
            </select>
          </div>
          <div className="flex justify-end pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-300 hover:text-white">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Update Supplier</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditSupplierModal;