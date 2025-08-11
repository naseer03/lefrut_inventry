import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Staff from '../models/Staff.js';
import TruckTrip from '../models/TruckTrip.js';
import mongoose from 'mongoose';

export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if it's a staff member (has staffId in token)
    if (decoded.staffId) {
      const staff = await Staff.findById(decoded.staffId).populate('jobRoles');
      if (!staff || !staff.isActive) {
        return res.status(401).json({ message: 'Invalid or inactive staff member' });
      }
      
      const isDriver = staff.jobRoles.some((role) => 
        role.name && role.name.toLowerCase().includes('driver')
      );
      
      // Check for active trip if user is a driver
      let hasActiveTrip = false;
      if (isDriver) {
        const activeTrip = await TruckTrip.findOne({
          driverId: staff._id,
          status: 'in_progress',
          isActive: true
        });
        hasActiveTrip = !!activeTrip;
      }
      
      // Create a user-like object for staff
      req.user = {
        _id: staff._id,
        username: staff.email,
        email: staff.email,
        firstName: staff.fullName.split(' ')[0] || staff.fullName,
        lastName: staff.fullName.split(' ').slice(1).join(' ') || '',
        avatar: staff.profilePhoto || '',
        role: 'staff',
        permissions: ['staff:view', 'staff:update', 'trips:view', 'trips:create', 'trips:update', 'sales:add', 'sales:view', 'products:view'],
        isActive: true,
        staffInfo: {
          id: staff._id,
          fullName: staff.fullName,
          employeeId: staff.employeeId,
          mobileNumber: staff.mobileNumber,
          email: staff.email,
          jobRoles: staff.jobRoles,
          isDriver,
          hasActiveTrip // Add active trip status
        }
      };
    } else {
      // Regular user authentication
      const user = await User.findById(decoded.userId).select('-password');
      if (!user || !user.isActive) {
        return res.status(401).json({ message: 'Invalid or inactive user' });
      }
      req.user = user;
    }

    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid token' });
  }
};

export const requirePermission = (module, action) => {
  return (req, res, next) => {
    // For staff users, check permissions differently
    if (req.user.role === 'staff') {
      const permissionString = `${module}:${action}`;
      if (!req.user.permissions || !req.user.permissions.includes(permissionString)) {
        return res.status(403).json({ message: 'Insufficient permissions' });
      }
    } else {
      // For regular users, use the hasPermission method
      if (!req.user.hasPermission || !req.user.hasPermission(module, action)) {
        return res.status(403).json({ message: 'Insufficient permissions' });
      }
    }
    next();
  };
};