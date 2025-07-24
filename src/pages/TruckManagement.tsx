import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Truck, User, MapPin, Gauge, AlertCircle } from 'lucide-react';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import TruckModal from '../components/TruckModal';

interface TruckData {
  _id: string;
  truckId: string;
  vehicleNumber: string;
  capacity: number;
  defaultDriverId: {
    _id: string;
    fullName: string;
    employeeId: string;
  } | null;
  defaultRouteId: {
    _id: string;
    name: string;
  } | null;
  isActive: boolean;
  createdAt: string;
}

interface TruckStats {
  totalTrucks: number;
  activeTrucks: number;
  inactiveTrucks: number;
  trucksWithDrivers: number;
  trucksWithoutDrivers: number;
  totalCapacity: number;
}

const TruckManagement: React.FC = () => {
  const { hasPermission } = useAuth();
  const [trucks, setTrucks] = useState<TruckData[]>([]);
  const [filteredTrucks, setFilteredTrucks] = useState<TruckData[]>([]);
  const [stats, setStats] = useState<TruckStats>({
    totalTrucks: 0,
    activeTrucks: 0,
    inactiveTrucks: 0,
    trucksWithDrivers: 0,
    trucksWithoutDrivers: 0,
    totalCapacity: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedTruck, setSelectedTruck] = useState<TruckData | null>(null);

  useEffect(() => {
    fetchTrucks();
    fetchStats();
  }, []);

  useEffect(() => {
    let filtered = trucks.filter(truck =>
      truck.truckId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      truck.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      truck.defaultDriverId?.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      truck.defaultRouteId?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (statusFilter !== 'all') {
      if (statusFilter === 'active') {
        filtered = filtered.filter(truck => truck.isActive);
      } else if (statusFilter === 'inactive') {
        filtered = filtered.filter(truck => !truck.isActive);
      } else if (statusFilter === 'with_driver') {
        filtered = filtered.filter(truck => truck.defaultDriverId);
      } else if (statusFilter === 'without_driver') {
        filtered = filtered.filter(truck => !truck.defaultDriverId);
      }
    }

    setFilteredTrucks(filtered);
  }, [trucks, searchTerm, statusFilter]);

  const fetchTrucks = async () => {
    try {
      const response = await api.get('/trucks');
      setTrucks(response.data);
    } catch (error) {
      toast.error('Failed to fetch trucks');
      console.error('Fetch trucks error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/trucks/stats/overview');
      setStats(response.data);
    } catch (error) {
      console.error('Fetch truck stats error:', error);
    }
  };

  const handleDeleteTruck = async (truckId: string, truckIdentifier: string) => {
    if (!hasPermission('trucks', 'delete')) {
      toast.error('You do not have permission to delete trucks');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete truck ${truckIdentifier}?`)) {
      return;
    }

    try {
      await api.delete(`/trucks/${truckId}`);
      setTrucks(trucks.filter(t => t._id !== truckId));
      await fetchStats();
      toast.success('Truck deleted successfully');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to delete truck';
      toast.error(errorMessage);
    }
  };

  const handleTruckSaved = (savedTruck: TruckData) => {
    if (selectedTruck) {
      setTrucks(trucks.map(t => t._id === savedTruck._id ? savedTruck : t));
    } else {
      setTrucks([savedTruck, ...trucks]);
    }
    setShowModal(false);
    setSelectedTruck(null);
    fetchStats();
  };

  const handleEditTruck = (truck: TruckData) => {
    if (!hasPermission('trucks', 'update')) {
      toast.error('You do not have permission to edit trucks');
      return;
    }
    setSelectedTruck(truck);
    setShowModal(true);
  };

  const handleAddTruck = () => {
    if (!hasPermission('trucks', 'add')) {
      toast.error('You do not have permission to add trucks');
      return;
    }
    setSelectedTruck(null);
    setShowModal(true);
  };

  if (!hasPermission('trucks', 'view')) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Truck className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-white mb-2">Access Denied</h3>
            <p className="text-gray-400">You don't have permission to view truck management.</p>
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
            <h1 className="text-3xl font-bold text-white">Truck Management</h1>
            <p className="text-gray-300 mt-1">
              Total Fleet: {stats.totalTrucks} trucks | Capacity: {stats.totalCapacity.toLocaleString()} units
            </p>
          </div>
          {hasPermission('trucks', 'add') && (
            <button
              onClick={handleAddTruck}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Truck
            </button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-green-500/10 backdrop-blur-lg rounded-xl border border-green-500/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-300 text-sm font-medium">Active Trucks</p>
                <p className="text-2xl font-bold text-white">{stats.activeTrucks}</p>
              </div>
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                <Truck className="h-6 w-6 text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-blue-500/10 backdrop-blur-lg rounded-xl border border-blue-500/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-300 text-sm font-medium">With Drivers</p>
                <p className="text-2xl font-bold text-white">{stats.trucksWithDrivers}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <User className="h-6 w-6 text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-orange-500/10 backdrop-blur-lg rounded-xl border border-orange-500/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-300 text-sm font-medium">Need Drivers</p>
                <p className="text-2xl font-bold text-white">{stats.trucksWithoutDrivers}</p>
              </div>
              <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-orange-400" />
              </div>
            </div>
          </div>

          <div className="bg-purple-500/10 backdrop-blur-lg rounded-xl border border-purple-500/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-300 text-sm font-medium">Total Capacity</p>
                <p className="text-2xl font-bold text-white">{stats.totalCapacity.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <Gauge className="h-6 w-6 text-purple-400" />
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
                placeholder="Search trucks..."
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
              <option value="all">All Trucks</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
              <option value="with_driver">With Driver</option>
              <option value="without_driver">Need Driver</option>
            </select>

            <div className="text-sm text-gray-300 flex items-center justify-center px-4 py-3 bg-white/5 rounded-lg">
              Showing {filteredTrucks.length} of {trucks.length} trucks
            </div>
          </div>
        </div>

        {/* Trucks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTrucks.map((truck) => (
            <div
              key={truck._id}
              className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6 hover:bg-white/15 transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <Truck className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-semibold text-white">
                      {truck.truckId}
                    </h3>
                    <p className="text-sm text-gray-300">{truck.vehicleNumber}</p>
                  </div>
                </div>
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                  truck.isActive 
                    ? 'bg-green-500/20 text-green-300' 
                    : 'bg-red-500/20 text-red-300'
                }`}>
                  {truck.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400 flex items-center gap-1">
                    <Gauge className="h-3 w-3" />
                    Capacity:
                  </span>
                  <span className="text-white font-medium">{truck.capacity.toLocaleString()} units</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400 flex items-center gap-1">
                    <User className="h-3 w-3" />
                    Driver:
                  </span>
                  <span className="text-white text-xs">
                    {truck.defaultDriverId ? (
                      <span className="bg-green-500/20 text-green-300 px-2 py-1 rounded">
                        {truck.defaultDriverId.fullName}
                      </span>
                    ) : (
                      <span className="bg-orange-500/20 text-orange-300 px-2 py-1 rounded">
                        Not Assigned
                      </span>
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400 flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    Route:
                  </span>
                  <span className="text-white text-xs">
                    {truck.defaultRouteId ? (
                      <span className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded">
                        {truck.defaultRouteId.name}
                      </span>
                    ) : (
                      <span className="bg-gray-500/20 text-gray-300 px-2 py-1 rounded">
                        Not Assigned
                      </span>
                    )}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-white/10">
                <p className="text-xs text-gray-400">
                  Added: {new Date(truck.createdAt).toLocaleDateString()}
                </p>
                <div className="flex items-center gap-2">
                  {hasPermission('trucks', 'update') && (
                    <button
                      onClick={() => handleEditTruck(truck)}
                      className="text-blue-400 hover:text-blue-300 transition-colors"
                      title="Edit Truck"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                  )}
                  {hasPermission('trucks', 'delete') && (
                    <button
                      onClick={() => handleDeleteTruck(truck._id, truck.truckId)}
                      className="text-red-400 hover:text-red-300 transition-colors"
                      title="Delete Truck"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredTrucks.length === 0 && (
          <div className="text-center py-12">
            <Truck className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-white mb-2">No Trucks Found</h3>
            <p className="text-gray-400 mb-6">
              {searchTerm || statusFilter !== 'all' 
                ? 'No trucks match your current filters.' 
                : 'Get started by adding your first truck to the fleet.'}
            </p>
            {hasPermission('trucks', 'add') && !searchTerm && statusFilter === 'all' && (
              <button
                onClick={handleAddTruck}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 mx-auto"
              >
                <Plus className="h-4 w-4" />
                Add First Truck
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <TruckModal
          truck={selectedTruck}
          onClose={() => {
            setShowModal(false);
            setSelectedTruck(null);
          }}
          onSave={handleTruckSaved}
        />
      )}
    </Layout>
  );
};

export default TruckManagement;