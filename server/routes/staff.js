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

// Get all staff
router.get('/', requirePermission('staff', 'view'), async (req, res) => {
  try {
    const staff = await Staff.find()
      .populate('userId', 'username email')
      .populate('departmentId', 'name')
      .populate('jobRoles', 'name')
      .select('-password');
    res.json(staff);
  } catch (error) {
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
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create staff
router.post('/', requirePermission('staff', 'add'), upload.single('profilePhoto'), async (req, res) => {
  try {
    const staffData = req.body;
    
    if (req.file) {
      staffData.profilePhoto = '/uploads/staff/profiles/' + req.file.filename;
    }

    const staff = new Staff(staffData);
    await staff.save();
    
    const populatedStaff = await Staff.findById(staff._id)
      .populate('userId', 'username email')
      .populate('departmentId', 'name')
      .populate('jobRoles', 'name')
      .select('-password');
    
    res.status(201).json(populatedStaff);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ message: 'Employee ID already exists' });
    } else {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
});

// Update staff
router.put('/:id', requirePermission('staff', 'update'), upload.single('profilePhoto'), async (req, res) => {
  try {
    const { password, ...updateData } = req.body;
    
    if (req.file) {
      updateData.profilePhoto = '/uploads/staff/profiles/' + req.file.filename;
    }

    const staff = await Staff.findById(req.params.id);
    if (!staff) {
      return res.status(404).json({ message: 'Staff not found' });
    }

    Object.assign(staff, updateData);
    
    if (password) {
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
    res.status(500).json({ message: 'Server error', error: error.message });
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
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;