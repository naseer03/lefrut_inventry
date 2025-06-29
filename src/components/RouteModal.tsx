import React, { useState, useEffect } from 'react';
import { X, MapPin } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

interface Route {
  _id: string;
  name: string;
  description: string;
  isActive: boolean;
}

interface RouteModalProps {
  route: Route | null;
  onClose: () => void;
  onSave: (route: Route) => void;
}

const RouteModal: React.FC<RouteModalProps> = ({ route, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (route) {
      setFormData({
        name: route.name,
        description: route.description,
        isActive: route.isActive
      });
    }
  }, [route]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.name.trim()) {
        toast.error('Route name is required');
        return;
      }

      const response = route
        ? await api.put(`/routes/${route._id}`, formData)
        : await api.post('/routes', formData);

      onSave(response.data);
      toast.success(`Route ${route ? 'updated' : 'created'} successfully`);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'An error occurred';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-white/20">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            {route ? 'Edit Route' : 'Add New Route'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Route Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter route name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter route description"
            />
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
                Active (route is available for use)
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
              {loading ? 'Saving...' : (route ? 'Update Route' : 'Add Route')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RouteModal;