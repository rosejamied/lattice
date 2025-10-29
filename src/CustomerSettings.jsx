import React from 'react';
import { Building, Plus } from 'lucide-react';

const CustomerSettings = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-white">Customer Management</h3>
          <p className="text-sm text-gray-400">Add, edit, and archive customer accounts.</p>
        </div>
        <button className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
          <Plus size={18} className="mr-2" />
          Add Customer
        </button>
      </div>
      <div className="border-t border-gray-700 pt-6 text-center text-gray-400">Customer list will be displayed here.</div>
    </div>
  );
};

export default CustomerSettings;