import { useState, useEffect, useCallback, useMemo } from 'react';
import * as api from './api.jsx'; // Explicitly use the axios-based API file

/**
 * Custom hook to manage pallet data by fetching from the remote server.
 */
export const useWarehouseData = () => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load from the API on mount
  useEffect(() => {
    const loadInventory = async () => {
      try {
        const data = await api.getInventory();
        setInventory(data);
      } catch (err) {
        console.error("Failed to load inventory from server:", err);
        setError("Failed to load inventory data.");
      } finally {
        setLoading(false);
      }
    };
    loadInventory();
  }, []);

  // This function is now just for optimistic UI updates.
  // The actual API calls are handled by the components that trigger them.
  const updateInventory = useCallback((newInventory) => {
    setInventory(newInventory);
    console.log("Inventory state updated. API calls are handled by add/delete/update functions.");
  }, []);

  const sortedInventory = useMemo(() => {
    // The server already sorts by name, but this is a good fallback.
    return [...inventory].sort((a, b) => a.name.localeCompare(b.name));
  }, [inventory]);

  return { inventory: sortedInventory, loading, error, updateInventory };
};