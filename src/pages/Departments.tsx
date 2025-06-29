import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Building } from 'lucide-react';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import DepartmentModal from '../components/DepartmentModal';

interface Department {
  _id: string;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: string;
}

const Departments: React.FC = () => {
  const { hasPermission } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [filteredDepartments, setFilteredDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    const filtered = departments.filter(dept =>
      dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dept.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredDepartments(filtered);
  }, [departments, searchTerm]);

  const fetchDepartments = async () => {
    try {
      const response = await api.get('/departments');
      setDepartments(response.data);
    } catch (error) {
      toast.error('Failed to fetch departments');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDepartment = async (deptId: string) => {
    if (!window.confirm('Are you sure you want to delete this department?')) return;

    try {
      await api.delete(`/departments/${deptId}`);
      setDepartments(departments.filter(d => d._id !== deptId));
      toast.success('Department deleted successfully');
    } catch (error) {
      toast.error('Failed to delete department');
    }
  };

  const handleDepartmentSaved = (savedDepartment: Department) => {
    if (selectedDepartment) {
      setDepartments(departments.map(d => d._id === savedDepartment._id ? savedDepartment : d));
    } else {
      setDepartments([...departments, savedDepartment]);
    }
    setShowModal(false);
    setSelectedDepartment(null);
  };

  const handleEditDepartment = (department: Department) => {
    setSelectedDepartment(department);
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
          <h1 className="text-3xl font-bold text-white">Departments</h1>
          {hasPermission('departments', 'add') && (
            <button
              onClick={() => setShowModal(true)}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Department
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search departments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Departments Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDepartments.map((department) => (
            <div
              key={department._id}
              className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6 hover:bg-white/15 transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                    <Building className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-semibold text-white">
                      {department.name}
                    </h3>
                  </div>
                </div>
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                  department.isActive 
                    ? 'bg-green-500/20 text-green-300' 
                    : 'bg-red-500/20 text-red-300'
                }`}>
                  {department.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <p className="text-gray-300 text-sm mb-4 min-h-[3rem]">
                {department.description || 'No description available'}
              </p>

              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400">
                  Created: {new Date(department.createdAt).toLocaleDateString()}
                </p>
                <div className="flex items-center gap-2">
                  {hasPermission('departments', 'update') && (
                    <button
                      onClick={() => handleEditDepartment(department)}
                      className="text-blue-400 hover:text-blue-300 transition-colors"
                      title="Edit Department"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                  )}
                  {hasPermission('departments', 'delete') && (
                    <button
                      onClick={() => handleDeleteDepartment(department._id)}
                      className="text-red-400 hover:text-red-300 transition-colors"
                      title="Delete Department"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredDepartments.length === 0 && (
          <div className="text-center py-12">
            <Building className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-white mb-2">No Departments Found</h3>
            <p className="text-gray-400 mb-6">
              {searchTerm ? 'No departments match your search.' : 'Get started by creating your first department.'}
            </p>
            {hasPermission('departments', 'add') && !searchTerm && (
              <button
                onClick={() => setShowModal(true)}
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 mx-auto"
              >
                <Plus className="h-4 w-4" />
                Add First Department
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <DepartmentModal
          department={selectedDepartment}
          onClose={() => {
            setShowModal(false);
            setSelectedDepartment(null);
          }}
          onSave={handleDepartmentSaved}
        />
      )}
    </Layout>
  );
};

export default Departments;