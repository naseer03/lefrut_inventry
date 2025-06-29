import express from 'express';
import Permission from '../models/Permission.js';
import User from '../models/User.js';
import { requirePermission } from '../middleware/auth.js';

const router = express.Router();

// Get all permissions
router.get('/', requirePermission('permissions', 'view'), async (req, res) => {
  try {
    const permissions = await Permission.find();
    res.json(permissions);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update user permissions
router.put('/user/:userId', requirePermission('permissions', 'update'), async (req, res) => {
  try {
    const { permissions } = req.body;
    
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.permissions = permissions;
    await user.save();

    res.json({ message: 'Permissions updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Seed permissions automatically
router.post('/seed', requirePermission('permissions', 'add'), async (req, res) => {
  try {
    const modules = [
      {
        module: 'users',
        displayName: 'User Management',
        description: 'Manage system users and their accounts'
      },
      {
        module: 'permissions',
        displayName: 'Permissions',
        description: 'Manage user permissions and access control'
      },
      {
        module: 'states',
        displayName: 'States',
        description: 'Manage state information'
      }
    ];

    const actions = [
      { name: 'view', displayName: 'View' },
      { name: 'add', displayName: 'Add' },
      { name: 'update', displayName: 'Update' },
      { name: 'delete', displayName: 'Delete' }
    ];

    for (const moduleData of modules) {
      await Permission.findOneAndUpdate(
        { module: moduleData.module },
        {
          ...moduleData,
          actions
        },
        { upsert: true, new: true }
      );
    }

    res.json({ message: 'Permissions seeded successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;