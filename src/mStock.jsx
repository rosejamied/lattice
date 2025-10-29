import React from 'react';
import { Boxes, ChevronLeft } from 'lucide-react';

const MStock = ({ navigateBack }) => {
  return (
    <div className="h-screen w-screen bg-gray-900 flex flex-col p-6 font-sans">
      <header className="flex items-center mb-8">
        <button onClick={navigateBack} className="p-2 mr-4 bg-gray-800 rounded-full hover:bg-gray-700"><ChevronLeft className="text-white" /></button>
        <h1 className="text-3xl font-bold text-white flex items-center"><Boxes className="mr-3 text-indigo-400" /> Stock Control</h1>
      </header>
      <main className="flex-grow flex items-center justify-center text-center text-gray-400">
        <p>Mobile stock control view is under construction.</p>
      </main>
    </div>
  );
};

export default MStock;