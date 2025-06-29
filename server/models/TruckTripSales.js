import mongoose from 'mongoose';

const truckTripSalesSchema = new mongoose.Schema({
  tripId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TruckTrip',
    required: false, // Changed from required: true to allow standalone sales
    default: null
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantitySold: {
    type: Number,
    required: true,
    min: [1, 'Quantity sold must be at least 1'],
    validate: {
      validator: Number.isInteger,
      message: 'Quantity sold must be a whole number'
    }
  },
  unitPrice: {
    type: Number,
    required: true,
    min: [0, 'Unit price must be positive'],
    validate: {
      validator: function(value) {
        return value > 0;
      },
      message: 'Unit price must be greater than 0'
    }
  },
  totalAmount: {
    type: Number,
    required: true,
    min: [0, 'Total amount must be positive'],
    validate: {
      validator: function(value) {
        return value > 0;
      },
      message: 'Total amount must be greater than 0'
    }
  },
  paymentMode: {
    type: String,
    enum: {
      values: ['Cash', 'UPI', 'Card'],
      message: 'Payment mode must be Cash, UPI, or Card'
    },
    required: true
  },
  paymentStatus: {
    type: String,
    enum: {
      values: ['pending', 'paid', 'failed', 'manual_paid'],
      message: 'Payment status must be pending, paid, failed, or manual_paid'
    },
    default: 'pending'
  },
  paymentGateway: {
    type: String,
    trim: true,
    default: null
  },
  paymentLinkId: {
    type: String,
    trim: true,
    default: null
  },
  razorpayPaymentId: {
    type: String,
    trim: true,
    default: null
  },
  paymentConfirmedAt: {
    type: Date,
    default: null
  },
  customerName: {
    type: String,
    trim: true,
    maxlength: [100, 'Customer name cannot exceed 100 characters'],
    default: null
  },
  customerPhone: {
    type: String,
    trim: true,
    validate: {
      validator: function(value) {
        if (!value) return true; // Allow empty/null values
        return /^[\+]?[1-9][\d]{0,15}$/.test(value); // Basic phone validation
      },
      message: 'Please enter a valid phone number'
    },
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Additional fields for standalone sales
  saleType: {
    type: String,
    enum: ['trip_sale', 'standalone_sale'],
    default: function() {
      return this.tripId ? 'trip_sale' : 'standalone_sale';
    }
  },
  saleLocation: {
    type: String,
    trim: true,
    default: 'Mobile Sales'
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters'],
    default: null
  }
}, {
  timestamps: true
});

// Virtual for calculating profit (if needed)
truckTripSalesSchema.virtual('profit').get(function() {
  // This would require product cost data to calculate actual profit
  return this.totalAmount; // Placeholder
});

// Pre-save middleware to calculate total amount and set payment status
truckTripSalesSchema.pre('save', function(next) {
  try {
    // Auto-calculate total amount if not set
    if (!this.totalAmount && this.quantitySold && this.unitPrice) {
      this.totalAmount = this.quantitySold * this.unitPrice;
    }

    // Validate that total amount matches calculation
    const calculatedTotal = this.quantitySold * this.unitPrice;
    if (Math.abs(this.totalAmount - calculatedTotal) > 0.01) {
      throw new Error('Total amount does not match quantity × unit price');
    }

    // Set payment status based on payment mode if not explicitly set
    if (!this.isModified('paymentStatus')) {
      if (this.paymentMode === 'Cash') {
        this.paymentStatus = 'paid';
        this.paymentConfirmedAt = new Date();
      } else {
        this.paymentStatus = 'pending';
      }
    }

    // Set payment confirmed date for paid status
    if (this.paymentStatus === 'paid' && !this.paymentConfirmedAt) {
      this.paymentConfirmedAt = new Date();
    }

    next();
  } catch (error) {
    next(error);
  }
});

// Post-save middleware for logging
truckTripSalesSchema.post('save', function(doc, next) {
  console.log(`Sale saved: ${doc._id} - ${doc.saleType} - ₹${doc.totalAmount}`);
  next();
});

// Index for better query performance
truckTripSalesSchema.index({ tripId: 1 });
truckTripSalesSchema.index({ productId: 1 });
truckTripSalesSchema.index({ createdAt: -1 });
truckTripSalesSchema.index({ paymentStatus: 1 });
truckTripSalesSchema.index({ saleType: 1 });

// Static method to get sales summary
truckTripSalesSchema.statics.getSummary = async function(startDate, endDate) {
  const matchStage = { isActive: true };
  
  if (startDate && endDate) {
    matchStage.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  return await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalSales: { $sum: '$totalAmount' },
        totalQuantity: { $sum: '$quantitySold' },
        totalTransactions: { $sum: 1 },
        cashSales: {
          $sum: {
            $cond: [{ $eq: ['$paymentMode', 'Cash'] }, '$totalAmount', 0]
          }
        },
        upiSales: {
          $sum: {
            $cond: [{ $eq: ['$paymentMode', 'UPI'] }, '$totalAmount', 0]
          }
        },
        cardSales: {
          $sum: {
            $cond: [{ $eq: ['$paymentMode', 'Card'] }, '$totalAmount', 0]
          }
        },
        standaloneSales: {
          $sum: {
            $cond: [{ $eq: ['$saleType', 'standalone_sale'] }, '$totalAmount', 0]
          }
        },
        tripSales: {
          $sum: {
            $cond: [{ $eq: ['$saleType', 'trip_sale'] }, '$totalAmount', 0]
          }
        }
      }
    }
  ]);
};

// Instance method to check if sale can be modified
truckTripSalesSchema.methods.canModify = function() {
  // Can't modify if payment is confirmed and it's an older sale
  if (this.paymentStatus === 'paid' && this.paymentConfirmedAt) {
    const hoursSinceConfirmation = (new Date() - this.paymentConfirmedAt) / (1000 * 60 * 60);
    return hoursSinceConfirmation < 24; // Allow modifications within 24 hours
  }
  return true;
};

export default mongoose.model('TruckTripSales', truckTripSalesSchema);