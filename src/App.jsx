import React, { useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Loader } from 'lucide-react';

// --- Hooks ---
import { useLocalWarehouseData } from './useLocalWarehouseData';

// --- Components ---
import Sidebar from './Sidebar';
import Dashboard from './Dashboard';
import InventoryList from './InventoryList';
import InventoryForm from './InventoryForm';
import ScheduleView from './ScheduleView';
import Card from './Card';

// --- Main Application Component ---
const App = () => {
  const [currentPage, setCurrentPage] = useState('dashboard'); // 'dashboard', 'inventory', 'form', 'schedule'
  const [itemToEdit, setItemToEdit] = useState(null);

  // Static user ID since multi-user sync is disabled
  const userId = 'LOCAL-USER-SIMULATION';

  // Data Hook
  const { inventory, loading, error, updateInventory } = useLocalWarehouseData();

  // CRUD Operations
  const handleSaveItem = useCallback((itemData) => {
    const now = new Date().toISOString();
    let newInventory;

    if (itemData.id) {
      // Update existing item
      newInventory = inventory.map(item =>
        item.id === itemData.id
          ? { ...item, ...itemData, updatedAt: now }
          : item
      );
    } else {
      // Add new item
      const newItem = {
        id: Date.now().toString(), // Simple unique ID for local storage
        ...itemData,
        createdAt: now,
        updatedAt: now,
      };
      newInventory = [...inventory, newItem];
    }
    updateInventory(newInventory);
    setCurrentPage('inventory');
    setItemToEdit(null);
  }, [inventory, updateInventory]);

  const handleDeleteItem = useCallback((item) => {
    // Note: Using window.confirm as requested, though custom modal UI is preferred in real apps.
    if (!window.confirm(`Are you sure you want to delete the pallet "${item.name}"? This action is irreversible.`)) return;

    const newInventory = inventory.filter(i => i.id !== item.id);
    updateInventory(newInventory);
  }, [inventory, updateInventory]);


  // View Handlers
  const navigate = (page, item = null) => {
    setItemToEdit(item);
    setCurrentPage(page);
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-indigo-400">
          <Loader className="w-12 h-12 animate-spin mb-4" />
          <p>Loading local data...</p>
        </div>
      );
    }

    switch (currentPage) {
      case 'dashboard':
        return <Dashboard inventory={inventory} userId={userId} />;
      case 'inventory':
        return (
          <InventoryList
            inventory={inventory}
            // onEdit handles both edit (item object) and add (null)
            onEdit={(item) => navigate('form', item)}
            onDelete={handleDeleteItem}
            loading={loading}
            error={error}
          />
        );
      case 'form':
        return <InventoryForm itemToEdit={itemToEdit} onSave={handleSaveItem} onCancel={() => navigate('inventory')} />;
      case 'schedule':
        return <ScheduleView />;
      default:
        return <Dashboard inventory={inventory} userId={userId} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex font-sans antialiased">
      <Sidebar currentPage={currentPage} navigate={navigate} />
      <main className="flex-grow overflow-y-auto">
        {renderContent()}
      </main>
    </div>
  );
};
export default App;
