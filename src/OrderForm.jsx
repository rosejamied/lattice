import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';

const OrderForm = ({ isOpen, onClose, onSave, orderToEdit, customers }) => {
  const [formData, setFormData] = useState({
    orderNumber: '',
    customer_id: '',
    status: 'Pending',
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    if (orderToEdit) {
      setFormData({
        orderNumber: orderToEdit.orderNumber || '',
        customer_id: orderToEdit.customer_id || '',
        status: orderToEdit.status || 'Pending',
      });
    } else {
      // Reset form for new order
      setFormData({
        orderNumber: '',
        customer_id: '',
        status: 'Pending',
      });
    }
    setError(null);
  }, [orderToEdit, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.orderNumber || !formData.customer_id) {
      setError("Order Number and Customer are required.");
      return;
    }
    onSave(orderToEdit ? { ...orderToEdit, ...formData } : formData);
  };

  const orderStatuses = ['Pending', 'Processing', 'Shipped', 'Completed', 'Cancelled'];

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <form onSubmit={handleSubmit} className="bg-gray-800 w-full max-w-lg p-6 rounded-xl space-y-6 border border-indigo-700 shadow-2xl">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold text-white">{orderToEdit ? 'Edit Order' : 'Create New Order'}</h3>
          <button type="button" onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-700"><X size={20} /></button>
        </div>

        {error && <div className="p-3 text-sm text-red-400 bg-red-900/50 rounded-lg">{error}</div>}

        <div>
          <label htmlFor="orderNumber" className="block text-sm font-medium text-gray-300 mb-1">Order Number</label>
          <input
            type="text" id="orderNumber" name="orderNumber" value={formData.orderNumber} onChange={handleChange}
            className="w-full p-2 rounded-lg bg-gray-900 text-gray-100 border border-gray-600 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="e.g., SO-1001"
            required
          />
        </div>

        <div>
          <label htmlFor="customer_id" className="block text-sm font-medium text-gray-300 mb-1">Customer</label>
          <select id="customer_id" name="customer_id" value={formData.customer_id} onChange={handleChange} required className="w-full p-2 rounded-lg bg-gray-900 text-gray-100 border border-gray-600 focus:ring-indigo-500 focus:border-indigo-500">
            <option value="">-- Select a Customer --</option>
            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-300 mb-1">Status</label>
          <select id="status" name="status" value={formData.status} onChange={handleChange} required className="w-full p-2 rounded-lg bg-gray-900 text-gray-100 border border-gray-600 focus:ring-indigo-500 focus:border-indigo-500">
            {orderStatuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 font-medium">Cancel</button>
          <button type="submit" className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 font-medium shadow-md shadow-indigo-500/50">
            <Save className="w-4 h-4 mr-2" /> {orderToEdit ? 'Save Changes' : 'Create Order'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default OrderForm;