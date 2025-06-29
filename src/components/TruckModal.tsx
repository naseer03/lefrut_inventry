import React, { useState, useEffect } from 'react';
import { X, Truck, User, MapPin } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

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
}

interface Driver {
  _id: string;
  fullName: string;
  employeeId: string;
}

interface Route {
  _id: string;
  name: string;
  description: string;
}

interface TruckModalProps {
  truck: TruckData | null;
  onClose: () => void;
  onSave: (truck: TruckData) => void;
}

const TruckModal: React.FC<TruckModalProps> = ({ truck, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    truckId: '',
    vehicleNumber: '',
    capacity: '',
    defaultDriverId: '',
    defaultRouteId: '',
    isActive: true
  });
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    fetchDriversAndRoutes();
    if (truck) {
      setFormData({
        truckId: truck.truckId,
        vehicleNumber: truck.vehicleNumber,
        capacity: truck.capacity.toString(),
        defaultDriverId: truck.defaultDriverId?._id || '',
        defaultRouteId: truck.defaultRouteId?._id || '',
        isActive: truck.isActive
      });
    }
  }, [truck]);

  const fetchDriversAndRoutes = async () => {
    try {
      const [driversResponse, routesResponse] = await Promise.all([
        api.get('/trucks/drivers/available'),
        api.get('/routes')
      ]);
      setDrivers(driversResponse.data);
      setRoutes(routesResponse.data.filter((route: Route) => route.isActive));
    } catch (error) {
      toast.error('Failed to fetch drivers and routes');
    } finally {
      setDataLoading(false);
    }
  };

  const generateTruckId = () => {
    const prefix = 'TRK';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    return `${prefix}${timestamp}${random}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validation
      if (!formData.truckId || !formData.vehicleNumber || !formData.capacity) {
        toast.error('Please fill in all required fields');
        return;
      }

      if (isNaN(Number(formData.capacity)) || Number(formData.capacity) <= 0) {
        toast.error('Capacity must be a positive number');
        return;
      }

      const submitData = {
        ...formData,
        capacity: Number(formData.capacity),
        vehicleNumber: formData.vehicleNumber.toUpperCase(),
        defaultDriverId: formData.defaultDriverId || null,
        defaultRouteId: formData.defaultRouteId || null
      };

      const response = truck
        ? await api.put(`/trucks/${truck._id}`, submitData)
        : await api.post('/trucks', submitData);

      onSave(response.data);
      toast.success(`Truck ${truck ? 'updated' : 'created'} successfully`);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'An error occurred';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (dataLoading) {
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
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-white/20">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Truck className="h-5 w-5" />
            {truck ? 'Edit Truck' : 'Add New Truck'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Truck ID *
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.truckId}
                  onChange={(e) => setFormData({ ...formData, truckId: e.target.value })}
                  required
                  className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., TRK001"
                />
                {!truck && (
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, truckId: generateTruckId() })}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg transition-colors text-sm"
                  >
                    Generate
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Vehicle Number *
              </label>
              <input
                type="text"
                value={formData.vehicleNumber}
                onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
                required
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., MH12AB1234"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Capacity (units) *
            </label>
            <input
              type="number"
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
              required
              min="1"
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 1000"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                <User className="h-4 w-4 inline mr-1" />
                Default Driver
              </label>
              <select
                value={formData.defaultDriverId}
                onChange={(e) => setFormData({ ...formData, defaultDriverId: e.target.value })}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Driver (Optional)</option>
                {drivers.map((driver) => (
                  <option key={driver._id} value={driver._id}>
                    {driver.fullName} ({driver.employeeId})
                  </option>
                ))}
              </select>
              {drivers.length === 0 && (
                <p className="text-xs text-orange-300 mt-1">No available drivers found</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                <MapPin className="h-4 w-4 inline mr-1" />
                Default Route
              </label>
              <select
                value={formData.defaultRouteId}
                onChange={(e) => setFormData({ ...formData, defaultRouteId: e.target.value })}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Route (Optional)</option>
                {routes.map((route) => (
                  <option key={route._id} value={route._id}>
                    {route.name}
                  </option>
                ))}
              </select>
              {routes.length === 0 && (
                <p className="text-xs text-orange-300 mt-1">No active routes found</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Status
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 rounded focus:ring-blue-500"
              />
              <label htmlFor="isActive" className="text-sm text-gray-200">
                Active (truck is operational)
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-white/20">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg font-medium transition-all disabled:opacity-50"
            >
              {loading ? 'Saving...' : (truck ? 'Update Truck' : 'Add Truck')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TruckModal;