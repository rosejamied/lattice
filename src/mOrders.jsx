import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, Loader, Package } from 'lucide-react';
import * as api from './api.jsx';
import OrderCard from './OrderCard.jsx'; // Re-using the desktop card component

const MOrders = ({ navigateBack, onViewOrder, customers }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState('active'); // 'active' or 'archived'

  useEffect(() => {
    setLoading(true);
    api.getOrders()
      .then(setOrders)
      .catch(err => {
        console.error("Failed to load mobile orders:", err);
        setError("Could not load orders.");
      })
      .finally(() => setLoading(false));
  }, []);

  const { activeOrders, archivedOrders } = useMemo(() => {
    if (!Array.isArray(orders)) return { activeOrders: [], archivedOrders: [] };
    const archivedStatuses = ['Completed', 'Cancelled'];
    return {
      activeOrders: orders.filter(order => !archivedStatuses.includes(order.status)),
      archivedOrders: orders.filter(order => archivedStatuses.includes(order.status)),
    };
  }, [orders]);

  const ordersToDisplay = view === 'active' ? activeOrders : archivedOrders;

  const handleCardClick = (order) => {
    // This will trigger the navigation logic in App.jsx to show the order details
    onViewOrder(order.id);
  };

  return (
    <div className="h-screen w-screen bg-gray-900 flex flex-col p-6 font-sans">
      <header className="flex items-center mb-8">
        <button onClick={navigateBack} className="p-2 mr-4 bg-gray-800 rounded-full hover:bg-gray-700"><ChevronLeft className="text-white" /></button>
        <h1 className="text-3xl font-bold text-white flex items-center"><Package className="mr-3 text-indigo-400" /> Orders</h1>
      </header>
      <div className="flex border-b border-gray-700 mb-4">
        <button onClick={() => setView('active')} className={`flex-1 py-2 text-center text-sm font-medium ${view === 'active' ? 'border-b-2 border-indigo-500 text-white' : 'text-gray-400'}`}>Active</button>
        <button onClick={() => setView('archived')} className={`flex-1 py-2 text-center text-sm font-medium ${view === 'archived' ? 'border-b-2 border-indigo-500 text-white' : 'text-gray-400'}`}>Archived</button>
      </div>
      <main className="flex-grow overflow-y-auto space-y-4">
        {loading && <div className="flex justify-center items-center h-full text-indigo-400"><Loader className="animate-spin mr-2" /> Loading...</div>}
        {error && <p className="text-center text-red-400">{error}</p>}
        {!loading && !error && ordersToDisplay.length > 0 ? (
          ordersToDisplay.map(order => <OrderCard key={order.id} order={order} onEdit={handleCardClick} onDelete={() => {}} />)
        ) : (
          !loading && <p className="text-center text-gray-500 mt-10">No {view} orders found.</p>
        )}
      </main>
    </div>
  );
};

export default MOrders;