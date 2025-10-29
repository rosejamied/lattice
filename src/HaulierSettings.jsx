import React from 'react';
import { Truck, Plus } from 'lucide-react';

const HaulierSettings = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-white">Haulier Management</h3>
          <p className="text-sm text-gray-400">Add, edit, and archive hauliers.</p>
        </div>
        <button className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700" disabled>
          <Plus size={18} className="mr-2" />
          Add Haulier
        </button>
      </div>
      <div className="border-t border-gray-700 pt-6 text-center text-gray-400">Haulier list will be displayed here.</div>
    </div>
  );
};

export default HaulierSettings;