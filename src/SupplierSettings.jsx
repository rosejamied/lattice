import React, { useState, useEffect } from 'react';
import { Factory, Plus, Loader, Archive, Edit } from 'lucide-react';
import * as api from './api.jsx';
import AddSupplierModal from './AddSupplierModal';
import EditSupplierModal from './EditSupplierModal';

const SupplierSettings = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [supplierToEdit, setSupplierToEdit] = useState(null);

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        setLoading(true);
        const data = await api.getSuppliers();
        setSuppliers(data);
        setError(null);
      } catch (err) {
        setError("Failed to load suppliers.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSuppliers();
  }, []);

  const handleAddSupplier = async (supplierData) => {
    try {
      const newSupplier = await api.addSupplier(supplierData);
      setSuppliers(prev => [...prev, newSupplier].sort((a, b) => a.name.localeCompare(b.name)));
    } catch (err) {
      setError("Failed to add supplier. Please try again.");
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleOpenEditModal = (supplier) => {
    setSupplierToEdit(supplier);
    setIsEditModalOpen(true);
  };

  const handleUpdateSupplier = async (id, supplierData) => {
    try {
      await api.updateSupplier(id, supplierData);
      setSuppliers(prev => prev.map(s => s.id === id ? { ...s, ...supplierData } : s));
    } catch (err) {
      setError("Failed to update supplier. Please try again.");
      setTimeout(() => setError(null), 5000);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium text-white">Supplier Management</h3>
            <p className="text-sm text-gray-400">Add, edit, and archive suppliers.</p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <Plus size={18} className="mr-2" />
            Add Supplier
          </button>
        </div>
        <div className="border-t border-gray-700 pt-6">
          {loading && <div className="flex justify-center items-center"><Loader className="animate-spin" /> <span className="ml-2">Loading suppliers...</span></div>}
          {error && <p className="text-center text-red-400">{error}</p>}
          {!loading && !error && suppliers.length === 0 && (
            <div className="text-center text-gray-400">No suppliers found. Click "Add Supplier" to begin.</div>
          )}
          {!loading && suppliers.length > 0 && (
            <div className="overflow-x-auto bg-gray-900/50 rounded-lg">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-700/50">
                  <tr>
                    {['Supplier Name', 'Status', 'Date Added', 'Actions'].map(header => (
                      <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {suppliers.map((supplier) => (
                    <tr key={supplier.id} className="hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{supplier.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${supplier.status === 'Active' ? 'bg-green-900 text-green-300' : 'bg-gray-600 text-gray-300'}`}>{supplier.status}</span></td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{new Date(supplier.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button onClick={() => handleOpenEditModal(supplier)} className="text-indigo-400 hover:text-indigo-300 p-1 rounded-full hover:bg-gray-600 transition-colors mr-2" title="Edit Supplier">
                          <Edit className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      <AddSupplierModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onAddSupplier={handleAddSupplier} />
      <EditSupplierModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} onUpdateSupplier={handleUpdateSupplier} supplier={supplierToEdit} />
    </>
  );
};

export default SupplierSettings;