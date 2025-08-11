import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Tag, FolderOpen, ChevronDown, ChevronRight } from 'lucide-react';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import CategoryModal from '../components/CategoryModal';
import SubCategoryModal from '../components/SubCategoryModal';

interface Category {
  _id: string;
  name: string;
  description: string;
  categoryImage: string;
  isActive: boolean;
  createdAt?: string;
}

interface SubCategory {
  _id: string;
  name: string;
  description: string;
  categoryId: {
    _id: string;
    name: string;
  };
  subCategoryImage: string;
  isActive: boolean;
  createdAt?: string;
}

interface SubCategoryFormData {
  _id: string;
  name: string;
  description: string;
  categoryId: string;
  subCategoryImage: string;
  isActive: boolean;
  createdAt?: string;
}

const Categories: React.FC = () => {
  const { hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState<'categories' | 'subcategories'>('categories');
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [filteredSubCategories, setFilteredSubCategories] = useState<SubCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showSubCategoryModal, setShowSubCategoryModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<SubCategory | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (activeTab === 'categories') {
      const filtered = categories.filter(category =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCategories(filtered);
    } else {
      const filtered = subCategories.filter(subCategory =>
        subCategory.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        subCategory.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        subCategory.categoryId.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredSubCategories(filtered);
    }
  }, [categories, subCategories, searchTerm, activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [categoriesResponse, subCategoriesResponse] = await Promise.all([
        api.get('/categories'),
        api.get('/sub-categories')
      ]);
      setCategories(categoriesResponse.data);
      setSubCategories(subCategoriesResponse.data);
    } catch (error) {
      toast.error('Failed to fetch data');
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

  const handleDeleteSubCategory = async (subCategoryId: string) => {
    if (!window.confirm('Are you sure you want to delete this sub-category?')) return;

    try {
      await api.delete(`/sub-categories/${subCategoryId}`);
      setSubCategories(subCategories.filter(sc => sc._id !== subCategoryId));
      toast.success('Sub-category deleted successfully');
    } catch (error) {
      toast.error('Failed to delete sub-category');
    }
  };

  const handleCategorySaved = (savedCategory: Category) => {
    if (selectedCategory) {
      setCategories(categories.map(c => c._id === savedCategory._id ? savedCategory : c));
    } else {
      setCategories([...categories, savedCategory]);
    }
    setShowCategoryModal(false);
    setSelectedCategory(null);
  };

  const handleSubCategorySaved = (savedSubCategory: any) => {
    // Convert the modal response format to the page expected format
    const pageSubCategory: SubCategory = {
      ...savedSubCategory,
      categoryId: typeof savedSubCategory.categoryId === 'string' 
        ? { _id: savedSubCategory.categoryId, name: '' } // We'll need to fetch the category name
        : savedSubCategory.categoryId
    };
    
    if (selectedSubCategory) {
      setSubCategories(subCategories.map(sc => sc._id === pageSubCategory._id ? pageSubCategory : sc));
    } else {
      setSubCategories([...subCategories, pageSubCategory]);
    }
    setShowSubCategoryModal(false);
    setSelectedSubCategory(null);
  };

  const handleEditCategory = (category: Category) => {
    setSelectedCategory(category);
    setShowCategoryModal(true);
  };

  const handleEditSubCategory = (subCategory: SubCategory) => {
    // Convert the API response format to the modal expected format
    const modalSubCategory = {
      ...subCategory,
      categoryId: subCategory.categoryId._id // Convert object to string for modal
    };
    setSelectedSubCategory(modalSubCategory as any);
    setShowSubCategoryModal(true);
  };

  const toggleCategoryExpansion = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const getSubCategoriesForCategory = (categoryId: string) => {
    return subCategories.filter(sc => sc.categoryId._id === categoryId);
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
          <h1 className="text-3xl font-bold text-white">Categories & Sub-Categories</h1>
          <div className="flex gap-3">
            {activeTab === 'categories' && hasPermission('categories', 'add') && (
              <button
                onClick={() => setShowCategoryModal(true)}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Category
              </button>
            )}
            {activeTab === 'subcategories' && hasPermission('categories', 'add') && (
              <button
                onClick={() => setShowSubCategoryModal(true)}
                className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Sub-Category
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-white/5 rounded-xl p-1">
          <button
            onClick={() => setActiveTab('categories')}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
              activeTab === 'categories'
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Tag className="h-4 w-4" />
            Categories ({categories.length})
          </button>
          <button
            onClick={() => setActiveTab('subcategories')}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
              activeTab === 'subcategories'
                ? 'bg-gradient-to-r from-green-500 to-blue-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <FolderOpen className="h-4 w-4" />
            Sub-Categories ({subCategories.length})
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder={`Search ${activeTab === 'categories' ? 'categories' : 'sub-categories'}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Content */}
        {activeTab === 'categories' ? (
          <div className="grid gap-4">
            {filteredCategories.map((category) => {
              const categorySubCategories = getSubCategoriesForCategory(category._id);
              const isExpanded = expandedCategories.has(category._id);
              
              return (
                <div key={category._id} className="bg-gradient-to-br from-white/5 to-white/10 rounded-2xl border border-white/10 p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      {/* Category Image */}
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-white/10 flex-shrink-0">
                        {category.categoryImage ? (
                          <img
                            src={`http://localhost:5001${category.categoryImage}`}
                            alt={category.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Tag className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                      </div>

                      {/* Category Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-white">{category.name}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            category.isActive 
                              ? 'bg-green-500/20 text-green-400' 
                              : 'bg-red-500/20 text-red-400'
                          }`}>
                            {category.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <p className="text-gray-300 text-sm mb-3">{category.description}</p>
                        
                        {/* Sub-Categories Count */}
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <span>{categorySubCategories.length} sub-categories</span>
                          <span>Created: {new Date(category.createdAt || '').toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {categorySubCategories.length > 0 && (
                        <button
                          onClick={() => toggleCategoryExpansion(category._id)}
                          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-gray-400" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-gray-400" />
                          )}
                        </button>
                      )}
                      
                      {hasPermission('categories', 'update') && (
                        <button
                          onClick={() => handleEditCategory(category)}
                          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        >
                          <Edit className="h-4 w-4 text-blue-400" />
                        </button>
                      )}
                      
                      {hasPermission('categories', 'delete') && (
                        <button
                          onClick={() => handleDeleteCategory(category._id)}
                          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-4 w-4 text-red-400" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Sub-Categories List */}
                  {isExpanded && categorySubCategories.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <h4 className="text-sm font-medium text-gray-300 mb-3">Sub-Categories:</h4>
                      <div className="grid gap-3">
                        {categorySubCategories.map((subCategory) => (
                          <div key={subCategory._id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg overflow-hidden bg-white/10">
                                {subCategory.subCategoryImage ? (
                                  <img
                                    src={`http://localhost:5001${subCategory.subCategoryImage}`}
                                    alt={subCategory.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <FolderOpen className="h-3 w-3 text-gray-400" />
                                  </div>
                                )}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-white">{subCategory.name}</p>
                                <p className="text-xs text-gray-400">{subCategory.description}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                subCategory.isActive 
                                  ? 'bg-green-500/20 text-green-400' 
                                  : 'bg-red-500/20 text-red-400'
                              }`}>
                                {subCategory.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredSubCategories.map((subCategory) => (
              <div key={subCategory._id} className="bg-gradient-to-br from-white/5 to-white/10 rounded-2xl border border-white/10 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    {/* Sub-Category Image */}
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-white/10 flex-shrink-0">
                      {subCategory.subCategoryImage ? (
                        <img
                          src={`http://localhost:5001${subCategory.subCategoryImage}`}
                          alt={subCategory.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FolderOpen className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* Sub-Category Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-white">{subCategory.name}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          subCategory.isActive 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {subCategory.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-gray-300 text-sm mb-3">{subCategory.description}</p>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span>Parent: {subCategory.categoryId.name}</span>
                        <span>Created: {new Date(subCategory.createdAt || '').toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {hasPermission('categories', 'update') && (
                      <button
                        onClick={() => handleEditSubCategory(subCategory)}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                      >
                        <Edit className="h-4 w-4 text-blue-400" />
                      </button>
                    )}
                    
                    {hasPermission('categories', 'delete') && (
                      <button
                        onClick={() => handleDeleteSubCategory(subCategory._id)}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-4 w-4 text-red-400" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {((activeTab === 'categories' && filteredCategories.length === 0) || 
          (activeTab === 'subcategories' && filteredSubCategories.length === 0)) && (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-white/5 rounded-full flex items-center justify-center">
              {activeTab === 'categories' ? (
                <Tag className="h-8 w-8 text-gray-400" />
              ) : (
                <FolderOpen className="h-8 w-8 text-gray-400" />
              )}
            </div>
            <h3 className="text-lg font-medium text-white mb-2">
              No {activeTab === 'categories' ? 'categories' : 'sub-categories'} found
            </h3>
            <p className="text-gray-400">
              {searchTerm ? 'Try adjusting your search terms' : `Get started by adding your first ${activeTab === 'categories' ? 'category' : 'sub-category'}`}
            </p>
          </div>
        )}
      </div>

      {/* Category Modal */}
      {showCategoryModal && (
        <CategoryModal
          onClose={() => {
            setShowCategoryModal(false);
            setSelectedCategory(null);
          }}
          onSave={handleCategorySaved}
          category={selectedCategory}
        />
      )}

      {/* Sub-Category Modal */}
      <SubCategoryModal
        isOpen={showSubCategoryModal}
        onClose={() => {
          setShowSubCategoryModal(false);
          setSelectedSubCategory(null);
        }}
        onSave={handleSubCategorySaved}
        subCategory={selectedSubCategory as any}
      />
    </Layout>
  );
};

export default Categories;