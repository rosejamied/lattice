import React, { useState, useEffect, useMemo } from 'react';
import * as api from './api';
import { ArrowUp, ArrowDown, Package } from 'lucide-react';

const SortableHeader = ({ children, name, sortConfig, onSort }) => {
  const isSorted = sortConfig.key === name;
  const direction = isSorted ? sortConfig.direction : undefined;

  return (
    <th
      scope="col"
      className="px-3 py-3.5 text-left text-sm font-semibold text-white cursor-pointer hover:bg-gray-700/50"
      onClick={() => onSort(name)}
    >
      <div className="group inline-flex items-center">
        {children}
        <span className="ml-2 flex-none rounded text-gray-400">
          {isSorted && direction === 'ascending' && <ArrowUp className="h-4 w-4" />}
          {isSorted && direction === 'descending' && <ArrowDown className="h-4 w-4" />}
          {!isSorted && <ArrowDown className="h-4 w-4 opacity-0 group-hover:opacity-50" />}
        </span>
      </div>
    </th>
  );
};

const Inventory = ({ user }) => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'stockNumber', direction: 'ascending' }); // Removed usePermissions

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        setLoading(true);
        const data = await api.getInventory();
        setInventory(data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    fetchInventory();
  }, []);

  const sortedInventory = useMemo(() => {
    let sortableItems = [...inventory];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;

        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortConfig.direction === 'ascending'
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [inventory, sortConfig]);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  if (loading) return <div className="text-white text-center p-8">Loading inventory...</div>;
  if (error) return <div className="text-red-400 text-center p-8">Error loading inventory: {error.message}</div>;

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-base font-semibold leading-6 text-white">Inventory</h1>
          <p className="mt-2 text-sm text-gray-300">A list of all the items in your warehouse.</p>
        </div>
        {/* Add button can go here if needed */}
      </div>
      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <table className="min-w-full divide-y divide-gray-700">
              <thead>
                <tr>
                  <SortableHeader name="stockNumber" sortConfig={sortConfig} onSort={requestSort}>Stock Number</SortableHeader>
                  <SortableHeader name="description" sortConfig={sortConfig} onSort={requestSort}>Description</SortableHeader>
                  <SortableHeader name="customerName" sortConfig={sortConfig} onSort={requestSort}>Customer</SortableHeader>
                  <SortableHeader name="quantity" sortConfig={sortConfig} onSort={requestSort}>Quantity</SortableHeader>
                  <SortableHeader name="location" sortConfig={sortConfig} onSort={requestSort}>Location</SortableHeader>
                  <SortableHeader name="status" sortConfig={sortConfig} onSort={requestSort}>Status</SortableHeader>
                  <SortableHeader name="inboundDate" sortConfig={sortConfig} onSort={requestSort}>Inbound Date</SortableHeader>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {sortedInventory.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-800/50">
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-white sm:pl-0">{item.stockNumber}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-300">{item.description}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-300">{item.customerName}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-300">{item.quantity}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-300">{item.location}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-300">{item.status}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-300">{new Date(item.inboundDate).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Inventory;