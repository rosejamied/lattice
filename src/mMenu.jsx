import React from 'react';
import { Calendar, Package, Boxes, LogOut, UserCircle } from 'lucide-react';

const MenuButton = ({ icon: Icon, label, onClick }) => (
  <button
    onClick={onClick}
    className="w-full flex flex-col items-center justify-center p-4 bg-gray-800 rounded-2xl shadow-lg hover:bg-indigo-600 hover:shadow-indigo-500/20 transition-all duration-300 ease-in-out transform hover:-translate-y-1"
  >
    <Icon className="w-10 h-10 mb-2 text-indigo-400" />
    <span className="text-lg font-semibold text-white">{label}</span>
  </button>
);

const MMenu = ({ user, onLogout, navigate }) => {
  const getInitials = (firstName, lastName) => {
    if (!firstName || !lastName) return '?';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <div className="h-screen w-screen bg-gray-900 flex flex-col p-4 font-sans">
      <header className="text-center mb-6">
        <h1 className="text-4xl font-bold text-white">Lattice Mobile</h1>
      </header>

      <main className="flex-grow flex flex-col justify-around">
        <MenuButton icon={Calendar} label="Schedule" onClick={() => navigate('schedule')} />
        <MenuButton icon={Package} label="Orders" onClick={() => navigate('orders')} />
        <MenuButton icon={Boxes} label="Stock Control" onClick={() => navigate('stock')} />
      </main>

      <footer className="mt-auto pt-4 border-t border-gray-700">
        <div className="flex items-center p-2 rounded-lg">
          <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center font-bold text-white mr-3">
            {user ? getInitials(user.firstName, user.lastName) : <UserCircle />}
          </div>
          <div className="flex-grow">
            <p className="font-semibold text-white text-sm">
              {user ? `${user.firstName} ${user.lastName}` : 'Loading...'}
            </p>
            <p className="text-xs text-gray-400">{user ? user.jobTitle : '...'}</p>
          </div>
          <button
            onClick={onLogout}
            className="ml-2 p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors"
            title="Log Out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </footer>
    </div>
  );
};

export default MMenu;