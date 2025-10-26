import React from 'react';
import { User, Zap, LayoutDashboard, List, Calendar, Settings } from 'lucide-react';

const Sidebar = ({ currentPage, navigate }) => {
  return (
    <nav className="w-20 hover:w-64 bg-gray-800 shadow-xl flex flex-col p-4 transition-all duration-300 ease-in-out group">
      <div className="flex-shrink-0 mb-8 pt-4 flex flex-col items-center group-hover:items-start">
        <Zap className="w-8 h-8 text-indigo-500 animate-pulse" />
        <h1 className="hidden group-hover:block text-xl font-bold text-white mt-1">LATTICE</h1>
      </div>

      {/* Navigation Items */}
      <div className="flex-grow space-y-2">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'inventory', label: 'Inventory', icon: List }, // Label updated
          { id: 'schedule', label: 'Schedule', icon: Calendar },
          { id: 'settings', label: 'Settings', icon: Settings },
        ].map(({ id, label, icon: Icon }) => ( // Removed isNew flag as 'form' is gone
          <button
            key={id}
            onClick={() => navigate(id)}
            className={`w-full flex items-center justify-center group-hover:justify-start p-3 rounded-xl transition-all duration-200
              ${currentPage === id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/50' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}
            `}
          >
            <Icon className="w-6 h-6" />
            <span className="hidden group-hover:inline ml-4 font-semibold">{label}</span>
          </button>
        ))}
      </div>

      {/* User / Footer */}
      <div className="mt-auto pt-4 border-t border-gray-700/50">
        <div className="flex items-center justify-center group-hover:justify-start text-sm text-gray-400 p-2">
           <User className="w-5 h-5 mr-2" />
           <span className="hidden group-hover:inline">Local User</span>
        </div>
      </div>
    </nav>
  );
};

export default Sidebar;