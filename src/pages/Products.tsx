import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Package, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import ProductModal from '../components/ProductModal';

interface Product {
  _id: string;
  name: string;
  categoryId: string | { _id: string; name: string };
  subCategoryId?: string;
  unitId: string | { _id: string; name: string; symbol: string };
  purchasePrice: number;
  sellingPrice: number;
  currentStock: number;
  minStockLevel: number;
  maxStockLevel: number;
  description: string;
  productImage: string;
  barcode: string;
  isActive: boolean;
  isPerishable: boolean;
  expiryDate: string;
  createdAt?: string;
}

interface SubCategory {
  _id: string;
  name: string;
  categoryId: string;
}

const Products: React.FC = () => {
  const { hasPermission } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [subCategoryFilter, setSubCategoryFilter] = useState('all');

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  useEffect(() => {
    if (categoryFilter !== 'all') {
      fetchSubCategories(categoryFilter);
      setSubCategoryFilter('all');
    } else {
      setSubCategories([]);
      setSubCategoryFilter('all');
    }
  }, [categoryFilter]);

  useEffect(() => {
    let filtered = products.filter(product => {
      const categoryName = typeof product.categoryId === 'object' ? product.categoryId.name : product.categoryId;
      return (
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.barcode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        categoryName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(product => (typeof product.categoryId === 'object' ? product.categoryId._id : product.categoryId) === categoryFilter);
    }
    if (subCategoryFilter !== 'all') {
      filtered = filtered.filter(product => product.subCategoryId === subCategoryFilter);
    }
    if (stockFilter !== 'all') {
      filtered = filtered.filter(product => {
        const stockStatus = getStockStatus(product);
        return stockStatus === stockFilter;
      });
    }

    setFilteredProducts(filtered);
  }, [products, searchTerm, categoryFilter, subCategoryFilter, stockFilter]);

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products');
      setProducts(response.data);
    } catch (error) {
      toast.error('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to fetch categories');
    }
  };

  const fetchSubCategories = async (categoryId: string) => {
    if (!categoryId) { setSubCategories([]); return; }
    try {
      const response = await api.get(`/sub-categories?categoryId=${categoryId}&isActive=true`);
      setSubCategories(response.data);
    } catch (error) {
      setSubCategories([]);
    }
  };

  const getStockStatus = (product: Product) => {
    if (product.currentStock <= 0) return 'out_of_stock';
    if (product.currentStock <= product.minStockLevel) return 'low_stock';
    if (product.currentStock >= product.maxStockLevel) return 'overstock';
    return 'in_stock';
  };

  const getStockStatusColor = (status: string) => {
    switch (status) {
      case 'out_of_stock': return 'bg-red-500/20 text-red-300';
      case 'low_stock': return 'bg-yellow-500/20 text-yellow-300';
      case 'overstock': return 'bg-purple-500/20 text-purple-300';
      default: return 'bg-green-500/20 text-green-300';
    }
  };

  const getStockStatusText = (status: string) => {
    switch (status) {
      case 'out_of_stock': return 'Out of Stock';
      case 'low_stock': return 'Low Stock';
      case 'overstock': return 'Overstock';
      default: return 'In Stock';
    }
  };

  const getProfitMargin = (product: Product) => {
    return product.sellingPrice - product.purchasePrice;
  };

  const getProfitPercentage = (product: Product) => {
    return ((product.sellingPrice - product.purchasePrice) / product.purchasePrice * 100).toFixed(1);
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;

    try {
      await api.delete(`/products/${productId}`);
      setProducts(products.filter(p => p._id !== productId));
      toast.success('Product deleted successfully');
    } catch (error) {
      toast.error('Failed to delete product');
    }
  };

  const handleProductSaved = (savedProduct: Product) => {
    if (selectedProduct) {
      setProducts(products.map(p => p._id === savedProduct._id ? savedProduct : p));
    } else {
      setProducts([...products, savedProduct]);
    }
    setShowModal(false);
    setSelectedProduct(null);
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
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
          <h1 className="text-3xl font-bold text-white">Products</h1>
          {hasPermission('products', 'add') && (
            <button
              onClick={() => setShowModal(true)}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Product
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Categories</option>
            {categories.map((category) => (
              <option key={category._id} value={category._id}>
                {typeof category.name === 'string' ? category.name : ''}
              </option>
            ))}
          </select>
          <select
            value={subCategoryFilter}
            onChange={(e) => setSubCategoryFilter(e.target.value)}
            className="px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={subCategories.length === 0}
          >
            <option value="all">All Sub-Categories</option>
            {subCategories.map((subCategory) => (
              <option key={subCategory._id} value={subCategory._id}>
                {subCategory.name}
              </option>
            ))}
          </select>
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Stock</option>
            <option value="in_stock">In Stock</option>
            <option value="low_stock">Low Stock</option>
            <option value="out_of_stock">Out of Stock</option>
            <option value="overstock">Overstock</option>
          </select>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => {
            const stockStatus = getStockStatus(product);
            const profitMargin = getProfitMargin(product);
            const profitPercentage = getProfitPercentage(product);
            
            return (
              <div
                key={product._id}
                className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6 hover:bg-white/15 transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-purple-500 rounded-lg flex items-center justify-center overflow-hidden">
                      {product.productImage ? (
                        <img 
                          src={`http://localhost:5001${product.productImage}`} 
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package className="h-8 w-8 text-white" />
                      )}
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-semibold text-white">
                        {product.name}
                      </h3>
                      <p className="text-sm text-gray-300">{typeof product.categoryId === 'object' ? product.categoryId.name : product.categoryId}</p>
                      {product.subCategoryId && (
                        <p className="text-xs text-blue-300">Sub-Category: {subCategories.find(sc => sc._id === product.subCategoryId)?.name || product.subCategoryId}</p>
                      )}
                      {product.barcode && (
                        <p className="text-xs text-gray-400">#{product.barcode}</p>
                      )}
                    </div>
                  </div>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    product.isActive 
                      ? 'bg-green-500/20 text-green-300' 
                      : 'bg-red-500/20 text-red-300'
                  }`}>
                    {product.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Purchase Price:</span>
                    <span className="text-white">₹{product.purchasePrice}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Selling Price:</span>
                    <span className="text-white">₹{product.sellingPrice}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Profit:</span>
                    <span className={`flex items-center ${profitMargin >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                      {profitMargin >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                      ₹{profitMargin} ({profitPercentage}%)
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Stock:</span>
                    <span className="text-white">{product.currentStock} {typeof product.unitId === 'object' ? product.unitId.symbol : ''}</span>
                  </div>
                </div>

                <div className="mb-4">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStockStatusColor(stockStatus)}`}>
                    {stockStatus === 'low_stock' && <AlertTriangle className="h-3 w-3 mr-1" />}
                    {getStockStatusText(stockStatus)}
                  </span>
                  {product.isPerishable && product.expiryDate && (
                    <span className="ml-2 inline-flex px-2 py-1 text-xs font-medium bg-orange-500/20 text-orange-300 rounded-full">
                      Expires: {new Date(product.expiryDate).toLocaleDateString()}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-400">
                    Created: {new Date(product.createdAt || '').toLocaleDateString()}
                  </p>
                  <div className="flex items-center gap-2">
                    {hasPermission('products', 'update') && (
                      <button
                        onClick={() => handleEditProduct(product)}
                        className="text-blue-400 hover:text-blue-300 transition-colors"
                        title="Edit Product"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    )}
                    {hasPermission('products', 'delete') && (
                      <button
                        onClick={() => handleDeleteProduct(product._id)}
                        className="text-red-400 hover:text-red-300 transition-colors"
                        title="Delete Product"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-white mb-2">No Products Found</h3>
            <p className="text-gray-400 mb-6">
              {searchTerm ? 'No products match your search.' : 'Get started by adding your first product.'}
            </p>
            {hasPermission('products', 'add') && !searchTerm && (
              <button
                onClick={() => setShowModal(true)}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 mx-auto"
              >
                <Plus className="h-4 w-4" />
                Add First Product
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <ProductModal
          product={selectedProduct as any}
          onClose={() => {
            setShowModal(false);
            setSelectedProduct(null);
          }}
          onSave={handleProductSaved}
        />
      )}
    </Layout>
  );
};

export default Products;