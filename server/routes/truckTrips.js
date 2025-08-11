import express from 'express';
import TruckTrip from '../models/TruckTrip.js';
import Truck from '../models/Truck.js';
import Route from '../models/Route.js';
import Staff from '../models/Staff.js';
import Product from '../models/Product.js';
import { requirePermission } from '../middleware/auth.js';

const router = express.Router();

// Helper function to validate and update stock for in-progress trips
const validateAndUpdateStock = async (trip, newDispatchItems, isUpdate = false) => {
  const stockUpdates = [];
  
  // If this is an update, we need to check what changed
  if (isUpdate && trip.status === 'in_progress') {
    const currentItems = trip.dispatchItems;
    const newItems = newDispatchItems;
    
    // Create maps for easy comparison
    const currentItemMap = new Map();
    const newItemMap = new Map();
    
    currentItems.forEach(item => {
      currentItemMap.set(item.itemId.toString(), item.quantity);
    });
    
    newItems.forEach(item => {
      newItemMap.set(item.itemId.toString(), item.quantity);
    });
    
    // Check stock changes for each item
    for (const [itemId, newQuantity] of newItemMap) {
      const currentQuantity = currentItemMap.get(itemId) || 0;
      const quantityChange = newQuantity - currentQuantity;
      
      if (quantityChange > 0) {
        // Need to check if we can add more stock
        const product = await Product.findById(itemId);
        if (product && quantityChange > product.currentStock) {
          throw new Error(`Insufficient stock for ${product.name}. Available: ${product.currentStock} ${product.unitId?.symbol || 'units'}, Requested additional: ${quantityChange}`);
        }
        
        if (product) {
          stockUpdates.push({
            productId: itemId,
            quantityChange: -quantityChange // Reduce stock
          });
        }
      } else if (quantityChange < 0) {
        // Stock is being reduced, we can add it back
        const product = await Product.findById(itemId);
        if (product) {
          stockUpdates.push({
            productId: itemId,
            quantityChange: Math.abs(quantityChange) // Add stock back
          });
        }
      }
    }
  } else if (trip.status === 'in_progress') {
    // For new items in in-progress trips, validate stock and prepare updates
    for (const item of newDispatchItems) {
      const product = await Product.findById(item.itemId);
      if (product && item.quantity > product.currentStock) {
        throw new Error(`Insufficient stock for ${product.name}. Available: ${product.currentStock} ${product.unitId?.symbol || 'units'}, Requested: ${item.quantity}`);
      }
      
      if (product) {
        stockUpdates.push({
          productId: item.itemId,
          quantityChange: -item.quantity // Reduce stock
        });
      }
    }
  }
  
  return stockUpdates;
};

// Helper function to apply stock updates
const applyStockUpdates = async (stockUpdates) => {
  for (const update of stockUpdates) {
    await Product.findByIdAndUpdate(update.productId, {
      $inc: { currentStock: update.quantityChange }
    });
  }
};

// Get trip products for driver's in-progress trip
router.get('/driver-trip-products', async (req, res) => {
  try {
    const { driverId } = req.query;
    
    if (!driverId) {
      return res.status(400).json({ message: 'Driver ID is required' });
    }

    // Find the driver's in-progress trip
    const trip = await TruckTrip.findOne({
      driverId,
      status: 'in_progress',
      isActive: true
    }).populate({
      path: 'dispatchItems.itemId',
      populate: {
        path: 'categoryId unitId',
        select: 'name symbol'
      }
    });

    if (!trip) {
      return res.status(404).json({ message: 'No in-progress trip found for this driver' });
    }

    // Format the trip products
    const tripProducts = trip.dispatchItems.map(item => ({
      _id: item.itemId._id,
      name: item.itemId.name,
      categoryId: item.itemId.categoryId,
      unitId: item.itemId.unitId,
      sellingPrice: item.itemId.sellingPrice,
      currentStock: item.quantity, // Use trip quantity as available stock
      productImage: item.itemId.productImage,
      isActive: item.itemId.isActive,
      tripQuantity: item.quantity,
      remainingQuantity: item.quantity // This will be updated based on sales
    }));

    res.json({
      tripId: trip._id,
      tripInfo: {
        truckId: trip.truckId,
        routeId: trip.routeId,
        startDate: trip.tripDate,
        status: trip.status
      },
      products: tripProducts
    });

  } catch (error) {
    console.error('Error fetching driver trip products:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all truck trips
router.get('/', requirePermission('trips', 'view'), async (req, res) => {
  try {
    const { status, truckId, routeId, startDate, endDate, page = 1, limit = 10 } = req.query;
    
    // Build filter object
    const filter = { isActive: true };
    
    if (status) filter.status = status;
    if (truckId) filter.truckId = truckId;
    if (routeId) filter.routeId = routeId;
    if (startDate || endDate) {
      filter.tripDate = {};
      if (startDate) filter.tripDate.$gte = new Date(startDate);
      if (endDate) filter.tripDate.$lte = new Date(endDate);
    }
    
    const skip = (page - 1) * limit;
    
    const trips = await TruckTrip.find(filter)
      .populate('truckId', 'truckId vehicleNumber capacity')
      .populate('routeId', 'name description')
      .populate('driverId', 'fullName employeeId')
      .populate('salespersonId', 'fullName employeeId')
      .populate('helperId', 'fullName employeeId')
      .populate('createdBy', 'username')
      .sort({ tripDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await TruckTrip.countDocuments(filter);
    
    res.json({
      trips,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        totalRecords: total
      }
    });
  } catch (error) {
    console.error('Get truck trips error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get truck trip by ID
router.get('/:id', requirePermission('trips', 'view'), async (req, res) => {
  try {
    const trip = await TruckTrip.findById(req.params.id)
      .populate('truckId', 'truckId vehicleNumber capacity')
      .populate('routeId', 'name description')
      .populate('driverId', 'fullName employeeId mobileNumber')
      .populate('salespersonId', 'fullName employeeId mobileNumber')
      .populate('helperId', 'fullName employeeId mobileNumber')
      .populate('dispatchItems.itemId', 'name sellingPrice currentStock unitId')
      .populate('createdBy', 'username');
    
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }
    
    res.json(trip);
  } catch (error) {
    console.error('Get truck trip by ID error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create new truck trip
router.post('/', requirePermission('trips', 'add'), async (req, res) => {
  try {
    const {
      truckId,
      tripDate,
      routeId,
      startTime,
      startLocation,
      driverId,
      salespersonId,
      helperId,
      fuelAdded,
      tripNotes,
      dispatchItems
    } = req.body;

    // Validation
    const errors = [];
    
    if (!truckId) errors.push('Truck is required');
    if (!tripDate) errors.push('Trip date is required');
    if (!routeId) errors.push('Route is required');
    if (!startTime) errors.push('Start time is required');
    if (!startLocation) errors.push('Start location is required');
    if (!driverId) errors.push('Driver is required');
    if (!dispatchItems || dispatchItems.length === 0) {
      errors.push('At least one dispatch item is required');
    }
    
    if (errors.length > 0) {
      return res.status(400).json({ message: 'Validation failed', errors });
    }

    // Validate truck exists and is active
    const truck = await Truck.findById(truckId);
    if (!truck || !truck.isActive) {
      return res.status(400).json({ message: 'Invalid or inactive truck' });
    }

    // Validate route exists and is active
    const route = await Route.findById(routeId);
    if (!route || !route.isActive) {
      return res.status(400).json({ message: 'Invalid or inactive route' });
    }

    // Validate driver exists and is active
    const driver = await Staff.findById(driverId);
    if (!driver || driver.status !== 'active') {
      return res.status(400).json({ message: 'Invalid or inactive driver' });
    }

    // Validate salesperson if provided
    if (salespersonId) {
      const salesperson = await Staff.findById(salespersonId);
      if (!salesperson || salesperson.status !== 'active') {
        return res.status(400).json({ message: 'Invalid or inactive salesperson' });
      }
    }

    // Validate helper if provided
    if (helperId) {
      const helper = await Staff.findById(helperId);
      if (!helper || helper.status !== 'active') {
        return res.status(400).json({ message: 'Invalid or inactive helper' });
      }
    }

    // Validate dispatch items
    for (const item of dispatchItems) {
      const product = await Product.findById(item.itemId);
      if (!product || !product.isActive) {
        return res.status(400).json({ message: `Invalid or inactive product: ${item.itemName}` });
      }
      
      if (item.quantity > product.currentStock) {
        return res.status(400).json({ 
          message: `Insufficient stock for ${item.itemName}. Available: ${product.currentStock}` 
        });
      }
    }

    // Calculate totals
    const totalValue = dispatchItems.reduce((sum, item) => sum + item.totalCost, 0);
    const totalItems = dispatchItems.reduce((sum, item) => sum + item.quantity, 0);

    const trip = new TruckTrip({
      truckId,
      tripDate: new Date(tripDate),
      routeId,
      startTime,
      startLocation,
      driverId,
      salespersonId: salespersonId || null,
      helperId: helperId || null,
      fuelAdded: fuelAdded || 0,
      tripNotes: tripNotes || '',
      dispatchItems,
      totalValue,
      totalItems,
      createdBy: req.user.id
    });

    await trip.save();
    
    // Populate the created trip for response
    const populatedTrip = await TruckTrip.findById(trip._id)
      .populate('truckId', 'truckId vehicleNumber capacity')
      .populate('routeId', 'name description')
      .populate('driverId', 'fullName employeeId')
      .populate('salespersonId', 'fullName employeeId')
      .populate('helperId', 'fullName employeeId')
      .populate('createdBy', 'username');
    
    res.status(201).json(populatedTrip);
  } catch (error) {
    console.error('Create truck trip error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ message: 'Validation error', errors });
    }
    
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update truck trip
router.put('/:id', requirePermission('trips', 'update'), async (req, res) => {
  try {
    const trip = await TruckTrip.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    // Allow updates for planned and in_progress trips
    if (!['planned', 'in_progress'].includes(trip.status)) {
      return res.status(400).json({ message: 'Cannot update trip that is not in planned or in_progress status' });
    }

    const updateData = req.body;
    
    // Validate required fields if being updated
    if (updateData.truckId) {
      const truck = await Truck.findById(updateData.truckId);
      if (!truck || !truck.isActive) {
        return res.status(400).json({ message: 'Invalid or inactive truck' });
      }
    }

    if (updateData.routeId) {
      const route = await Route.findById(updateData.routeId);
      if (!route || !route.isActive) {
        return res.status(400).json({ message: 'Invalid or inactive route' });
      }
    }

    if (updateData.driverId) {
      const driver = await Staff.findById(updateData.driverId);
      if (!driver || driver.status !== 'active') {
        return res.status(400).json({ message: 'Invalid or inactive driver' });
      }
    }

    // Validate dispatch items if being updated
    if (updateData.dispatchItems) {
      if (updateData.dispatchItems.length === 0) {
        return res.status(400).json({ message: 'At least one dispatch item is required' });
      }

      for (const item of updateData.dispatchItems) {
        const product = await Product.findById(item.itemId);
        if (!product || !product.isActive) {
          return res.status(400).json({ message: `Invalid or inactive product: ${item.itemName}` });
        }
        
        // For in-progress trips, check stock availability
        if (trip.status === 'in_progress') {
          if (item.quantity > product.currentStock) {
            return res.status(400).json({ 
              message: `Insufficient stock for ${item.itemName}. Available: ${product.currentStock} ${product.unitId?.symbol || 'units'}, Requested: ${item.quantity}` 
            });
          }
        }
      }

      // Calculate totals
      updateData.totalValue = updateData.dispatchItems.reduce((sum, item) => sum + item.totalCost, 0);
      updateData.totalItems = updateData.dispatchItems.reduce((sum, item) => sum + item.quantity, 0);
    }

    // Update the trip
    Object.assign(trip, updateData);
    await trip.save();
    
    const updatedTrip = await TruckTrip.findById(trip._id)
      .populate('truckId', 'truckId vehicleNumber capacity')
      .populate('routeId', 'name description')
      .populate('driverId', 'fullName employeeId')
      .populate('salespersonId', 'fullName employeeId')
      .populate('helperId', 'fullName employeeId')
      .populate('dispatchItems.itemId', 'name sellingPrice currentStock unitId')
      .populate('createdBy', 'username');
    
    res.json(updatedTrip);
  } catch (error) {
    console.error('Update truck trip error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Manage trip products (specific endpoint for product management)
router.patch('/:id/products', requirePermission('trips', 'update'), async (req, res) => {
  try {
    const { dispatchItems } = req.body;
    
    if (!dispatchItems || dispatchItems.length === 0) {
      return res.status(400).json({ message: 'At least one dispatch item is required' });
    }

    const trip = await TruckTrip.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    // Allow product management for planned and in_progress trips
    if (!['planned', 'in_progress'].includes(trip.status)) {
      return res.status(400).json({ message: 'Cannot manage products for trip that is not in planned or in_progress status' });
    }

    // Validate all dispatch items
    for (const item of dispatchItems) {
      if (!item.itemId || !item.itemName || !item.quantity || !item.costPrice) {
        return res.status(400).json({ message: 'All dispatch items must have itemId, itemName, quantity, and costPrice' });
      }

      const product = await Product.findById(item.itemId);
      if (!product || !product.isActive) {
        return res.status(400).json({ message: `Invalid or inactive product: ${item.itemName}` });
      }
      
      if (item.quantity <= 0) {
        return res.status(400).json({ message: `Quantity must be greater than 0 for ${item.itemName}` });
      }

      // Calculate total cost for each item
      item.totalCost = item.quantity * item.costPrice;
    }

    // For in-progress trips, validate and prepare stock updates
    let stockUpdates = [];
    if (trip.status === 'in_progress') {
      try {
        stockUpdates = await validateAndUpdateStock(trip, dispatchItems, true);
      } catch (error) {
        return res.status(400).json({ message: error.message });
      }
    }

    // Update trip with new dispatch items
    trip.dispatchItems = dispatchItems;
    trip.totalValue = dispatchItems.reduce((sum, item) => sum + item.totalCost, 0);
    trip.totalItems = dispatchItems.reduce((sum, item) => sum + item.quantity, 0);

    await trip.save();
    
    // Apply stock updates for in-progress trips
    if (trip.status === 'in_progress' && stockUpdates.length > 0) {
      await applyStockUpdates(stockUpdates);
    }
    
    const updatedTrip = await TruckTrip.findById(trip._id)
      .populate('truckId', 'truckId vehicleNumber capacity')
      .populate('routeId', 'name description')
      .populate('driverId', 'fullName employeeId')
      .populate('salespersonId', 'fullName employeeId')
      .populate('helperId', 'fullName employeeId')
      .populate('dispatchItems.itemId', 'name sellingPrice currentStock unitId')
      .populate('createdBy', 'username');
    
    res.json({
      message: `Trip products updated successfully for ${trip.status} trip`,
      trip: updatedTrip
    });
  } catch (error) {
    console.error('Manage trip products error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add products to existing trip
router.post('/:id/products', requirePermission('trips', 'update'), async (req, res) => {
  try {
    const { newItems } = req.body;
    
    if (!newItems || newItems.length === 0) {
      return res.status(400).json({ message: 'At least one new item is required' });
    }

    const trip = await TruckTrip.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    // Allow adding products for planned and in_progress trips
    if (!['planned', 'in_progress'].includes(trip.status)) {
      return res.status(400).json({ message: 'Cannot add products to trip that is not in planned or in_progress status' });
    }

    // Validate new items
    for (const newItem of newItems) {
      if (!newItem.itemId || !newItem.itemName || !newItem.quantity || !newItem.costPrice) {
        return res.status(400).json({ message: 'All new items must have itemId, itemName, quantity, and costPrice' });
      }

      const product = await Product.findById(newItem.itemId);
      if (!product || !product.isActive) {
        return res.status(400).json({ message: `Invalid or inactive product: ${newItem.itemName}` });
      }
      
      if (newItem.quantity <= 0) {
        return res.status(400).json({ message: `Quantity must be greater than 0 for ${newItem.itemName}` });
      }

      // Calculate total cost for each item
      newItem.totalCost = newItem.quantity * newItem.costPrice;
    }

    // For in-progress trips, validate and prepare stock updates
    let stockUpdates = [];
    if (trip.status === 'in_progress') {
      try {
        stockUpdates = await validateAndUpdateStock(trip, newItems, false);
      } catch (error) {
        return res.status(400).json({ message: error.message });
      }
    }

    // Add new items to existing dispatch items
    trip.dispatchItems = [...trip.dispatchItems, ...newItems];
    trip.totalValue = trip.dispatchItems.reduce((sum, item) => sum + item.totalCost, 0);
    trip.totalItems = trip.dispatchItems.reduce((sum, item) => sum + item.quantity, 0);

    await trip.save();
    
    // Apply stock updates for in-progress trips
    if (trip.status === 'in_progress' && stockUpdates.length > 0) {
      await applyStockUpdates(stockUpdates);
    }
    
    const updatedTrip = await TruckTrip.findById(trip._id)
      .populate('truckId', 'truckId vehicleNumber capacity')
      .populate('routeId', 'name description')
      .populate('driverId', 'fullName employeeId')
      .populate('salespersonId', 'fullName employeeId')
      .populate('helperId', 'fullName employeeId')
      .populate('dispatchItems.itemId', 'name sellingPrice currentStock unitId')
      .populate('createdBy', 'username');
    
    res.json({
      message: `Products added successfully to ${trip.status} trip`,
      trip: updatedTrip
    });
  } catch (error) {
    console.error('Add products to trip error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Remove products from trip
router.delete('/:id/products/:itemId', requirePermission('trips', 'update'), async (req, res) => {
  try {
    const { itemId } = req.params;

    const trip = await TruckTrip.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    // Allow removing products for planned and in_progress trips
    if (!['planned', 'in_progress'].includes(trip.status)) {
      return res.status(400).json({ message: 'Cannot remove products from trip that is not in planned or in_progress status' });
    }

    // Find and remove the item
    const itemIndex = trip.dispatchItems.findIndex(item => item.itemId.toString() === itemId);
    if (itemIndex === -1) {
      return res.status(404).json({ message: 'Product not found in trip' });
    }

    const removedItem = trip.dispatchItems[itemIndex];

    // Remove the item
    trip.dispatchItems.splice(itemIndex, 1);

    // Recalculate totals
    trip.totalValue = trip.dispatchItems.reduce((sum, item) => sum + item.totalCost, 0);
    trip.totalItems = trip.dispatchItems.reduce((sum, item) => sum + item.quantity, 0);

    await trip.save();
    
    // For in-progress trips, restore stock when product is removed
    if (trip.status === 'in_progress') {
      await Product.findByIdAndUpdate(itemId, {
        $inc: { currentStock: removedItem.quantity }
      });
    }
    
    const updatedTrip = await TruckTrip.findById(trip._id)
      .populate('truckId', 'truckId vehicleNumber capacity')
      .populate('routeId', 'name description')
      .populate('driverId', 'fullName employeeId')
      .populate('salespersonId', 'fullName employeeId')
      .populate('helperId', 'fullName employeeId')
      .populate('dispatchItems.itemId', 'name sellingPrice currentStock unitId')
      .populate('createdBy', 'username');
    
    res.json({
      message: 'Product removed successfully from trip',
      trip: updatedTrip
    });
  } catch (error) {
    console.error('Remove product from trip error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete truck trip (soft delete)
router.delete('/:id', requirePermission('trips', 'delete'), async (req, res) => {
  try {
    const trip = await TruckTrip.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    // Only allow deletion for planned trips
    if (trip.status !== 'planned') {
      return res.status(400).json({ message: 'Cannot delete trip that is not in planned status' });
    }

    trip.isActive = false;
    await trip.save();
    
    res.json({ message: 'Trip deleted successfully' });
  } catch (error) {
    console.error('Delete truck trip error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update trip status
router.patch('/:id/status', requirePermission('trips', 'update'), async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['planned', 'in_progress', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const trip = await TruckTrip.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    trip.status = status;
    await trip.save();
    
    res.json({ message: 'Trip status updated successfully', status });
  } catch (error) {
    console.error('Update trip status error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router; 