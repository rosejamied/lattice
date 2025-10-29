import React from 'react';
import { Smartphone } from 'lucide-react';

const MobileView = () => {
  return (
    <div className="h-screen w-screen bg-gray-900 flex flex-col items-center justify-center text-center p-8 font-sans">
      <Smartphone className="w-16 h-16 text-indigo-400 mb-6" />
      <h1 className="text-3xl font-bold text-white mb-2">Mobile View</h1>
      <p className="text-lg text-gray-400">
        This optimized view for mobile devices is under construction.
      </p>
      <p className="text-gray-500 mt-4">
        Please use a desktop or tablet for the full experience for now.
      </p>
    </div>
  );
};

export default MobileView;