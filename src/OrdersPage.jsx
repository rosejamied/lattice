import React, { useState, useEffect, useMemo } from 'react';
import OrderCard from './OrderCard';
import OrderForm from './OrderForm'; // Import the new form
import * as api from './api.jsx';
import { Package, Plus, Loader } from 'lucide-react';

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [view, setView] = useState('active'); // 'active' or 'archived'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [orderToEdit, setOrderToEdit] = useState(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.getOrders(),
      api.getCustomers()
    ]).then(([ordersData, customersData]) => {
      setOrders(ordersData);
      setCustomers(customersData);
    }).catch(err => {
      setError("Failed to load page data. Please check server connection.");
    })
      .finally(() => setLoading(false));
  }, []);

  const handleNewOrder = () => {
    setOrderToEdit(null);
    setIsFormOpen(true);
  };

  const handleEditOrder = (order) => {
    setOrderToEdit(order);
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
    try {
      if (orderData.id) { // Updating existing order
        await api.updateOrder(orderData.id, orderData);
        setOrders(prev => prev.map(o => o.id === orderData.id ? { ...o, ...orderData, customerName: customers.find(c => c.id === orderData.customer_id)?.name } : o));
      } else { // Creating new order
        const newOrder = await api.addOrder(orderData);
        setOrders(prev => [newOrder, ...prev]);
      }
      setIsFormOpen(false);
    } catch (err) {
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {ordersToDisplay.map(order => <OrderCard key={order.id} order={order} onEdit={handleEditOrder} onDelete={handleDeleteOrder} />)}
          </div>
        ) : (
          <p className="text-center text-gray-400 py-10">No {view} orders found.</p>
        )
      )}

      <OrderForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSaveOrder}
        orderToEdit={orderToEdit}
        customers={customers}
      />
    </div>
  );
};

export default OrdersPage;