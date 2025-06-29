import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

interface Permission {
  module: string;
  displayName: string;
  description: string;
  actions: Array<{
    name: string;
    displayName: string;
  }>;
}

interface User {
  _id: string;
  username: string;
  permissions: Array<{
    module: string;
    actions: string[];
  }>;
}

interface PermissionModalProps {
  user: User;
  onClose: () => void;
  onSave: (userId: string, permissions: Array<{ module: string; actions: string[] }>) => void;
}

const PermissionModal: React.FC<PermissionModalProps> = ({ user, onClose, onSave }) => {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [userPermissions, setUserPermissions] = useState<Array<{ module: string; actions: string[] }>>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPermissions();
    setUserPermissions(user.permissions || []);
  }, [user]);

  const fetchPermissions = async () => {
    try {
      const response = await api.get('/permissions');
      setPermissions(response.data);
    } catch (error) {
      toast.error('Failed to fetch permissions');
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionChange = (module: string, action: string, checked: boolean) => {
    setUserPermissions(prev => {
      const existing = prev.find(p => p.module === module);
      
      if (existing) {
        const updatedActions = checked
          ? [...existing.actions, action]
          : existing.actions.filter(a => a !== action);
        
        return prev.map(p => 
          p.module === module 
            ? { ...p, actions: updatedActions }
            : p
        ).filter(p => p.actions.length > 0);
      } else {
        return checked ? [...prev, { module, actions: [action] }] : prev;
      }
    });
  };

  const isActionChecked = (module: string, action: string) => {
    const modulePermission = userPermissions.find(p => p.module === module);
    return modulePermission ? modulePermission.actions.includes(action) : false;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(`/permissions/user/${user._id}`, { permissions: userPermissions });
      onSave(user._id, userPermissions);
      toast.success('Permissions updated successfully');
    } catch (error) {
      toast.error('Failed to update permissions');
    } finally {
      setSaving(false);
    }
  };

  const handleSeedPermissions = async () => {
    try {
      await api.post('/permissions/seed');
      await fetchPermissions();
      toast.success('Permissions seeded successfully');
    } catch (error) {
      toast.error('Failed to seed permissions');
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-white/20">
          <div>
            <h2 className="text-xl font-bold text-white">
              Manage Permissions for {user.username}
            </h2>
            <p className="text-sm text-gray-300 mt-1">
              Select the permissions you want to grant to this user
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSeedPermissions}
              className="px-3 py-1 text-sm bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
            >
              Seed Permissions
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {permissions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400 mb-4">No permissions found. Click "Seed Permissions" to create default permissions.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {permissions.map((permission) => (
                <div key={permission.module} className="bg-white/5 rounded-lg border border-white/10 p-4">
                  <div className="mb-3">
                    <h3 className="text-lg font-medium text-white">{permission.displayName}</h3>
                    {permission.description && (
                      <p className="text-sm text-gray-400 mt-1">{permission.description}</p>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {permission.actions.map((action) => (
                      <label
                        key={action.name}
                        className="flex items-center space-x-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={isActionChecked(permission.module, action.name)}
                          onChange={(e) => handlePermissionChange(permission.module, action.name, e.target.checked)}
                          className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 rounded focus:ring-blue-500 focus:ring-2"
                        />
                        <span className="text-sm text-gray-300">{action.displayName}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3 p-6 border-t border-white/20">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg font-medium transition-all disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Permissions'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PermissionModal;