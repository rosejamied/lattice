import React, { useState } from 'react';
import { Upload, Trash2, AlertTriangle, Loader, Calendar, KeyRound } from 'lucide-react';
import * as api from './api.jsx'; // This is already correct
import { usePermissions } from './usePermissions.jsx';
import ImportMappingModal from './ImportMappingModal';
import * as XLSX from 'xlsx'; // Import the new library

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
  const [initialMappings, setInitialMappings] = useState({});
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const can = usePermissions(user);
  const [savedMaps, setSavedMaps] = useState([]);

  // Load saved maps from localStorage on component mount
  useState(() => {
    const maps = localStorage.getItem('lattice-import-maps');
    if (maps) {
      setSavedMaps(JSON.parse(maps));
    }
  }, []);

  const handleSaveMap = (newMap) => {
    const updatedMaps = [...savedMaps.filter(m => m.name !== newMap.name), newMap];
    setSavedMaps(updatedMaps);
    localStorage.setItem('lattice-import-maps', JSON.stringify(updatedMaps));
  };

  // Helper to show more detailed error messages from the server
  const showDetailedError = (dataType, error) => {
    const serverMessage = error.response?.data?.message || error.response?.data?.error;
    const errorMessage = serverMessage ? `${error.message}. Server says: "${serverMessage}"` : error.message;
    
    console.error(`Failed to clear ${dataType}:`, error);
    alert(`An error occurred while clearing ${dataType}: ${errorMessage}`);
  };

  const handleClearData = async (dataType) => {
    const message = `Are you absolutely sure you want to delete ALL ${dataType.toUpperCase()} data? This action is irreversible.`;
    if (window.confirm(message)) {
      if (dataType === 'inventory') {
        try {
          await api.clearInventory();
          alert('All inventory data has been successfully cleared. The page will now reload.');
          window.location.reload();
        } catch (error) {
          showDetailedError(dataType, error);
        }
      } else if (dataType === 'suppliers') {
        try {
          await api.clearSuppliers();
          alert('All supplier data has been successfully cleared.');
        } catch (error) {
          showDetailedError(dataType, error);
        }
      } else if (dataType === 'bookings') {
        try {
          await api.clearBookings();
          alert('All booking data has been successfully cleared.');
        } catch (error) {
          showDetailedError(dataType, error);
        }
      } else if (dataType === 'hauliers') {
        try {
          await api.clearHauliers();
          alert('All haulier data has been successfully cleared.');
        } catch (error) {
          showDetailedError(dataType, error);
        }
      } else if (dataType === 'orders') {
        try {
          await api.clearOrders();
          alert('All order data has been successfully cleared.');
        } catch (error) {
          showDetailedError(dataType, error);
        }
      } else if (dataType === 'all-except-users') {
        try {
          await api.clearAllDataExceptUsers();
          alert('All application data has been cleared. Users and roles have been preserved. The page will now reload.');
          window.location.reload();
        } catch (error) { showDetailedError('all data', error); }
      } else {
        alert(`${dataType} data clearing is not yet implemented.`);
      }
    }
  };

  const openImportModal = () => {
    if (!csvFile) return;
    // Set initial mappings to an empty object to disable auto-mapping.
    // This ensures the user must manually map all fields.
    setInitialMappings({});
    setIsModalOpen(true);
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setCsvFile(file);

    // Use FileReader and xlsx library to read the spreadsheet headers
    const reader = new FileReader();
    reader.onload = (event) => {
      const data = event.target.result;
      const workbook = XLSX.read(data, { type: 'array', cellDates: true });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      // 'header: 1' reads the first row into an array of strings
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      if (jsonData.length > 0) {
        setCsvHeaders(jsonData[0]); // The first row is the headers
      }
    };
    // Read the file as an ArrayBuffer, which is suitable for binary spreadsheet files
    reader.readAsArrayBuffer(file);
  };

  const handleConfirmImport = async (mappings) => {
    if (!csvFile) return;
    setIsImporting(true);
    setImportProgress(0);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = event.target.result;
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        const results = XLSX.utils.sheet_to_json(worksheet, { header: csvHeaders, range: 1 });

        const itemsToProcess = results.map(row => {
          // This mapping logic remains the same, as it correctly sanitizes the data.
          const newItem = {
            id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // Create a robust unique ID
            customerName: row[mappings.customerName] || 'Unknown Customer',
            stockNumber: row[mappings.stockNumber] || 'N/A',
            description: row[mappings.description] || 'N/A',
            quantity: parseInt(row[mappings.quantity], 10) || 0,
            location: row[mappings.location] || 'N/A',
            inboundOrderNumber: row[mappings.inboundOrderNumber] || null,
            inboundDate: (() => {
              const dateValue = row[mappings.inboundDate];
              if (dateValue) {
                const parsedDate = new Date(dateValue);
                if (!isNaN(parsedDate.getTime())) {
                  return parsedDate.toISOString();
                }
              }
              return null; // If no date value or invalid, store as null
            })(),
            inboundReference: row[mappings.inboundReference] || 'N/A',
            storageCostPerWeek: parseFloat(row[mappings.storageCostPerWeek]) || 0,
            rhdIn: parseFloat(row[mappings.rhdIn]) || 0,
            rhdOut: parseFloat(row[mappings.rhdOut]) || 0,
            originalBookingReference: String(row[mappings.bookingReference] || ''), // Ensure it's a string
            originalOrderDate: (() => {
              const dateValue = row[mappings.orderDate];
              if (dateValue) {
                const parsedDate = new Date(dateValue);
                if (!isNaN(parsedDate.getTime())) {
                  // Set time to the beginning of the day to store date only.
                  parsedDate.setHours(0, 0, 0, 0);
                  return parsedDate.toISOString();
                }
              }
              return null; // Return null if date is invalid or not present
            })(),
            originalTimeBooked: (() => {
              const timeValue = row[mappings.timeBooked];
              if (timeValue) {
                if (timeValue instanceof Date) return timeValue.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
                if (typeof timeValue === 'number') {
                  // Handle Excel's time format (fraction of a day)
                  const totalSeconds = Math.round(timeValue * 24 * 60 * 60);
                  const hours = Math.floor(totalSeconds / 3600);
                  const minutes = Math.floor((totalSeconds % 3600) / 60);
                  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
                }
                return String(timeValue);
              }
              return null; // Return null if time is not present
            })(),
          };

          // --- Status Logic (Corrected) ---
          const hasOutboundOrder = newItem.originalBookingReference || newItem.originalOrderDate;
          if (hasOutboundOrder && newItem.originalOrderDate) { // Only check if a valid date exists
            // Combine the clean date and time for an accurate comparison
            const outboundDateTime = new Date(newItem.originalOrderDate); // Already set to 00:00
            if (newItem.originalTimeBooked) {
              const timeParts = newItem.originalTimeBooked.split(':');
              if (timeParts.length === 2) {
                outboundDateTime.setHours(parseInt(timeParts[0], 10), parseInt(timeParts[1], 10));
              }
            }
            
            if (outboundDateTime < new Date()) { // Compare against the current moment
              newItem.status = 'Dispatched';
            } else {
              newItem.status = 'Allocated';
            }
          } else {
            newItem.status = 'In Stock'; // Default status if no outbound details
          }

          return newItem;
        });

        // The entire complex multi-step process is replaced by a single API call.
        console.log("Sending processed items to the new smart import endpoint:", itemsToProcess);
        setImportProgress(50); // Set progress to 50% before the single API call

        await api.processFullImport(itemsToProcess);

        setImportProgress(100);

        alert(`Import complete! ${itemsToProcess.length} items were processed successfully. The page will now reload.`);
        window.location.reload();
      } catch (error) {
        console.error("Failed to import data:", error);
        const serverMessage = error.response?.data?.message || error.message;
        alert(`Import failed: ${serverMessage}`);
      } finally {
        setIsImporting(false);
      }
    };
    reader.readAsArrayBuffer(csvFile);
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
            <div className="flex flex-col">
              <label htmlFor="inventory-import-file" className="sr-only">Select import file</label>
              <input
                id="inventory-import-file"
                name="inventory-import-file"
                type="file"
                accept=".csv, .xls, .xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-600 file:text-white hover:file:bg-gray-500"
              />
            </div>
            <div className="flex space-x-4">
              <button onClick={openImportModal} disabled={!csvFile || isImporting} className="flex items-center justify-center w-40 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-500 disabled:cursor-not-allowed">
                {isImporting ? (
                  <>
                    <Loader size={18} className="animate-spin mr-2" />
                    <span>{importProgress}%</span>
                  </>
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
                <p className="text-gray-300 font-semibold">Clear All Data (Keep Users & Roles)</p>
                <DangerButton onClick={() => handleClearData('all-except-users')}><Trash2 size={16} className="mr-2" />Master Reset</DangerButton>
              </div>
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
              <div className="flex justify-between items-center">
                <p className="text-gray-300">Clear all order data.</p>
                <DangerButton onClick={() => handleClearData('orders')}><Trash2 size={16} className="mr-2" />Clear Orders</DangerButton>
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
        initialMappings={initialMappings}
        savedMaps={savedMaps}
        onSaveMap={handleSaveMap}
      />
    </>
  );
};

export default AdvancedSettings;