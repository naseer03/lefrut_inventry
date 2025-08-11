import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Package, DollarSign, TrendingUp } from 'lucide-react';
import api from '../services/api';

interface TripProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tripData: any) => void;
  trip?: any;
}

interface DispatchItem {
  id: string;
  item: string;
  itemId: string;
  itemName: string;
  quantity: number;
  costPrice: number;
  totalCost: number;
}

interface Product {
  _id: string;
  name: string;
  sellingPrice: number;
  currentStock: number;
  unitId: {
    _id: string;
    name: string;
    symbol: string;
  };
}

const TripProductModal: React.FC<TripProductModalProps> = ({ isOpen, onClose, onSave, trip }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [existingItems, setExistingItems] = useState<DispatchItem[]>([]);
  const [newItems, setNewItems] = useState<Array<{
    id: string;
    item: string;
    itemId: string;
    quantity: number;
    costPrice: number;
  }>>([{
    id: '1',
    item: '',
    itemId: '',
    quantity: 0,
    costPrice: 0
  }]);

  useEffect(() => {
    if (isOpen && trip) {
      fetchProducts();
      // Convert existing trip items to our format
      const existing = trip.dispatchItems.map((item: any, index: number) => ({
        id: `existing-${index}`,
        item: item.itemName,
        itemId: item.itemId || '',
        itemName: item.itemName,
        quantity: item.quantity,
        costPrice: item.costPrice,
        totalCost: item.totalCost
      }));
      setExistingItems(existing);
    }
  }, [isOpen, trip]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/products?isActive=true');
      setProducts(response.data);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewItemChange = (rowId: string, field: string, value: any) => {
    setNewItems(prev => prev.map(item => {
      if (item.id === rowId) {
        const updated = { ...item, [field]: value };
        
        // Auto-calculate cost price when product is selected
        if (field === 'item' && value) {
          const selectedProduct = products.find(p => p._id === value);
          if (selectedProduct) {
            updated.itemId = selectedProduct._id;
            updated.costPrice = selectedProduct.sellingPrice;
          }
        }
        
        return updated;
      }
      return item;
    }));
  };

  const addNewItemRow = () => {
    const newRowId = (newItems.length + 1).toString();
    setNewItems(prev => [...prev, {
      id: newRowId,
      item: '',
      itemId: '',
      quantity: 0,
      costPrice: 0
    }]);
  };

  const removeNewItemRow = (rowId: string) => {
    if (newItems.length > 1) {
      setNewItems(prev => prev.filter(item => item.id !== rowId));
    }
  };

  const addNewItems = () => {
    const validItems = newItems.filter(item => item.item && item.quantity > 0 && item.costPrice > 0);
    
    if (validItems.length === 0) {
      alert('Please fill at least one item with valid values');
      return;
    }

    const itemsToAdd: DispatchItem[] = validItems.map(item => {
      const selectedProduct = products.find(p => p._id === item.item);
      return {
        id: Date.now().toString() + Math.random(),
        item: selectedProduct?.name || item.item,
        itemId: selectedProduct?._id || item.itemId,
        itemName: selectedProduct?.name || item.item,
        quantity: item.quantity,
        costPrice: selectedProduct?.sellingPrice || item.costPrice,
        totalCost: item.quantity * (selectedProduct?.sellingPrice || item.costPrice)
      };
    });

    setExistingItems(prev => [...prev, ...itemsToAdd]);
    
    // Reset new items to single row
    setNewItems([{
      id: '1',
      item: '',
      itemId: '',
      quantity: 0,
      costPrice: 0
    }]);
  };

  const updateExistingItemQuantity = (itemId: string, newQuantity: number) => {
    setExistingItems(prev => prev.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          quantity: newQuantity,
          totalCost: newQuantity * item.costPrice
        };
      }
      return item;
    }));
  };

  const removeExistingItem = (itemId: string) => {
    setExistingItems(prev => prev.filter(item => item.id !== itemId));
  };

  const handleSubmit = async () => {
    try {
      if (!trip) {
        alert('No trip selected');
        return;
      }

      if (existingItems.length === 0) {
        alert('At least one dispatch item is required');
        return;
      }

      // Validate all items
      for (const item of existingItems) {
        if (item.quantity <= 0) {
          alert(`Quantity must be greater than 0 for ${item.itemName}`);
          return;
        }
        
        // For in-progress trips, check stock availability
        if (trip.status === 'in_progress') {
          const product = products.find(p => p._id === item.itemId);
          if (product && item.quantity > product.currentStock) {
            alert(`Insufficient stock for ${item.itemName}. Available: ${product.currentStock} ${product.unitId?.symbol || 'units'}, Requested: ${item.quantity}`);
            return;
          }
        }
      }

      // Prepare updated trip data
      const updatedTripData = {
        dispatchItems: existingItems.map(item => ({
          itemId: item.itemId,
          itemName: item.itemName,
          quantity: item.quantity,
          costPrice: item.costPrice,
          totalCost: item.totalCost
        }))
      };

      console.log(`🚀 Updating trip products for ${trip.status} trip:`, updatedTripData);

      // Use the specific product management endpoint
      const response = await api.patch(`/truck-trips/${trip._id}/products`, updatedTripData);

      if (response.data && response.data.trip) {
        console.log('✅ Trip products updated successfully:', response.data);
        onSave(response.data.trip);
      }
    } catch (error: any) {
      console.error('❌ Error updating trip products:', error);
      alert(error.response?.data?.message || 'Failed to update trip products');
    }
  };

  const totalValue = existingItems.reduce((sum, item) => sum + item.totalCost, 0);
  const totalItems = existingItems.reduce((sum, item) => sum + item.quantity, 0);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl border border-white/20 max-w-4xl w-full max-h-[95vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom-4 duration-500">
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-purple-600/20 p-8 border-b border-white/20">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-pink-500/5"></div>
          <div className="relative flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent mb-2">
                Manage Trip Products
              </h2>
              <p className="text-gray-300 text-lg">
                {trip?.status === 'planned' 
                  ? `Plan and organize products for trip #${trip?._id.slice(-6).toUpperCase()}`
                  : `Add or modify products for active trip #${trip?._id.slice(-6).toUpperCase()}`
                }
              </p>
              <div className="mt-2">
                <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
                  trip?.status === 'planned' 
                    ? 'bg-blue-500/20 text-blue-300' 
                    : 'bg-green-500/20 text-green-300'
                }`}>
                  {trip?.status === 'planned' ? 'Planned Trip' : 'In Progress'}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="group p-2 text-gray-400 hover:text-white transition-all duration-300 hover:bg-white/10 rounded-xl"
            >
              <X className="h-6 w-6 group-hover:rotate-90 transition-transform duration-300" />
            </button>
          </div>
        </div>

        <div className="p-8 space-y-8">
          {/* Current Products */}
          <div className="group">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-gradient-to-br from-green-500/20 to-blue-500/20 rounded-lg mr-3">
                <Package className="h-5 w-5 text-green-400" />
              </div>
              <h3 className="text-xl font-semibold bg-gradient-to-r from-white to-green-200 bg-clip-text text-transparent">
                {trip?.status === 'planned' ? 'Planned Products' : 'Current Products'}
              </h3>
            </div>
            
            {existingItems.length > 0 ? (
              <div className="space-y-4">
                {existingItems.map((item) => (
                  <div key={item.id} className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-white">{item.itemName}</h4>
                      <button
                        onClick={() => removeExistingItem(item.id)}
                        className="text-red-400 hover:text-red-300 transition-colors duration-300 p-1 hover:bg-red-400/10 rounded-lg"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Quantity</label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateExistingItemQuantity(item.id, parseInt(e.target.value) || 0)}
                          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Price (₹)</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.costPrice}
                          disabled
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-gray-400"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Total (₹)</label>
                        <div className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white font-medium">
                          ₹{item.totalCost.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No products added yet</p>
              </div>
            )}
          </div>

          {/* Add New Products */}
          <div className="group">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg mr-3">
                <Plus className="h-5 w-5 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                {trip?.status === 'planned' ? 'Add Products to Plan' : 'Add New Products'}
              </h3>
            </div>
            
            <div className="space-y-4">
              {newItems.map((item) => (
                <div key={item.id} className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-white">New Product</h4>
                    {newItems.length > 1 && (
                      <button
                        onClick={() => removeNewItemRow(item.id)}
                        className="text-red-400 hover:text-red-300 transition-colors duration-300 p-1 hover:bg-red-400/10 rounded-lg"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Product</label>
                      <select
                        value={item.item}
                        onChange={(e) => handleNewItemChange(item.id, 'item', e.target.value)}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={loading}
                      >
                        <option value="">Select product</option>
                        {products.map((product) => (
                          <option key={product._id} value={product._id}>
                            {product.name} - Stock: {product.currentStock} {product.unitId?.symbol || 'units'}
                            {trip?.status === 'in_progress' && product.currentStock <= 0 && ' (Out of Stock)'}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Quantity</label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleNewItemChange(item.id, 'quantity', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Price (₹)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.costPrice}
                        disabled
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-gray-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Total (₹)</label>
                      <div className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white font-medium">
                        ₹{(item.quantity * item.costPrice).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              <button
                onClick={addNewItemRow}
                className="w-full py-3 border-2 border-dashed border-white/20 rounded-xl text-white hover:border-white/40 hover:bg-white/5 transition-all duration-300 flex items-center justify-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Another Product
              </button>
              
              <button
                onClick={addNewItems}
                className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add to Trip
              </button>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-gradient-to-br from-green-500/10 to-blue-500/10 rounded-2xl border border-white/10 p-6 backdrop-blur-sm">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-gradient-to-br from-green-500/20 to-blue-500/20 rounded-lg mr-3">
                <DollarSign className="h-5 w-5 text-green-400" />
              </div>
              <h3 className="text-xl font-semibold bg-gradient-to-r from-white to-green-200 bg-clip-text text-transparent">
                {trip?.status === 'planned' ? 'Trip Plan Summary' : 'Trip Summary'}
              </h3>
            </div>
            <div className="flex justify-between items-center">
              <div className="text-gray-300 text-lg">
                <span className="font-medium">Total Value:</span> 
                <span className="ml-2 text-2xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">₹{totalValue.toFixed(2)}</span>
              </div>
              <div className="text-gray-300 text-lg">
                <span className="font-medium">Total Items:</span> 
                <span className="ml-2 text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">{totalItems} units</span>
              </div>
            </div>
            {trip?.status === 'in_progress' && (
              <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <p className="text-yellow-300 text-sm">
                  ⚠️ Note: For in-progress trips, stock availability is checked before adding products.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-4 p-8 border-t border-white/20 bg-gradient-to-r from-gray-800/50 to-gray-900/50">
          <button
            onClick={onClose}
            className="px-8 py-3 text-gray-300 border border-white/20 rounded-xl hover:bg-white/10 hover:border-white/30 transition-all duration-300 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white rounded-xl transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            {trip?.status === 'planned' ? 'Update Trip Plan' : 'Update Trip Products'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TripProductModal; 