import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import permissionRoutes from './routes/permissions.js';
import stateRoutes from './routes/states.js';
import staffRoutes from './routes/staff.js';
import departmentRoutes from './routes/departments.js';
import jobRoleRoutes from './routes/jobRoles.js';
import documentTypeRoutes from './routes/documentTypes.js';
import productRoutes from './routes/products.js';
import categoryRoutes from './routes/categories.js';
import unitRoutes from './routes/units.js';
import salesRoutes from './routes/sales.js';
import truckRoutes from './routes/trucks.js';
import routesRoutes from './routes/routes.js';
import reportsRoutes from './routes/reports.js';

// Middleware
import { authenticateToken } from './middleware/auth.js';

// Seeders
import { seedDefaultData } from './seeders/index.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Create upload directories if they don't exist
const uploadDirs = [
  'uploads/avatars',
  'uploads/staff/profiles',
  'uploads/staff/documents',
  'uploads/products',
  'uploads/categories'
];

uploadDirs.forEach(dir => {
  const fullPath = path.join(__dirname, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fruit_business_management')
  .then(async () => {
    console.log('Connected to MongoDB');
    // Seed default data
    await seedDefaultData();
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
  });

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/permissions', authenticateToken, permissionRoutes);
app.use('/api/states', authenticateToken, stateRoutes);
app.use('/api/staff', authenticateToken, staffRoutes);
app.use('/api/departments', authenticateToken, departmentRoutes);
app.use('/api/job-roles', authenticateToken, jobRoleRoutes);
app.use('/api/document-types', authenticateToken, documentTypeRoutes);
app.use('/api/products', authenticateToken, productRoutes);
app.use('/api/categories', authenticateToken, categoryRoutes);
app.use('/api/units', authenticateToken, unitRoutes);
app.use('/api/sales', authenticateToken, salesRoutes);
app.use('/api/trucks', authenticateToken, truckRoutes);
app.use('/api/routes', authenticateToken, routesRoutes);
app.use('/api/reports', authenticateToken, reportsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Fruit Business Management System'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Fruit Business Management Server running on port ${PORT}`);
  console.log(`📊 Admin Panel: http://localhost:3000`);
  console.log(`🔧 API Health: http://localhost:${PORT}/api/health`);
});