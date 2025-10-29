import React, { useState, useEffect } from 'react';
import { Truck, Plus, Loader, Archive } from 'lucide-react';
import * as api from './api.jsx';
import AddHaulierModal from './AddHaulierModal';

const HaulierSettings = () => {
  const [hauliers, setHauliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchHauliers = async () => {
      try {
        setLoading(true);
        const data = await api.getHauliers();
        setHauliers(data);
        setError(null);
      } catch (err) {
        setError("Failed to load hauliers.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchHauliers();
  }, []);

  const handleAddHaulier = async (haulierData) => {
    try {
      const newHaulier = await api.addHaulier(haulierData);
      setHauliers(prev => [...prev, newHaulier].sort((a, b) => a.name.localeCompare(b.name)));
    } catch (err) {
      setError("Failed to add haulier. Please try again.");
      setTimeout(() => setError(null), 5000);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium text-white">Haulier Management</h3>
            <p className="text-sm text-gray-400">Add, edit, and archive hauliers.</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <Plus size={18} className="mr-2" />
            Add Haulier
          </button>
        </div>
        <div className="border-t border-gray-700 pt-6">
          {loading && <div className="flex justify-center items-center"><Loader className="animate-spin" /> <span className="ml-2">Loading hauliers...</span></div>}
          {error && <p className="text-center text-red-400">{error}</p>}
          {!loading && !error && hauliers.length === 0 && (
            <div className="text-center text-gray-400">No hauliers found. Click "Add Haulier" to begin.</div>
          )}
          {!loading && hauliers.length > 0 && (
            <div className="overflow-x-auto bg-gray-900/50 rounded-lg">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-700/50">
                  <tr>
                    {['Haulier Name', 'Status', 'Date Added', 'Actions'].map(header => (
                      <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {hauliers.map((haulier) => (
                    <tr key={haulier.id} className="hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{haulier.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${haulier.status === 'Active' ? 'bg-green-900 text-green-300' : 'bg-gray-600 text-gray-300'}`}>{haulier.status}</span></td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{new Date(haulier.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button className="text-yellow-400 hover:text-yellow-300 p-1 rounded-full hover:bg-gray-600 transition-colors" title="Archive Haulier (coming soon)"><Archive className="w-5 h-5" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      <AddHaulierModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAddHaulier={handleAddHaulier} />
    </>
  );
};

export default HaulierSettings;