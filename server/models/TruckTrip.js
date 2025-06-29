import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: false });

const truckTripSchema = new mongoose.Schema({
  truckId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Truck',
    required: true
  },
  routeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Route',
    required: true
  },
  tripDate: {
    type: Date,
    required: true
  },
  startTime: {
    type: Date
  },
  endTime: {
    type: Date
  },
  fuelAddedLiters: {
    type: Number,
    default: 0,
    min: 0
  },
  fuelCost: {
    type: Number,
    default: 0,
    min: 0
  },
  expenses: [expenseSchema],
  status: {
    type: String,
    enum: ['planned', 'in_progress', 'completed', 'cancelled'],
    default: 'planned'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

export default mongoose.model('TruckTrip', truckTripSchema);