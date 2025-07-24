import React, { useState, useEffect } from 'react';
import { Plus, Search, Package, ShoppingCart, CreditCard, User, Phone, Minus } from 'lucide-react';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

interface Product {
  _id: string;
  name: string;
  categoryId: {
    _id: string;
    name: string;
  };
  unitId: {
    _id: string;
    name: string;
    symbol: string;
  };
  sellingPrice: number;
  currentStock: number;
  productImage: string;
  isActive: boolean;
}

interface CartItem {
  product: Product;
  quantity: number;
  totalPrice: number;
}

const MobileSales: React.FC = () => {
  const { hasPermission } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: ''
  });
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'UPI' | 'Card'>('Cash');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    const filtered = products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      product.isActive &&
      product.currentStock > 0
    );
    setFilteredProducts(filtered);
  }, [products, searchTerm]);

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products');
      setProducts(response.data);
    } catch (error) {
      toast.error('Failed to fetch products');
      console.error('Fetch products error:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.product._id === product._id);
    
    if (existingItem) {
      if (existingItem.quantity >= product.currentStock) {
        toast.error('Cannot add more than available stock');
        return;
      }
      
      setCart(cart.map(item =>
        item.product._id === product._id
          ? {
              ...item,
              quantity: item.quantity + 1,
              totalPrice: (item.quantity + 1) * product.sellingPrice
            }
          : item
      ));
    } else {
      setCart([...cart, {
        product,
        quantity: 1,
        totalPrice: product.sellingPrice
      }]);
    }
    
    toast.success(`${product.name} added to cart`);
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const product = products.find(p => p._id === productId);
    if (!product) return;

    if (newQuantity > product.currentStock) {
      toast.error('Cannot exceed available stock');
      return;
    }

    setCart(cart.map(item =>
      item.product._id === productId
        ? {
            ...item,
            quantity: newQuantity,
            totalPrice: newQuantity * product.sellingPrice
          }
        : item
    ));
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product._id !== productId));
  };

  const getTotalAmount = () => {
    return cart.reduce((total, item) => total + item.totalPrice, 0);
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const validateSaleData = () => {
    if (cart.length === 0) {
      throw new Error('Cart is empty');
    }

    // Check stock availability for all items
    for (const item of cart) {
      const currentProduct = products.find(p => p._id === item.product._id);
      if (!currentProduct) {
        throw new Error(`Product ${item.product.name} not found`);
      }
      if (currentProduct.currentStock < item.quantity) {
        throw new Error(`Insufficient stock for ${item.product.name}. Available: ${currentProduct.currentStock}, Required: ${item.quantity}`);
      }
    }

    // Validate payment mode
    if (!['Cash', 'UPI', 'Card'].includes(paymentMode)) {
      throw new Error('Invalid payment mode');
    }
  };

  const handleSubmitSale = async () => {
    try {
      validateSaleData();
    } catch (error: any) {
      toast.error(error.message);
      return;
    }

    setSubmitting(true);

    try {
      // Process each sale individually with better error handling
      const salesResults = [];
      const stockUpdates = [];

      for (const item of cart) {
        try {
          // Create sale without tripId (for standalone sales)
          const saleData = {
            productId: item.product._id,
            quantitySold: item.quantity,
            unitPrice: item.product.sellingPrice,
            totalAmount: item.totalPrice,
            paymentMode,
            paymentStatus: paymentMode === 'Cash' ? 'paid' : 'pending',
            customerName: customerInfo.name.trim() || undefined,
            customerPhone: customerInfo.phone.trim() || undefined
          };

          console.log('Creating sale with data:', saleData);

          const saleResponse = await api.post('/sales', saleData);
          salesResults.push(saleResponse.data);

          // Prepare stock update
          stockUpdates.push({
            productId: item.product._id,
            quantity: item.quantity,
            operation: 'subtract'
          });

        } catch (error: any) {
          console.error(`Failed to create sale for ${item.product.name}:`, error);
          
          // If this is a validation error, show specific message
          if (error.response?.status === 400) {
            throw new Error(`Sale validation failed for ${item.product.name}: ${error.response.data.message}`);
          } else if (error.response?.status === 403) {
            throw new Error('You do not have permission to create sales');
          } else {
            throw new Error(`Failed to process sale for ${item.product.name}`);
          }
        }
      }

      // If all sales were successful, update stock levels
      console.log('All sales created successfully, updating stock...');
      
      for (const stockUpdate of stockUpdates) {
        try {
          await api.patch(`/products/${stockUpdate.productId}/stock`, {
            quantity: stockUpdate.quantity,
            operation: stockUpdate.operation
          });
        } catch (error) {
          console.error(`Failed to update stock for product ${stockUpdate.productId}:`, error);
          // Continue with other stock updates even if one fails
        }
      }

      // Clear cart and form on success
      setCart([]);
      setCustomerInfo({ name: '', phone: '' });
      
      toast.success(`Sale completed successfully! ${salesResults.length} items sold for ₹${getTotalAmount()}`);
      
      // Refresh products to update stock display
      await fetchProducts();

    } catch (error: any) {
      console.error('Sale submission error:', error);
      
      // Show user-friendly error message
      const errorMessage = error.response?.data?.message || error.message || 'Failed to complete sale';
      toast.error(errorMessage);
      
    } finally {
      setSubmitting(false);
    }
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
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Products Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h1 className="text-2xl font-bold text-white">Mobile Sales</h1>
            <div className="text-sm text-gray-300">
              Available Products: {filteredProducts.length}
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredProducts.map((product) => (
              <div
                key={product._id}
                className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-4 hover:bg-white/15 transition-all duration-300"
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-purple-500 rounded-lg flex items-center justify-center overflow-hidden">
                    {product.productImage ? (
                      <img 
                        src={`http://89.116.32.45:5000${product.productImage}`} 
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package className="h-8 w-8 text-white" />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-1">
                      {product.name}
                    </h3>
                    <p className="text-sm text-gray-300 mb-1">
                      {product.categoryId.name}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-green-300">
                        ₹{product.sellingPrice}
                      </span>
                      <span className="text-sm text-gray-400">
                        Stock: {product.currentStock} {product.unitId.symbol}
                      </span>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => addToCart(product)}
                    disabled={product.currentStock <= 0}
                    className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white p-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-white mb-2">No Products Found</h3>
              <p className="text-gray-400">
                {searchTerm ? 'No products match your search.' : 'No products available for sale.'}
              </p>
            </div>
          )}
        </div>

        {/* Cart Section */}
        <div className="space-y-6">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Shopping Cart</h2>
              <div className="bg-blue-500 text-white px-2 py-1 rounded-full text-sm">
                {getTotalItems()} items
              </div>
            </div>

            {cart.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-400">Cart is empty</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <div
                    key={item.product._id}
                    className="bg-white/5 rounded-lg p-3 border border-white/10"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-white font-medium">{item.product.name}</h4>
                      <button
                        onClick={() => removeFromCart(item.product._id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        ×
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.product._id, item.quantity - 1)}
                          className="w-6 h-6 bg-gray-600 hover:bg-gray-700 text-white rounded flex items-center justify-center"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="text-white font-medium w-8 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.product._id, item.quantity + 1)}
                          className="w-6 h-6 bg-blue-600 hover:bg-blue-700 text-white rounded flex items-center justify-center"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-sm text-gray-300">₹{item.product.sellingPrice}/unit</p>
                        <p className="text-white font-bold">₹{item.totalPrice}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {cart.length > 0 && (
              <div className="mt-6 pt-4 border-t border-white/20">
                <div className="flex items-center justify-between text-lg font-bold text-white">
                  <span>Total:</span>
                  <span>₹{getTotalAmount()}</span>
                </div>
              </div>
            )}
          </div>

          {/* Customer Info */}
          <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Customer Information</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  <User className="h-4 w-4 inline mr-1" />
                  Customer Name (Optional)
                </label>
                <input
                  type="text"
                  value={customerInfo.name}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter customer name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  <Phone className="h-4 w-4 inline mr-1" />
                  Phone Number (Optional)
                </label>
                <input
                  type="tel"
                  value={customerInfo.phone}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  <CreditCard className="h-4 w-4 inline mr-1" />
                  Payment Mode
                </label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value as 'Cash' | 'UPI' | 'Card')}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Card">Card</option>
                </select>
              </div>
            </div>
          </div>

          {/* Complete Sale Button */}
          <button
            onClick={handleSubmitSale}
            disabled={cart.length === 0 || submitting}
            className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-4 px-6 rounded-xl font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Processing...
              </>
            ) : (
              <>
                <ShoppingCart className="h-5 w-5" />
                Complete Sale (₹{getTotalAmount()})
              </>
            )}
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default MobileSales;