import mongoose from 'mongoose';

const truckTripStaffSchema = new mongoose.Schema({
  tripId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TruckTrip',
    required: true
  },
  staffId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff',
    required: true
  },
  jobRoleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JobRole',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate staff assignments for same trip
truckTripStaffSchema.index({ tripId: 1, staffId: 1 }, { unique: true });

export default mongoose.model('TruckTripStaff', truckTripStaffSchema);