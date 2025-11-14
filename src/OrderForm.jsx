import React, { useState, useEffect } from 'react';
import { X, Save, Edit, Loader, Package } from 'lucide-react';
import * as api from './api.jsx';

const DetailRow = ({ label, value }) => (
  <div className="flex justify-between items-center py-2 border-b border-gray-700">
    <p className="text-sm text-gray-400">{label}</p>
    <p className="text-sm font-medium text-white text-right">{value}</p>
  </div>
);

const OrderForm = ({ isOpen, onClose, onSave, orderToEdit, initialInventoryItem, clearInitialInventoryItem, customers, isEditable, onSetEditable }) => {
  const [formData, setFormData] = useState({
    orderNumber: '',
    customer_id: '',
    status: 'Pending',
  });
  const [error, setError] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);

  useEffect(() => {
    setOrderItems([]); // Reset items on open
    if (orderToEdit) {
      setFormData({
        orderNumber: orderToEdit.orderNumber || '',
        customer_id: orderToEdit.customer_id || '',
        status: orderToEdit.status || 'Pending',
      });
      // Fetch associated items for an existing order
      setLoadingItems(true);
      api.getOrderItems(orderToEdit.id)
        .then(setOrderItems)
        .catch(err => console.error("Failed to fetch order items", err))
        .finally(() => setLoadingItems(false));
    } else if (initialInventoryItem) {
      setFormData({
        orderNumber: initialInventoryItem.inboundOrderNumber || initialInventoryItem.inboundReference || '',
        customer_id: initialInventoryItem.customer_id || '',
        status: 'Pending',
      });
      // If creating from an inventory item, show it in the list
      setOrderItems([initialInventoryItem]);
    }
    else {
      // Reset form for new order
      setFormData({
        orderNumber: '',
        customer_id: '',
        status: 'Pending',
      });
    }
    setError(null);
  }, [orderToEdit, initialInventoryItem, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.orderNumber || !formData.customer_id) {
      // This validation only applies when the form is editable
      setError("Order Number and Customer are required.");
      return;
    }
    clearInitialInventoryItem(); // Clear the initial item after saving
    onSave(orderToEdit ? { ...orderToEdit, ...formData } : formData);
  };

  const orderStatuses = ['Pending', 'Processing', 'Completed', 'Cancelled'];

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <form onSubmit={handleSubmit} className="bg-gray-800 w-full max-w-4xl p-6 rounded-xl space-y-6 border border-indigo-700 shadow-2xl">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold text-white">{orderToEdit ? 'Edit Order' : 'Create New Order'}</h3>
          <button type="button" onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-700"><X size={20} /></button>
        </div>

        {error && <div className="p-3 text-sm text-red-400 bg-red-900/50 rounded-lg">{error}</div>}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column: Form Fields */}
          <div className="space-y-6">
            <div>
              <label htmlFor="orderNumber" className="block text-sm font-medium text-gray-300 mb-1">Order Number</label>
              <input
                type="text" id="orderNumber" name="orderNumber" value={formData.orderNumber} onChange={handleChange}
                className="w-full p-2 rounded-lg bg-gray-900 text-gray-100 border border-gray-600 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-700 disabled:cursor-not-allowed"
                placeholder="e.g., SO-1001"
                required
                disabled={!isEditable}
              />
            </div>

            <div>
              <label htmlFor="customer_id" className="block text-sm font-medium text-gray-300 mb-1">Customer</label>
              <select id="customer_id" name="customer_id" value={formData.customer_id} onChange={handleChange} required
                className="w-full p-2 rounded-lg bg-gray-900 text-gray-100 border border-gray-600 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-700 disabled:cursor-not-allowed"
                disabled={!isEditable}
              >
                <option value="">-- Select a Customer --</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-300 mb-1">Status</label>
              <select id="status" name="status" value={formData.status} onChange={handleChange} required
                className="w-full p-2 rounded-lg bg-gray-900 text-gray-100 border border-gray-600 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-700 disabled:cursor-not-allowed"
                disabled={!isEditable}
              >
                {orderStatuses.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Right Column: Order Items */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-300 mb-1">Pallets on this Order</h4>
            <div className="bg-gray-900/70 rounded-lg p-3 h-48 overflow-y-auto border border-gray-700">
              {loadingItems ? (
                <div className="flex justify-center items-center h-full text-gray-400"><Loader className="animate-spin mr-2" /> Loading items...</div>
              ) : orderItems.length > 0 ? (
                <ul className="space-y-2">
                  {orderItems.map(item => (
                    <li key={item.id} className="flex justify-between items-center p-2 bg-gray-700/50 rounded-md">
                      <span className="text-sm font-medium text-white">{item.stockNumber}</span>
                      <span className="text-xs text-gray-400">{item.location}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex justify-center items-center h-full text-gray-500 text-sm">No pallets on this order.</div>
              )}
            </div>
          </div>
        </div>
        {orderToEdit && (
          <div className="space-y-1 mt-4 pt-4 border-t border-gray-700">
            <DetailRow label="Created At" value={new Date(orderToEdit.createdAt).toLocaleString()} />
            <DetailRow label="Last Updated" value={new Date(orderToEdit.updatedAt).toLocaleString()} />
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-700">
          <button type="button" onClick={() => { // Changed Cancel to Close
            clearInitialInventoryItem(); // Clear the initial item on cancel
            onClose();
          }} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 font-medium">Close</button>
          {orderToEdit && !isEditable && (
            <button
              type="button" onClick={onSetEditable}
              className="flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-500 transition-colors font-medium"
            >
              <Edit className="w-4 h-4 mr-1" /> Edit Order
            </button>
          )}
          {isEditable && (
            <button
              type="submit"
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 font-medium shadow-md shadow-indigo-500/50"
            >
              <Save className="w-4 h-4 mr-2" /> {orderToEdit ? 'Save Changes' : 'Create Order'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default OrderForm;