import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Tag } from 'lucide-react';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import CategoryModal from '../components/CategoryModal';

interface Category {
  _id: string;
  name: string;
  description: string;
  categoryImage: string;
  isActive: boolean;
  createdAt: string;
}

const Categories: React.FC = () => {
  const { hasPermission } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    const filtered = categories.filter(category =>
      category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredCategories(filtered);
  }, [categories, searchTerm]);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data);
    } catch (error) {
      toast.error('Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;

    try {
      await api.delete(`/categories/${categoryId}`);
      setCategories(categories.filter(c => c._id !== categoryId));
      toast.success('Category deleted successfully');
    } catch (error) {
      toast.error('Failed to delete category');
    }
  };

  const handleCategorySaved = (savedCategory: Category) => {
    if (selectedCategory) {
      setCategories(categories.map(c => c._id === savedCategory._id ? savedCategory : c));
    } else {
      setCategories([...categories, savedCategory]);
    }
    setShowModal(false);
    setSelectedCategory(null);
  };

  const handleEditCategory = (category: Category) => {
    setSelectedCategory(category);
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
          <h1 className="text-3xl font-bold text-white">Categories</h1>
          {hasPermission('categories', 'add') && (
            <button
              onClick={() => setShowModal(true)}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Category
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCategories.map((category) => (
            <div
              key={category._id}
              className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6 hover:bg-white/15 transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-blue-500 rounded-lg flex items-center justify-center overflow-hidden">
                    {category.categoryImage ? (
                      <img 
                        src={`http://localhost:5000${category.categoryImage}`} 
                        alt={category.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Tag className="h-8 w-8 text-white" />
                    )}
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-semibold text-white">
                      {category.name}
                    </h3>
                  </div>
                </div>
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                  category.isActive 
                    ? 'bg-green-500/20 text-green-300' 
                    : 'bg-red-500/20 text-red-300'
                }`}>
                  {category.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <p className="text-gray-300 text-sm mb-4 min-h-[3rem]">
                {category.description || 'No description available'}
              </p>

              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400">
                  Created: {new Date(category.createdAt).toLocaleDateString()}
                </p>
                <div className="flex items-center gap-2">
                  {hasPermission('categories', 'update') && (
                    <button
                      onClick={() => handleEditCategory(category)}
                      className="text-blue-400 hover:text-blue-300 transition-colors"
                      title="Edit Category"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                  )}
                  {hasPermission('categories', 'delete') && (
                    <button
                      onClick={() => handleDeleteCategory(category._id)}
                      className="text-red-400 hover:text-red-300 transition-colors"
                      title="Delete Category"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredCategories.length === 0 && (
          <div className="text-center py-12">
            <Tag className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-white mb-2">No Categories Found</h3>
            <p className="text-gray-400 mb-6">
              {searchTerm ? 'No categories match your search.' : 'Get started by creating your first category.'}
            </p>
            {hasPermission('categories', 'add') && !searchTerm && (
              <button
                onClick={() => setShowModal(true)}
                className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 mx-auto"
              >
                <Plus className="h-4 w-4" />
                Add First Category
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <CategoryModal
          category={selectedCategory}
          onClose={() => {
            setShowModal(false);
            setSelectedCategory(null);
          }}
          onSave={handleCategorySaved}
        />
      )}
    </Layout>
  );
};

export default Categories;