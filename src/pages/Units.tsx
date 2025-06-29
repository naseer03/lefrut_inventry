import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Scale } from 'lucide-react';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import UnitModal from '../components/UnitModal';

interface Unit {
  _id: string;
  name: string;
  symbol: string;
  description: string;
  isActive: boolean;
  createdAt: string;
}

const Units: React.FC = () => {
  const { hasPermission } = useAuth();
  const [units, setUnits] = useState<Unit[]>([]);
  const [filteredUnits, setFilteredUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);

  useEffect(() => {
    fetchUnits();
  }, []);

  useEffect(() => {
    const filtered = units.filter(unit =>
      unit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      unit.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      unit.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUnits(filtered);
  }, [units, searchTerm]);

  const fetchUnits = async () => {
    try {
      const response = await api.get('/units');
      setUnits(response.data);
    } catch (error) {
      toast.error('Failed to fetch units');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUnit = async (unitId: string) => {
    if (!window.confirm('Are you sure you want to delete this unit?')) return;

    try {
      await api.delete(`/units/${unitId}`);
      setUnits(units.filter(u => u._id !== unitId));
      toast.success('Unit deleted successfully');
    } catch (error) {
      toast.error('Failed to delete unit');
    }
  };

  const handleUnitSaved = (savedUnit: Unit) => {
    if (selectedUnit) {
      setUnits(units.map(u => u._id === savedUnit._id ? savedUnit : u));
    } else {
      setUnits([...units, savedUnit]);
    }
    setShowModal(false);
    setSelectedUnit(null);
  };

  const handleEditUnit = (unit: Unit) => {
    setSelectedUnit(unit);
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
          <h1 className="text-3xl font-bold text-white">Units Management</h1>
          {hasPermission('units', 'add') && (
            <button
              onClick={() => setShowModal(true)}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Unit
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search units..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Units Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUnits.map((unit) => (
            <div
              key={unit._id}
              className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6 hover:bg-white/15 transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-cyan-600 rounded-lg flex items-center justify-center">
                    <Scale className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-semibold text-white">
                      {unit.name}
                    </h3>
                    <p className="text-sm text-gray-300">Symbol: {unit.symbol}</p>
                  </div>
                </div>
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                  unit.isActive 
                    ? 'bg-green-500/20 text-green-300' 
                    : 'bg-red-500/20 text-red-300'
                }`}>
                  {unit.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <p className="text-gray-300 text-sm mb-4 min-h-[3rem]">
                {unit.description || 'No description available'}
              </p>

              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400">
                  Created: {new Date(unit.createdAt).toLocaleDateString()}
                </p>
                <div className="flex items-center gap-2">
                  {hasPermission('units', 'update') && (
                    <button
                      onClick={() => handleEditUnit(unit)}
                      className="text-blue-400 hover:text-blue-300 transition-colors"
                      title="Edit Unit"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                  )}
                  {hasPermission('units', 'delete') && (
                    <button
                      onClick={() => handleDeleteUnit(unit._id)}
                      className="text-red-400 hover:text-red-300 transition-colors"
                      title="Delete Unit"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredUnits.length === 0 && (
          <div className="text-center py-12">
            <Scale className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-white mb-2">No Units Found</h3>
            <p className="text-gray-400 mb-6">
              {searchTerm ? 'No units match your search.' : 'Get started by creating your first unit.'}
            </p>
            {hasPermission('units', 'add') && !searchTerm && (
              <button
                onClick={() => setShowModal(true)}
                className="bg-gradient-to-r from-indigo-500 to-cyan-600 hover:from-indigo-600 hover:to-cyan-700 text-white px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 mx-auto"
              >
                <Plus className="h-4 w-4" />
                Add First Unit
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <UnitModal
          unit={selectedUnit}
          onClose={() => {
            setShowModal(false);
            setSelectedUnit(null);
          }}
          onSave={handleUnitSaved}
        />
      )}
    </Layout>
  );
};

export default Units;