import React, { useState, useEffect } from 'react';
import { X, Upload } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

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
}

interface Department {
  _id: string;
  name: string;
}

interface JobRole {
  _id: string;
  name: string;
}

interface User {
  _id: string;
  username: string;
  email: string;
}

interface StaffModalProps {
  staff: Staff | null;
  onClose: () => void;
  onSave: (staff: Staff) => void;
}

const StaffModal: React.FC<StaffModalProps> = ({ staff, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    employeeId: '',
    mobileNumber: '',
    email: '',
    userId: '',
    departmentId: '',
    jobRoles: [] as string[],
    shiftTiming: '',
    dateOfJoining: '',
    salary: '',
    address: '',
    status: 'active',
    password: ''
  });
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [jobRoles, setJobRoles] = useState<JobRole[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    fetchData();
    if (staff) {
      setFormData({
        fullName: staff.fullName,
        employeeId: staff.employeeId,
        mobileNumber: staff.mobileNumber,
        email: staff.email || '',
        userId: staff.userId._id,
        departmentId: staff.departmentId._id,
        jobRoles: staff.jobRoles.map(role => role._id),
        shiftTiming: staff.shiftTiming,
        dateOfJoining: staff.dateOfJoining.split('T')[0],
        salary: staff.salary?.toString() || '',
        address: staff.address,
        status: staff.status,
        password: ''
      });
    }
  }, [staff]);

  const fetchData = async () => {
    try {
      const [deptResponse, roleResponse, userResponse] = await Promise.all([
        api.get('/departments'),
        api.get('/job-roles'),
        api.get('/users')
      ]);
      setDepartments(deptResponse.data);
      setJobRoles(roleResponse.data);
      setUsers(userResponse.data);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setDataLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = new FormData();
      
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'jobRoles') {
          submitData.append(key, JSON.stringify(value));
        } else {
          submitData.append(key, value.toString());
        }
      });

      if (profilePhoto) {
        submitData.append('profilePhoto', profilePhoto);
      }

      const response = staff
        ? await api.put(`/staff/${staff._id}`, submitData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          })
        : await api.post('/staff', submitData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });

      onSave(response.data);
      toast.success(`Staff ${staff ? 'updated' : 'created'} successfully`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleJobRoleChange = (roleId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      jobRoles: checked
        ? [...prev.jobRoles, roleId]
        : prev.jobRoles.filter(id => id !== roleId)
    }));
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
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-white/20">
          <h2 className="text-xl font-bold text-white">
            {staff ? 'Edit Staff Member' : 'Add New Staff Member'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-8rem)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Profile Photo */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Profile Photo
              </label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center overflow-hidden">
                  {staff?.profilePhoto ? (
                    <img 
                      src={`http://localhost:5000${staff.profilePhoto}`} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-lg font-bold text-white">
                      {formData.fullName.split(' ').map(n => n[0]).join('')}
                    </span>
                  )}
                </div>
                <label className="cursor-pointer bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Choose Photo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setProfilePhoto(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Basic Information */}
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                required
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Employee ID *
              </label>
              <input
                type="text"
                value={formData.employeeId}
                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                required
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Mobile Number *
              </label>
              <input
                type="tel"
                value={formData.mobileNumber}
                onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                required
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                User Account *
              </label>
              <select
                value={formData.userId}
                onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                required
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select User</option>
                {users.map((user) => (
                  <option key={user._id} value={user._id}>
                    {user.username} ({user.email})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Department *
              </label>
              <select
                value={formData.departmentId}
                onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                required
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Department</option>
                {departments.map((dept) => (
                  <option key={dept._id} value={dept._id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Shift Timing
              </label>
              <input
                type="text"
                value={formData.shiftTiming}
                onChange={(e) => setFormData({ ...formData, shiftTiming: e.target.value })}
                placeholder="e.g., 9:00 AM - 6:00 PM"
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Date of Joining *
              </label>
              <input
                type="date"
                value={formData.dateOfJoining}
                onChange={(e) => setFormData({ ...formData, dateOfJoining: e.target.value })}
                required
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Salary
              </label>
              <input
                type="number"
                value={formData.salary}
                onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                min="0"
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Address
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {!staff && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Password *
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={!staff}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {/* Job Roles */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Job Roles
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {jobRoles.map((role) => (
                  <label
                    key={role._id}
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={formData.jobRoles.includes(role._id)}
                      onChange={(e) => handleJobRoleChange(role._id, e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <span className="text-sm text-gray-300">{role.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-6 mt-6 border-t border-white/20">
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
              {loading ? 'Saving...' : 'Save Staff Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StaffModal;