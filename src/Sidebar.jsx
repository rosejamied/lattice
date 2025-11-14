import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Calendar, Package, List, Settings, LogOut, ChevronLeft, ChevronRight, UserCircle, Zap } from 'lucide-react';

const Sidebar = ({ isOpen, toggle, onLogout, user, serverStatus = 'offline' }) => {
  const allNavItems = [
    { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/schedule", icon: Calendar, label: "Schedule" },
    { to: "/orders", icon: Package, label: "Orders" },
    { to: "/inventory", icon: List, label: "Inventory" },
  ];

  const navItems = allNavItems.filter(Boolean);

  const getInitials = (firstName, lastName) => {
    if (!firstName || !lastName) return '?';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const statusIndicator = {
    online: { color: 'text-green-400', title: 'Server Connection: Online' },
    offline: { color: 'text-red-500', title: 'Server Connection: Offline' },
    connecting: { color: 'text-yellow-400', title: 'Server Connection: Connecting...' },
  };
  const currentStatus = statusIndicator[serverStatus] || statusIndicator.offline;

  const NavItem = ({ to, icon: Icon, label }) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center w-full px-4 py-3 rounded-lg transition-colors duration-200 ${
          isActive
            ? 'bg-indigo-600 text-white shadow-md'
            : 'text-gray-400 hover:bg-gray-700 hover:text-white'
        }`
      }
    >
      <Icon className="w-6 h-6" />
      {isOpen && <span className="ml-4 font-medium whitespace-nowrap">{label}</span>}
    </NavLink>
  );

  return (
    <div className={`relative flex flex-col bg-gray-800 text-white transition-all duration-300 ease-in-out ${isOpen ? 'w-64' : 'w-20'}`}>
      {/* Header */}
      <div className="flex items-center justify-center h-20 border-b border-gray-700">
        <div className={`flex items-center gap-2 text-2xl font-bold text-white transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`} title={currentStatus.title}>
          <div className="relative">
            <Zap className={`h-6 w-6 transition-colors duration-300 ${currentStatus.color}`} />
          </div>
          <span>Lattice</span>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-grow px-4 py-4 space-y-2">
        {navItems.map(item => (
          <NavItem key={item.to} {...item} />
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
          {isOpen && ( // Settings cog is always visible when sidebar is open
            <NavLink to="/settings" className="p-2 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors ml-auto" title="Settings">
              <Settings className="w-5 h-5" />
            </NavLink>
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