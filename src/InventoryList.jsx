import React, { useState, useMemo } from 'react';
import { Plus, List, Loader, Edit, Trash } from 'lucide-react';

const InventoryList = ({ inventory, onEdit, onAddNew, onDelete, loading, error }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredInventory = useMemo(() => {
    if (!searchTerm) return inventory;
    const term = searchTerm.toLowerCase();
    return inventory.filter(item => 
      (item.stockNumber && item.stockNumber.toLowerCase().includes(term)) ||
      (item.inboundOrderNumber && item.inboundOrderNumber.toLowerCase().includes(term)) ||
      (item.description && item.description.toLowerCase().includes(term))
    );
  }, [inventory, searchTerm]);

  const getStatusBadge = (quantity) => {
    if (quantity < 10) return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-900 text-red-300">Low</span>;
    if (quantity < 50) return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-900 text-yellow-300">Medium</span>;
    return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-900 text-green-300">In Stock</span>;
  };

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-3xl font-bold text-white flex items-center">
        <List className="w-6 h-6 mr-2 text-indigo-400" />
        Current Inventory
      </h1>

      {/* Combined Search and Add Pallet Button */}
      <div className="flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          placeholder="Search by Stock #, Order #, or Description..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-grow p-3 rounded-xl bg-gray-800 text-gray-100 border border-gray-700 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
        />
        <button
          onClick={onAddNew}
          className="flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 transition-colors font-medium shadow-md shadow-indigo-500/50 whitespace-nowrap"
        >
          <Plus className="w-5 h-5 mr-2" /> Add Pallet
        </button>
      </div>


      {loading && (
        <div className="flex justify-center items-center py-10 text-indigo-400">
          <Loader className="w-8 h-8 animate-spin mr-2" /> Loading Local Data...
        </div>
      )}

      {error && <p className="text-red-400 p-4 bg-red-900/50 rounded-lg">{error}</p>}

      <div className="overflow-x-auto bg-gray-800 rounded-xl shadow-lg">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gray-700/50">
            <tr>
              {['Stock Number', 'Order Number', 'Description', 'Qty', 'Stock Location', 'Status', 'Inbound Date', 'Reference Number', 'Actions'].map(header => (
                <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {Array.isArray(filteredInventory) && filteredInventory.map((item) => (
              <tr key={item.id} className="hover:bg-gray-700 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{item.stockNumber}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{item.inboundOrderNumber}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{item.description}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 font-bold">{item.quantity}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{item.location}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{item.status}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{item.inboundDate ? new Date(item.inboundDate).toLocaleDateString() : 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{item.inboundReference}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => onEdit(item)}
                    className="text-indigo-400 hover:text-indigo-300 p-1 rounded-full hover:bg-gray-600 transition-colors mr-2"
                    title="Edit Pallet"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => onDelete(item)}
                    className="text-red-400 hover:text-red-300 p-1 rounded-full hover:bg-gray-600 transition-colors"
                    title="Delete Pallet"
                  >
                    <Trash className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
            {(!Array.isArray(filteredInventory) || filteredInventory.length === 0) && !loading && (
              <tr>
                <td colSpan="9" className="px-6 py-4 text-center text-gray-400">
                  {searchTerm ? "No pallets found matching your search." : "No pallets in stock. Start by adding one!"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InventoryList;