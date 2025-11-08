import React, { useState, useMemo } from 'react';
import { Plus, List, Loader, Edit, Trash, Filter, ArrowUp, ArrowDown, PackagePlus } from 'lucide-react';
import InventoryForm from './InventoryForm';
import InventoryDetailModal from './InventoryDetailModal';

const SortableHeader = ({ children, name, sortConfig, onSort }) => {
  const isSorted = sortConfig.key === name;
  const direction = isSorted ? sortConfig.direction : undefined;

  return (
    <th
      scope="col"
      className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-600/50 transition-colors"
      onClick={() => onSort(name)}
    >
      <div className="flex items-center group">
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

const InventoryList = ({ inventory, customers, onSave, onDelete, loading, error, onInitiateOrderCreation }) => {
  const [view, setView] = useState('active'); // 'active' or 'archived'
  const [searchTerm, setSearchTerm] = useState('');
  const [customerFilter, setCustomerFilter] = useState(''); // State for the customer filter
  const [sortConfig, setSortConfig] = useState({ key: 'stockNumber', direction: 'ascending' });
  
  // State management moved from the deleted page
  const [currentView, setCurrentView] = useState('list'); // 'list' or 'form'
  const [itemToEdit, setItemToEdit] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [itemToView, setItemToView] = useState(null);

  const filteredInventory = useMemo(() => {
    let items = Array.isArray(inventory) ? [...inventory] : [];

    // First, filter by view (active or archived) based on the 'view' state
    if (view === 'active') {
      items = items.filter(item => item.status !== 'Dispatched');
    } else {
      items = items.filter(item => item.status === 'Dispatched');
    }

    // Apply customer filter first
    if (customerFilter) {
      items = items.filter(item => item.customer_id === customerFilter);
    }

    // Then apply search term filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      items = items.filter(item => 
        (item.stockNumber && item.stockNumber.toLowerCase().includes(term)) ||
        (item.inboundOrderNumber && item.inboundOrderNumber.toLowerCase().includes(term)) ||
        (item.description && item.description.toLowerCase().includes(term))
      );
    }

    // Apply sorting
    if (sortConfig.key !== null) {
      items.sort((a, b) => {
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

    return items;
  }, [inventory, searchTerm, customerFilter, sortConfig, view]);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'In Stock':
        return 'bg-green-500/20 text-green-300';
      case 'Allocated':
        return 'bg-yellow-500/20 text-yellow-300';
      case 'Dispatched':
        return 'bg-gray-500/20 text-gray-400';
      default:
        return 'bg-gray-600/20 text-gray-300';
    }
  };

  // Handler functions moved from the deleted page
  const handleEdit = (item) => {
    setItemToEdit(item);
    setCurrentView('form');
  };

  const handleAddNew = () => {
    setItemToEdit(null);
    setCurrentView('form');
  };

  const handleCancelForm = () => {
    setItemToEdit(null);
    setCurrentView('list');
  };

  const handleViewDetails = (item) => {
    setItemToView(item);
    setIsDetailModalOpen(true);
  };

  const handleSaveAndCloseForm = (itemData) => {
    onSave(itemData);
    setCurrentView('list');
  };

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-3xl font-bold text-white flex items-center">
        <List className="w-6 h-6 mr-2 text-indigo-400" />
        Current Inventory
      </h1>

      {currentView === 'list' ? (
        <>
          {/* --- View Toggle --- */}
          <div className="flex border-b border-gray-700">
            <button 
              onClick={() => setView('active')} 
              className={`px-4 py-2 text-sm font-medium transition-colors ${view === 'active' ? 'border-b-2 border-indigo-500 text-white' : 'text-gray-400 hover:text-white'}`}
            >Active Inventory</button>
            <button 
              onClick={() => setView('archived')} 
              className={`px-4 py-2 text-sm font-medium transition-colors ${view === 'archived' ? 'border-b-2 border-indigo-500 text-white' : 'text-gray-400 hover:text-white'}`}
            >Dispatched Archive</button>
          </div>

          {/* --- Filter and Action Bar --- */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Customer Filter */}
            <div className="flex-grow">
              <label htmlFor="customer-filter" className="sr-only">Filter by Customer</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Filter className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  id="customer-filter"
                  value={customerFilter}
                  onChange={(e) => setCustomerFilter(e.target.value)}
                  className="w-full p-3 pl-10 rounded-xl bg-gray-800 text-gray-100 border border-gray-700 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                >
                  <option value="">All Customers</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>

            {/* Search Input */}
            <input
              type="text"
              placeholder="Search within selection..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-grow p-3 rounded-xl bg-gray-800 text-gray-100 border border-gray-700 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            />

            {/* Add Pallet Button */}
            <button
              onClick={handleAddNew}
              className="flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 transition-colors font-medium shadow-md shadow-indigo-500/50 whitespace-nowrap"
            >
              <Plus className="w-5 h-5 mr-2" /> Add Pallet
            </button>
          </div>

          {loading && (
            <div className="flex justify-center items-center py-10 text-indigo-400">
              <Loader className="w-8 h-8 animate-spin mr-2" /> Loading Local Data...
            </div>
          )}

          {error && <p className="text-red-400 p-4 bg-red-900/50 rounded-lg">{error}</p>}

          <div className="overflow-x-auto bg-gray-800 rounded-xl shadow-lg">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-700/50">
                <tr>
                  <SortableHeader name="stockNumber" sortConfig={sortConfig} onSort={requestSort}>Stock Number</SortableHeader>
                  <SortableHeader name="inboundOrderNumber" sortConfig={sortConfig} onSort={requestSort}>Order Number</SortableHeader>
                  <SortableHeader name="description" sortConfig={sortConfig} onSort={requestSort}>Description</SortableHeader>
                  <SortableHeader name="quantity" sortConfig={sortConfig} onSort={requestSort}>Qty</SortableHeader>
                  <SortableHeader name="location" sortConfig={sortConfig} onSort={requestSort}>Stock Location</SortableHeader>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                  <SortableHeader name="inboundDate" sortConfig={sortConfig} onSort={requestSort}>Inbound Date</SortableHeader>
                  <SortableHeader name="inboundReference" sortConfig={sortConfig} onSort={requestSort}>Reference Number</SortableHeader>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {Array.isArray(filteredInventory) && filteredInventory.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-700/50 transition-colors cursor-pointer" onClick={() => handleViewDetails(item)}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{item.stockNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{item.inboundOrderNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{item.description}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 font-bold">{item.quantity}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{item.location}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(item.status)}`}>{item.status}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{item.inboundDate ? new Date(item.inboundDate).toLocaleDateString('en-GB') : 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{item.inboundReference}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={(e) => { e.stopPropagation(); handleEdit(item); }} className="text-indigo-400 hover:text-indigo-300 p-1 rounded-full hover:bg-gray-600 transition-colors mr-2" title="Edit Pallet"><Edit className="w-5 h-5" /></button>
                      <button onClick={(e) => { e.stopPropagation(); onInitiateOrderCreation(item);}} className="text-green-400 hover:text-green-300 p-1 rounded-full hover:bg-gray-600 transition-colors mr-2" title="Create Order"><PackagePlus className="w-5 h-5" /></button>
                      <button onClick={(e) => { e.stopPropagation(); onDelete(item); }} className="text-red-400 hover:text-red-300 p-1 rounded-full hover:bg-gray-600 transition-colors" title="Delete Pallet"><Trash className="w-5 h-5" /></button>
                    </td>
                  </tr>
                ))}
                {(!Array.isArray(filteredInventory) || filteredInventory.length === 0) && !loading && (
                  <tr><td colSpan="9" className="px-6 py-4 text-center text-gray-400">{searchTerm || customerFilter ? "No pallets found matching your filters." : "No pallets in stock. Start by adding one!"}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <InventoryForm itemToEdit={itemToEdit} onSave={handleSaveAndCloseForm} onCancel={handleCancelForm} />
      )}
      <InventoryDetailModal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} item={itemToView} customers={customers} />
    </div>
  );
};

export default InventoryList;