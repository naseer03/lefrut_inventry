import express from 'express';
import SubCategory from '../models/SubCategory.js';
import Category from '../models/Category.js';
import { requirePermission } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/subcategories'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'subcategory-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Get all sub-categories
router.get('/', requirePermission('categories', 'view'), async (req, res) => {
  try {
    const { categoryId, isActive } = req.query;
    const filter = {};
    
    if (categoryId) filter.categoryId = categoryId;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    
    const subCategories = await SubCategory.find(filter)
      .populate('categoryId', 'name')
      .sort({ createdAt: -1 });
    
    res.json(subCategories);
  } catch (error) {
    console.error('Get sub-categories error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get sub-category by ID
router.get('/:id', requirePermission('categories', 'view'), async (req, res) => {
  try {
    const subCategory = await SubCategory.findById(req.params.id)
      .populate('categoryId', 'name description');
    
    if (!subCategory) {
      return res.status(404).json({ message: 'Sub-category not found' });
    }
    
    res.json(subCategory);
  } catch (error) {
    console.error('Get sub-category by ID error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create new sub-category
router.post('/', requirePermission('categories', 'add'), upload.single('subCategoryImage'), async (req, res) => {
  try {
    const { name, description, categoryId } = req.body;
    
    // Validation
    if (!name || !categoryId) {
      return res.status(400).json({ message: 'Name and category are required' });
    }
    
    // Check if category exists and is active
    const category = await Category.findById(categoryId);
    if (!category || !category.isActive) {
      return res.status(400).json({ message: 'Invalid or inactive category' });
    }
    
    // Check if sub-category name already exists in this category
    const existingSubCategory = await SubCategory.findOne({
      categoryId,
      name: { $regex: new RegExp(`^${name}$`, 'i') }
    });
    
    if (existingSubCategory) {
      return res.status(409).json({ message: 'Sub-category with this name already exists in this category' });
    }
    
    const subCategoryData = {
      name: name.trim(),
      description: description?.trim() || '',
      categoryId
    };
    
    if (req.file) {
      subCategoryData.subCategoryImage = `/uploads/subcategories/${req.file.filename}`;
    }
    
    const subCategory = new SubCategory(subCategoryData);
    await subCategory.save();
    
    const populatedSubCategory = await SubCategory.findById(subCategory._id)
      .populate('categoryId', 'name');
    
    res.status(201).json(populatedSubCategory);
  } catch (error) {
    console.error('Create sub-category error:', error);
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Sub-category with this name already exists in this category' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update sub-category
router.put('/:id', requirePermission('categories', 'update'), upload.single('subCategoryImage'), async (req, res) => {
  try {
    const { name, description, categoryId } = req.body;
    
    const subCategory = await SubCategory.findById(req.params.id);
    if (!subCategory) {
      return res.status(404).json({ message: 'Sub-category not found' });
    }
    
    // Validation
    if (!name || !categoryId) {
      return res.status(400).json({ message: 'Name and category are required' });
    }
    
    // Check if category exists and is active
    const category = await Category.findById(categoryId);
    if (!category || !category.isActive) {
      return res.status(400).json({ message: 'Invalid or inactive category' });
    }
    
    // Check if sub-category name already exists in this category (excluding current sub-category)
    const existingSubCategory = await SubCategory.findOne({
      categoryId,
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      _id: { $ne: req.params.id }
    });
    
    if (existingSubCategory) {
      return res.status(409).json({ message: 'Sub-category with this name already exists in this category' });
    }
    
    // Update fields
    subCategory.name = name.trim();
    subCategory.description = description?.trim() || '';
    subCategory.categoryId = categoryId;
    
    if (req.file) {
      subCategory.subCategoryImage = `/uploads/subcategories/${req.file.filename}`;
    }
    
    await subCategory.save();
    
    const updatedSubCategory = await SubCategory.findById(subCategory._id)
      .populate('categoryId', 'name');
    
    res.json(updatedSubCategory);
  } catch (error) {
    console.error('Update sub-category error:', error);
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Sub-category with this name already exists in this category' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete sub-category (soft delete)
router.delete('/:id', requirePermission('categories', 'delete'), async (req, res) => {
  try {
    const subCategory = await SubCategory.findById(req.params.id);
    if (!subCategory) {
      return res.status(404).json({ message: 'Sub-category not found' });
    }
    
    subCategory.isActive = false;
    await subCategory.save();
    
    res.json({ message: 'Sub-category deleted successfully' });
  } catch (error) {
    console.error('Delete sub-category error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Toggle sub-category status
router.patch('/:id/toggle', requirePermission('categories', 'update'), async (req, res) => {
  try {
    const subCategory = await SubCategory.findById(req.params.id);
    if (!subCategory) {
      return res.status(404).json({ message: 'Sub-category not found' });
    }
    
    subCategory.isActive = !subCategory.isActive;
    await subCategory.save();
    
    res.json({ 
      message: `Sub-category ${subCategory.isActive ? 'activated' : 'deactivated'} successfully`,
      isActive: subCategory.isActive
    });
  } catch (error) {
    console.error('Toggle sub-category status error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router; 