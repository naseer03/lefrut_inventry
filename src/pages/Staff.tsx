import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, FileText, Eye } from 'lucide-react';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import StaffModal from '../components/StaffModal';

interface Staff {
  _id: string;
  fullName: string;
  employeeId: string;
  mobileNumber: string;
  email: string;
  userId: {
    _id: string;
    username: string;
    email: string;
  };
  departmentId: {
    _id: string;
    name: string;
  };
  jobRoles: Array<{
    _id: string;
    name: string;
  }>;
  shiftTiming: string;
  dateOfJoining: string;
  salary: number;
  address: string;
  status: string;
  profilePhoto: string;
  isActive: boolean;
  createdAt: string;
}

const Staff: React.FC = () => {
  const { hasPermission } = useAuth();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [filteredStaff, setFilteredStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchStaff();
  }, []);

  useEffect(() => {
    let filtered = staff.filter(member =>
      member.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.mobileNumber.includes(searchTerm) ||
      member.departmentId.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (filterStatus !== 'all') {
      filtered = filtered.filter(member => member.status === filterStatus);
    }

    setFilteredStaff(filtered);
  }, [staff, searchTerm, filterStatus]);

  const fetchStaff = async () => {
    try {
      const response = await api.get('/staff');
      setStaff(response.data);
    } catch (error) {
      toast.error('Failed to fetch staff');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStaff = async (staffId: string) => {
    if (!window.confirm('Are you sure you want to delete this staff member?')) return;

    try {
      await api.delete(`/staff/${staffId}`);
      setStaff(staff.filter(s => s._id !== staffId));
      toast.success('Staff member deleted successfully');
    } catch (error) {
      toast.error('Failed to delete staff member');
    }
  };

  const handleStaffSaved = (savedStaff: Staff) => {
    if (selectedStaff) {
      setStaff(staff.map(s => s._id === savedStaff._id ? savedStaff : s));
    } else {
      setStaff([...staff, savedStaff]);
    }
    setShowModal(false);
    setSelectedStaff(null);
  };

  const handleEditStaff = (staffMember: Staff) => {
    setSelectedStaff(staffMember);
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
          <h1 className="text-3xl font-bold text-white">Staff Management</h1>
          {hasPermission('staff', 'add') && (
            <button
              onClick={() => setShowModal(true)}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Staff Member
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search staff..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* Staff Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStaff.map((staffMember) => (
            <div
              key={staffMember._id}
              className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6 hover:bg-white/15 transition-all duration-300"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center overflow-hidden">
                  {staffMember.profilePhoto ? (
                    <img 
                      src={`http://localhost:5000${staffMember.profilePhoto}`} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-lg font-bold text-white">
                      {staffMember.fullName.split(' ').map(n => n[0]).join('')}
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-1">
                    {staffMember.fullName}
                  </h3>
                  <p className="text-sm text-gray-300">ID: {staffMember.employeeId}</p>
                  <p className="text-sm text-gray-300">{staffMember.departmentId.name}</p>
                </div>
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                  staffMember.status === 'active' 
                    ? 'bg-green-500/20 text-green-300' 
                    : 'bg-red-500/20 text-red-300'
                }`}>
                  {staffMember.status}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Mobile:</span>
                  <span className="text-white">{staffMember.mobileNumber}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Salary:</span>
                  <span className="text-white">₹{staffMember.salary?.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Joined:</span>
                  <span className="text-white">
                    {new Date(staffMember.dateOfJoining).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-xs text-gray-400 mb-1">Job Roles:</p>
                <div className="flex flex-wrap gap-1">
                  {staffMember.jobRoles.map((role) => (
                    <span
                      key={role._id}
                      className="inline-flex px-2 py-1 text-xs font-medium bg-blue-500/20 text-blue-300 rounded-md"
                    >
                      {role.name}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {hasPermission('staff', 'view') && (
                    <button
                      onClick={() => {/* View details */}}
                      className="text-green-400 hover:text-green-300 transition-colors"
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  )}
                  {hasPermission('staff', 'view') && (
                    <button
                      onClick={() => {/* View documents */}}
                      className="text-yellow-400 hover:text-yellow-300 transition-colors"
                      title="View Documents"
                    >
                      <FileText className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {hasPermission('staff', 'update') && (
                    <button
                      onClick={() => handleEditStaff(staffMember)}
                      className="text-blue-400 hover:text-blue-300 transition-colors"
                      title="Edit Staff"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                  )}
                  {hasPermission('staff', 'delete') && (
                    <button
                      onClick={() => handleDeleteStaff(staffMember._id)}
                      className="text-red-400 hover:text-red-300 transition-colors"
                      title="Delete Staff"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredStaff.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400">No staff members found</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <StaffModal
          staff={selectedStaff}
          onClose={() => {
            setShowModal(false);
            setSelectedStaff(null);
          }}
          onSave={handleStaffSaved}
        />
      )}
    </Layout>
  );
};

export default Staff;