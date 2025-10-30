import React from 'react';
import { List } from 'lucide-react';

const InventoryHoldingPage = () => {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center p-8">
      <List className="w-16 h-16 text-indigo-400 mb-6" />
      <h1 className="text-3xl font-bold text-white mb-2">Inventory Management</h1>
      <p className="text-lg text-gray-400">
        This feature is currently under construction.
      </p>
    </div>
  );
};

export default InventoryHoldingPage;