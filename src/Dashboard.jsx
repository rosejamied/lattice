import React, { useMemo } from 'react';
import { LayoutDashboard, List, Zap } from 'lucide-react'; // Zap was missing here
import Card from './Card';

// Dashboard View
const Dashboard = ({ inventory }) => {
  const uniquePalletTypes = inventory.length;

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-3xl font-bold text-white flex items-center">
        <LayoutDashboard className="w-6 h-6 mr-2 text-indigo-400" />
        Lattice Warehouse Overview
      </h1>

      {/* Stats Card */}
      <div className="max-w-sm">
        <Card title="Pallet Types in Stock" value={uniquePalletTypes.toLocaleString()} icon={List} color="indigo" />
      </div>
    </div>
  );
};

export default Dashboard;