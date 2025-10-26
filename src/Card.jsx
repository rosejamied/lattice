import React from 'react';
import PropTypes from 'prop-types';

// Generic Card Component for Dashboard
const Card = ({ title, value, icon: Icon, color }) => {
  const colorClasses = {
    indigo: {
      border: 'border-indigo-600',
      bg: 'bg-indigo-600/20',
      text: 'text-indigo-400',
    },
    sky: {
      border: 'border-sky-600',
      bg: 'bg-sky-600/20',
      text: 'text-sky-400',
    },
  };

  const classes = colorClasses[color] || colorClasses.indigo;

  return (
    <div className={`bg-gray-800 p-6 rounded-xl shadow-xl flex items-center justify-between border-t-4 ${classes.border}`}>
      <div>
        <p className="text-sm font-medium text-gray-400">{title}</p>
        <p className="text-4xl font-extrabold text-white mt-1">{value}</p>
      </div>
      <div className={`p-3 rounded-full ${classes.bg} ${classes.text}`}>
        <Icon className="w-8 h-8" />
      </div>
    </div>
  );
};

export default Card;