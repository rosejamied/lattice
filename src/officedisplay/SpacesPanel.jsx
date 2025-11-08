import React, { useMemo } from 'react';
import { LayoutGrid } from 'lucide-react';

const SpacesPanel = ({ locations, inventory }) => {
  const { totalSpaces, occupiedSpaces, disabledSpaces } = useMemo(() => {
    const total = locations.length;
    const disabled = locations.filter(loc => loc.enabled === 0).length;

    const occupied = new Set(
      inventory
        .filter(item => item.status !== 'Dispatched' && item.location)
        .map(item => item.location.toUpperCase())
    ).size;

    return {
      totalSpaces: total,
      occupiedSpaces: occupied,
      disabledSpaces: disabled,
    };
  }, [locations, inventory]);

  const availableSpaces = totalSpaces - occupiedSpaces - disabledSpaces;
  const totalEnabledSpaces = totalSpaces - disabledSpaces;
  const utilization = totalEnabledSpaces > 0 ? Math.round((occupiedSpaces / totalEnabledSpaces) * 100) : 0;

  const pieChartStyle = {
    background: `conic-gradient(#10b981 0% ${utilization}%, #3b82f6 ${utilization}% 100%)`,
  };

  const StatCard = ({ label, value, className }) => (
    <div className={`p-6 rounded-lg ${className}`}>
      <p className="text-xl text-gray-300">{label}</p>
      <p className="text-6xl font-bold text-white">{value}</p>
    </div>
  );

  return (
    <div className="bg-gray-800/50 p-6 rounded-2xl h-[80vh] flex flex-col">
      <h2 className="text-3xl font-bold flex items-center mb-6 text-indigo-400">
        <LayoutGrid size={32} className="mr-4" />
        Warehouse Spaces
      </h2>
      <div className="flex-grow flex flex-col items-center justify-center space-y-8">
        {/* Pie Chart */}
        <div className="relative w-64 h-64 rounded-full" style={pieChartStyle}>
          <div className="absolute inset-4 bg-gray-800 rounded-full flex flex-col items-center justify-center">
            <p className="text-6xl font-bold text-white">{utilization}%</p>
            <p className="text-xl text-gray-400">Utilization</p>
          </div>
        </div>

        {/* Legend and Stats */}
        <div className="grid grid-cols-2 gap-6 w-full max-w-md">
          <div className="text-center">
            <div className="flex items-center justify-center"><div className="w-4 h-4 rounded-full bg-green-500 mr-2"></div><p className="text-lg text-gray-300">Occupied</p></div>
            <p className="text-4xl font-bold">{occupiedSpaces}</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center"><div className="w-4 h-4 rounded-full bg-blue-500 mr-2"></div><p className="text-lg text-gray-300">Available</p></div>
            <p className="text-4xl font-bold">{availableSpaces}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpacesPanel;