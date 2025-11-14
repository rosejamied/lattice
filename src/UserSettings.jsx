import React, { useState, useEffect } from 'react';
import { Users, Plus, Loader, Edit, Trash } from 'lucide-react';
import * as api from './api.jsx';
import AddUserModal from './AddUserModal';
import EditUserModal from './EditUserModal';

const UserSettings = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [allRoles, setAllRoles] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [fetchedUsers, fetchedRoles] = await Promise.all([
          api.getUsers(),
          api.getRoles()
        ]);
        setUsers(fetchedUsers);
        setAllRoles(fetchedRoles);
        setError(null);
      } catch (err) {
        setError("Failed to load user data.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleAddUser = async (userData) => {
    const newUser = {
      id: Date.now().toString(),
      ...userData,
      createdAt: new Date().toISOString(),
    };

    // Optimistic update
    const tempUser = { ...newUser, id: `temp-${newUser.id}` }; // Use a temporary ID for optimistic update
    setUsers(prevUsers => [...prevUsers, tempUser]);

    try {
      const addedUser = await api.addUser(newUser);
      // Replace temp user with the one from the server
      setUsers(prevUsers => prevUsers.map(u => u.id === tempUser.id ? addedUser : u));
    } catch (err) {
      setError("Failed to add user. Please try again.");
      // Revert optimistic update on failure
      setUsers(prevUsers => prevUsers.filter(u => u.id !== tempUser.id));
      // Show the error for a few seconds
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleOpenEditModal = (user) => {
    setUserToEdit(user);
    setIsEditModalOpen(true);
  };

  const handleUpdateUser = async (id, userData) => {
    try {
      await api.updateUser(id, userData);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, ...userData } : u));
    } catch (err) {
      setError("Failed to update user. Please try again.");
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleDeleteUser = async (id, username) => {
    // Prevent deleting the last user
    if (users.length <= 1) {
      alert("You cannot delete the last user.");
      return;
    }
    if (window.confirm(`Are you sure you want to permanently delete user "${username}"?`)) {
      await api.deleteUser(id);
      setUsers(prev => prev.filter(u => u.id !== id));
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium text-white">User Management</h3>
            <p className="text-sm text-gray-400">Manage user accounts and permissions.</p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <Plus size={18} className="mr-2" />
            Add User
          </button>
        </div>
        <div className="border-t border-gray-700 pt-6">
          {loading && <div className="flex justify-center items-center"><Loader className="animate-spin" /> <span className="ml-2">Loading users...</span></div>}
          {error && <p className="text-center text-red-400">{error}</p>}
          {!loading && !error && users.length === 0 && (
            <div className="text-center text-gray-400">No users found. Click "Add User" to begin.</div>
          )}
          {!loading && users.length > 0 && (
            <div className="overflow-x-auto bg-gray-900/50 rounded-lg">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-700/50">
                  <tr>
                    {['Full Name', 'Username', 'Role', 'Date Added', 'Actions'].map(header => (
                      <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="font-medium text-white">{`${user.firstName} ${user.lastName}`}</div>
                        <div className="text-gray-400">{user.jobTitle}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 font-mono">{user.username}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{user.role}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{new Date(user.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button onClick={() => handleOpenEditModal(user)} className="text-indigo-400 hover:text-indigo-300 p-1 rounded-full hover:bg-gray-600 transition-colors mr-2" title="Edit User">
                          <Edit className="w-5 h-5" />
                        </button>
                        <button onClick={() => handleDeleteUser(user.id, user.username)} className="text-red-400 hover:text-red-300 p-1 rounded-full hover:bg-gray-600 transition-colors" title="Delete User">
                          <Trash className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      <AddUserModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddUser={handleAddUser}
        roles={allRoles}
        existingUsers={users}
      />
      <EditUserModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} onUpdateUser={handleUpdateUser} user={userToEdit} roles={allRoles} />
    </>
  );
};

export default UserSettings;