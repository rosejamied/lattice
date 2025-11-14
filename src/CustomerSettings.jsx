import React, { useState, useEffect } from 'react';
import { Building, Plus, Loader, Edit, Trash } from 'lucide-react';
import * as api from './api.jsx';
import AddCustomerModal from './AddCustomerModal';
import EditCustomerModal from './EditCustomerModal';

const CustomerSettings = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState(null);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoading(true);
        const data = await api.getCustomers();
        setCustomers(data);
        setError(null);
      } catch (err) {
        setError("Failed to load customers.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCustomers();
  }, []);

  const handleAddCustomer = async (customerData) => {
    try {
      const newCustomer = await api.addCustomer(customerData);
      setCustomers(prev => [...prev, newCustomer].sort((a, b) => a.name.localeCompare(b.name)));
    } catch (err) {
      setError("Failed to add customer. Please try again.");
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleOpenEditModal = (customer) => {
    setCustomerToEdit(customer);
    setIsEditModalOpen(true);
  };

  const handleUpdateCustomer = async (id, customerDetails, associatedSupplierIds, associatedHaulierIds) => {
    try {
      await Promise.all([
        api.updateCustomer(id, customerDetails),
        api.updateCustomerSuppliers(id, associatedSupplierIds),
        api.updateCustomerHauliers(id, associatedHaulierIds),
      ]);
      // Refetch customers to see name/status changes
      const data = await api.getCustomers();
      setCustomers(data);
    } catch (err) {
      setError("Failed to update customer suppliers. Please try again.");
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleDeleteCustomer = async (id, name) => {
    if (window.confirm(`Are you sure you want to permanently delete customer "${name}"? This will also delete all associated contracts and bookings.`)) {
      await api.deleteCustomer(id);
      setCustomers(prev => prev.filter(c => c.id !== id));
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium text-white">Customer Management</h3>
            <p className="text-sm text-gray-400">Add, edit, and archive customer accounts.</p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <Plus size={18} className="mr-2" />
            Add Customer
          </button>
        </div>
        <div className="border-t border-gray-700 pt-6">
          {loading && <div className="flex justify-center items-center"><Loader className="animate-spin" /> <span className="ml-2">Loading customers...</span></div>}
          {error && <p className="text-center text-red-400">{error}</p>}
          {!loading && !error && customers.length === 0 && (
            <div className="text-center text-gray-400">No customers found. Click "Add Customer" to begin.</div>
          )}
          {!loading && customers.length > 0 && (
            <div className="overflow-x-auto bg-gray-900/50 rounded-lg">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-700/50">
                  <tr>
                    {['Customer Name', 'Status', 'Date Added', 'Actions'].map(header => (
                      <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {customers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{customer.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${customer.status === 'Active' ? 'bg-green-900 text-green-300' : 'bg-gray-600 text-gray-300'}`}>{customer.status}</span></td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{new Date(customer.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button onClick={() => handleOpenEditModal(customer)} className="text-indigo-400 hover:text-indigo-300 p-1 rounded-full hover:bg-gray-600 transition-colors mr-2" title="Edit Customer">
                          <Edit className="w-5 h-5" />
                        </button>
                        <button onClick={() => handleDeleteCustomer(customer.id, customer.name)} className="text-red-400 hover:text-red-300 p-1 rounded-full hover:bg-gray-600 transition-colors" title="Delete Customer">
                          <Trash className="w-5 h-5" />
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
      <AddCustomerModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onAddCustomer={handleAddCustomer} />
      <EditCustomerModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} onUpdate={handleUpdateCustomer} customer={customerToEdit} />
    </>
  );
};

export default CustomerSettings;