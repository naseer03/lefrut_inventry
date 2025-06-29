import mongoose from 'mongoose';

const truckTripSalesSchema = new mongoose.Schema({
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
  quantitySold: {
    type: Number,
    required: true,
    min: 0
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  paymentMode: {
    type: String,
    enum: ['Cash', 'UPI', 'Card'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'manual_paid'],
    default: 'pending'
  },
  paymentGateway: {
    type: String,
    trim: true
  },
  paymentLinkId: {
    type: String,
    trim: true
  },
  razorpayPaymentId: {
    type: String,
    trim: true
  },
  paymentConfirmedAt: {
    type: Date
  },
  customerName: {
    type: String,
    trim: true
  },
  customerPhone: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Pre-save middleware to calculate total amount
truckTripSalesSchema.pre('save', function(next) {
  this.totalAmount = this.quantitySold * this.unitPrice;
  next();
});

export default mongoose.model('TruckTripSales', truckTripSalesSchema);