import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  unitId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Unit',
    required: true
  },
  purchasePrice: {
    type: Number,
    required: true,
    min: 0
  },
  sellingPrice: {
    type: Number,
    required: true,
    min: 0
  },
  currentStock: {
    type: Number,
    default: 0,
    min: 0
  },
  minStockLevel: {
    type: Number,
    default: 10,
    min: 0
  },
  maxStockLevel: {
    type: Number,
    default: 1000,
    min: 0
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  productImage: {
    type: String,
    default: ''
  },
  barcode: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isPerishable: {
    type: Boolean,
    default: true
  },
  expiryDate: {
    type: Date
  }
}, {
  timestamps: true
});

// Virtual for profit margin
productSchema.virtual('profitMargin').get(function() {
  return this.sellingPrice - this.purchasePrice;
});

// Virtual for profit percentage
productSchema.virtual('profitPercentage').get(function() {
  return ((this.sellingPrice - this.purchasePrice) / this.purchasePrice * 100).toFixed(2);
});

// Virtual for stock status
productSchema.virtual('stockStatus').get(function() {
  if (this.currentStock <= 0) return 'out_of_stock';
  if (this.currentStock <= this.minStockLevel) return 'low_stock';
  if (this.currentStock >= this.maxStockLevel) return 'overstock';
  return 'in_stock';
});

export default mongoose.model('Product', productSchema);