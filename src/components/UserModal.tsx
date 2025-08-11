import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

interface User {
  _id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  permissions: Array<{
    module: string;
    actions: string[];
  }>;
}

interface UserModalProps {
  user: User | null;
  onClose: () => void;
  onSave: (user: User) => void;
}

const UserModal: React.FC<UserModalProps> = ({ user, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    role: 'user',
    isActive: true
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: `${user.firstName} ${user.lastName}`.trim(),
        role: user.role,
        isActive: user.isActive
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Split the name into firstName and lastName
      const nameParts = formData.name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      let submitData;
      
      if (user) {
        // For editing existing users, preserve username and email
        submitData = {
          firstName,
          lastName,
          role: formData.role,
          isActive: formData.isActive
        };
      } else {
        // For new users, generate unique username and email
        const baseUsername = formData.name.toLowerCase().replace(/\s+/g, '.');
        const timestamp = Date.now().toString().slice(-4); // Last 4 digits of timestamp
        const username = `${baseUsername}.${timestamp}`;
        const email = `${username}@fruitbusiness.com`;

        submitData = {
          firstName,
          lastName,
          username,
          email,
          password: 'defaultPassword123', // Default password for new users
          role: formData.role,
          isActive: formData.isActive
        };
      }

      console.log('Submitting user data:', submitData);

      const response = user
        ? await api.put(`/users/${user._id}`, submitData)
        : await api.post('/users', submitData);

      onSave(response.data);
      toast.success(`User ${user ? 'updated' : 'created'} successfully`);
    } catch (error: any) {
      console.error('Error creating/updating user:', error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else if (error.message) {
        toast.error(error.message);
      } else {
        toast.error('An error occurred while saving the user');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-white/20">
          <h2 className="text-xl font-bold text-white">
            {user ? 'Edit User' : 'Add New User'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {!user && (
            <div className="p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg">
              <p className="text-sm text-blue-200">
                <strong>Note:</strong> Username and email will be auto-generated from the name. 
                Default password will be "defaultPassword123".
              </p>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="Enter full name"
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Role
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
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

export default UserModal;