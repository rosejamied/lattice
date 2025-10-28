import React, { useState, useEffect } from 'react';
import { Users, Plus, Loader, Edit, Trash } from 'lucide-react';
import * as api from './api.js';
import AddUserModal from './AddUserModal';

const UserSettings = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const fetchedUsers = await api.getUsers();
        setUsers(fetchedUsers);
        setError(null);
      } catch (err) {
        setError("Failed to load users.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
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

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium text-white">User Management</h3>
            <p className="text-sm text-gray-400">Manage user accounts and permissions.</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{`${user.firstName} ${user.lastName}`}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 font-mono">{user.username}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{user.role}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{new Date(user.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button className="text-indigo-400 hover:text-indigo-300 p-1 rounded-full hover:bg-gray-600 transition-colors mr-2" title="Edit User (coming soon)">
                          <Edit className="w-5 h-5" />
                        </button>
                        <button className="text-red-400 hover:text-red-300 p-1 rounded-full hover:bg-gray-600 transition-colors" title="Delete User (coming soon)">
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
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddUser={handleAddUser}
        existingUsers={users}
      />
    </>
  );
};

export default UserSettings;