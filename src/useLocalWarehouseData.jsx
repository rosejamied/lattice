import { useState, useEffect, useCallback, useMemo } from 'react';

/**
 * Custom hook to manage pallet data using browser localStorage.
 */
export const useLocalWarehouseData = () => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const storedInventory = localStorage.getItem('wms_inventory');
      if (storedInventory) {
        const items = JSON.parse(storedInventory);
        setInventory(items);
      }
      setLoading(false);
    } catch (e) {
      console.error("Failed to load inventory from local storage:", e);
      setError("Failed to load local inventory data.");
      setLoading(false);
    }
  }, []);

  // Function to persist and update state
  const updateInventory = useCallback((newInventory) => {
    setInventory(newInventory);
    try {
      localStorage.setItem('wms_inventory', JSON.stringify(newInventory));
      setError(null);
    } catch (e) {
      console.error("Failed to save inventory to local storage:", e);
      setError("Failed to save local inventory data.");
    }
  }, []);

  const sortedInventory = useMemo(() => {
    return [...inventory].sort((a, b) => a.name.localeCompare(b.name));
  }, [inventory]);

  return { inventory: sortedInventory, loading, error, updateInventory };
};