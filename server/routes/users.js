import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import { requirePermission } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Multer configuration for avatar upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/avatars'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Get all users
router.get('/', requirePermission('users', 'view'), async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user by ID
router.get('/:id', requirePermission('users', 'view'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create user
router.post('/', requirePermission('users', 'add'), async (req, res) => {
  try {
    console.log('Creating user with data:', req.body);
    
    // Validate required fields
    const { firstName, lastName, username, email, password } = req.body;
    
    if (!firstName || !lastName || !username || !email || !password) {
      return res.status(400).json({ 
        message: 'Missing required fields: firstName, lastName, username, email, and password are required' 
      });
    }

    // Check if username or email already exists
    const existingUser = await User.findOne({
      $or: [{ username }, { email }]
    });

    if (existingUser) {
      return res.status(400).json({ 
        message: existingUser.username === username 
          ? 'Username already exists' 
          : 'Email already exists' 
      });
    }

    const user = new User(req.body);
    await user.save();
    
    const userResponse = user.toObject();
    delete userResponse.password;
    
    console.log('User created successfully:', userResponse._id);
    res.status(201).json(userResponse);
  } catch (error) {
    console.error('Error creating user:', error);
    
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      res.status(400).json({ 
        message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists` 
      });
    } else if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      res.status(400).json({ 
        message: `Validation failed: ${messages.join(', ')}` 
      });
    } else {
      res.status(500).json({ 
        message: 'Server error occurred while creating user', 
        error: error.message 
      });
    }
  }
});

// Update user
router.put('/:id', requirePermission('users', 'update'), async (req, res) => {
  try {
    const { password, ...updateData } = req.body;
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    Object.assign(user, updateData);
    
    if (password) {
      user.password = password;
    }
    
    await user.save();
    
    const userResponse = user.toObject();
    delete userResponse.password;
    
    res.json(userResponse);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete user
router.delete('/:id', requirePermission('users', 'delete'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update user profile
router.put('/profile/:id', upload.single('avatar'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (req.user._id.toString() !== req.params.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Can only update own profile' });
    }

    const updateData = req.body;
    if (req.file) {
      updateData.avatar = '/uploads/avatars/' + req.file.filename;
    }

    Object.assign(user, updateData);
    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;

    res.json(userResponse);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;