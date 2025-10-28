import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const AddUserModal = ({ isOpen, onClose, onAddUser, existingUsers }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState('Operator');
  const [password, setPassword] = useState('');
  const [generatedUsername, setGeneratedUsername] = useState('');

  // Auto-generate username when names change
  useEffect(() => {
    if (lastName && firstName) {
      const baseUsername = `${lastName.toLowerCase()}${firstName.charAt(0).toLowerCase()}`.replace(/[^a-z0-9]/gi, '');
      let username = baseUsername;
      let counter = 1;
      const existingUsernames = new Set(existingUsers.map(u => u.username));

      while (existingUsernames.has(username)) {
        username = `${baseUsername}${counter}`;
        counter++;
      }
      setGeneratedUsername(username);
    } else {
      setGeneratedUsername('');
    }
  }, [firstName, lastName, existingUsers]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!firstName || !lastName || !password || !role) {
      alert('Please fill out all fields.');
      return;
    }
    onAddUser({
      firstName,
      lastName,
      role,
      password,
      username: generatedUsername,
    });
    // Reset form and close
    setFirstName('');
    setLastName('');
    setRole('Operator');
    setPassword('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
      <div className="bg-gray-800 rounded-xl shadow-2xl p-8 w-full max-w-md m-4 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
          <X size={24} />
        </button>
        <h2 className="text-2xl font-bold text-white mb-6">Add New User</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1" htmlFor="firstName">First Name</label>
              <input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full p-2 rounded-lg bg-gray-900 text-gray-100 border border-gray-600 focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1" htmlFor="lastName">Last Name</label>
              <input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full p-2 rounded-lg bg-gray-900 text-gray-100 border border-gray-600 focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Generated Username</label>
            <input
              type="text"
              value={generatedUsername}
              className="w-full p-2 rounded-lg bg-gray-700 text-gray-300 border border-gray-600 cursor-not-allowed"
              readOnly
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1" htmlFor="role">Role</label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full p-2 rounded-lg bg-gray-900 text-gray-100 border border-gray-600 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option>Operator</option>
              <option>Manager</option>
              <option>Admin</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 rounded-lg bg-gray-900 text-gray-100 border border-gray-600 focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
          <div className="flex justify-end pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-300 hover:text-white">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Add User</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddUserModal;