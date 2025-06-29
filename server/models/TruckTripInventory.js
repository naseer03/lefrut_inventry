import mongoose from 'mongoose';

const truckTripInventorySchema = new mongoose.Schema({
  tripId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TruckTrip',
    required: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantityLoaded: {
    type: Number,
    required: true,
    min: 0
  },
  quantityReturned: {
    type: Number,
    default: 0,
    min: 0
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Virtual for quantity sold
truckTripInventorySchema.virtual('quantitySold').get(function() {
  return this.quantityLoaded - this.quantityReturned;
});

// Compound index to prevent duplicate products for same trip
truckTripInventorySchema.index({ tripId: 1, productId: 1 }, { unique: true });

export default mongoose.model('TruckTripInventory', truckTripInventorySchema);