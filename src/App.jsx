import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Loader } from 'lucide-react';

// --- Hooks ---
import { useWarehouseData } from './useWarehouseData'; // Correct hook
import * as api from './api'; // Centralized API service

// --- Components ---
import Sidebar from './Sidebar';
import Dashboard from './Dashboard';
import InventoryList from './InventoryList';
import InventoryForm from './InventoryForm';
import ScheduleView from './ScheduleView';
import SettingsPage from './SettingsPage'; // Added Settings Page
import Card from './Card';

// --- Main Application Component ---
const App = () => {
  const [currentPage, setCurrentPage] = useState('dashboard'); // 'dashboard', 'inventory', 'form', 'schedule'
  const [itemToEdit, setItemToEdit] = useState(null);
  const [scheduleSettings, setScheduleSettings] = useState({
    // Default to Monday-Friday visible
    visibleDays: [1, 2, 3, 4, 5], // Sunday: 0, Saturday: 6
    // Default to business hours
    startHour: 8, // 8 AM
    endHour: 18,  // 6 PM
  });

  // Effect to load settings from the server on initial mount
  useEffect(() => {
    api.getScheduleSettings()
      .then(settingsFromServer => {
        if (settingsFromServer) {
          setScheduleSettings(settingsFromServer);
        }
      })
      .catch(err => {
        console.log("No schedule settings found on server, using defaults.", err.message);
      });
  }, []);
  // Static user ID since multi-user sync is disabled
  const userId = 'LOCAL-USER-SIMULATION';

  // Data Hook
  const { inventory, loading, error, updateInventory } = useWarehouseData();

  // View Handlers
  const navigate = (page, item = null) => {
    setItemToEdit(item);
    setCurrentPage(page);
  };

  // CRUD Operations
  const handleSaveItem = useCallback((itemData) => {
    const now = new Date().toISOString();

    if (itemData.id) {
      const updatedItem = { ...itemData, updatedAt: now };
      // Optimistic UI Update
      const updatedInventory = inventory.map(item =>
        item.id === itemData.id
          ? updatedItem
          : item
      );
      updateInventory(updatedInventory);
      // API Call
      api.updateInventoryItem(itemData.id, updatedItem).catch(err => {
        console.error("Failed to update item:", err);
      });
    } else {
      const newItem = {
        id: Date.now().toString(),
        ...itemData,
        createdAt: now,
        updatedAt: now,
      };
      // Optimistic UI Update
      const newInventory = [...inventory, newItem];
      updateInventory(newInventory);
      // API Call
      api.addInventoryItem(newItem).catch(err => {
        console.error("Failed to add item:", err);
      });
    }
    navigate('inventory');
  }, [inventory, updateInventory, navigate]);

  const handleDeleteItem = useCallback((item) => {
    if (!window.confirm(`Are you sure you want to delete the pallet "${item.name}"? This action is irreversible.`)) return;

    // Optimistic UI Update
    const newInventory = inventory.filter(i => i.id !== item.id);
    updateInventory(newInventory);
    // API Call
    api.deleteInventoryItem(item.id).catch(err => {
      console.error("Failed to delete item:", err);
    });
  }, [inventory, updateInventory]);

  const handleScheduleSettingsChange = (newSettings) => {
    setScheduleSettings(newSettings);
    // Persist the new settings to the server
    api.updateScheduleSettings(newSettings).catch(err => console.error("Failed to save settings:", err));
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
        // Placeholder for the inventory page
        return <div className="flex flex-col items-center justify-center h-full text-center p-8">
          <h1 className="text-4xl font-bold text-white mb-4">Inventory Management</h1>
          <p className="text-lg text-gray-400">This feature is currently under construction.</p>
          <p className="text-gray-400">Please check back later!</p>
        </div>;
      case 'form':
        return <InventoryForm itemToEdit={itemToEdit} onSave={handleSaveItem} onCancel={() => navigate('inventory')} />;
      case 'schedule':
        return <ScheduleView scheduleSettings={scheduleSettings} />; // Pass settings to ScheduleView
      case 'settings':
        return <SettingsPage scheduleSettings={scheduleSettings} onScheduleSettingsChange={handleScheduleSettingsChange} />;
      default:
        return <Dashboard inventory={inventory} userId={userId} />;
    }
  };

  return (
    <div className="h-screen bg-gray-900 text-gray-100 flex font-sans antialiased overflow-hidden">
      <Sidebar currentPage={currentPage} navigate={navigate} />
      <main className="flex-grow overflow-y-auto">
        {renderContent()}
      </main>
    </div>
  );
};
export default App;
