import React, { useState, useEffect } from 'react';
import { X, Upload } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

interface Category {
  _id: string;
  name: string;
  description: string;
  categoryImage: string;
  isActive: boolean;
}

interface CategoryModalProps {
  category: Category | null;
  onClose: () => void;
  onSave: (category: Category) => void;
}

const CategoryModal: React.FC<CategoryModalProps> = ({ category, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true
  });
  const [categoryImage, setCategoryImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        description: category.description,
        isActive: category.isActive
      });
    }
  }, [category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitFormData = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        submitFormData.append(key, value.toString());
      });

      if (categoryImage) {
        submitFormData.append('categoryImage', categoryImage);
      }

      const response = category
        ? await api.put(`/categories/${category._id}`, submitFormData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          })
        : await api.post('/categories', submitFormData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });

      onSave(response.data);
      toast.success(`Category ${category ? 'updated' : 'created'} successfully`);
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
            {category ? 'Edit Category' : 'Add New Category'}
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
              Category Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter category name"
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
              placeholder="Enter category description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Category Image
            </label>
            <div className="flex items-center space-x-4">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setCategoryImage(e.target.files?.[0] || null)}
                className="hidden"
                id="categoryImage"
              />
              <label
                htmlFor="categoryImage"
                className="flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg cursor-pointer transition-colors"
              >
                <Upload className="h-4 w-4 mr-2" />
                Choose Image
              </label>
              {categoryImage && (
                <span className="text-sm text-gray-300">{categoryImage.name}</span>
              )}
            </div>
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

export default CategoryModal;