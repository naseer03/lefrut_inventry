// server/routes/routes.js
import express from 'express';
import Route from '../models/Route.js';
import Truck from '../models/Truck.js';
import { requirePermission } from '../middleware/auth.js';

const router = express.Router();

// Get all routes
router.get('/', requirePermission('routes', 'view'), async (req, res) => {
  try {
    const routes = await Route.find().sort({ createdAt: -1 });
    res.json(routes);
  } catch (error) {
    console.error('Get routes error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get route by ID
router.get('/:id', requirePermission('routes', 'view'), async (req, res) => {
  try {
    const route = await Route.findById(req.params.id);
    if (!route) {
      return res.status(404).json({ message: 'Route not found' });
    }
    res.json(route);
  } catch (error) {
    console.error('Get route by ID error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create route
router.post('/', requirePermission('routes', 'add'), async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Route name is required' });
    }

    // Check if route name already exists
    const existingRoute = await Route.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') }
    });

    if (existingRoute) {
      return res.status(400).json({ message: 'Route name already exists' });
    }

    const route = new Route({
      name: name.trim(),
      description: description?.trim() || ''
    });

    await route.save();
    res.status(201).json(route);
  } catch (error) {
    console.error('Create route error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Route name already exists' });
    }
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ message: 'Validation error', errors });
    }
    
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update route
router.put('/:id', requirePermission('routes', 'update'), async (req, res) => {
  try {
    const { name, description, isActive } = req.body;

    const route = await Route.findById(req.params.id);
    if (!route) {
      return res.status(404).json({ message: 'Route not found' });
    }

    // Check if new name conflicts with existing routes
    if (name && name !== route.name) {
      const existingRoute = await Route.findOne({ 
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        _id: { $ne: req.params.id }
      });
      
      if (existingRoute) {
        return res.status(400).json({ message: 'Route name already exists' });
      }
    }

    // Update fields
    if (name) route.name = name.trim();
    if (description !== undefined) route.description = description?.trim() || '';
    if (isActive !== undefined) route.isActive = isActive;

    await route.save();
    res.json(route);
  } catch (error) {
    console.error('Update route error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ message: 'Validation error', errors });
    }
    
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete route
router.delete('/:id', requirePermission('routes', 'delete'), async (req, res) => {
  try {
    const route = await Route.findById(req.params.id);
    if (!route) {
      return res.status(404).json({ message: 'Route not found' });
    }

    // Check if route is being used by any trucks
    const trucksUsingRoute = await Truck.countDocuments({ defaultRouteId: req.params.id });

    if (trucksUsingRoute > 0) {
      return res.status(400).json({ 
        message: `Cannot delete route. ${trucksUsingRoute} truck(s) are using this route.` 
      });
    }

    await Route.findByIdAndDelete(req.params.id);
    res.json({ message: 'Route deleted successfully' });
  } catch (error) {
    console.error('Delete route error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get route statistics
router.get('/stats/overview', requirePermission('routes', 'view'), async (req, res) => {
  try {
    const totalRoutes = await Route.countDocuments();
    const activeRoutes = await Route.countDocuments({ isActive: true });
    
    // Count trucks assigned to each route
    const routeUsage = await Truck.aggregate([
      { $match: { defaultRouteId: { $ne: null } } },
      { $group: { _id: '$defaultRouteId', truckCount: { $sum: 1 } } },
      { $lookup: { from: 'routes', localField: '_id', foreignField: '_id', as: 'route' } },
      { $unwind: '$route' },
      { $project: { routeName: '$route.name', truckCount: 1 } },
      { $sort: { truckCount: -1 } }
    ]);

    res.json({
      totalRoutes,
      activeRoutes,
      inactiveRoutes: totalRoutes - activeRoutes,
      routeUsage
    });
  } catch (error) {
    console.error('Get route stats error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;