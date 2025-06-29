import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import StateModal from '../components/StateModal';

interface State {
  _id: string;
  stateName: string;
  description: string;
  isActive: boolean;
  createdAt: string;
}

const States: React.FC = () => {
  const { hasPermission } = useAuth();
  const [states, setStates] = useState<State[]>([]);
  const [filteredStates, setFilteredStates] = useState<State[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedState, setSelectedState] = useState<State | null>(null);

  useEffect(() => {
    fetchStates();
  }, []);

  useEffect(() => {
    const filtered = states.filter(state =>
      state.stateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      state.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredStates(filtered);
  }, [states, searchTerm]);

  const fetchStates = async () => {
    try {
      const response = await api.get('/states');
      setStates(response.data);
    } catch (error) {
      toast.error('Failed to fetch states');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteState = async (stateId: string) => {
    if (!window.confirm('Are you sure you want to delete this state?')) return;

    try {
      await api.delete(`/states/${stateId}`);
      setStates(states.filter(s => s._id !== stateId));
      toast.success('State deleted successfully');
    } catch (error) {
      toast.error('Failed to delete state');
    }
  };

  const handleStateSaved = (savedState: State) => {
    if (selectedState) {
      setStates(states.map(s => s._id === savedState._id ? savedState : s));
    } else {
      setStates([...states, savedState]);
    }
    setShowModal(false);
    setSelectedState(null);
  };

  const handleEditState = (state: State) => {
    setSelectedState(state);
    setShowModal(true);
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
          <h1 className="text-3xl font-bold text-white">States Management</h1>
          {hasPermission('states', 'add') && (
            <button
              onClick={() => setShowModal(true)}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add State
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search states..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* States Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStates.map((state) => (
            <div
              key={state._id}
              className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6 hover:bg-white/15 transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {state.stateName}
                  </h3>
                  <p className="text-gray-300 text-sm">
                    {state.description || 'No description'}
                  </p>
                </div>
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                  state.isActive 
                    ? 'bg-green-500/20 text-green-300' 
                    : 'bg-red-500/20 text-red-300'
                }`}>
                  {state.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400">
                  Created: {new Date(state.createdAt).toLocaleDateString()}
                </p>
                <div className="flex items-center gap-2">
                  {hasPermission('states', 'update') && (
                    <button
                      onClick={() => handleEditState(state)}
                      className="text-blue-400 hover:text-blue-300 transition-colors"
                      title="Edit State"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                  )}
                  {hasPermission('states', 'delete') && (
                    <button
                      onClick={() => handleDeleteState(state._id)}
                      className="text-red-400 hover:text-red-300 transition-colors"
                      title="Delete State"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredStates.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400">No states found</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <StateModal
          state={selectedState}
          onClose={() => {
            setShowModal(false);
            setSelectedState(null);
          }}
          onSave={handleStateSaved}
        />
      )}
    </Layout>
  );
};

export default States;