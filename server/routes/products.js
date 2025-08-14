import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import Product from '../models/Product.js';
import { requirePermission } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Multer configuration for product images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/products'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'product-' + uniqueSuffix + path.extname(file.originalname));
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

// Helper: coerce numeric fields
const coerceNumbers = (data) => {
  const numericFields = ['purchasePrice','sellingPrice','currentStock','minStockLevel','maxStockLevel'];
  for (const f of numericFields) {
    if (data[f] !== undefined && data[f] !== null && data[f] !== '') {
      const num = Number(data[f]);
      data[f] = isNaN(num) ? undefined : num;
    }
  }
};

// Get all products
router.get('/', requirePermission('products', 'view'), async (req, res) => {
  try {
    const products = await Product.find()
      .populate('categoryId', 'name')
      .populate('unitId', 'name symbol');
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get product by ID
router.get('/:id', requirePermission('products', 'view'), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('categoryId', 'name')
      .populate('unitId', 'name symbol');
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create product
router.post('/', requirePermission('products', 'add'), upload.single('productImage'), async (req, res) => {
  try {
    const productData = { ...req.body };

    // Coerce numeric inputs (multipart/form-data sends strings)
    coerceNumbers(productData);

    // Sanitize optional ObjectId/date fields
    if (!productData.subCategoryId || productData.subCategoryId === '') {
      delete productData.subCategoryId; // keep it undefined so schema default/null applies
    }
    if (productData.expiryDate === '') {
      delete productData.expiryDate;
    }
    
    if (req.file) {
      productData.productImage = '/uploads/products/' + req.file.filename;
    }

    // Validate required fields explicitly for better UX
    const errors = [];
    if (!productData.name || !productData.name.trim()) errors.push('Product name is required');
    if (!productData.categoryId || productData.categoryId === '') errors.push('Category is required');
    if (!productData.unitId || productData.unitId === '') errors.push('Unit is required');
    if (productData.purchasePrice === undefined || productData.purchasePrice === null || isNaN(productData.purchasePrice)) errors.push('Purchase price is required');
    if (productData.sellingPrice === undefined || productData.sellingPrice === null || isNaN(productData.sellingPrice)) errors.push('Selling price is required');

    if (errors.length > 0) {
      return res.status(400).json({ message: 'Validation failed', errors });
    }

    const product = new Product(productData);
    await product.save();
    
    const populatedProduct = await Product.findById(product._id)
      .populate('categoryId', 'name')
      .populate('unitId', 'name symbol');
    
    res.status(201).json(populatedProduct);
  } catch (error) {
    console.error('Create product error:', error);
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ message: 'Validation error', errors });
    }
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Barcode already exists' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update product
router.put('/:id', requirePermission('products', 'update'), upload.single('productImage'), async (req, res) => {
  try {
    const updateData = { ...req.body };

    // Coerce numeric inputs
    coerceNumbers(updateData);

    // Sanitize optional ObjectId/date fields
    if (updateData.subCategoryId === '') {
      updateData.subCategoryId = null; // explicitly null to clear
    }
    if (updateData.expiryDate === '') {
      updateData.expiryDate = null;
    }
    
    if (req.file) {
      updateData.productImage = '/uploads/products/' + req.file.filename;
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('categoryId', 'name')
     .populate('unitId', 'name symbol');
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    res.json(product);
  } catch (error) {
    console.error('Update product error:', error);
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ message: 'Validation error', errors });
    }
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Barcode already exists' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete product
router.delete('/:id', requirePermission('products', 'delete'), async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update stock
router.patch('/:id/stock', requirePermission('products', 'update'), async (req, res) => {
  try {
    const { quantity, operation } = req.body; // operation: 'add' or 'subtract'
    
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (operation === 'add') {
      product.currentStock += quantity;
    } else if (operation === 'subtract') {
      if (product.currentStock < quantity) {
        return res.status(400).json({ message: 'Insufficient stock' });
      }
      product.currentStock -= quantity;
    }

    await product.save();
    
    const populatedProduct = await Product.findById(product._id)
      .populate('categoryId', 'name')
      .populate('unitId', 'name symbol');
    
    res.json(populatedProduct);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get low stock products
router.get('/alerts/low-stock', requirePermission('products', 'view'), async (req, res) => {
  try {
    const products = await Product.find({
      $expr: { $lte: ['$currentStock', '$minStockLevel'] }
    }).populate('categoryId', 'name')
      .populate('unitId', 'name symbol');
    
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;