import { useMemo, useState, useEffect } from 'react';
import { PERMISSIONS } from './permissions';
import * as api from './api.jsx';

let allRolePermissions = null; // Cache permissions

export const usePermissions = (user) => {
  const [permissions, setPermissions] = useState(allRolePermissions);

  useEffect(() => {
    if (!permissions) {
      api.getRolePermissions().then(data => {
        allRolePermissions = data;
        setPermissions(data);
      });
    }
  }, [permissions]);

  const userPermissions = useMemo(() => {
    if (!user || !user.role || !permissions) return [];
    return permissions[user.role] || [];
  }, [user, permissions]);

  return (permission) => userPermissions.includes(permission);
};