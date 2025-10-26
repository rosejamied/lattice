import React, { useMemo } from 'react';
import { LayoutDashboard, List, Zap } from 'lucide-react';
import Card from './Card';

// Dashboard View
const Dashboard = ({ inventory, userId }) => {
  const totalStock = useMemo(() => inventory.reduce((sum, item) => sum + (item.quantity || 0), 0), [inventory]);
  const uniquePallets = inventory.length;

  // Calculate low stock pallets (used for the list check)
  const lowStockPallets = useMemo(() =>
    inventory.filter(item => (item.quantity || 0) < 10)
  , [inventory]);


  const getPalletClass = (quantity) => {
    if (quantity < 10) return 'text-red-400 bg-red-900/50';
    if (quantity < 50) return 'text-yellow-400 bg-yellow-900/50';
    return 'text-green-400 bg-green-900/50';
  };

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-3xl font-bold text-white flex items-center">
        <LayoutDashboard className="w-6 h-6 mr-2 text-indigo-400" />
        Lattice Warehouse Overview
      </h1>
      <p className="text-sm text-gray-400">
        User ID: <span className="font-mono text-xs bg-gray-700 p-1 rounded">{userId}</span>
      </p>

      {/* Stats Cards - Updated to 2 columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Total Pallet Stock" value={totalStock.toLocaleString()} icon={List} color="indigo" />
        <Card title="Unique Pallets Tracked" value={uniquePallets.toLocaleString()} icon={Zap} color="sky" />
        {/* Low Pallet Count card has been removed */}
      </div>

      {/* Low Stock Alert List */}
      <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
        <h2 className="text-xl font-semibold text-white mb-4 border-b border-gray-700 pb-2">Low Pallet Alerts (&lt; 10 Units)</h2>
        {lowStockPallets.length === 0 ? (
          <p className="text-green-400">All systems go! No low pallet alerts.</p>
        ) : (
          <ul className="space-y-3">
            {lowStockPallets
              .slice(0, 5)
              .map(item => (
                <li key={item.id} className="flex justify-between items-center p-3 rounded-lg bg-gray-700/50">
                  <span className="text-gray-300 font-medium">{item.name} ({item.sku})</span>
                  <span className={`px-3 py-1 text-sm font-bold rounded-full ${getPalletClass(item.quantity)}`}>
                    {item.quantity} pallets
                  </span>
                </li>
              ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Dashboard;