import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

interface State {
  _id: string;
  stateName: string;
  description: string;
  isActive: boolean;
}

interface StateModalProps {
  state: State | null;
  onClose: () => void;
  onSave: (state: State) => void;
}

const StateModal: React.FC<StateModalProps> = ({ state, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    stateName: '',
    description: '',
    isActive: true
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (state) {
      setFormData({
        stateName: state.stateName,
        description: state.description,
        isActive: state.isActive
      });
    }
  }, [state]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = state
        ? await api.put(`/states/${state._id}`, formData)
        : await api.post('/states', formData);

      onSave(response.data);
      toast.success(`State ${state ? 'updated' : 'created'} successfully`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-white/20">
          <h2 className="text-xl font-bold text-white">
            {state ? 'Edit State' : 'Add New State'}
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
              State Name
            </label>
            <input
              type="text"
              value={formData.stateName}
              onChange={(e) => setFormData({ ...formData, stateName: e.target.value })}
              required
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter state name"
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
              placeholder="Enter state description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Status
            </label>
            <select
              value={formData.isActive.toString()}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'true' })}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
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
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StateModal;