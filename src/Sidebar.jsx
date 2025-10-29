import React from 'react';
import { LayoutDashboard, List, Calendar, Settings, LogOut, UserCircle, ChevronLeft } from 'lucide-react';

const NavItem = ({ icon: Icon, label, isActive, isSidebarOpen, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center w-full text-left py-3 rounded-lg transition-colors duration-200 ${
      isActive
        ? 'bg-indigo-600 text-white shadow-lg'
        : 'text-gray-400 hover:bg-gray-700 hover:text-white'
    } ${isSidebarOpen ? 'px-4' : 'px-3 justify-center'}`}
    title={isSidebarOpen ? label : ''}
  >
    <Icon className={`w-5 h-5 ${isSidebarOpen ? 'mr-4' : 'mr-0'}`} />
    <span className={`font-medium transition-opacity duration-200 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 w-0'}`}>{label}</span>
  </button>
);

const Sidebar = ({ isOpen, toggle, currentPage, navigate, onLogout, user }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'inventory', label: 'Inventory', icon: List },
    { id: 'schedule', label: 'Schedule', icon: Calendar },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const getInitials = (firstName, lastName) => {
    if (!firstName || !lastName) return <UserCircle className="w-10 h-10 text-gray-500" />;
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <aside className={`flex flex-col bg-gray-800 text-white border-r border-gray-700 shadow-lg transition-all duration-300 ease-in-out ${isOpen ? 'w-64 p-4' : 'w-20 p-4'}`}>
      <div className={`flex items-center mb-8 ${isOpen ? 'justify-between' : 'justify-center'}`}>
        <h1 className={`text-2xl font-bold text-white tracking-wider transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 w-0'}`}>Lattice</h1>
        <button onClick={toggle} className="p-1 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white">
          <ChevronLeft className={`w-6 h-6 transition-transform duration-300 ${isOpen ? '' : 'rotate-180'}`} />
        </button>
      </div>

      <nav className="flex-grow space-y-2">
        {navItems.map((item) => (
          <NavItem
            key={item.id}
            icon={item.icon}
            label={item.label}
            isActive={currentPage === item.id}
            isSidebarOpen={isOpen}
            onClick={() => navigate(item.id)}
          />
        ))}
      </nav>

      <div className="mt-auto">
        <div className="border-t border-gray-700 pt-4">
          <div className={`flex items-center rounded-lg ${isOpen ? 'p-2 hover:bg-gray-700/50' : 'justify-center'}`}>
            <div className={`w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center font-bold text-white flex-shrink-0 ${isOpen ? 'mr-3' : 'mr-0'}`}>
              {user ? getInitials(user.firstName, user.lastName) : '?'}
            </div>
            <div className={`flex-grow transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 w-0'}`}>
              <p className="font-semibold text-white text-sm">
                {user ? `${user.firstName} ${user.lastName}` : 'Loading...'}
              </p>
              <p className="text-xs text-gray-400">{user ? user.role : '...'}</p>
            </div>
            <button
              onClick={onLogout}
              className={`p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded-full transition-colors ${isOpen ? 'ml-2' : 'hidden'}`}
              title="Log Out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;