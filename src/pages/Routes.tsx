import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, MapPin, Truck, TrendingUp } from 'lucide-react';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import RouteModal from '../components/RouteModal';

interface Route {
  _id: string;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: string;
}

interface RouteStats {
  totalRoutes: number;
  activeRoutes: number;
  inactiveRoutes: number;
  routeUsage: Array<{
    routeName: string;
    truckCount: number;
  }>;
}

const Routes: React.FC = () => {
  const { hasPermission } = useAuth();
  const [routes, setRoutes] = useState<Route[]>([]);
  const [filteredRoutes, setFilteredRoutes] = useState<Route[]>([]);
  const [stats, setStats] = useState<RouteStats>({
    totalRoutes: 0,
    activeRoutes: 0,
    inactiveRoutes: 0,
    routeUsage: []
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);

  useEffect(() => {
    fetchRoutes();
    fetchStats();
  }, []);

  useEffect(() => {
    let filtered = routes.filter(route =>
      route.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      route.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (statusFilter !== 'all') {
      filtered = filtered.filter(route => 
        statusFilter === 'active' ? route.isActive : !route.isActive
      );
    }

    setFilteredRoutes(filtered);
  }, [routes, searchTerm, statusFilter]);

  const fetchRoutes = async () => {
    try {
      const response = await api.get('/routes');
      setRoutes(response.data);
    } catch (error) {
      toast.error('Failed to fetch routes');
      console.error('Fetch routes error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/routes/stats/overview');
      setStats(response.data);
    } catch (error) {
      console.error('Fetch route stats error:', error);
    }
  };

  const handleDeleteRoute = async (routeId: string, routeName: string) => {
    if (!hasPermission('routes', 'delete')) {
      toast.error('You do not have permission to delete routes');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete route "${routeName}"?`)) {
      return;
    }

    try {
      await api.delete(`/routes/${routeId}`);
      setRoutes(routes.filter(r => r._id !== routeId));
      await fetchStats();
      toast.success('Route deleted successfully');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to delete route';
      toast.error(errorMessage);
    }
  };

  const handleRouteSaved = (savedRoute: Route) => {
    if (selectedRoute) {
      setRoutes(routes.map(r => r._id === savedRoute._id ? savedRoute : r));
    } else {
      setRoutes([savedRoute, ...routes]);
    }
    setShowModal(false);
    setSelectedRoute(null);
    fetchStats();
  };

  const handleEditRoute = (route: Route) => {
    if (!hasPermission('routes', 'update')) {
      toast.error('You do not have permission to edit routes');
      return;
    }
    setSelectedRoute(route);
    setShowModal(true);
  };

  const handleAddRoute = () => {
    if (!hasPermission('routes', 'add')) {
      toast.error('You do not have permission to add routes');
      return;
    }
    setSelectedRoute(null);
    setShowModal(true);
  };

  const getRouteUsage = (routeId: string) => {
    const usage = stats.routeUsage.find(u => u.routeName === routes.find(r => r._id === routeId)?.name);
    return usage?.truckCount || 0;
  };

  if (!hasPermission('routes', 'view')) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-white mb-2">Access Denied</h3>
            <p className="text-gray-400">You don't have permission to view route management.</p>
          </div>
        </div>
      </Layout>
    );
  }

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
          <div>
            <h1 className="text-3xl font-bold text-white">Route Management</h1>
            <p className="text-gray-300 mt-1">
              Total Routes: {stats.totalRoutes} | Active: {stats.activeRoutes}
            </p>
          </div>
          {hasPermission('routes', 'add') && (
            <button
              onClick={handleAddRoute}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Route
            </button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-green-500/10 backdrop-blur-lg rounded-xl border border-green-500/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-300 text-sm font-medium">Active Routes</p>
                <p className="text-2xl font-bold text-white">{stats.activeRoutes}</p>
              </div>
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                <MapPin className="h-6 w-6 text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-blue-500/10 backdrop-blur-lg rounded-xl border border-blue-500/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-300 text-sm font-medium">Total Routes</p>
                <p className="text-2xl font-bold text-white">{stats.totalRoutes}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-purple-500/10 backdrop-blur-lg rounded-xl border border-purple-500/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-300 text-sm font-medium">Routes in Use</p>
                <p className="text-2xl font-bold text-white">{stats.routeUsage.length}</p>
              </div>
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <Truck className="h-6 w-6 text-purple-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search routes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Routes</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>

            <div className="text-sm text-gray-300 flex items-center justify-center px-4 py-3 bg-white/5 rounded-lg">
              Showing {filteredRoutes.length} of {routes.length} routes
            </div>
          </div>
        </div>

        {/* Routes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRoutes.map((route) => {
            const truckCount = getRouteUsage(route._id);
            return (
              <div
                key={route._id}
                className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6 hover:bg-white/15 transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                      <MapPin className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-semibold text-white">
                        {route.name}
                      </h3>
                      <p className="text-sm text-gray-400">
                        {truckCount} truck{truckCount !== 1 ? 's' : ''} assigned
                      </p>
                    </div>
                  </div>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    route.isActive 
                      ? 'bg-green-500/20 text-green-300' 
                      : 'bg-red-500/20 text-red-300'
                  }`}>
                    {route.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <p className="text-gray-300 text-sm mb-4 min-h-[3rem]">
                  {route.description || 'No description available'}
                </p>

                <div className="flex items-center justify-between pt-3 border-t border-white/10">
                  <p className="text-xs text-gray-400">
                    Created: {new Date(route.createdAt).toLocaleDateString()}
                  </p>
                  <div className="flex items-center gap-2">
                    {hasPermission('routes', 'update') && (
                      <button
                        onClick={() => handleEditRoute(route)}
                        className="text-blue-400 hover:text-blue-300 transition-colors"
                        title="Edit Route"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    )}
                    {hasPermission('routes', 'delete') && (
                      <button
                        onClick={() => handleDeleteRoute(route._id, route.name)}
                        className="text-red-400 hover:text-red-300 transition-colors"
                        title="Delete Route"
                        disabled={truckCount > 0}
                      >
                        <Trash2 className={`h-4 w-4 ${truckCount > 0 ? 'opacity-50 cursor-not-allowed' : ''}`} />
                      </button>
                    )}
                  </div>
                </div>

                {truckCount > 0 && (
                  <div className="mt-2 text-xs text-orange-300">
                    ⚠️ Cannot delete - {truckCount} truck{truckCount !== 1 ? 's' : ''} using this route
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {filteredRoutes.length === 0 && (
          <div className="text-center py-12">
            <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-white mb-2">No Routes Found</h3>
            <p className="text-gray-400 mb-6">
              {searchTerm || statusFilter !== 'all' 
                ? 'No routes match your current filters.' 
                : 'Get started by creating your first delivery route.'}
            </p>
            {hasPermission('routes', 'add') && !searchTerm && statusFilter === 'all' && (
              <button
                onClick={handleAddRoute}
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 mx-auto"
              >
                <Plus className="h-4 w-4" />
                Add First Route
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <RouteModal
          route={selectedRoute}
          onClose={() => {
            setShowModal(false);
            setSelectedRoute(null);
          }}
          onSave={handleRouteSaved}
        />
      )}
    </Layout>
  );
};

export default Routes;