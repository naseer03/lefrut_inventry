import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Briefcase } from 'lucide-react';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import JobRoleModal from '../components/JobRoleModal';

interface JobRole {
  _id: string;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: string;
}

const JobRoles: React.FC = () => {
  const { hasPermission } = useAuth();
  const [jobRoles, setJobRoles] = useState<JobRole[]>([]);
  const [filteredJobRoles, setFilteredJobRoles] = useState<JobRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedJobRole, setSelectedJobRole] = useState<JobRole | null>(null);

  useEffect(() => {
    fetchJobRoles();
  }, []);

  useEffect(() => {
    const filtered = jobRoles.filter(role =>
      role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredJobRoles(filtered);
  }, [jobRoles, searchTerm]);

  const fetchJobRoles = async () => {
    try {
      const response = await api.get('/job-roles');
      setJobRoles(response.data);
    } catch (error) {
      toast.error('Failed to fetch job roles');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteJobRole = async (roleId: string) => {
    if (!window.confirm('Are you sure you want to delete this job role?')) return;

    try {
      await api.delete(`/job-roles/${roleId}`);
      setJobRoles(jobRoles.filter(r => r._id !== roleId));
      toast.success('Job role deleted successfully');
    } catch (error) {
      toast.error('Failed to delete job role');
    }
  };

  const handleJobRoleSaved = (savedJobRole: JobRole) => {
    if (selectedJobRole) {
      setJobRoles(jobRoles.map(r => r._id === savedJobRole._id ? savedJobRole : r));
    } else {
      setJobRoles([...jobRoles, savedJobRole]);
    }
    setShowModal(false);
    setSelectedJobRole(null);
  };

  const handleEditJobRole = (jobRole: JobRole) => {
    setSelectedJobRole(jobRole);
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
          <h1 className="text-3xl font-bold text-white">Job Roles</h1>
          {hasPermission('job_roles', 'add') && (
            <button
              onClick={() => setShowModal(true)}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Job Role
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search job roles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Job Roles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredJobRoles.map((jobRole) => (
            <div
              key={jobRole._id}
              className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6 hover:bg-white/15 transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                    <Briefcase className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-semibold text-white">
                      {jobRole.name}
                    </h3>
                  </div>
                </div>
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                  jobRole.isActive 
                    ? 'bg-green-500/20 text-green-300' 
                    : 'bg-red-500/20 text-red-300'
                }`}>
                  {jobRole.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <p className="text-gray-300 text-sm mb-4 min-h-[3rem]">
                {jobRole.description || 'No description available'}
              </p>

              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400">
                  Created: {new Date(jobRole.createdAt).toLocaleDateString()}
                </p>
                <div className="flex items-center gap-2">
                  {hasPermission('job_roles', 'update') && (
                    <button
                      onClick={() => handleEditJobRole(jobRole)}
                      className="text-blue-400 hover:text-blue-300 transition-colors"
                      title="Edit Job Role"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                  )}
                  {hasPermission('job_roles', 'delete') && (
                    <button
                      onClick={() => handleDeleteJobRole(jobRole._id)}
                      className="text-red-400 hover:text-red-300 transition-colors"
                      title="Delete Job Role"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredJobRoles.length === 0 && (
          <div className="text-center py-12">
            <Briefcase className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-white mb-2">No Job Roles Found</h3>
            <p className="text-gray-400 mb-6">
              {searchTerm ? 'No job roles match your search.' : 'Get started by creating your first job role.'}
            </p>
            {hasPermission('job_roles', 'add') && !searchTerm && (
              <button
                onClick={() => setShowModal(true)}
                className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 mx-auto"
              >
                <Plus className="h-4 w-4" />
                Add First Job Role
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <JobRoleModal
          jobRole={selectedJobRole}
          onClose={() => {
            setShowModal(false);
            setSelectedJobRole(null);
          }}
          onSave={handleJobRoleSaved}
        />
      )}
    </Layout>
  );
};

export default JobRoles;