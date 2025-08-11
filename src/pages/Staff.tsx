import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, FileText, Eye, User, Calendar, Briefcase } from 'lucide-react';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import StaffModal from '../components/StaffModal';
// Define the Staff interface
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
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [departments, setDepartments] = useState<any[]>([]);

  // Check permissions
  const canView = hasPermission('staff', 'view');
  const canAdd = hasPermission('staff', 'add');
  const canUpdate = hasPermission('staff', 'update');
  const canDelete = hasPermission('staff', 'delete');

  useEffect(() => {
    if (canView) {
      fetchStaff();
      fetchDepartments();
    }
  }, [canView]);

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

    if (filterDepartment !== 'all') {
      filtered = filtered.filter(member => member.departmentId._id === filterDepartment);
    }

    setFilteredStaff(filtered);
  }, [staff, searchTerm, filterStatus, filterDepartment]);

  const fetchStaff = async () => {
    try {
      const response = await api.get('/staff');
      setStaff(response.data);
      console.log('Staff fetched:', response.data.length);
    } catch (error: any) {
      console.error('Error fetching staff:', error);
      if (error.response?.status === 403) {
        toast.error('You do not have permission to view staff');
      } else {
        toast.error('Failed to fetch staff');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await api.get('/departments');
      setDepartments(response.data);
    } catch (error) {
      console.error('Failed to fetch departments');
    }
  };

  const handleDeleteStaff = async (staffId: string, staffName: string) => {
    if (!canDelete) {
      toast.error('You do not have permission to delete staff');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ${staffName}? This action cannot be undone.`)) {
      return;
    }

    try {
      await api.delete(`/staff/${staffId}`);
      setStaff(staff.filter(s => s._id !== staffId));
      toast.success('Staff member deleted successfully');
    } catch (error: any) {
      console.error('Error deleting staff:', error);
      if (error.response?.status === 403) {
        toast.error('You do not have permission to delete staff');
      } else {
        toast.error('Failed to delete staff member');
      }
    }
  };

  const handleStaffSaved = (savedStaff: Staff) => {
    if (selectedStaff) {
      // Update existing staff
      setStaff(staff.map(s => s._id === savedStaff._id ? savedStaff : s));
    } else {
      // Add new staff
      setStaff([savedStaff, ...staff]);
    }
    setShowModal(false);
    setSelectedStaff(null);
  };

  const handleEditStaff = (staffMember: Staff) => {
    if (!canUpdate) {
      toast.error('You do not have permission to edit staff');
      return;
    }
    setSelectedStaff(staffMember);
    setShowModal(true);
  };

  const handleAddStaff = () => {
    if (!canAdd) {
      toast.error('You do not have permission to add staff');
      return;
    }
    setSelectedStaff(null);
    setShowModal(true);
  };

  // Show permission denied message if user can't view staff
  if (!canView) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-white mb-2">Access Denied</h3>
            <p className="text-gray-400">You don't have permission to view staff members.</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-white">Loading staff members...</p>
          </div>
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
            <h1 className="text-3xl font-bold text-white">Staff Management</h1>
            <p className="text-gray-300 mt-1">
              Total Staff: {staff.length} | Active: {staff.filter(s => s.status === 'active').length}
            </p>
          </div>
          {canAdd && (
            <button
              onClick={handleAddStaff}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Staff Member
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search staff (name, ID, phone)..."
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

            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Departments</option>
              {departments.map((dept) => (
                <option key={dept._id} value={dept._id}>
                  {dept.name}
                </option>
              ))}
            </select>

            <div className="text-sm text-gray-300 flex items-center justify-center px-4 py-3 bg-white/5 rounded-lg">
              Showing {filteredStaff.length} of {staff.length} staff
            </div>
          </div>
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
                      src={`http://localhost:5001${staffMember.profilePhoto}`} 
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
                  <div className="flex items-center gap-2 mb-1">
                    <User className="h-3 w-3 text-gray-400" />
                    <p className="text-sm text-blue-300 font-mono">{staffMember.employeeId}</p>
                  </div>
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
                  <span className="text-gray-400 flex items-center gap-1">
                    📞 Mobile:
                  </span>
                  <span className="text-white font-mono">{staffMember.mobileNumber}</span>
                </div>
                
                {staffMember.salary && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">💰 Salary:</span>
                    <span className="text-white">₹{staffMember.salary?.toLocaleString()}</span>
                  </div>
                )}
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Joined:
                  </span>
                  <span className="text-white">
                    {new Date(staffMember.dateOfJoining).toLocaleDateString()}
                  </span>
                </div>

                {staffMember.shiftTiming && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">⏰ Shift:</span>
                    <span className="text-white text-xs">{staffMember.shiftTiming}</span>
                  </div>
                )}
              </div>

              <div className="mb-4">
                <p className="text-xs text-gray-400 mb-2 flex items-center gap-1">
                  <Briefcase className="h-3 w-3" />
                  Job Roles:
                </p>
                <div className="flex flex-wrap gap-1">
                  {staffMember.jobRoles.slice(0, 2).map((role) => (
                    <span
                      key={role._id}
                      className="inline-flex px-2 py-1 text-xs font-medium bg-blue-500/20 text-blue-300 rounded-md"
                    >
                      {role.name}
                    </span>
                  ))}
                  {staffMember.jobRoles.length > 2 && (
                    <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-500/20 text-gray-300 rounded-md">
                      +{staffMember.jobRoles.length - 2} more
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-white/10">
                <div className="flex items-center gap-2">
                  {canView && (
                    <button
                      onClick={() => {/* View details */}}
                      className="text-green-400 hover:text-green-300 transition-colors"
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  )}
                  {canView && (
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
                  {canUpdate && (
                    <button
                      onClick={() => handleEditStaff(staffMember)}
                      className="text-blue-400 hover:text-blue-300 transition-colors"
                      title="Edit Staff"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => handleDeleteStaff(staffMember._id, staffMember.fullName)}
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
            <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-white mb-2">No Staff Members Found</h3>
            <p className="text-gray-400 mb-6">
              {searchTerm || filterStatus !== 'all' || filterDepartment !== 'all' 
                ? 'No staff members match your current filters.' 
                : 'Get started by adding your first staff member.'}
            </p>
            {canAdd && !searchTerm && filterStatus === 'all' && filterDepartment === 'all' && (
              <button
                onClick={handleAddStaff}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 mx-auto"
              >
                <Plus className="h-4 w-4" />
                Add First Staff Member
              </button>
            )}
          </div>
        )}

        {/* Quick Stats */}
        {staff.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-green-500/10 backdrop-blur-lg rounded-xl border border-green-500/20 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-300 text-sm font-medium">Active Staff</p>
                  <p className="text-2xl font-bold text-white">
                    {staff.filter(s => s.status === 'active').length}
                  </p>
                </div>
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <User className="h-5 w-5 text-green-400" />
                </div>
              </div>
            </div>
            
            <div className="bg-blue-500/10 backdrop-blur-lg rounded-xl border border-blue-500/20 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-300 text-sm font-medium">Departments</p>
                  <p className="text-2xl font-bold text-white">
                    {new Set(staff.map(s => s.departmentId._id)).size}
                  </p>
                </div>
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Briefcase className="h-5 w-5 text-blue-400" />
                </div>
              </div>
            </div>

            <div className="bg-purple-500/10 backdrop-blur-lg rounded-xl border border-purple-500/20 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-300 text-sm font-medium">This Month</p>
                  <p className="text-2xl font-bold text-white">
                    {staff.filter(s => {
                      const joinDate = new Date(s.dateOfJoining);
                      const now = new Date();
                      return joinDate.getMonth() === now.getMonth() && 
                             joinDate.getFullYear() === now.getFullYear();
                    }).length}
                  </p>
                </div>
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-purple-400" />
                </div>
              </div>
            </div>

            <div className="bg-orange-500/10 backdrop-blur-lg rounded-xl border border-orange-500/20 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-300 text-sm font-medium">Avg. Roles</p>
                  <p className="text-2xl font-bold text-white">
                    {staff.length > 0 ? 
                      (staff.reduce((sum, s) => sum + s.jobRoles.length, 0) / staff.length).toFixed(1) 
                      : '0'}
                  </p>
                </div>
                <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                  <FileText className="h-5 w-5 text-orange-400" />
                </div>
              </div>
            </div>
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