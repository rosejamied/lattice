import React, { useState } from 'react';
import { Zap, UserPlus } from 'lucide-react';

const InitialSetupPage = ({ onSetupComplete, api }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    password: '',
    jobTitle: 'Manager',
    permissions: ['admin'] // Grant admin permissions by default
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.username || !formData.password || !formData.firstName || !formData.lastName) {
      setError('All fields are required.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // This API call should create the first user
      await api.createInitialAdmin(formData);
      // Automatically log the user in after creation
      onSetupComplete(formData.username, formData.password);
    } catch (err) {
      setError(err.message || 'Failed to create admin account.');
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
      <div className="w-full max-w-md p-8 space-y-6 bg-gray-800 rounded-lg shadow-lg">
        <div className="flex flex-col items-center space-y-2">
          <Zap className="w-10 h-10 text-indigo-400" />
          <h1 className="text-2xl font-bold">Welcome to Lattice</h1>
          <p className="text-gray-400">Create the first administrator account to get started.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" name="firstName" placeholder="First Name" onChange={handleChange} className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          <input type="text" name="lastName" placeholder="Last Name" onChange={handleChange} className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          <input type="text" name="username" placeholder="Username" onChange={handleChange} className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          <input type="password" name="password" placeholder="Password" onChange={handleChange} className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          <button type="submit" disabled={loading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400">
            {loading ? 'Creating Account...' : 'Create Admin Account'}
          </button>
          {error && <p className="text-sm text-red-400 text-center">{error}</p>}
        </form>
      </div>
    </div>
  );
};

export default InitialSetupPage;