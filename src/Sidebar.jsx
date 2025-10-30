import React from 'react';
import { LayoutDashboard, Calendar, Package, Boxes, Settings, LogOut, ChevronLeft, ChevronRight, UserCircle } from 'lucide-react';

// A reusable component for each navigation item
const NavItem = ({ icon: Icon, label, page, currentPage, navigate, isOpen }) => (
  <button
    onClick={() => navigate(page)}
    className={`flex items-center w-full px-4 py-3 rounded-lg transition-colors duration-200 ${
      currentPage === page
        ? 'bg-indigo-600 text-white shadow-md'
        : 'text-gray-400 hover:bg-gray-700 hover:text-white'
    }`}
  >
    <Icon className="w-6 h-6" />
    {isOpen && <span className="ml-4 font-medium whitespace-nowrap">{label}</span>}
  </button>
);

const Sidebar = ({ isOpen, toggle, currentPage, navigate, onLogout, user }) => {
  const getInitials = (firstName, lastName) => {
    if (!firstName || !lastName) return '?';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  // Define the navigation items in the desired order
  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', page: 'dashboard' },
    { icon: Calendar, label: 'Schedule', page: 'schedule' },
    { icon: Package, label: 'Orders', page: 'orders' },
    { icon: Boxes, label: 'Inventory', page: 'inventory' },
    { icon: Settings, label: 'Settings', page: 'settings' },
  ];

  return (
    <div className={`relative flex flex-col bg-gray-800 text-white transition-all duration-300 ease-in-out ${isOpen ? 'w-64' : 'w-20'}`}>
      {/* Header */}
      <div className="flex items-center justify-center h-20 border-b border-gray-700">
        <div className={`text-2xl font-bold text-indigo-400 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
          Lattice
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-grow px-4 py-4 space-y-2">
        {navItems.map(item => (
          <NavItem
            key={item.page}
            isOpen={isOpen}
            currentPage={currentPage}
            navigate={navigate}
            {...item}
          />
        ))}
      </nav>

      {/* Footer with User Info and Logout */}
      <div className="px-4 py-4 border-t border-gray-700">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center font-bold text-white flex-shrink-0">
            {user ? getInitials(user.firstName, user.lastName) : <UserCircle />}
          </div>
          {isOpen && (
            <div className="ml-3 overflow-hidden">
              <p className="font-semibold text-white text-sm truncate">
                {user ? `${user.firstName} ${user.lastName}` : 'Loading...'}
              </p>
              <p className="text-xs text-gray-400 truncate">{user ? user.jobTitle : '...'}</p>
            </div>
          )}
        </div>
        <button
          onClick={onLogout}
          className={`flex items-center w-full px-4 py-3 mt-4 rounded-lg transition-colors duration-200 text-gray-400 hover:bg-red-800/50 hover:text-red-300`}
        >
          <LogOut className="w-6 h-6" />
          {isOpen && <span className="ml-4 font-medium whitespace-nowrap">Logout</span>}
        </button>
      </div>

      {/* Toggle Button */}
      <button
        onClick={toggle}
        className="absolute -right-3 top-20 p-1.5 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-500 focus:outline-none"
      >
        {isOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
      </button>
    </div>
  );
};

export default Sidebar;