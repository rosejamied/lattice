import React, { useState, useEffect } from 'react';
import { Building, Plus, Loader, Edit, Archive } from 'lucide-react';
import * as api from './api.jsx';
import AddCustomerModal from './AddCustomerModal';

const CustomerSettings = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium text-white">Customer Management</h3>
            <p className="text-sm text-gray-400">Add, edit, and archive customer accounts.</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
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
                        <button className="text-yellow-400 hover:text-yellow-300 p-1 rounded-full hover:bg-gray-600 transition-colors" title="Archive Customer (coming soon)"><Archive className="w-5 h-5" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      <AddCustomerModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAddCustomer={handleAddCustomer} />
    </>
  );
};

export default CustomerSettings;