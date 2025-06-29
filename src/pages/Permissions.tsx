import React, { useState, useEffect } from 'react';
import { Shield, RefreshCw, Plus } from 'lucide-react';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

interface Permission {
  _id: string;
  module: string;
  displayName: string;
  description: string;
  actions: Array<{
    name: string;
    displayName: string;
  }>;
  isActive: boolean;
}

const Permissions: React.FC = () => {
  const { hasPermission } = useAuth();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    fetchPermissions();
  }, []);

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

  const handleSeedPermissions = async () => {
    setSeeding(true);
    try {
      await api.post('/permissions/seed');
      await fetchPermissions();
      toast.success('Permissions seeded successfully');
    } catch (error) {
      toast.error('Failed to seed permissions');
    } finally {
      setSeeding(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-3xl font-bold text-white">Permissions Management</h1>
          {hasPermission('permissions', 'add') && (
            <button
              onClick={handleSeedPermissions}
              disabled={seeding}
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {seeding ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              {seeding ? 'Seeding...' : 'Seed Permissions'}
            </button>
          )}
        </div>

        {/* Description */}
        <div className="bg-blue-500/10 rounded-lg border border-blue-500/20 p-4">
          <p className="text-blue-200 text-sm">
            This page displays all available permissions in the system. Use the "Seed Permissions" button to automatically create permissions based on your application modules. These permissions can then be assigned to users to control access to different features.
          </p>
        </div>

        {/* Permissions Grid */}
        {permissions.length === 0 ? (
          <div className="text-center py-12">
            <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-white mb-2">No Permissions Found</h3>
            <p className="text-gray-400 mb-6">
              No permissions have been created yet. Click "Seed Permissions" to create default permissions.
            </p>
            {hasPermission('permissions', 'add') && (
              <button
                onClick={handleSeedPermissions}
                disabled={seeding}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 mx-auto disabled:opacity-50"
              >
                {seeding ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                {seeding ? 'Seeding...' : 'Seed Permissions'}
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {permissions.map((permission) => (
              <div
                key={permission._id}
                className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6 hover:bg-white/15 transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <Shield className="h-5 w-5 text-white" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-semibold text-white">
                        {permission.displayName}
                      </h3>
                      <p className="text-sm text-gray-400">
                        {permission.module}
                      </p>
                    </div>
                  </div>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    permission.isActive 
                      ? 'bg-green-500/20 text-green-300' 
                      : 'bg-red-500/20 text-red-300'
                  }`}>
                    {permission.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <p className="text-gray-300 text-sm mb-4">
                  {permission.description || 'No description available'}
                </p>

                <div>
                  <h4 className="text-sm font-medium text-gray-200 mb-2">Available Actions:</h4>
                  <div className="flex flex-wrap gap-2">
                    {permission.actions.map((action) => (
                      <span
                        key={action.name}
                        className="inline-flex px-2 py-1 text-xs font-medium bg-blue-500/20 text-blue-300 rounded-md"
                      >
                        {action.displayName}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Permissions;