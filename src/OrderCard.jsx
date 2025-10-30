import React from 'react';
import { Edit, Trash } from 'lucide-react';

const OrderCard = ({ order, onEdit, onDelete }) => {
  const getStatusBadge = (status) => {
    const baseClasses = "px-2 py-1 text-xs font-semibold rounded-full";
    switch (status) {
      case 'Pending': return `${baseClasses} bg-yellow-900 text-yellow-300`;
      case 'Processing': return `${baseClasses} bg-blue-900 text-blue-300`;
      case 'Shipped': return `${baseClasses} bg-purple-900 text-purple-300`;
      case 'Completed': return `${baseClasses} bg-green-900 text-green-300`;
      case 'Cancelled': return `${baseClasses} bg-gray-700 text-gray-400`;
      default: return `${baseClasses} bg-gray-800 text-gray-300`;
    }
  };

  return (
    <div className="bg-gray-800 rounded-xl shadow-lg p-4 flex flex-col justify-between hover:bg-gray-700/50 transition-colors cursor-pointer" onClick={() => onEdit(order)}>
      <div>
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-white text-lg">{order.orderNumber}</h3>
          <div className={getStatusBadge(order.status)}>{order.status}</div>
        </div>
        <p className="text-sm text-gray-300 mb-4">{order.customerName}</p>
      </div>
      <div className="flex justify-between items-center border-t border-gray-700 pt-3">
        <p className="text-xs text-gray-400">
          Created: {new Date(order.createdAt).toLocaleDateString()}
        </p>
        <div className="flex space-x-2">
          <button onClick={(e) => { e.stopPropagation(); onEdit(order); }} className="text-indigo-400 hover:text-indigo-300 p-1 rounded-full hover:bg-gray-600 transition-colors" title="Edit Order"><Edit className="w-4 h-4" /></button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(order); }} className="text-red-400 hover:text-red-300 p-1 rounded-full hover:bg-gray-600 transition-colors" title="Delete Order"><Trash className="w-4 h-4" /></button>
        </div>
      </div>
    </div>
  );
};

export default OrderCard;