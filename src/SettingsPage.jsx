import React, { useState } from 'react';
import { Settings, Calendar, Users, ShieldAlert, Building, KeyRound, X, LayoutGrid } from 'lucide-react';
import UserSettings from './UserSettings';
import CustomerSettings from './CustomerSettings';
import AdvancedSettings from './AdvancedSettings'; // Keep AdvancedSettings
import WarehouseVisualizer from './WarehouseVisualizer'; // Import the new component

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const ScheduleSettings = ({ settings, onSettingsChange }) => {
  const [localSettings, setLocalSettings] = useState(settings);

  const handleDayToggle = (dayIndex) => {
    const newVisibleDays = localSettings.visibleDays.includes(dayIndex)
      ? localSettings.visibleDays.filter(d => d !== dayIndex)
      : [...localSettings.visibleDays, dayIndex];
    setLocalSettings({ ...localSettings, visibleDays: newVisibleDays });
  };

  const handleHourChange = (e) => {
    const { name, value } = e.target;
    setLocalSettings({ ...localSettings, [name]: parseInt(value) });
  };

  const handleSave = () => {
    onSettingsChange(localSettings);
  };

  const hourOptions = Array.from({ length: 24 }).map((_, i) => (
    <option key={i} value={i}>{`${i.toString().padStart(2, '0')}:00`}</option>
  ));

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Schedule Display Settings</h2>
      <div>
        <h3 className="text-lg font-medium text-white">Visible Days</h3>
        <p className="text-sm text-gray-400">Select the days to display on the weekly schedule.</p>
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {dayNames.map((day, index) => (
            <label key={day} className="flex items-center space-x-3 p-3 bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-700">
              <input
                type="checkbox"
                checked={localSettings.visibleDays.includes(index)}
                onChange={() => handleDayToggle(index)}
                className="h-5 w-5 rounded bg-gray-800 border-gray-600 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-gray-300">{day}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="border-t border-gray-700 pt-6">
        <h3 className="text-lg font-medium text-white">Visible Hours</h3>
        <p className="text-sm text-gray-400">Set the start and end times for the daily schedule view.</p>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label htmlFor="startHour" className="block text-sm font-medium text-gray-300 mb-1">Start Hour</label>
            <select
              id="startHour"
              name="startHour"
              value={localSettings.startHour}
              onChange={handleHourChange}
              className="w-full p-2 rounded-lg bg-gray-900 text-gray-100 border border-gray-600 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {hourOptions}
            </select>
          </div>
          <div>
            <label htmlFor="endHour" className="block text-sm font-medium text-gray-300 mb-1">End Hour</label>
            <select
              id="endHour"
              name="endHour"
              value={localSettings.endHour}
              onChange={handleHourChange}
              className="w-full p-2 rounded-lg bg-gray-900 text-gray-100 border border-gray-600 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {hourOptions}
            </select>
          </div>
        </div>
      </div>
      <div className="flex justify-end pt-4 border-t border-gray-700">
        <button
          onClick={handleSave}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-gray-800"
        >
          Save Settings
        </button>
      </div>
    </div>
  );
};

const SettingsPage = ({ user, scheduleSettings, onScheduleSettingsChange }) => {
  const [activeTab, setActiveTab] = useState('customers');
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false); // Keep schedule modal state

  const allTabs = [ // All tabs are now always visible
    { id: 'customers', label: 'Customers', icon: Building },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'layout', label: 'Layout', icon: LayoutGrid },
    { id: 'advanced', label: 'Advanced', icon: ShieldAlert },
  ];
  const visibleTabs = allTabs;

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-3xl font-bold text-white flex items-center">
        <Settings className="w-6 h-6 mr-3 text-indigo-400" />
        Settings
      </h1>

      <div className="flex border-b border-gray-700">
        {visibleTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center px-4 py-2 text-sm font-medium transition-colors
              ${activeTab === tab.id
                ? 'border-b-2 border-indigo-500 text-white'
                : 'text-gray-400 hover:text-white'
              }
            `}
          >
            <tab.icon className="w-4 h-4 mr-2" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
        {activeTab === 'users' && (
          <UserSettings user={user} />
        )}
        {activeTab === 'layout' && (
          <WarehouseVisualizer />
        )}
        {activeTab === 'advanced' && (
          <AdvancedSettings 
            user={user}
            onOpenScheduleSettings={() => setIsScheduleModalOpen(true)} // Keep schedule settings handler
          />
        )}
        {activeTab === 'customers' && (
          <CustomerSettings />
        )}
      </div>

      {/* Schedule Settings Modal */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl shadow-2xl p-8 w-full max-w-4xl m-4 relative">
            <button onClick={() => setIsScheduleModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"><X size={24} /></button>
            <ScheduleSettings 
              settings={scheduleSettings} 
              onSettingsChange={(newSettings) => { onScheduleSettingsChange(newSettings); setIsScheduleModalOpen(false); }} 
            />
          </div>
        </div>
      )}

    </div>
  );
};

export default SettingsPage;