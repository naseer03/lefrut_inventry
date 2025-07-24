// server/routes/trucks.js
import express from 'express';
import Truck from '../models/Truck.js';
import Staff from '../models/Staff.js';
import Route from '../models/Route.js';
import { requirePermission } from '../middleware/auth.js';

const router = express.Router();

// Get all trucks
router.get('/', requirePermission('trucks', 'view'), async (req, res) => {
  try {
    const trucks = await Truck.find()
      .populate('defaultDriverId', 'fullName employeeId')
      .populate('defaultRouteId', 'name')
      .sort({ createdAt: -1 });
    res.json(trucks);
  } catch (error) {
    console.error('Get trucks error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get truck by ID
router.get('/:id', requirePermission('trucks', 'view'), async (req, res) => {
  try {
    const truck = await Truck.findById(req.params.id)
      .populate('defaultDriverId', 'fullName employeeId mobileNumber')
      .populate('defaultRouteId', 'name description');
    
    if (!truck) {
      return res.status(404).json({ message: 'Truck not found' });
    }
    res.json(truck);
  } catch (error) {
    console.error('Get truck by ID error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create truck
router.post('/', requirePermission('trucks', 'add'), async (req, res) => {
  try {
    const { truckId, vehicleNumber, capacity, defaultDriverId, defaultRouteId } = req.body;

    // Validate required fields
    if (!truckId || !vehicleNumber || !capacity) {
      return res.status(400).json({ message: 'Truck ID, vehicle number, and capacity are required' });
    }

    // Check if truckId or vehicleNumber already exists
    const existingTruck = await Truck.findOne({
      $or: [{ truckId }, { vehicleNumber }]
    });

    if (existingTruck) {
      return res.status(400).json({ 
        message: existingTruck.truckId === truckId ? 'Truck ID already exists' : 'Vehicle number already exists'
      });
    }

    // Validate driver exists and has driver role
    if (defaultDriverId) {
      const driver = await Staff.findById(defaultDriverId).populate('jobRoles');
      if (!driver) {
        return res.status(400).json({ message: 'Driver not found' });
      }
      
      const hasDriverRole = driver.jobRoles.some(role => 
        role.name.toLowerCase().includes('driver')
      );
      
      if (!hasDriverRole) {
        return res.status(400).json({ message: 'Selected staff member is not a driver' });
      }
    }

    // Validate route exists
    if (defaultRouteId) {
      const route = await Route.findById(defaultRouteId);
      if (!route) {
        return res.status(400).json({ message: 'Route not found' });
      }
    }

    const truck = new Truck({
      truckId,
      vehicleNumber: vehicleNumber.toUpperCase(),
      capacity: Number(capacity),
      defaultDriverId: defaultDriverId || null,
      defaultRouteId: defaultRouteId || null
    });

    await truck.save();
    
    const populatedTruck = await Truck.findById(truck._id)
      .populate('defaultDriverId', 'fullName employeeId')
      .populate('defaultRouteId', 'name');
    
    res.status(201).json(populatedTruck);
  } catch (error) {
    console.error('Create truck error:', error);
    
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ message: `${field} already exists` });
    }
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ message: 'Validation error', errors });
    }
    
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update truck
router.put('/:id', requirePermission('trucks', 'update'), async (req, res) => {
  try {
    const { vehicleNumber, capacity, defaultDriverId, defaultRouteId, isActive } = req.body;

    const truck = await Truck.findById(req.params.id);
    if (!truck) {
      return res.status(404).json({ message: 'Truck not found' });
    }

    // Check if new vehicle number conflicts with existing trucks
    if (vehicleNumber && vehicleNumber !== truck.vehicleNumber) {
      const existingTruck = await Truck.findOne({ 
        vehicleNumber: vehicleNumber,
        _id: { $ne: req.params.id }
      });
      
      if (existingTruck) {
        return res.status(400).json({ message: 'Vehicle number already exists' });
      }
    }

    // Validate driver if provided
    if (defaultDriverId) {
      const driver = await Staff.findById(defaultDriverId).populate('jobRoles');
      if (!driver) {
        return res.status(400).json({ message: 'Driver not found' });
      }
      
      const hasDriverRole = driver.jobRoles.some(role => 
        role.name.toLowerCase().includes('driver')
      );
      
      if (!hasDriverRole) {
        return res.status(400).json({ message: 'Selected staff member is not a driver' });
      }
    }

    // Validate route if provided
    if (defaultRouteId) {
      const route = await Route.findById(defaultRouteId);
      if (!route) {
        return res.status(400).json({ message: 'Route not found' });
      }
    }

    // Update fields
    if (vehicleNumber) truck.vehicleNumber = vehicleNumber.toUpperCase();
    if (capacity) truck.capacity = Number(capacity);
    if (defaultDriverId !== undefined) truck.defaultDriverId = defaultDriverId || null;
    if (defaultRouteId !== undefined) truck.defaultRouteId = defaultRouteId || null;
    if (isActive !== undefined) truck.isActive = isActive;

    await truck.save();
    
    const populatedTruck = await Truck.findById(truck._id)
      .populate('defaultDriverId', 'fullName employeeId')
      .populate('defaultRouteId', 'name');
    
    res.json(populatedTruck);
  } catch (error) {
    console.error('Update truck error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ message: 'Validation error', errors });
    }
    
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete truck
router.delete('/:id', requirePermission('trucks', 'delete'), async (req, res) => {
  try {
    const truck = await Truck.findById(req.params.id);
    if (!truck) {
      return res.status(404).json({ message: 'Truck not found' });
    }

    // For now, we'll allow deletion - in production you might want to check for active trips
    await Truck.findByIdAndDelete(req.params.id);
    res.json({ message: 'Truck deleted successfully' });
  } catch (error) {
    console.error('Delete truck error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get available drivers
router.get('/drivers/available', requirePermission('trucks', 'view'), async (req, res) => {
  try {
    const drivers = await Staff.find({
      status: 'active',
      isActive: true
    }).populate('jobRoles', 'name').select('fullName employeeId jobRoles');

    const availableDrivers = drivers.filter(staff => 
      staff.jobRoles.some(role => role.name.toLowerCase().includes('driver'))
    );

    res.json(availableDrivers);
  } catch (error) {
    console.error('Get available drivers error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get truck statistics
router.get('/stats/overview', requirePermission('trucks', 'view'), async (req, res) => {
  try {
    const totalTrucks = await Truck.countDocuments();
    const activeTrucks = await Truck.countDocuments({ isActive: true });
    const trucksWithDrivers = await Truck.countDocuments({ 
      defaultDriverId: { $ne: null },
      isActive: true 
    });
    
    const totalCapacity = await Truck.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: null, total: { $sum: '$capacity' } } }
    ]);

    res.json({
      totalTrucks,
      activeTrucks,
      inactiveTrucks: totalTrucks - activeTrucks,
      trucksWithDrivers,
      trucksWithoutDrivers: activeTrucks - trucksWithDrivers,
      totalCapacity: totalCapacity[0]?.total || 0
    });
  } catch (error) {
    console.error('Get truck stats error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;