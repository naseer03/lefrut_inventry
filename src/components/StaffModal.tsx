import React, { useState, useEffect } from 'react';
import { X, Upload, RefreshCw } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

interface Staff {
  _id: string;
  fullName: string;
  employeeId: string;
  mobileNumber: string;
  email: string;
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
  idProofType: string;
  idProofNumber: string;
  idProofDocument: string;
  // Truck Driver Information
  drivingLicenseNumber: string;
  drivingLicenseExpiry: string;
  drivingLicenseDocument: string;
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
    departmentId: '',
    jobRoles: [] as string[],
    shiftTiming: '',
    dateOfJoining: '',
    salary: '',
    address: '',
    idProofType: '',
    idProofNumber: '',
    idProofDocument: '',
    // Truck Driver Information
    drivingLicenseNumber: '',
    drivingLicenseExpiry: '',
    status: 'active',
    password: '',
    confirmPassword: '',
  });
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [idProofDocument, setIdProofDocument] = useState<File | null>(null);
  const [drivingLicenseDocument, setDrivingLicenseDocument] = useState<File | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [jobRoles, setJobRoles] = useState<JobRole[]>([]);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [generatingEmployeeId, setGeneratingEmployeeId] = useState(false);

  useEffect(() => {
    fetchData();
    if (staff) {
      setFormData({
        fullName: staff.fullName,
        employeeId: staff.employeeId,
        mobileNumber: staff.mobileNumber,
        email: staff.email || '',
        departmentId: staff.departmentId._id,
        jobRoles: staff.jobRoles.map(role => role._id),
        shiftTiming: staff.shiftTiming,
        dateOfJoining: staff.dateOfJoining.split('T')[0],
        salary: staff.salary?.toString() || '',
        address: staff.address,
        idProofType: staff.idProofType,
        idProofNumber: staff.idProofNumber,
        idProofDocument: staff.idProofDocument,
        // Truck Driver Information
        drivingLicenseNumber: staff.drivingLicenseNumber || '',
        drivingLicenseExpiry: staff.drivingLicenseExpiry ? staff.drivingLicenseExpiry.split('T')[0] : '',
        status: staff.status,
        password: '',
        confirmPassword: '',
      });
    } else {
      // Auto-generate employee ID for new staff
      generateEmployeeId();
    }
  }, [staff]);

  const fetchData = async () => {
    try {
      const [deptResponse, roleResponse] = await Promise.all([
        api.get('/departments'),
        api.get('/job-roles')
      ]);
      setDepartments(deptResponse.data);
      setJobRoles(roleResponse.data);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setDataLoading(false);
    }
  };

  const generateEmployeeId = async () => {
    if (staff) return; // Don't generate for existing staff
    
    setGeneratingEmployeeId(true);
    try {
      const response = await api.get('/staff/next-employee-id');
      setFormData(prev => ({
        ...prev,
        employeeId: response.data.employeeId
      }));
    } catch (error) {
      toast.error('Failed to generate employee ID');
    } finally {
      setGeneratingEmployeeId(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Form submission started', { staff: !!staff, formData });
    
    // Validate password confirmation for new staff
    if (!staff && formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    // Validate password confirmation for existing staff if password is being changed
    if (staff && formData.password && formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    // Validate required fields
    const requiredFields = ['fullName', 'employeeId', 'mobileNumber', 'departmentId', 'dateOfJoining'];
    const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData]);
    
    if (missingFields.length > 0) {
      toast.error(`Missing required fields: ${missingFields.join(', ')}`);
      return;
    }
    
    // Validate job roles are selected
    if (formData.jobRoles.length === 0) {
      toast.error('Please select at least one job role');
      return;
    }
    
    // Validate truck driver specific fields if truck driver role is selected
    if (isTruckDriverSelected()) {
      if (!formData.drivingLicenseNumber.trim()) {
        toast.error('Driving License Number is required for Truck Driver role');
        return;
      }
      if (!formData.drivingLicenseExpiry) {
        toast.error('Driving License Expiry Date is required for Truck Driver role');
        return;
      }
      if (!drivingLicenseDocument && !staff?.drivingLicenseDocument) {
        toast.error('Driving License Document is required for Truck Driver role');
        return;
      }
    }
    
    setLoading(true);

    try {
      const submitData = new FormData();
      
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'jobRoles') {
          submitData.append(key, JSON.stringify(value));
        } else if (key !== 'confirmPassword') { // Don't send confirmPassword to backend
          submitData.append(key, value.toString());
        }
      });

      if (profilePhoto) {
        submitData.append('profilePhoto', profilePhoto);
      }

      if (idProofDocument) {
        submitData.append('idProofDocument', idProofDocument);
      }

      if (drivingLicenseDocument) {
        submitData.append('drivingLicenseDocument', drivingLicenseDocument);
      }

      console.log('Sending request to:', staff ? `PUT /staff/${staff._id}` : 'POST /staff');
      
      const response = staff
        ? await api.put(`/staff/${staff._id}`, submitData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          })
        : await api.post('/staff', submitData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });

      console.log('Response received:', response.data);
      onSave(response.data);
      toast.success(`Staff ${staff ? 'updated' : 'created'} successfully`);
    } catch (error: any) {
      console.error('Error in handleSubmit:', error);
      console.error('Error response:', error.response?.data);
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

  // Helper function to check if Truck Driver role is selected
  const isTruckDriverSelected = () => {
    const truckDriverRole = jobRoles.find(role => role.name === 'Truck Driver');
    return truckDriverRole && formData.jobRoles.includes(truckDriverRole._id);
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
                      src={`http://localhost:5001${staff.profilePhoto}`} 
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
                    name="profilePhoto"
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
                Employee ID
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.employeeId}
                  readOnly={!staff} // Allow editing only for existing staff (in case manual correction needed)
                  className={`flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    !staff ? 'cursor-not-allowed opacity-75' : ''
                  }`}
                  placeholder="Auto-generated"
                />
                {!staff && (
                  <button
                    type="button"
                    onClick={generateEmployeeId}
                    disabled={generatingEmployeeId}
                    className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1"
                    title="Regenerate Employee ID"
                  >
                    <RefreshCw className={`h-4 w-4 ${generatingEmployeeId ? 'animate-spin' : ''}`} />
                  </button>
                )}
              </div>
              {!staff && (
                <p className="text-xs text-gray-400 mt-1">
                  Employee ID is auto-generated. Click refresh to generate a new one.
                </p>
              )}
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

            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Password {!staff && '*'}
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required={!staff}
                placeholder={staff ? "Leave blank to keep current password" : "Enter password"}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Confirm Password {!staff && '*'}
              </label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required={!staff}
                placeholder={staff ? "Leave blank to keep current password" : "Confirm password"}
                className={`w-full px-3 py-2 bg-white/10 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  formData.confirmPassword && formData.password !== formData.confirmPassword
                    ? 'border-red-500 focus:ring-red-500'
                    : formData.confirmPassword && formData.password === formData.confirmPassword
                    ? 'border-green-500 focus:ring-green-500'
                    : 'border-white/20'
                }`}
              />
              {formData.confirmPassword && (
                <p className={`text-xs mt-1 ${
                  formData.password === formData.confirmPassword
                    ? 'text-green-400'
                    : 'text-red-400'
                }`}>
                  {formData.password === formData.confirmPassword
                    ? '✓ Passwords match'
                    : '✗ Passwords do not match'
                  }
                </p>
              )}
            </div>

            {/* ID Proof Information */}
            <div className="md:col-span-2">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-white mb-2">ID Proof Information</h3>
                <p className="text-sm text-gray-400">Identity verification documents</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">
                    ID Proof Type *
                  </label>
                  <select
                    value={formData.idProofType}
                    onChange={(e) => setFormData({ ...formData, idProofType: e.target.value })}
                    required
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select ID proof type</option>
                    <option value="Aadhar Card">Aadhar Card</option>
                    <option value="PAN Card">PAN Card</option>
                    <option value="Passport">Passport</option>
                    <option value="Driving License">Driving License</option>
                    <option value="Voter ID">Voter ID</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">
                    ID Proof Number *
                  </label>
                  <input
                    type="text"
                    value={formData.idProofNumber}
                    onChange={(e) => setFormData({ ...formData, idProofNumber: e.target.value })}
                    required
                    placeholder="Enter ID proof number"
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Upload ID Proof Document *
                </label>
                <div className="flex items-center gap-4">
                  <label className="cursor-pointer bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    Choose file
                    <input
                      type="file"
                      name="idProofDocument"
                      accept="image/*,.pdf"
                      onChange={(e) => setIdProofDocument(e.target.files?.[0] || null)}
                      className="hidden"
                      required={!staff?.idProofDocument}
                    />
                  </label>
                  {idProofDocument && (
                    <span className="text-sm text-green-400">
                      ✓ {idProofDocument.name}
                    </span>
                  )}
                  {staff?.idProofDocument && !idProofDocument && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-400">
                        Current: {staff.idProofDocument.split('/').pop()}
                      </span>
                      <a
                        href={`http://localhost:5001${staff.idProofDocument}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 text-sm"
                      >
                        View Document
                      </a>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Max 5MB, Images or PDF only
                </p>
              </div>
            </div>

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

            {/* Truck Driver Information (conditional) */}
            {isTruckDriverSelected() && (
              <div className="md:col-span-2">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-white mb-2">Truck Driver Information</h3>
                  <p className="text-sm text-gray-400">Details for Truck Driver role</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                      Driving License Number *
                    </label>
                    <input
                      type="text"
                      value={formData.drivingLicenseNumber}
                      onChange={(e) => setFormData({ ...formData, drivingLicenseNumber: e.target.value })}
                      required
                      placeholder="e.g., MH1420110012345"
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                      License Expiry Date *
                    </label>
                    <input
                      type="date"
                      value={formData.drivingLicenseExpiry}
                      onChange={(e) => setFormData({ ...formData, drivingLicenseExpiry: e.target.value })}
                      required
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">
                    Upload Driving License *
                  </label>
                  <div className="flex items-center gap-4">
                    <label className="cursor-pointer bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      Choose license file
                      <input
                        type="file"
                        name="drivingLicenseDocument"
                        accept="image/*,.pdf"
                        onChange={(e) => setDrivingLicenseDocument(e.target.files?.[0] || null)}
                        className="hidden"
                        required={!staff?.drivingLicenseDocument}
                      />
                    </label>
                    {drivingLicenseDocument && (
                      <span className="text-sm text-green-400">
                        ✓ {drivingLicenseDocument.name}
                      </span>
                    )}
                    {staff?.drivingLicenseDocument && !drivingLicenseDocument && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-400">
                          Current: {staff.drivingLicenseDocument.split('/').pop()}
                        </span>
                        <a
                          href={`http://localhost:5001${staff.drivingLicenseDocument}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 text-sm"
                        >
                          View Document
                        </a>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Max 5MB, Images or PDF only
                  </p>
                  <div className="mt-2 p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
                    <p className="text-xs text-yellow-300">
                      Note: The driving license must be valid and not expired. Please ensure all details are clearly visible in the uploaded document.
                    </p>
                  </div>
                </div>
              </div>
            )}
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
              disabled={loading || generatingEmployeeId}
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