import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Loader } from 'lucide-react';
import { Routes, Route, Outlet, useNavigate as useReactRouterNavigate } from 'react-router-dom';

import LoginPage from './LoginPage'; // Import the new Login Page
// --- Hooks ---
import { useWarehouseData } from './useWarehouseData'; // Correct hook
import * as api from './api.jsx'; // Explicitly use the axios-based API file

// --- Components ---
import Sidebar from './Sidebar.jsx';
import Dashboard from './Dashboard';
import InventoryList from './InventoryList.jsx';
import ScheduleView from './ScheduleView.jsx';
import SettingsPage from './SettingsPage.jsx';
import InitialSetupPage from './InitialSetupPage.jsx'; // Import the new setup page
import OfficeDisplay from './officedisplay/OfficeDisplay.jsx';
import OrderDetailModal from './OrderDetailModal.jsx'; // Import the new modal
import OrdersPage from './OrdersPage'; // Import the new Orders page

// --- Mobile Components ---
import MLoginPage from './mLoginPage';
import MMenu from './mMenu';
import MSchedule from './mSchedule';
import MOrders from './mOrders';
import MStock from './mStock';

// --- Custom Hooks ---
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return isMobile;
};

// --- Layout Component for Desktop View ---
const MainLayout = ({ isSidebarOpen, toggleSidebar, onLogout, user, serverStatus, loading, isOrderDetailModalOpen, closeOrderDetailModal, orderToViewId }) => (
  <div className="h-screen bg-gray-900 text-gray-100 flex font-sans antialiased overflow-hidden">
    <Sidebar
      isOpen={isSidebarOpen}
      toggle={toggleSidebar}
      onLogout={onLogout}
      user={user}
      serverStatus={serverStatus}
    />
    <main className="flex-grow overflow-y-auto">
      {loading ? (
        <div className="flex flex-col items-center justify-center h-full text-indigo-400">
          <Loader className="w-12 h-12 animate-spin mb-4" />
          <p>Loading warehouse data...</p>
        </div>
      ) : (
        <Outlet /> // Nested routes will render here
      )}
    </main>
    <OrderDetailModal 
      isOpen={isOrderDetailModalOpen}
      onClose={closeOrderDetailModal}
      orderId={orderToViewId}
    />
  </div>
);

// --- Main Application Component ---
const App = () => {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [customers, setCustomers] = useState([]);

  // --- Page State ---
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [mobilePage, setMobilePage] = useState('menu'); // 'menu', 'schedule', 'orders', 'stock'
  const [orderCreationInitialInventoryItem, setOrderCreationInitialInventoryItem] = useState(null);
  const [isOrderDetailModalOpen, setIsOrderDetailModalOpen] = useState(false);
  const [orderToViewId, setOrderToViewId] = useState(null);
  const [itemToEdit, setItemToEdit] = useState(null);

  const [scheduleSettings, setScheduleSettings] = useState({
    // Default to Monday-Friday visible
    visibleDays: [1, 2, 3, 4, 5], // Sunday: 0, Saturday: 6
    // Default to business hours
    startHour: 8, // 8 AM
    endHour: 18,  // 6 PM
  });

  // --- Responsive Hook ---
  const isMobile = useIsMobile();
  const navigate = useReactRouterNavigate();

  // --- Effects ---
  useEffect(() => {
    const checkSystemStatus = async () => {
      try {
        const { needsSetup: setupRequired } = await api.checkInitialSetup();
        if (setupRequired) {
          setNeedsSetup(true);
        } else {
          const storedUser = localStorage.getItem('latticeUser');
          if (storedUser) setUser(JSON.parse(storedUser));
        }
      } catch (err) {
        // Provide more specific feedback for developers
        if (err.response?.status === 404) {
          setAuthError("Connection Error: The server is running, but the required setup endpoint (/api/setup/status) was not found. Please check the backend implementation.");
        } else {
          const message = err.message || "An unknown error occurred.";
          setAuthError(`Could not connect to the server to check system status. (${message})`);
        }
      } finally {
        setAuthLoading(false);
      }
    };
    checkSystemStatus();
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
      
      api.getCustomers()
        .then(setCustomers)
        .catch(err => console.error("Failed to fetch customers in App.jsx", err));
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
      setNeedsSetup(false); // Ensure we exit setup mode on successful login
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
  const { inventory, locations, loading, error, updateInventory, refreshData } = useWarehouseData();

  // Determine server status based on the primary data hook's state
  const serverStatus = useMemo(() => {
    if (loading) {
      return 'connecting';
    }
    if (error) {
      return 'offline';
    }
    return 'online';
  }, [loading, error]);

  // View Handlers
  const mobileNavigate = (page) => {
    setMobilePage(page);
  };

  // --- Handler to view an order from another page ---
  const handleViewOrder = useCallback((orderId) => {
    setOrderToViewId(orderId);
    setIsOrderDetailModalOpen(true);
  }, [navigate]);

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
  }, [inventory, updateInventory]);

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

  const handleInitiateOrderCreation = useCallback((item) => {
    setOrderCreationInitialInventoryItem(item);
    navigate('/orders');
  }, [navigate]);

  // --- Mobile View Rendering ---
  if (isMobile) {
    if (!user) {
      return <MLoginPage onLogin={handleLogin} error={authError} loading={authLoading} />;
    }

    switch (mobilePage) {
      case 'schedule':
        return <MSchedule navigateBack={() => mobileNavigate('menu')} scheduleSettings={scheduleSettings} />;
      case 'orders':
        return <MOrders 
          navigateBack={() => mobileNavigate('menu')} 
          onViewOrder={handleViewOrder} 
          customers={customers} 
        />;
      case 'stock':
        return <MStock 
          navigateBack={() => mobileNavigate('menu')} 
          inventory={inventory} 
          locations={locations}
          customers={customers}
        />;
      case 'menu':
      default:
        return <MMenu user={user} onLogout={handleLogout} navigate={mobileNavigate} />;
    }
  }

  // --- Initial Setup Rendering ---
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-indigo-400">
        <Loader className="w-12 h-12 animate-spin" />
      </div>
    );
  }
  if (needsSetup) {
    return <InitialSetupPage onSetupComplete={handleLogin} api={api} />;
  }
  // --- Desktop View Rendering ---

  // If not logged in, show the login page.
  if (!user) {
    return <LoginPage onLogin={handleLogin} error={authError} loading={authLoading} />;
  }

  // If logged in, show the main application.
  return (
    <Routes>
      {/* Standalone route for the office display */}
      <Route path="/display" element={<OfficeDisplay />} />

      {/* All other routes use the MainLayout with the sidebar */}
      <Route element={
        <MainLayout 
          isSidebarOpen={isSidebarOpen}
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onLogout={handleLogout}
          user={user}
          serverStatus={serverStatus}
          loading={loading}
          isOrderDetailModalOpen={isOrderDetailModalOpen}
          closeOrderDetailModal={() => setIsOrderDetailModalOpen(false)}
          orderToViewId={orderToViewId}
        />
      }>
        <Route path="/" element={<Dashboard inventory={inventory} />} />
        <Route path="/dashboard" element={<Dashboard inventory={inventory} />} />
        <Route path="/inventory" element={
          <InventoryList 
            inventory={inventory} 
            onSave={handleSaveItem} 
            onDelete={handleDeleteItem} 
            loading={loading} 
            error={error}
            customers={customers}
          />
        } />
        <Route path="/orders" element={
          <OrdersPage
            initialInventoryItem={orderCreationInitialInventoryItem}
            clearInitialInventoryItem={() => setOrderCreationInitialInventoryItem(null)}
            onDataChange={refreshData}
          />
        } />
        <Route path="/schedule" element={
          <ScheduleView 
            user={user} 
            scheduleSettings={scheduleSettings} 
            onViewOrder={handleViewOrder}
          />
        } />
        <Route path="/settings" element={<SettingsPage user={user} scheduleSettings={scheduleSettings} onScheduleSettingsChange={handleScheduleSettingsChange} />} />
      </Route>
    </Routes>
  );
};

export default App;
