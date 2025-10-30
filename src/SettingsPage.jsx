import React, { useState } from 'react';
import { Settings, Calendar, Users, ShieldAlert, Building, KeyRound, X } from 'lucide-react';
import { usePermissions } from './usePermissions';
import UserSettings from './UserSettings';
import AdvancedSettings from './AdvancedSettings';
import CustomerSettings from './CustomerSettings';
import RoleSettings from './RoleSettings';

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const ScheduleSettings = ({ settings, onSettingsChange }) => {
  const handleDayToggle = (dayIndex) => {
    const newVisibleDays = settings.visibleDays.includes(dayIndex)
      ? settings.visibleDays.filter(d => d !== dayIndex)
      : [...settings.visibleDays, dayIndex];
    onSettingsChange({ ...settings, visibleDays: newVisibleDays });
  };

  const handleHourChange = (e) => {
    const { name, value } = e.target;
    onSettingsChange({ ...settings, [name]: parseInt(value) });
  };

  const hourOptions = Array.from({ length: 24 }).map((_, i) => (
    <option key={i} value={i}>{`${i.toString().padStart(2, '0')}:00`}</option>
  ));

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-white">Visible Days</h3>
        <p className="text-sm text-gray-400">Select the days to display on the weekly schedule.</p>
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {dayNames.map((day, index) => (
            <label key={day} className="flex items-center space-x-3 p-3 bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-700">
              <input
                type="checkbox"
                checked={settings.visibleDays.includes(index)}
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
              value={settings.startHour}
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
              value={settings.endHour}
              onChange={handleHourChange}
              className="w-full p-2 rounded-lg bg-gray-900 text-gray-100 border border-gray-600 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {hourOptions}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

const SettingsPage = ({ user, scheduleSettings, onScheduleSettingsChange }) => {
  const [activeTab, setActiveTab] = useState('customers');
  const can = usePermissions(user);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isRolesModalOpen, setIsRolesModalOpen] = useState(false);

  const allTabs = [
    { id: 'customers', label: 'Customers', icon: Building, permission: 'manage-customers' },
    { id: 'users', label: 'Users', icon: Users, permission: 'manage-users' },
    { id: 'advanced', label: 'Advanced', icon: ShieldAlert, permission: 'manage-settings' },
  ];

  const visibleTabs = allTabs.filter(tab => !tab.permission || can(tab.permission));

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
        {activeTab === 'advanced' && (
          <AdvancedSettings 
            user={user}
            onOpenScheduleSettings={() => setIsScheduleModalOpen(true)}
            onOpenRolesSettings={() => setIsRolesModalOpen(true)}
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
            <button onClick={() => setIsScheduleModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={24} /></button>
            <ScheduleSettings settings={scheduleSettings} onSettingsChange={onScheduleSettingsChange} />
          </div>
        </div>
      )}

      {/* Roles Settings Modal */}
      {isRolesModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl shadow-2xl p-8 w-full max-w-4xl m-4 relative">
            <button onClick={() => setIsRolesModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={24} /></button>
            <RoleSettings onClose={() => setIsRolesModalOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;