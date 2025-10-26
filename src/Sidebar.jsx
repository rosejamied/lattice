import React from 'react';
import { User, Zap, LayoutDashboard, List, Calendar } from 'lucide-react';

const Sidebar = ({ currentPage, navigate }) => {
  return (
    <nav className="w-20 md:w-64 bg-gray-800 shadow-xl flex flex-col p-4">
      <div className="flex-shrink-0 mb-8 pt-4">
        <Zap className="w-8 h-8 text-indigo-500 mx-auto md:mx-0" />
        <h1 className="hidden md:block text-xl font-bold text-white mt-1">LATTICE</h1>
      </div>

      {/* Navigation Items */}
      <div className="flex-grow space-y-2">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'inventory', label: 'Inventory', icon: List }, // Label updated
          { id: 'schedule', label: 'Schedule', icon: Calendar },
        ].map(({ id, label, icon: Icon }) => ( // Removed isNew flag as 'form' is gone
          <button
            key={id}
            onClick={() => navigate(id)}
            className={`w-full flex items-center justify-center md:justify-start p-3 rounded-xl transition-all duration-200 group
              ${currentPage === id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/50' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}
            `}
          >
            <Icon className="w-6 h-6" />
            <span className="hidden md:inline ml-4 font-semibold">{label}</span>
          </button>
        ))}
      </div>

      {/* User / Footer */}
      <div className="mt-auto pt-4 border-t border-gray-700/50">
        <div className="flex items-center justify-center md:justify-start text-sm text-gray-400 p-2">
           <User className="w-5 h-5 mr-2" />
           <span className="hidden md:inline">Local User</span>
        </div>
      </div>
    </nav>
  );
};

export default Sidebar;