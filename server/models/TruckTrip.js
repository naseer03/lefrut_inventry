import mongoose from 'mongoose';

const truckTripSchema = new mongoose.Schema({
  truckId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Truck',
    required: true
  },
  tripDate: {
    type: Date,
    required: true
  },
  routeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Route',
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  startLocation: {
    type: String,
    required: true
  },
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff',
    required: true
  },
  salespersonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff'
  },
  helperId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff'
  },
  fuelAdded: {
    type: Number,
    default: 0
  },
  tripNotes: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['planned', 'in_progress', 'completed', 'cancelled'],
    default: 'planned'
  },
  dispatchItems: [{
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    itemName: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    costPrice: {
      type: Number,
      required: true,
      min: 0
    },
    totalCost: {
      type: Number,
      required: true,
      min: 0
    }
  }],
  totalValue: {
    type: Number,
    default: 0
  },
  totalItems: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Virtual for trip duration (can be calculated later)
truckTripSchema.virtual('tripDuration').get(function() {
  // This can be calculated when trip is completed
  return null;
});

// Index for better query performance
truckTripSchema.index({ tripDate: -1, status: 1 });
truckTripSchema.index({ truckId: 1, tripDate: 1 });

export default mongoose.model('TruckTrip', truckTripSchema);