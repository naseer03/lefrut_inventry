import express from 'express';
import TruckTripSales from '../models/TruckTripSales.js';
import Product from '../models/Product.js';
import { requirePermission } from '../middleware/auth.js';

const router = express.Router();

// Get all sales
router.get('/', requirePermission('sales', 'view'), async (req, res) => {
  try {
    const sales = await TruckTripSales.find()
      .populate('productId', 'name sellingPrice')
      .sort({ createdAt: -1 });
    res.json(sales);
  } catch (error) {
    console.error('Get sales error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get sales by trip ID
router.get('/trip/:tripId', requirePermission('sales', 'view'), async (req, res) => {
  try {
    const sales = await TruckTripSales.find({ tripId: req.params.tripId })
      .populate('productId', 'name sellingPrice');
    res.json(sales);
  } catch (error) {
    console.error('Get sales by trip error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get sales by product within a trip (and optionally by staff)
router.get('/trip/:tripId/product/:productId', requirePermission('sales', 'view'), async (req, res) => {
  try {
    const { tripId, productId } = req.params;
    const filter = { tripId, productId };
    if (req.query.staffId) {
      filter.staffId = req.query.staffId;
    }

    const sales = await TruckTripSales.find(filter)
      .populate('productId', 'name sellingPrice')
      .sort({ createdAt: -1 });

    res.json(sales);
  } catch (error) {
    console.error('Get product sales error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create sale (Mobile-friendly endpoint)
router.post('/', requirePermission('sales', 'add'), async (req, res) => {
  try {
    const { 
      tripId, 
      productId, 
      quantitySold, 
      unitPrice,
      totalAmount,
      paymentMode, 
      paymentStatus,
      customerName, 
      customerPhone 
    } = req.body;

    console.log('Creating sale with data:', req.body);

    // Validate required fields
    if (!productId) {
      return res.status(400).json({ message: 'Product ID is required' });
    }

    if (!quantitySold || quantitySold <= 0) {
      return res.status(400).json({ message: 'Valid quantity sold is required' });
    }

    if (!paymentMode || !['Cash', 'UPI'].includes(paymentMode)) {
      return res.status(400).json({ message: 'Valid payment mode is required (Cash or UPI)' });
    }

    // Get product details for pricing and stock check
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check stock availability
    if (product.currentStock < quantitySold) {
      return res.status(400).json({ 
        message: `Insufficient stock. Available: ${product.currentStock}, Requested: ${quantitySold}` 
      });
    }

    // Calculate prices if not provided
    const finalUnitPrice = unitPrice || product.sellingPrice;
    const finalTotalAmount = totalAmount || (finalUnitPrice * quantitySold);

    // Create sale record
    const saleData = {
      tripId: tripId || null, // Allow null for standalone sales
      staffId: req.user.role === 'staff' ? req.user._id : (req.body.staffId || null),
      productId,
      quantitySold: Number(quantitySold),
      unitPrice: Number(finalUnitPrice),
      totalAmount: Number(finalTotalAmount),
      paymentMode,
      paymentStatus: paymentStatus || (paymentMode === 'Cash' ? 'paid' : 'pending'),
      customerName: customerName?.trim() || null,
      customerPhone: customerPhone?.trim() || null
    };

    if (!saleData.staffId) {
      return res.status(400).json({ message: 'Staff ID is required' });
    }

    console.log('Creating sale with processed data:', saleData);

    const sale = new TruckTripSales(saleData);
    await sale.save();

    // Note: Stock update is handled separately by the frontend
    // This allows for better error handling and transaction control
    
    const populatedSale = await TruckTripSales.findById(sale._id)
      .populate('productId', 'name sellingPrice');
      // Removed tripId population since TruckTrip model isn't registered
    
    console.log('Sale created successfully:', populatedSale._id);
    res.status(201).json(populatedSale);

  } catch (error) {
    console.error('Create sale error:', error);
    
    // Handle specific MongoDB errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ 
        message: 'Validation error', 
        errors,
        details: error.message 
      });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({ 
        message: 'Invalid ID format provided',
        details: error.message 
      });
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'Duplicate entry detected',
        details: error.message 
      });
    }

    res.status(500).json({ 
      message: 'Server error while creating sale', 
      error: error.message 
    });
  }
});

// Update sale
router.put('/:id', requirePermission('sales', 'update'), async (req, res) => {
  try {
    const sale = await TruckTripSales.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('productId', 'name sellingPrice');
    
    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }
    
    res.json(sale);
  } catch (error) {
    console.error('Update sale error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ message: 'Validation error', errors });
    }

    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete sale
router.delete('/:id', requirePermission('sales', 'delete'), async (req, res) => {
  try {
    const sale = await TruckTripSales.findById(req.params.id);
    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }

    // Restore product stock
    const product = await Product.findById(sale.productId);
    if (product) {
      product.currentStock += sale.quantitySold;
      await product.save();
      console.log(`Stock restored for product ${product.name}: +${sale.quantitySold}`);
    }

    await TruckTripSales.findByIdAndDelete(req.params.id);
    res.json({ message: 'Sale deleted successfully and stock restored' });
  } catch (error) {
    console.error('Delete sale error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get sales summary
router.get('/summary', requirePermission('sales', 'view'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const matchStage = {};
    if (startDate && endDate) {
      matchStage.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const summary = await TruckTripSales.aggregate([
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
          }
        }
      }
    ]);

    res.json(summary[0] || {
      totalSales: 0,
      totalQuantity: 0,
      totalTransactions: 0,
      cashSales: 0,
      upiSales: 0,
      cardSales: 0
    });
  } catch (error) {
    console.error('Get sales summary error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;