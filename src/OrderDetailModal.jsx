import React, { useState, useEffect } from 'react';
import { X, Package, Loader, User, Calendar, Hash } from 'lucide-react';
import * as api from './api.jsx';
import { formatDate } from './dateFormatter';

const DetailRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-start py-2">
    <Icon className="w-5 h-5 text-gray-400 mt-1 mr-3 flex-shrink-0" />
    <div>
      <p className="text-sm text-gray-400">{label}</p>
      <p className="font-medium text-white">{value}</p>
    </div>
  </div>
);

const OrderDetailModal = ({ isOpen, onClose, orderId }) => {
  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && orderId) {
      const fetchOrderDetails = async () => {
        setLoading(true);
        setError(null);
        try {
          // Find the specific order from all orders
          const allOrders = await api.getOrders();
          const foundOrder = allOrders.find(o => o.id === orderId);
          if (!foundOrder) throw new Error("Order not found.");
          setOrder(foundOrder);

          // Fetch the items for that order
          const orderItems = await api.getOrderItems(orderId);
          setItems(orderItems);
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };
      fetchOrderDetails();
    }
  }, [isOpen, orderId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl shadow-2xl p-8 w-full max-w-2xl m-4 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
          <X size={24} />
        </button>
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
          <Package className="w-6 h-6 mr-3 text-indigo-400" />
          Order Details
        </h2>

        {loading && <div className="flex justify-center items-center h-48"><Loader className="animate-spin" /></div>}
        {error && <p className="text-red-400 text-center">{error}</p>}

        {!loading && !error && order && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            <div>
              <h3 className="text-lg font-semibold text-indigo-300 mb-2">Order Information</h3>
              <DetailRow icon={Hash} label="Order Number" value={order.orderNumber} />
              <DetailRow icon={User} label="Customer" value={order.customerName} />
              <DetailRow icon={Calendar} label="Order Date" value={formatDate(order.createdAt)} />
              <DetailRow icon={Package} label="Status" value={order.status} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-indigo-300 mb-2">Pallets on this Order</h3>
              <div className="max-h-60 overflow-y-auto bg-gray-900/50 p-3 rounded-lg">
                {items.length > 0 ? (
                  <ul className="divide-y divide-gray-700">
                    {items.map(item => (
                      <li key={item.id} className="py-2">
                        <p className="font-bold text-gray-200">Stock No: {item.stockNumber} | Qty: {item.quantity}</p>
                        <p className="text-sm text-gray-400">{item.description}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">No items found for this order.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderDetailModal;