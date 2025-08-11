import express from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Staff from '../models/Staff.js';
import Truck from '../models/Truck.js';
import TruckTrip from '../models/TruckTrip.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Staff Login
router.post('/staff-login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find staff by email
    const staff = await Staff.findOne({ email }).populate('jobRoles');
    
    if (!staff || !staff.isActive) {
      return res.status(401).json({ message: 'Invalid email or inactive account' });
    }

    // Check password
    const isValidPassword = await staff.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    // Since we removed userId field, we'll create a minimal user object for staff login
    // This allows staff to login without requiring a separate user account
    const user = {
      _id: staff._id, // Use staff ID as user ID
      username: staff.email,
      email: staff.email,
      firstName: staff.fullName.split(' ')[0] || staff.fullName,
      lastName: staff.fullName.split(' ').slice(1).join(' ') || '',
      avatar: staff.profilePhoto || '',
      role: 'staff',
      permissions: ['staff:view', 'staff:update', 'trips:view', 'trips:create', 'trips:update', 'sales:add', 'sales:view', 'products:view'], // Staff permissions with sales, trips, and products
      isActive: true
    };

    // Get truck information and check for active trips if staff is a driver
    let truckInfo = null;
    let hasActiveTrip = false;
    const isDriver = staff.jobRoles.some((role) => 
      role.name && role.name.toLowerCase().includes('driver')
    );
    
    if (isDriver) {
      const truck = await Truck.findOne({ defaultDriverId: staff._id });
      if (truck) {
        truckInfo = {
          id: truck._id,
          truckId: truck.truckId,
          vehicleNumber: truck.vehicleNumber,
          capacity: truck.capacity
        };
        
        // Check if driver has an active "in_progress" trip
        const activeTrip = await TruckTrip.findOne({
          driverId: staff._id,
          status: 'in_progress',
          isActive: true
        });
        
        hasActiveTrip = !!activeTrip;
      }
    }

    // Create JWT token
    const tokenPayload = {
      userId: staff._id,
      staffId: staff._id,
      role: 'staff',
      permissions: user.permissions
    };
    
    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '24h' });

    res.json({
      token,
      user: {
        ...user,
        staffInfo: {
          id: staff._id,
          fullName: staff.fullName,
          employeeId: staff.employeeId,
          mobileNumber: staff.mobileNumber,
          email: staff.email,
          jobRoles: staff.jobRoles,
          isDriver,
          hasActiveTrip // Add this to indicate if driver has an in-progress trip
        },
        truckInfo
      }
    });
  } catch (error) {
    console.error('Staff login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find user
    const user = await User.findOne({ 
      $or: [{ username }, { email: username }] 
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Get staff information if user is associated with staff
    let staffInfo = null;
    let truckInfo = null;
    
    try {
      const staff = await Staff.findOne({ userId: user._id }).populate('jobRoles');
      if (staff) {
        staffInfo = {
          id: staff._id,
          fullName: staff.fullName,
          employeeId: staff.employeeId,
          mobileNumber: staff.mobileNumber,
          email: staff.email,
          jobRoles: staff.jobRoles,
          isDriver: staff.jobRoles.some((role) => 
            role.name && role.name.toLowerCase().includes('driver')
          )
        };
        
        // If staff is a driver, get their truck information
        if (staffInfo.isDriver) {
          const truck = await Truck.findOne({ defaultDriverId: staff._id });
          if (truck) {
            truckInfo = {
              id: truck._id,
              truckId: truck.truckId,
              vehicleNumber: truck.vehicleNumber,
              capacity: truck.capacity
            };
          }
        }
      }
    } catch (error) {
      console.error('Error fetching staff info:', error);
    }

    // Generate token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        role: user.role,
        permissions: user.permissions,
        staffInfo,
        truckInfo
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get current user
router.get('/me', authenticateToken, async (req, res) => {
  try {
    let truckInfo = null;
    
    // If user is staff and is a driver, get truck information
    if (req.user.role === 'staff' && req.user.staffInfo?.isDriver) {
      const truck = await Truck.findOne({ defaultDriverId: req.user._id });
      if (truck) {
        truckInfo = {
          id: truck._id,
          truckId: truck.truckId,
          vehicleNumber: truck.vehicleNumber,
          capacity: truck.capacity
        };
      }
    }

    res.json({
      user: {
        id: req.user._id,
        username: req.user.username,
        email: req.user.email,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        avatar: req.user.avatar,
        role: req.user.role,
        permissions: req.user.permissions,
        staffInfo: req.user.staffInfo,
        truckInfo
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Change password
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Verify current password
    const isValidPassword = await req.user.comparePassword(currentPassword);
    if (!isValidPassword) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Update password
    req.user.password = newPassword;
    await req.user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;