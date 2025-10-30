import React, { useState, useEffect } from 'react';
import { X, KeyRound } from 'lucide-react';
import * as api from './api.jsx';
import ChangePasswordModal from './ChangePasswordModal';
import { ROLES } from './permissions';

const EditUserModal = ({ isOpen, onClose, onUpdateUser, user, roles }) => {
  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState('Operator');
  const [jobTitle, setJobTitle] = useState('');
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  useEffect(() => {
    if (user) {
      setUsername(user.username);
      setFirstName(user.firstName);
      setLastName(user.lastName);
      setRole(user.role);
      setJobTitle(user.jobTitle || '');
    }
  }, [user]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!firstName || !lastName || !role || !jobTitle) {
      alert('Please fill out all fields.');
      return;
    }
    onUpdateUser(user.id, { username, firstName, lastName, role, jobTitle });
    onClose();
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
      <div className="bg-gray-800 rounded-xl shadow-2xl p-8 w-full max-w-md m-4 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
          <X size={24} />
        </button>
        <h2 className="text-2xl font-bold text-white mb-6">Edit User</h2>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1" htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-2 rounded-lg bg-gray-900 text-gray-100 border border-gray-600 focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1" htmlFor="role">Role</label>
              <input
                id="role"
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                className="w-full p-2 rounded-lg bg-gray-900 text-gray-100 border border-gray-600 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="e.g., Warehouse Operative"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1" htmlFor="permissionLevel">Permission Level</label>
            <select
              id="permissionLevel"
              value={role} // This still controls the permission role
              onChange={(e) => setRole(e.target.value)}
              className="w-full p-2 rounded-lg bg-gray-900 text-gray-100 border border-gray-600 focus:ring-indigo-500 focus:border-indigo-500"
              required
            >{roles.map(r => <option key={r} value={r}>{r}</option>)}</select>
          </div>
          <div>
            <button type="button" onClick={() => setIsPasswordModalOpen(true)} className="w-full flex items-center justify-center mt-2 px-4 py-2 text-sm text-indigo-300 border border-indigo-500/50 rounded-lg hover:bg-indigo-500/20">
              <KeyRound size={16} className="mr-2" />
              Change Password
            </button>
          </div>
          <div className="flex justify-end pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-300 hover:text-white">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Save Changes</button>
          </div>
        </form>
        <ChangePasswordModal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} onSave={api.changeUserPassword} user={user} />
      </div>
    </div>
  );
};

export default EditUserModal;