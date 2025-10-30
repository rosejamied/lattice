import React, { useState, useEffect } from 'react';
import { PERMISSIONS, ROLES, ROLE_PERMISSIONS } from './permissions.js';
import * as api from './api.jsx';
import { Loader, Plus } from 'lucide-react';

const RoleSettings = ({ onClose }) => {
  const [rolePermissions, setRolePermissions] = useState({});
  const [allRoles, setAllRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newRoleName, setNewRoleName] = useState('');
  const [selectedRole, setSelectedRole] = useState('');

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const [fetchedRoles, fetchedPermissions] = await Promise.all([
          api.getRoles(),
          api.getRolePermissions()
        ]);

        // If the roles table is empty, seed it with the default roles.
        if (fetchedRoles.length === 0) {
          const defaultRoles = Object.values(ROLES);
          await Promise.all(defaultRoles.map(role => api.addRole(role)));
          setAllRoles(defaultRoles);
          // Set initial selected role
          if (defaultRoles.length > 0) setSelectedRole(defaultRoles[0]);
        } else {
          setAllRoles(fetchedRoles);
        }

        // If the permissions table is empty, seed it with default permissions.
        if (Object.keys(fetchedPermissions).length === 0 && fetchedRoles.length === 0) {
          // Only seed permissions if both roles and permissions are empty to avoid race conditions
          setRolePermissions(ROLE_PERMISSIONS); // Set state for immediate UI update
          await api.updateRolePermissions(ROLE_PERMISSIONS); // Save to DB
        } else {
          setRolePermissions(fetchedPermissions);
        }

        if (fetchedRoles.length > 0 && !selectedRole) {
          setSelectedRole(fetchedRoles[0]);
        }
      } catch (error) { console.error("Failed to load permissions", error); }
      finally { setLoading(false); }
    };
    fetchPermissions();
  }, []);

  const handlePermissionChange = (role, permission) => {
    const currentPermissions = rolePermissions[role] || [];
    const newPermissions = currentPermissions.includes(permission)
      ? currentPermissions.filter(p => p !== permission)
      : [...currentPermissions, permission];

    setRolePermissions(prev => ({
      ...prev,
      [role]: newPermissions,
    }));
  };

  const handleSaveChanges = () => {
    api.updateRolePermissions(rolePermissions)
      .then(() => {
        alert("Permissions saved successfully!");
        onClose(); // Close the modal on successful save
      })
      .catch(err => alert(`Failed to save permissions: ${err.message}`));
  };

  const handleAddRole = async () => {
    if (!newRoleName.trim() || allRoles.includes(newRoleName.trim())) {
      alert("Role name cannot be empty or a duplicate.");
      return;
    }
    const newRole = await api.addRole(newRoleName.trim());
    // After adding, select the new role
    setAllRoles(prev => [...prev, newRole.name].sort());
    setSelectedRole(newRole.name);
    setNewRoleName('');
  };

  if (loading) {
    return <div className="flex justify-center items-center h-48"><Loader className="animate-spin" /></div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-medium text-white">Role Management</h3>
        <p className="text-sm text-gray-400">Define what users in each role are allowed to do.</p>
      </div>
      <div className="border-t border-gray-700 pt-6">
        <h4 className="font-semibold text-gray-300 mb-2">Add New Role</h4>
        <div className="flex items-center">
          <input
            type="text"
            value={newRoleName}
            onChange={(e) => setNewRoleName(e.target.value)}
            placeholder="Enter new role name..."
            className="flex-grow p-2 text-sm rounded-l-lg bg-gray-700 text-gray-100 border border-gray-600 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <button type="button" onClick={handleAddRole} className="p-2 bg-indigo-600 text-white rounded-r-lg hover:bg-indigo-700"><Plus size={18} /></button>
        </div>
      </div>
      <div className="border-t border-gray-700 pt-6">
        <div className="flex items-center gap-4 mb-4">
          <label htmlFor="roleSelect" className="text-sm font-medium text-gray-300">Editing Permissions For:</label>
          <select
            id="roleSelect"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="p-2 rounded-lg bg-gray-700 text-gray-100 border border-gray-600 focus:ring-indigo-500 focus:border-indigo-500"
          >
            {allRoles.map(role => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
        </div>

        {selectedRole && (
          <div className="p-4 bg-gray-900/50 rounded-lg">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(PERMISSIONS).map(([key, permission]) => (
                <label key={permission} className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rolePermissions[selectedRole]?.includes(permission) || false}
                    onChange={() => handlePermissionChange(selectedRole, permission)}
                    className="h-4 w-4 rounded bg-gray-800 border-gray-500 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <span className="text-sm text-gray-300">
                    {permission.replace(/-/g, ' ')}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="flex justify-end pt-4">
        <button
          onClick={handleSaveChanges}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
};

export default RoleSettings;