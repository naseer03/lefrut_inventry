import mongoose from 'mongoose';

const truckSchema = new mongoose.Schema({
  truckId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  vehicleNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  capacity: {
    type: Number,
    required: true,
    min: 0
  },
  defaultDriverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff'
  },
  defaultRouteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Route'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

export default mongoose.model('Truck', truckSchema);