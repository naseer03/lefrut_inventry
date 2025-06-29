import express from 'express';
import TruckTripSales from '../models/TruckTripSales.js';
import Product from '../models/Product.js';
import { requirePermission } from '../middleware/auth.js';

const router = express.Router();

// Get all sales
router.get('/', requirePermission('sales', 'view'), async (req, res) => {
  try {
    const sales = await TruckTripSales.find()
      .populate('tripId', 'tripDate')
      .populate('productId', 'name sellingPrice')
      .sort({ createdAt: -1 });
    res.json(sales);
  } catch (error) {
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
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create sale (Mobile-friendly endpoint)
router.post('/', requirePermission('sales', 'add'), async (req, res) => {
  try {
    const { tripId, productId, quantitySold, paymentMode, customerName, customerPhone } = req.body;
    
    // Get product details for pricing
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const sale = new TruckTripSales({
      tripId,
      productId,
      quantitySold,
      unitPrice: product.sellingPrice,
      paymentMode,
      customerName,
      customerPhone,
      paymentStatus: paymentMode === 'Cash' ? 'paid' : 'pending'
    });

    await sale.save();
    
    // Update product stock
    product.currentStock -= quantitySold;
    await product.save();
    
    const populatedSale = await TruckTripSales.findById(sale._id)
      .populate('productId', 'name sellingPrice');
    
    res.status(201).json(populatedSale);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
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
    }

    await TruckTripSales.findByIdAndDelete(req.params.id);
    res.json({ message: 'Sale deleted successfully' });
  } catch (error) {
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
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;