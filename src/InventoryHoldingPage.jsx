import React, { useState } from 'react';
import InventoryList from './InventoryList';
import InventoryForm from './InventoryForm';

const InventoryHoldingPage = ({ inventory, onSave, onDelete, loading, error }) => {
  const [view, setView] = useState('list'); // 'list' or 'form'
  const [itemToEdit, setItemToEdit] = useState(null);

  const handleEdit = (item) => {
    setItemToEdit(item);
    setView('form');
  };

  const handleAddNew = () => {
    setItemToEdit(null);
    setView('form');
  };

  const handleCancel = () => {
    setItemToEdit(null);
    setView('list');
  };

  return (
    view === 'list'
      ? <InventoryList inventory={inventory} onEdit={handleEdit} onAddNew={handleAddNew} onDelete={onDelete} loading={loading} error={error} />
      : <InventoryForm itemToEdit={itemToEdit} onSave={onSave} onCancel={handleCancel} />
  );
};

export default InventoryHoldingPage;