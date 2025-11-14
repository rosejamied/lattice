import React, { useState, useEffect, useMemo } from 'react';
import OrderCard from './OrderCard';
import OrderForm from './OrderForm'; // Import the new form
import * as api from './api.jsx'; // Import the new form
import { Package, Plus, Loader, Edit, Trash2 } from 'lucide-react';

const OrdersPage = ({ onDataChange, initialInventoryItem, clearInitialInventoryItem }) => {
  const [orders, setOrders] = useState([]); // This state is now only for this page's list
  const [customers, setCustomers] = useState([]);
  const [view, setView] = useState('active'); // 'active' or 'archived'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Form and Modal State ---
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [orderToEdit, setOrderToEdit] = useState(null);
  const [isOrderFormEditable, setIsOrderFormEditable] = useState(false);

  const openOrderModal = (order, isEditable = false) => {
    setOrderToEdit(order);
    setIsOrderFormEditable(isEditable);
    setIsFormOpen(true);
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.getOrders(),
      api.getCustomers()
    ]).then(([ordersData, customersData]) => {
      setOrders(ordersData);
      setCustomers(customersData);
    }).catch(err => {
      console.error("Error loading orders or customers:", err); // Log the actual error
      setError("Failed to load page data. Please check server connection.");
    })
      .finally(() => setLoading(false));
  }, []);

  // Effect to open a specific order if an ID is passed from another page
  useEffect(() => {
    if (initialInventoryItem?.orderId && orders.length > 0) {
      const targetOrder = orders.find(o => o.id === initialInventoryItem.orderId);
      if (targetOrder) {
        openOrderModal(targetOrder, false); // Open in read-only mode
      }
      clearInitialInventoryItem(); // Clear the trigger
    }
  }, [initialInventoryItem, orders, clearInitialInventoryItem]);

  const handleNewOrder = () => {
    setOrderToEdit(null);
    setIsOrderFormEditable(true);
    setIsFormOpen(true);
  };

  const handleDeleteOrder = async (order) => {
    if (window.confirm(`Are you sure you want to delete order #${order.orderNumber}?`)) {
      try {
        await api.deleteOrder(order.id);
        setOrders(prev => prev.filter(o => o.id !== order.id));
      } catch (err) {
        setError("Failed to delete order. " + err.message);
      }
    }
  };

  const handleSaveOrder = async (orderData) => {
    const originalOrders = [...orders]; // Keep a copy in case of error
    try {
      if (orderData.id) { // Updating existing order
        await api.updateOrder(orderData.id, orderData);
      } else { // Creating new order
        await api.addOrder(orderData);
      }
      // After saving, re-fetch all orders to get the latest data including pallet counts
      const updatedOrders = await api.getOrders();
      setOrders(updatedOrders);
      setIsFormOpen(false); // Close the form on successful save
      onDataChange(); // Trigger a full app data refresh
    } catch (err) {
      setOrders(originalOrders); // Revert on error
      setError("Failed to save order. " + err.message);
    }
  };

  const { activeOrders, archivedOrders } = useMemo(() => {
    if (!Array.isArray(orders)) return { activeOrders: [], archivedOrders: [] };
    const archivedStatuses = ['Completed', 'Cancelled'];
    return {
      activeOrders: orders.filter(order => !archivedStatuses.includes(order.status)),
      archivedOrders: orders.filter(order => archivedStatuses.includes(order.status)),
    };
  }, [orders]);
  
  const ordersToDisplay = view === 'active' ? activeOrders : archivedOrders;

  const formatDate = (isoString) => {
    if (!isoString) return 'N/A';
    return new Date(isoString).toLocaleDateString('en-GB');
  };

  const formatTime = (isoString) => {
    if (!isoString) return 'N/A';
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white flex items-center">
          <Package className="w-6 h-6 mr-2 text-indigo-400" />
          Order Management
        </h1>
        <button
          onClick={handleNewOrder}
          className="flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 transition-colors font-medium shadow-md shadow-indigo-500/50 whitespace-nowrap"
        >
          <Plus className="w-5 h-5 mr-2" /> New Order
        </button>
      </div>

      <div className="flex border-b border-gray-700">
        <button onClick={() => setView('active')} className={`px-4 py-2 text-sm font-medium transition-colors ${view === 'active' ? 'border-b-2 border-indigo-500 text-white' : 'text-gray-400 hover:text-white'}`}>Active Orders</button>
        <button onClick={() => setView('archived')} className={`px-4 py-2 text-sm font-medium transition-colors ${view === 'archived' ? 'border-b-2 border-indigo-500 text-white' : 'text-gray-400 hover:text-white'}`}>Archived Orders</button>
      </div>

      {loading && (
        <div className="flex justify-center items-center py-10 text-indigo-400"><Loader className="w-8 h-8 animate-spin mr-2" /> Loading Orders...</div>
      )}
      {error && <p className="text-red-400 p-4 bg-red-900/50 rounded-lg">{error}</p>}
      
      {!loading && !error && (
        ordersToDisplay.length > 0 ? (
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-800">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Date</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Time</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Customer</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Reference</th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">Pallet Qty</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-900 divide-y divide-gray-700">
              {ordersToDisplay.map(order => (
                <tr key={order.id} className="hover:bg-gray-800/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{formatDate(order.createdAt)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{formatTime(order.createdAt)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{order.customerName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{order.orderNumber}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-bold text-white">{order.palletCount}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{order.status}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                    <button onClick={() => openOrderModal(order)} className="text-indigo-400 hover:text-indigo-300">
                      <Edit size={18} />
                    </button>
                    <button onClick={() => handleDeleteOrder(order)} className="text-red-500 hover:text-red-400">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-center text-gray-400 py-10">No {view} orders found.</p>
        )
      )}

      <OrderForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSaveOrder}
        orderToEdit={orderToEdit}
        isEditable={isOrderFormEditable}
        onSetEditable={() => setIsOrderFormEditable(true)}
        customers={customers}
      />

    </div>
  );
};

export default OrdersPage;