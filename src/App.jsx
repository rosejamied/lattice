import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Loader } from 'lucide-react';

import LoginPage from './LoginPage'; // Import the new Login Page
// --- Hooks ---
import { useWarehouseData } from './useWarehouseData'; // Correct hook
import * as api from './api.jsx'; // Explicitly use the axios-based API file

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
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // --- Page State ---
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentPage, setCurrentPage] = useState('dashboard'); // 'dashboard', 'inventory', 'form', 'schedule'
  const [itemToEdit, setItemToEdit] = useState(null);
  const [scheduleSettings, setScheduleSettings] = useState({
    // Default to Monday-Friday visible
    visibleDays: [1, 2, 3, 4, 5], // Sunday: 0, Saturday: 6
    // Default to business hours
    startHour: 8, // 8 AM
    endHour: 18,  // 6 PM
  });

  // --- Effects ---
  // Check for existing session on initial load
  useEffect(() => {
    const storedUser = localStorage.getItem('latticeUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setAuthLoading(false);
  }, []);

  // Load app settings once the user is logged in
  useEffect(() => {
    if (user) {
      api.getScheduleSettings()
        .then(settingsFromServer => {
          if (settingsFromServer) {
            setScheduleSettings(settingsFromServer);
          }
        })
        .catch(err => {
          console.log("No schedule settings found on server, using defaults.", err.message);
        });
    }
  }, [user]);

  // --- Auth Handlers ---
  const handleLogin = async (username, password) => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const { user: loggedInUser } = await api.login({ username, password });
      localStorage.setItem('latticeUser', JSON.stringify(loggedInUser));
      setUser(loggedInUser);
    } catch (error) {
      setAuthError(error.message || "Login failed. Please check your credentials.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('latticeUser');
    setUser(null);
  };

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
          <p>Loading warehouse data...</p>
        </div>
      );
    }

    switch (currentPage) {
      case 'dashboard':
        return <Dashboard inventory={inventory} />;
      case 'inventory':
        return (
          <InventoryList
            inventory={inventory}
            loading={loading}
            error={error}
            onEdit={(item) => navigate('form', item)}
            onDelete={handleDeleteItem}
          />
        );
      case 'form':
        return <InventoryForm itemToEdit={itemToEdit} onSave={handleSaveItem} onCancel={() => navigate('inventory')} />;
      case 'schedule':
        return <ScheduleView scheduleSettings={scheduleSettings} />; // Pass settings to ScheduleView
      case 'settings':
        return <SettingsPage scheduleSettings={scheduleSettings} onScheduleSettingsChange={handleScheduleSettingsChange} />;
      default:
        return <Dashboard inventory={inventory} />;
    }
  };

  // If not logged in, show the login page.
  if (!user) {
    return <LoginPage onLogin={handleLogin} error={authError} loading={authLoading} />;
  }

  // If logged in, show the main application.
  return (
    <div className="h-screen bg-gray-900 text-gray-100 flex font-sans antialiased overflow-hidden">
      <Sidebar
        isOpen={isSidebarOpen}
        toggle={() => setIsSidebarOpen(!isSidebarOpen)}
        currentPage={currentPage}
        navigate={navigate}
        onLogout={handleLogout} user={user}
      />
      <main className="flex-grow overflow-y-auto">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;
