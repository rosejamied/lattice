import { useState, useEffect, useCallback, useMemo } from 'react';
import * as api from './api.jsx'; // Explicitly use the axios-based API file

/**
 * Custom hook to manage pallet data by fetching from the remote server.
 */
export const useWarehouseData = () => {
  const [inventory, setInventory] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [inventoryData, locationsData] = await Promise.all([
        api.getInventory(),
        api.getLocations(),
      ]);
      setInventory(inventoryData);
      setLocations(locationsData);
    } catch (err) {
      console.error("Failed to load warehouse data from server:", err);
      setError("Failed to load warehouse data.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Load from the API on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  // This function is now just for optimistic UI updates.
  // The actual API calls are handled by the components that trigger them.
  const updateInventory = useCallback((newInventory) => {
    setInventory(newInventory);
    console.log("Inventory state updated. API calls are handled by add/delete/update functions.");
  }, []);

  const sortedInventory = useMemo(() => {
    // Sort by description, which is the new primary text field.
    return [...inventory].sort((a, b) => (a.description || '').localeCompare(b.description || ''));
  }, [inventory]);

  return { inventory: sortedInventory, locations, loading, error, updateInventory, refreshData: loadData };
};