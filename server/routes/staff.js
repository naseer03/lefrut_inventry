import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import Staff from '../models/Staff.js';
import StaffDocument from '../models/StaffDocument.js';
import { requirePermission } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = file.fieldname === 'profilePhoto' 
      ? path.join(__dirname, '../uploads/staff/profiles')
      : path.join(__dirname, '../uploads/staff/documents');
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only image and PDF files are allowed'));
    }
  }
});

// Generate next employee ID endpoint
router.get('/next-employee-id', requirePermission('staff', 'view'), async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    const prefix = `EMP${currentYear}`;
    
    // Find the latest employee ID for the current year
    const latestStaff = await Staff.findOne({
      employeeId: { $regex: `^${prefix}` }
    }).sort({ employeeId: -1 });

    let sequence = 1;
    
    if (latestStaff && latestStaff.employeeId) {
      // Extract sequence number from latest employee ID
      const lastSequence = parseInt(latestStaff.employeeId.replace(prefix, ''));
      sequence = lastSequence + 1;
    }
    
    // Generate next employee ID with zero-padded sequence (4 digits)
    const nextEmployeeId = `${prefix}${sequence.toString().padStart(4, '0')}`;
    
    res.json({ employeeId: nextEmployeeId });
  } catch (error) {
    console.error('Error generating employee ID:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all staff
router.get('/', requirePermission('staff', 'view'), async (req, res) => {
  try {
    const staff = await Staff.find()
      .populate('userId', 'username email')
      .populate('departmentId', 'name')
      .populate('jobRoles', 'name')
      .select('-password')
      .sort({ createdAt: -1 });
    res.json(staff);
  } catch (error) {
    console.error('Error fetching staff:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get staff by ID
router.get('/:id', requirePermission('staff', 'view'), async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id)
      .populate('userId', 'username email')
      .populate('departmentId', 'name')
      .populate('jobRoles', 'name')
      .select('-password');
    
    if (!staff) {
      return res.status(404).json({ message: 'Staff not found' });
    }

    // Get staff documents
    const documents = await StaffDocument.find({ staffId: req.params.id })
      .populate('documentTypeId', 'name');

    res.json({ ...staff.toObject(), documents });
  } catch (error) {
    console.error('Error fetching staff by ID:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create staff
router.post('/', requirePermission('staff', 'add'), upload.single('profilePhoto'), async (req, res) => {
  try {
    console.log('Creating staff with data:', req.body);
    console.log('File uploaded:', req.file);

    const staffData = { ...req.body };
    
    // Remove employeeId from request data as it will be auto-generated
    delete staffData.employeeId;
    
    // Parse jobRoles if it's a JSON string
    if (typeof staffData.jobRoles === 'string') {
      try {
        staffData.jobRoles = JSON.parse(staffData.jobRoles);
      } catch (e) {
        console.error('Error parsing jobRoles:', e);
        staffData.jobRoles = [];
      }
    }
    
    // Convert salary to number if provided
    if (staffData.salary && typeof staffData.salary === 'string') {
      staffData.salary = parseFloat(staffData.salary);
      if (isNaN(staffData.salary)) {
        delete staffData.salary;
      }
    }
    
    // Convert dateOfJoining to Date
    if (staffData.dateOfJoining) {
      staffData.dateOfJoining = new Date(staffData.dateOfJoining);
    }
    
    // Handle profile photo
    if (req.file) {
      staffData.profilePhoto = '/uploads/staff/profiles/' + req.file.filename;
    }

    console.log('Processed staff data:', staffData);

    const staff = new Staff(staffData);
    await staff.save();
    
    console.log('Staff saved with ID:', staff._id);
    
    const populatedStaff = await Staff.findById(staff._id)
      .populate('userId', 'username email')
      .populate('departmentId', 'name')
      .populate('jobRoles', 'name')
      .select('-password');
    
    res.status(201).json(populatedStaff);
  } catch (error) {
    console.error('Error creating staff:', error);
    if (error.code === 11000) {
      // Check which field caused the duplicate error
      const field = Object.keys(error.keyPattern)[0];
      res.status(400).json({ message: `${field} already exists` });
    } else if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(e => e.message);
      res.status(400).json({ message: 'Validation error', errors });
    } else {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
});

// Update staff
router.put('/:id', requirePermission('staff', 'update'), upload.single('profilePhoto'), async (req, res) => {
  try {
    console.log('Updating staff with data:', req.body);
    
    const { password, employeeId, ...updateData } = req.body;
    
    // Don't allow manual employee ID changes after creation
    // Employee ID can only be auto-generated during creation
    
    // Parse jobRoles if it's a JSON string
    if (typeof updateData.jobRoles === 'string') {
      try {
        updateData.jobRoles = JSON.parse(updateData.jobRoles);
      } catch (e) {
        console.error('Error parsing jobRoles:', e);
        updateData.jobRoles = [];
      }
    }
    
    // Convert salary to number if provided
    if (updateData.salary && typeof updateData.salary === 'string') {
      updateData.salary = parseFloat(updateData.salary);
      if (isNaN(updateData.salary)) {
        delete updateData.salary;
      }
    }
    
    // Convert dateOfJoining to Date
    if (updateData.dateOfJoining) {
      updateData.dateOfJoining = new Date(updateData.dateOfJoining);
    }
    
    if (req.file) {
      updateData.profilePhoto = '/uploads/staff/profiles/' + req.file.filename;
    }

    const staff = await Staff.findById(req.params.id);
    if (!staff) {
      return res.status(404).json({ message: 'Staff not found' });
    }

    Object.assign(staff, updateData);
    
    if (password && password.trim() !== '') {
      staff.password = password;
    }
    
    await staff.save();
    
    const populatedStaff = await Staff.findById(staff._id)
      .populate('userId', 'username email')
      .populate('departmentId', 'name')
      .populate('jobRoles', 'name')
      .select('-password');
    
    res.json(populatedStaff);
  } catch (error) {
    console.error('Error updating staff:', error);
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(e => e.message);
      res.status(400).json({ message: 'Validation error', errors });
    } else {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
});

// Delete staff
router.delete('/:id', requirePermission('staff', 'delete'), async (req, res) => {
  try {
    const staff = await Staff.findByIdAndDelete(req.params.id);
    if (!staff) {
      return res.status(404).json({ message: 'Staff not found' });
    }

    // Delete associated documents
    await StaffDocument.deleteMany({ staffId: req.params.id });

    res.json({ message: 'Staff deleted successfully' });
  } catch (error) {
    console.error('Error deleting staff:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Upload staff document
router.post('/:id/documents', requirePermission('staff', 'update'), upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { documentTypeId, documentNumber } = req.body;
    
    const staffDocument = new StaffDocument({
      staffId: req.params.id,
      documentTypeId,
      documentNumber,
      fileUrl: '/uploads/staff/documents/' + req.file.filename
    });

    await staffDocument.save();
    
    const populatedDocument = await StaffDocument.findById(staffDocument._id)
      .populate('documentTypeId', 'name');

    res.status(201).json(populatedDocument);
  } catch (error) {
    console.error('Error uploading document:', error);
    if (error.code === 11000) {
      res.status(400).json({ message: 'Document type already exists for this staff member' });
    } else {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
});

// Get staff documents
router.get('/:id/documents', requirePermission('staff', 'view'), async (req, res) => {
  try {
    const documents = await StaffDocument.find({ staffId: req.params.id })
      .populate('documentTypeId', 'name');
    res.json(documents);
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete staff document
router.delete('/:staffId/documents/:documentId', requirePermission('staff', 'delete'), async (req, res) => {
  try {
    const document = await StaffDocument.findOneAndDelete({
      _id: req.params.documentId,
      staffId: req.params.staffId
    });
    
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;