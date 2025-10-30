import React, { useState } from 'react';
import { Upload, Trash2, AlertTriangle, Loader, Calendar, KeyRound } from 'lucide-react';
import * as api from './api.jsx'; // This is already correct
import { usePermissions } from './usePermissions.jsx';
import ImportMappingModal from './ImportMappingModal.jsx';
import Papa from 'papaparse';

const DangerButton = ({ onClick, children }) => (
  <button
    onClick={onClick}
    className="flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 focus:ring-offset-gray-800"
  >
    {children}
  </button>
);

const AdvancedSettings = ({ user, onOpenScheduleSettings, onOpenRolesSettings }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [csvHeaders, setCsvHeaders] = useState([]);
  const [isImporting, setIsImporting] = useState(false);
  const can = usePermissions(user);


  const handleClearData = async (dataType) => {
    const message = `Are you absolutely sure you want to delete ALL ${dataType.toUpperCase()} data? This action is irreversible.`;
    if (window.confirm(message)) {
      if (dataType === 'inventory') {
        try {
          await api.clearInventory();
          alert('All inventory data has been successfully cleared. The page will now reload.');
          window.location.reload();
        } catch (error) {
          console.error(`Failed to clear ${dataType}:`, error);
          alert(`An error occurred while clearing ${dataType}: ${error.message}`);
        }
      } else if (dataType === 'suppliers') {
        try {
          await api.clearSuppliers();
          alert('All supplier data has been successfully cleared.');
        } catch (error) {
          console.error(`Failed to clear ${dataType}:`, error);
          alert(`An error occurred while clearing ${dataType}: ${error.message}`);
        }
      } else if (dataType === 'bookings') {
        try {
          // This part is not yet implemented in the API
          alert(`${dataType} data clearing is not yet implemented.`);
        } catch (error) {
          console.error(`Failed to clear ${dataType}:`, error);
          alert(`An error occurred while clearing ${dataType}: ${error.message}`);
        }
      } else if (dataType === 'hauliers') {
        try {
          await api.clearHauliers();
          alert('All haulier data has been successfully cleared.');
          window.location.reload();
        } catch (error) {
          console.error(`Failed to clear ${dataType}:`, error);
          alert(`An error occurred while clearing ${dataType}: ${error.message}`);
        }
      } else {
        alert(`${dataType} data clearing is not yet implemented.`);
      }
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setCsvFile(file);

    // Use FileReader to read the first line of the CSV for headers
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const firstLine = text.split('\n')[0].trim();
      const headers = firstLine.split(',');
      setCsvHeaders(headers);
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = async (mappings) => {
    if (!csvFile) return;
    setIsImporting(true);

    Papa.parse(csvFile, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const now = new Date().toISOString();
        const newItems = results.data.map(row => ({
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9), // More unique ID
          name: row[mappings.name] || 'N/A',
          sku: row[mappings.sku] || 'N/A',
          quantity: parseInt(row[mappings.quantity], 10) || 0,
          location: row[mappings.location] || 'N/A',
          createdAt: now,
          updatedAt: now,
        }));

        try {
          await api.bulkAddInventory(newItems);
          alert(`${newItems.length} items imported successfully! The page will now reload.`);
          window.location.reload();
        } catch (error) {
          console.error("Failed to import data:", error);
          alert(`Import failed: ${error.message}`);
        } finally {
          setIsImporting(false);
        }
      },
      error: (error) => {
        console.error("CSV parsing error:", error);
        alert(`Failed to parse CSV file: ${error.message}`);
        setIsImporting(false);
      }
    });
  };

  return (
    <>
      <div className="space-y-8">
        {/* --- General Configurations --- */}
        <div>
          <h3 className="text-lg font-medium text-white">General Configuration</h3>
          <p className="text-sm text-gray-400">Configure application-wide settings.</p>
          <div className="mt-4 p-4 bg-gray-900/50 border border-gray-700 rounded-lg space-y-3">
            {can('manage-schedule-settings') && (
              <div className="flex justify-between items-center">
                <p className="text-gray-300">Configure visible days and hours for the schedule.</p>
                <button onClick={onOpenScheduleSettings} className="flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-gray-600 rounded-lg hover:bg-gray-500">
                  <Calendar size={16} className="mr-2" />Schedule Settings
                </button>
              </div>
            )}
            {can('manage-roles') && (
              <div className="flex justify-between items-center">
                <p className="text-gray-300">Define roles and what permissions they have.</p>
                <button onClick={onOpenRolesSettings} className="flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-gray-600 rounded-lg hover:bg-gray-500">
                  <KeyRound size={16} className="mr-2" />Roles & Permissions
                </button>
              </div>
            )}
          </div>
        </div>

        {/* --- Import Data Section --- */}
        <div>
          <h3 className="text-lg font-medium text-white">Import Data</h3>
          <p className="text-sm text-gray-400">Import data from a CSV file from a previous system.</p>
          <div className="mt-4 p-4 border border-dashed border-gray-600 rounded-lg space-y-4">
            <div className="flex items-center">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-600 file:text-white hover:file:bg-gray-500"
              />
            </div>
            <div className="flex space-x-4">
              <button onClick={() => setIsModalOpen(true)} disabled={!csvFile || isImporting} className="flex items-center justify-center w-40 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-500 disabled:cursor-not-allowed">
                {isImporting ? (
                  <Loader size={18} className="animate-spin" />
                ) : (
                  <><Upload size={18} className="mr-2" /> Import Inventory</>
                )}
              </button>
              {/* Bookings import button can be implemented similarly */}
            </div>
          </div>
        </div>

        {/* --- Danger Zone --- */}
        {can('manage-settings') && (
          <div className="border-t border-red-500/30 pt-6">
            <h3 className="text-lg font-medium text-red-400 flex items-center"><AlertTriangle className="mr-2" />Danger Zone</h3>
            <p className="text-sm text-gray-400">These actions are destructive and cannot be undone.</p>
            <div className="mt-4 p-4 bg-red-900/20 border border-red-500/30 rounded-lg space-y-3">
              <div className="flex justify-between items-center">
                <p className="text-gray-300">Clear all inventory data.</p>
                <DangerButton onClick={() => handleClearData('inventory')}><Trash2 size={16} className="mr-2" />Clear Inventory</DangerButton>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-gray-300">Clear all schedule & booking data.</p>
                <DangerButton onClick={() => handleClearData('bookings')}><Trash2 size={16} className="mr-2" />Clear Bookings</DangerButton>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-gray-300">Clear all supplier data.</p>
                <DangerButton onClick={() => handleClearData('suppliers')}><Trash2 size={16} className="mr-2" />Clear Suppliers</DangerButton>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-gray-300">Clear all haulier data.</p>
                <DangerButton onClick={() => handleClearData('hauliers')}><Trash2 size={16} className="mr-2" />Clear Hauliers</DangerButton>
              </div>
            </div>
          </div>
        )}
      </div>
      <ImportMappingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmImport}
        csvHeaders={csvHeaders}
      />
    </>
  );
};

export default AdvancedSettings;