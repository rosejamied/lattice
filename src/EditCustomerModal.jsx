import React, { useState, useEffect } from 'react';
import { X, Loader, Plus } from 'lucide-react';
import * as api from './api.jsx';

const EditCustomerModal = ({ isOpen, onClose, onUpdate, customer }) => {
  const [name, setName] = useState('');
  const [status, setStatus] = useState('Active');
  const [allSuppliers, setAllSuppliers] = useState([]);
  const [allHauliers, setAllHauliers] = useState([]);
  const [associatedSupplierIds, setAssociatedSupplierIds] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [associatedHaulierIds, setAssociatedHaulierIds] = useState([]);
  const [isAlsoSupplier, setIsAlsoSupplier] = useState(false);
  const [isAlsoHaulier, setIsAlsoHaulier] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newSupplierName, setNewSupplierName] = useState('');
  const [newContractName, setNewContractName] = useState('');

  useEffect(() => {
    if (isOpen && customer) {
      setName(customer.name);
      setStatus(customer.status);
      setLoading(true);
      Promise.all([
        api.getSuppliers(),
        api.getHauliers(),
        api.getCustomerSuppliers(customer.id),
        api.getCustomerHauliers(customer.id),
        api.getCustomerContracts(customer.id),
      ]).then(([suppliers, hauliers, supplierIds, haulierIds, customerContracts]) => {
        setAllSuppliers(suppliers);
        setAllHauliers(hauliers);
        setAssociatedSupplierIds(supplierIds);
        setAssociatedHaulierIds(haulierIds);
        setContracts(customerContracts);
        // Check if this customer exists as a supplier or haulier
        setIsAlsoSupplier(suppliers.some(s => s.id === `supp_from_${customer.id}`));
        setIsAlsoHaulier(hauliers.some(h => h.id === `haul_from_${customer.id}`));
      }).catch(err => {
        console.error("Failed to load data for edit modal", err);
      }).finally(() => {
        setLoading(false);
      });
    }
  }, [isOpen, customer]);

  const handleSupplierToggle = (supplierId) => {
    setAssociatedSupplierIds(prev =>
      prev.includes(supplierId)
        ? prev.filter(id => id !== supplierId)
        : [...prev, supplierId]
    );
  };

  const handleHaulierToggle = (haulierId) => {
    setAssociatedHaulierIds(prev =>
      prev.includes(haulierId)
        ? prev.filter(id => id !== haulierId)
        : [...prev, haulierId]
    );
  };

  const handleAddNewSupplier = async () => {
    if (!newSupplierName.trim()) return;
    const newSupplier = await api.addSupplier({ name: newSupplierName });
    setAllSuppliers(prev => [...prev, newSupplier].sort((a, b) => a.name.localeCompare(b.name)));
    setAssociatedSupplierIds(prev => [...prev, newSupplier.id]);
    setNewSupplierName('');
  };

  const handleAddNewContract = async () => {
    if (!newContractName.trim()) return;
    const newContract = await api.addContract({ name: newContractName, customer_id: customer.id });
    setContracts(prev => [...prev, newContract]);
    setNewContractName('');
  };

  const handleDeleteContract = async (contractId) => {
    if (!window.confirm("Are you sure you want to delete this contract?")) return;
    await api.deleteContract(contractId);
    setContracts(prev => prev.filter(c => c.id !== contractId));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate(customer.id, { name, status, isSupplier: isAlsoSupplier, isHaulier: isAlsoHaulier }, associatedSupplierIds, associatedHaulierIds);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl shadow-2xl p-8 w-full max-w-4xl m-4 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={24} /></button>
        <h2 className="text-2xl font-bold text-white mb-6">Edit: {customer?.name}</h2>
        {loading ? <div className="flex justify-center items-center h-64"><Loader className="animate-spin" /></div> : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Customer Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full p-2 rounded-lg bg-gray-900 text-gray-100 border border-gray-600" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Status</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full p-2 rounded-lg bg-gray-900 text-gray-100 border border-gray-600">
                  <option>Active</option>
                  <option>Archived</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 border-t border-gray-700 pt-4">
              <label className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-700 cursor-pointer">
                <input type="checkbox" checked={isAlsoSupplier} onChange={() => setIsAlsoSupplier(prev => !prev)} className="h-4 w-4 rounded bg-gray-800 border-gray-500 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-gray-300 text-sm">This customer is also a Supplier</span>
              </label>
              <label className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-700 cursor-pointer">
                <input type="checkbox" checked={isAlsoHaulier} onChange={() => setIsAlsoHaulier(prev => !prev)} className="h-4 w-4 rounded bg-gray-800 border-gray-500 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-gray-300 text-sm">This customer is also a Haulier</span>
              </label>
            </div>
            {/* --- Main Content Area: Two Columns --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-gray-700 pt-4">
              {/* Left Column: Suppliers and Hauliers */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Customer's Own Suppliers</label>
                  <div className="max-h-48 overflow-y-auto p-3 bg-gray-900 rounded-lg border border-gray-600 grid grid-cols-1 gap-2">
                    {allSuppliers.map(supplier => (
                      <label key={supplier.id} className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-700 cursor-pointer">
                        <input type="checkbox" checked={associatedSupplierIds.includes(supplier.id)} onChange={() => handleSupplierToggle(supplier.id)} className="h-4 w-4 rounded bg-gray-800 border-gray-500 text-indigo-600 focus:ring-indigo-500" />
                        <span className="text-gray-300 text-sm">{supplier.name}</span>
                      </label>
                    ))}
                  </div>
                  <div className="flex items-center mt-2">
                    <input type="text" value={newSupplierName} onChange={(e) => setNewSupplierName(e.target.value)} placeholder="Add new supplier..." className="flex-grow p-2 text-sm rounded-l-lg bg-gray-700 text-gray-100 border border-gray-600 focus:ring-indigo-500 focus:border-indigo-500" />
                    <button type="button" onClick={handleAddNewSupplier} className="p-2 bg-indigo-600 text-white rounded-r-lg hover:bg-indigo-700"><Plus size={18} /></button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Associated Hauliers</label>
                  <div className="max-h-48 overflow-y-auto p-3 bg-gray-900 rounded-lg border border-gray-600 grid grid-cols-1 gap-2">
                    {allHauliers.map(haulier => (
                      <label key={haulier.id} className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-700 cursor-pointer">
                        <input type="checkbox" checked={associatedHaulierIds.includes(haulier.id)} onChange={() => handleHaulierToggle(haulier.id)} className="h-4 w-4 rounded bg-gray-800 border-gray-500 text-indigo-600 focus:ring-indigo-500" />
                        <span className="text-gray-300 text-sm">{haulier.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Contracts */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Contracts</label>
                <div className="max-h-96 overflow-y-auto p-3 bg-gray-900 rounded-lg border border-gray-600 space-y-2">
                  {contracts.map(contract => (
                    <div key={contract.id} className="flex items-center justify-between p-2 rounded-md bg-gray-700/50">
                      <span className="text-gray-300 text-sm">{contract.name}</span>
                      <button type="button" onClick={() => handleDeleteContract(contract.id)} className="text-red-400 hover:text-red-300 p-1 rounded-full hover:bg-gray-600">
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                  {contracts.length === 0 && <p className="text-xs text-gray-500 text-center">No contracts added yet.</p>}
                </div>
                <div className="flex items-center mt-2">
                  <input type="text" value={newContractName} onChange={(e) => setNewContractName(e.target.value)} placeholder="Add new contract..." className="flex-grow p-2 text-sm rounded-l-lg bg-gray-700 text-gray-100 border border-gray-600 focus:ring-indigo-500 focus:border-indigo-500" />
                  <button type="button" onClick={handleAddNewContract} className="p-2 bg-indigo-600 text-white rounded-r-lg hover:bg-indigo-700"><Plus size={18} /></button>
                </div>
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <button type="button" onClick={onClose} className="px-4 py-2 text-gray-300 hover:text-white">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Save Changes</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default EditCustomerModal;