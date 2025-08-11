import React, { useState, useEffect } from 'react';
import { X, Upload, Tag } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

interface Category {
  _id: string;
  name: string;
  description: string;
  isActive: boolean;
}

interface SubCategory {
  _id: string;
  name: string;
  description: string;
  categoryId: string;
  subCategoryImage: string;
  isActive: boolean;
}

interface SubCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (subCategory: SubCategory) => void;
  subCategory?: SubCategory | null;
}

const SubCategoryModal: React.FC<SubCategoryModalProps> = ({
  isOpen,
  onClose,
  onSave,
  subCategory
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    categoryId: ''
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      if (subCategory) {
        setFormData({
          name: subCategory.name,
          description: subCategory.description,
          categoryId: subCategory.categoryId
        });
        setImagePreview(subCategory.subCategoryImage ? `http://localhost:5001${subCategory.subCategoryImage}` : '');
      } else {
        resetForm();
      }
    }
  }, [isOpen, subCategory]);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories?isActive=true');
      setCategories(response.data);
    } catch (error) {
      toast.error('Failed to fetch categories');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      categoryId: ''
    });
    setSelectedImage(null);
    setImagePreview('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }
      
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.categoryId) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const submitData = new FormData();
      submitData.append('name', formData.name.trim());
      submitData.append('description', formData.description.trim());
      submitData.append('categoryId', formData.categoryId);
      
      if (selectedImage) {
        submitData.append('subCategoryImage', selectedImage);
      }

      let response;
      if (subCategory) {
        response = await api.put(`/sub-categories/${subCategory._id}`, submitData);
        toast.success('Sub-category updated successfully');
      } else {
        response = await api.post('/sub-categories', submitData);
        toast.success('Sub-category created successfully');
      }

      onSave(response.data);
      onClose();
    } catch (error: any) {
      console.error('Error saving sub-category:', error);
      const errorMessage = error.response?.data?.message || 'Failed to save sub-category';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-white/20 w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Tag className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">
                {subCategory ? 'Edit Sub-Category' : 'Add New Sub-Category'}
              </h2>
              <p className="text-sm text-gray-400">
                {subCategory ? 'Update sub-category information' : 'Create a new sub-category'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Category Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Parent Category *
            </label>
            <select
              name="categoryId"
              value={formData.categoryId}
              onChange={handleInputChange}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sub-Category Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Sub-Category Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter sub-category name"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Enter sub-category description"
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Sub-Category Image
            </label>
            <div className="space-y-4">
              {/* Image Preview */}
              {imagePreview && (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-32 h-32 object-cover rounded-lg border border-white/10"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedImage(null);
                      setImagePreview('');
                    }}
                    className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full hover:bg-red-600 transition-colors"
                  >
                    <X className="h-3 w-3 text-white" />
                  </button>
                </div>
              )}

              {/* Upload Button */}
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/20 rounded-lg cursor-pointer bg-white/5 hover:bg-white/10 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-2 text-gray-400" />
                    <p className="mb-2 text-sm text-gray-400">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-3 bg-white/5 border border-white/10 text-white rounded-xl font-medium hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  {subCategory ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  <Tag className="h-4 w-4" />
                  {subCategory ? 'Update Sub-Category' : 'Create Sub-Category'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubCategoryModal; 