// server/routes/reports.js
import express from 'express';
import mongoose from 'mongoose';
import TruckTripSales from '../models/TruckTripSales.js';
import Product from '../models/Product.js';
import Staff from '../models/Staff.js';
import Category from '../models/Category.js';
import TruckTrip from '../models/TruckTrip.js';
import { requirePermission } from '../middleware/auth.js';

const router = express.Router();

// Generate comprehensive reports
router.get('/generate', requirePermission('sales', 'view'), async (req, res) => {
  try {
    const {
      reportType = 'sales',
      timeframe = 'monthly',
      startDate,
      endDate,
      userId = 'all',
      productId = 'all',
      categoryId = 'all'
    } = req.query;

    // Build date filter
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
      };
    }

    // Build additional filters
    const additionalFilters = { isActive: true };
    if (productId !== 'all') additionalFilters.productId = new mongoose.Types.ObjectId(productId);

    const matchStage = { ...dateFilter, ...additionalFilters };

    // Generate different types of reports
    let reportData = {};

    // Sales Overview
    const salesSummary = await TruckTripSales.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: 'products',
          localField: 'productId',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
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
          totalCost: { $sum: { $multiply: ['$quantitySold', '$product.purchasePrice'] } },
          totalRevenue: { $sum: '$totalAmount' }
        }
      },
      {
        $project: {
          totalSales: 1,
          totalQuantity: 1,
          totalTransactions: 1,
          cashSales: 1,
          upiSales: 1,
          cardSales: 1,
          profit: { $subtract: ['$totalRevenue', '$totalCost'] },
          profitMargin: {
            $multiply: [
              { $divide: [{ $subtract: ['$totalRevenue', '$totalCost'] }, '$totalRevenue'] },
              100
            ]
          }
        }
      }
    ]);

    reportData.sales = salesSummary[0] || {
      totalSales: 0,
      totalQuantity: 0,
      totalTransactions: 0,
      cashSales: 0,
      upiSales: 0,
      cardSales: 0,
      profit: 0,
      profitMargin: 0
    };

    // Product Performance
    if (reportType === 'products' || reportType === 'comprehensive') {
      const productPerformance = await TruckTripSales.aggregate([
        { $match: matchStage },
        {
          $lookup: {
            from: 'products',
            localField: 'productId',
            foreignField: '_id',
            as: 'product'
          }
        },
        { $unwind: '$product' },
        {
          $group: {
            _id: '$productId',
            name: { $first: '$product.name' },
            totalSold: { $sum: '$quantitySold' },
            totalRevenue: { $sum: '$totalAmount' },
            totalCost: { $sum: { $multiply: ['$quantitySold', '$product.purchasePrice'] } },
            avgPrice: { $avg: '$unitPrice' },
            transactionCount: { $sum: 1 }
          }
        },
        {
          $project: {
            name: 1,
            totalSold: 1,
            totalRevenue: 1,
            totalProfit: { $subtract: ['$totalRevenue', '$totalCost'] },
            avgPrice: 1,
            transactionCount: 1
          }
        },
        { $sort: { totalRevenue: -1 } }
      ]);

      reportData.products = productPerformance;
    }

    // Staff Performance
    if (reportType === 'users' || reportType === 'comprehensive') {
      const staffPerformance = await TruckTripSales.aggregate([
        { $match: matchStage },
        {
          $lookup: {
            from: 'trucktrips',
            localField: 'tripId',
            foreignField: '_id',
            as: 'trip'
          }
        },
        {
          $lookup: {
            from: 'staff',
            localField: 'trip.driverId',
            foreignField: '_id',
            as: 'staff'
          }
        },
        { $unwind: { path: '$staff', preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: '$staff._id',
            fullName: { $first: '$staff.fullName' },
            totalSales: { $sum: '$totalAmount' },
            totalTransactions: { $sum: 1 },
            avgTransactionValue: { $avg: '$totalAmount' }
          }
        },
        { $match: { _id: { $ne: null } } },
        { $sort: { totalSales: -1 } }
      ]);

      reportData.users = staffPerformance;
    }

    // Category Analysis
    if (reportType === 'categories' || reportType === 'comprehensive') {
      const categoryAnalysis = await TruckTripSales.aggregate([
        { $match: matchStage },
        {
          $lookup: {
            from: 'products',
            localField: 'productId',
            foreignField: '_id',
            as: 'product'
          }
        },
        { $unwind: '$product' },
        {
          $lookup: {
            from: 'categories',
            localField: 'product.categoryId',
            foreignField: '_id',
            as: 'category'
          }
        },
        { $unwind: '$category' },
        {
          $group: {
            _id: '$category._id',
            name: { $first: '$category.name' },
            totalSales: { $sum: '$totalAmount' },
            totalQuantity: { $sum: '$quantitySold' },
            productCount: { $addToSet: '$productId' }
          }
        },
        {
          $project: {
            name: 1,
            totalSales: 1,
            totalQuantity: 1,
            productCount: { $size: '$productCount' }
          }
        },
        { $sort: { totalSales: -1 } }
      ]);

      reportData.categories = categoryAnalysis;
    }

    // Timeline Analysis
    if (reportType === 'sales' || reportType === 'comprehensive') {
      let groupByFormat;
      switch (timeframe) {
        case 'daily':
          groupByFormat = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
          break;
        case 'weekly':
          groupByFormat = { 
            $dateToString: { 
              format: "%Y-W%U", 
              date: "$createdAt" 
            }
          };
          break;
        case 'monthly':
          groupByFormat = { $dateToString: { format: "%Y-%m", date: "$createdAt" } };
          break;
        case 'yearly':
          groupByFormat = { $dateToString: { format: "%Y", date: "$createdAt" } };
          break;
        default:
          groupByFormat = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
      }

      const timeline = await TruckTripSales.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: groupByFormat,
            date: { $first: groupByFormat },
            totalSales: { $sum: '$totalAmount' },
            totalTransactions: { $sum: 1 },
            totalQuantity: { $sum: '$quantitySold' }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      reportData.timeline = timeline;
    }

    // Expense Analysis
    if (reportType === 'income' || reportType === 'comprehensive') {
      const expenseAnalysis = await TruckTrip.aggregate([
        { 
          $match: {
            tripDate: dateFilter.createdAt ? {
              $gte: new Date(startDate),
              $lte: new Date(endDate)
            } : { $exists: true }
          }
        },
        {
          $group: {
            _id: null,
            totalFuelCost: { $sum: '$fuelCost' },
            totalExpenses: { $sum: { $sum: '$expenses.amount' } }
          }
        },
        {
          $project: {
            totalExpenses: { $add: ['$totalFuelCost', '$totalExpenses'] },
            fuelCosts: '$totalFuelCost',
            operationalCosts: '$totalExpenses'
          }
        }
      ]);

      reportData.expenses = expenseAnalysis[0] || {
        totalExpenses: 0,
        fuelCosts: 0,
        operationalCosts: 0
      };

      // Add expense breakdown
      const expenseBreakdown = await TruckTrip.aggregate([
        { 
          $match: {
            tripDate: dateFilter.createdAt ? {
              $gte: new Date(startDate),
              $lte: new Date(endDate)
            } : { $exists: true }
          }
        },
        { $unwind: { path: '$expenses', preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: '$expenses.type',
            amount: { $sum: '$expenses.amount' }
          }
        },
        { $match: { _id: { $ne: null } } },
        { $sort: { amount: -1 } }
      ]);

      if (reportData.expenses) {
        reportData.expenses.breakdown = expenseBreakdown;
      }
    }

    // User-specific filtering for staff performance
    if (userId !== 'all' && reportData.users) {
      reportData.users = reportData.users.filter(user => user._id.toString() === userId);
    }

    // Category-specific filtering
    if (categoryId !== 'all') {
      if (reportData.categories) {
        reportData.categories = reportData.categories.filter(cat => cat._id.toString() === categoryId);
      }
      if (reportData.products) {
        // Filter products by category
        const categoryProducts = await Product.find({ categoryId: new mongoose.Types.ObjectId(categoryId) }).select('_id');
        const productIds = categoryProducts.map(p => p._id.toString());
        reportData.products = reportData.products.filter(product => productIds.includes(product._id.toString()));
      }
    }

    res.json(reportData);

  } catch (error) {
    console.error('Report generation error:', error);
    res.status(500).json({ message: 'Failed to generate report', error: error.message });
  }
});

// Get sales summary for dashboard
router.get('/dashboard-summary', requirePermission('sales', 'view'), async (req, res) => {
  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const periods = [
      { name: 'today', start: startOfDay },
      { name: 'thisWeek', start: startOfWeek },
      { name: 'thisMonth', start: startOfMonth },
      { name: 'thisYear', start: startOfYear }
    ];

    const summaryPromises = periods.map(async (period) => {
      const summary = await TruckTripSales.aggregate([
        {
          $match: {
            createdAt: { $gte: period.start },
            isActive: true
          }
        },
        {
          $group: {
            _id: null,
            totalSales: { $sum: '$totalAmount' },
            totalTransactions: { $sum: 1 },
            totalQuantity: { $sum: '$quantitySold' }
          }
        }
      ]);

      return {
        period: period.name,
        data: summary[0] || { totalSales: 0, totalTransactions: 0, totalQuantity: 0 }
      };
    });

    const summaries = await Promise.all(summaryPromises);
    const result = {};
    summaries.forEach(summary => {
      result[summary.period] = summary.data;
    });

    res.json(result);

  } catch (error) {
    console.error('Dashboard summary error:', error);
    res.status(500).json({ message: 'Failed to get dashboard summary', error: error.message });
  }
});

// Get top products report
router.get('/top-products', requirePermission('sales', 'view'), async (req, res) => {
  try {
    const { limit = 10, startDate, endDate } = req.query;
    
    const matchStage = { isActive: true };
    if (startDate && endDate) {
      matchStage.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const topProducts = await TruckTripSales.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: 'products',
          localField: 'productId',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $group: {
          _id: '$productId',
          name: { $first: '$product.name' },
          category: { $first: '$product.categoryId' },
          totalSold: { $sum: '$quantitySold' },
          totalRevenue: { $sum: '$totalAmount' },
          averagePrice: { $avg: '$unitPrice' },
          transactionCount: { $sum: 1 }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: parseInt(limit) },
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'categoryInfo'
        }
      },
      {
        $project: {
          name: 1,
          categoryName: { $arrayElemAt: ['$categoryInfo.name', 0] },
          totalSold: 1,
          totalRevenue: 1,
          averagePrice: 1,
          transactionCount: 1
        }
      }
    ]);

    res.json(topProducts);

  } catch (error) {
    console.error('Top products report error:', error);
    res.status(500).json({ message: 'Failed to get top products', error: error.message });
  }
});

// Get payment method analysis
router.get('/payment-analysis', requirePermission('sales', 'view'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const matchStage = { isActive: true };
    if (startDate && endDate) {
      matchStage.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const paymentAnalysis = await TruckTripSales.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$paymentMode',
          totalAmount: { $sum: '$totalAmount' },
          transactionCount: { $sum: 1 },
          averageTransaction: { $avg: '$totalAmount' }
        }
      },
      { $sort: { totalAmount: -1 } }
    ]);

    res.json(paymentAnalysis);

  } catch (error) {
    console.error('Payment analysis error:', error);
    res.status(500).json({ message: 'Failed to get payment analysis', error: error.message });
  }
});

// Get inventory report
router.get('/inventory', requirePermission('products', 'view'), async (req, res) => {
  try {
    const inventoryReport = await Product.aggregate([
      { $match: { isActive: true } },
      {
        $lookup: {
          from: 'categories',
          localField: 'categoryId',
          foreignField: '_id',
          as: 'category'
        }
      },
      {
        $lookup: {
          from: 'units',
          localField: 'unitId',
          foreignField: '_id',
          as: 'unit'
        }
      },
      {
        $project: {
          name: 1,
          categoryName: { $arrayElemAt: ['$category.name', 0] },
          unitName: { $arrayElemAt: ['$unit.name', 0] },
          unitSymbol: { $arrayElemAt: ['$unit.symbol', 0] },
          currentStock: 1,
          minStockLevel: 1,
          maxStockLevel: 1,
          purchasePrice: 1,
          sellingPrice: 1,
          stockValue: { $multiply: ['$currentStock', '$purchasePrice'] },
          stockStatus: {
            $cond: {
              if: { $lte: ['$currentStock', 0] },
              then: 'out_of_stock',
              else: {
                $cond: {
                  if: { $lte: ['$currentStock', '$minStockLevel'] },
                  then: 'low_stock',
                  else: {
                    $cond: {
                      if: { $gte: ['$currentStock', '$maxStockLevel'] },
                      then: 'overstock',
                      else: 'in_stock'
                    }
                  }
                }
              }
            }
          }
        }
      },
      { $sort: { stockValue: -1 } }
    ]);

    // Calculate summary
    const summary = {
      totalProducts: inventoryReport.length,
      totalStockValue: inventoryReport.reduce((sum, item) => sum + item.stockValue, 0),
      lowStockItems: inventoryReport.filter(item => item.stockStatus === 'low_stock').length,
      outOfStockItems: inventoryReport.filter(item => item.stockStatus === 'out_of_stock').length,
      overstockItems: inventoryReport.filter(item => item.stockStatus === 'overstock').length
    };

    res.json({
      summary,
      products: inventoryReport
    });

  } catch (error) {
    console.error('Inventory report error:', error);
    res.status(500).json({ message: 'Failed to get inventory report', error: error.message });
  }
});

export default router;