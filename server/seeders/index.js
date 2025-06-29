import User from '../models/User.js';
import Permission from '../models/Permission.js';
import State from '../models/State.js';
import Department from '../models/Department.js';
import JobRole from '../models/JobRole.js';
import DocumentType from '../models/DocumentType.js';
import Category from '../models/Category.js';
import Unit from '../models/Unit.js';

export const seedDefaultData = async () => {
  try {
    // Seed permissions
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
      },
      {
        module: 'staff',
        displayName: 'Staff Management',
        description: 'Manage staff members and their information'
      },
      {
        module: 'departments',
        displayName: 'Departments',
        description: 'Manage company departments'
      },
      {
        module: 'job_roles',
        displayName: 'Job Roles',
        description: 'Manage job roles and positions'
      },
      {
        module: 'document_types',
        displayName: 'Document Types',
        description: 'Manage document types for staff'
      },
      {
        module: 'products',
        displayName: 'Product Management',
        description: 'Manage products and inventory'
      },
      {
        module: 'categories',
        displayName: 'Categories',
        description: 'Manage product categories'
      },
      {
        module: 'units',
        displayName: 'Units',
        description: 'Manage measurement units'
      },
      {
        module: 'sales',
        displayName: 'Sales Management',
        description: 'Manage sales and transactions'
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

    // Seed default admin user
    const adminExists = await User.findOne({ role: 'admin' });
    if (!adminExists) {
      const adminUser = new User({
        username: 'admin',
        email: 'admin@fruitbusiness.com',
        password: 'admin123',
        firstName: 'System',
        lastName: 'Administrator',
        role: 'admin',
        permissions: []
      });
      await adminUser.save();
      console.log('Default admin user created');
    }

    // Seed default states
    const defaultStates = [
      { stateName: 'Andhra Pradesh', description: 'South Indian State' },
      { stateName: 'Telangana', description: 'South Indian State' },
      { stateName: 'Karnataka', description: 'South Indian State' },
      { stateName: 'Tamil Nadu', description: 'South Indian State' },
      { stateName: 'Kerala', description: 'South Indian State' }
    ];

    for (const stateData of defaultStates) {
      await State.findOneAndUpdate(
        { stateName: stateData.stateName },
        stateData,
        { upsert: true, new: true }
      );
    }

    // Seed default departments
    const defaultDepartments = [
      { name: 'Fruit Truck Operations', description: 'Mobile fruit selling operations' },
      { name: 'Warehouse', description: 'Storage and inventory management' },
      { name: 'Administration', description: 'Administrative and management tasks' },
      { name: 'Sales', description: 'Sales and customer service' },
      { name: 'Logistics', description: 'Transportation and delivery' }
    ];

    for (const deptData of defaultDepartments) {
      await Department.findOneAndUpdate(
        { name: deptData.name },
        deptData,
        { upsert: true, new: true }
      );
    }

    // Seed default job roles
    const defaultJobRoles = [
      { name: 'Driver', description: 'Vehicle driver for fruit trucks' },
      { name: 'Salesperson', description: 'Direct sales to customers' },
      { name: 'Helper', description: 'Assistant for loading/unloading' },
      { name: 'Manager', description: 'Operations manager' },
      { name: 'Supervisor', description: 'Field supervisor' },
      { name: 'Accountant', description: 'Financial management' }
    ];

    for (const roleData of defaultJobRoles) {
      await JobRole.findOneAndUpdate(
        { name: roleData.name },
        roleData,
        { upsert: true, new: true }
      );
    }

    // Seed default document types
    const defaultDocumentTypes = [
      { name: 'Aadhaar Card', description: 'Government identity proof' },
      { name: 'Driving License', description: 'Valid driving license' },
      { name: 'PAN Card', description: 'Permanent Account Number' },
      { name: 'Voter ID', description: 'Voter identification card' },
      { name: 'Passport', description: 'Passport for identity' },
      { name: 'Bank Passbook', description: 'Bank account details' }
    ];

    for (const docType of defaultDocumentTypes) {
      await DocumentType.findOneAndUpdate(
        { name: docType.name },
        docType,
        { upsert: true, new: true }
      );
    }

    // Seed default categories
    const defaultCategories = [
      { name: 'Citrus Fruits', description: 'Oranges, lemons, limes, etc.' },
      { name: 'Tropical Fruits', description: 'Mangoes, pineapples, bananas, etc.' },
      { name: 'Berries', description: 'Strawberries, blueberries, etc.' },
      { name: 'Stone Fruits', description: 'Peaches, plums, apricots, etc.' },
      { name: 'Seasonal Fruits', description: 'Seasonal and local fruits' },
      { name: 'Vegetables', description: 'Fresh vegetables' }
    ];

    for (const categoryData of defaultCategories) {
      await Category.findOneAndUpdate(
        { name: categoryData.name },
        categoryData,
        { upsert: true, new: true }
      );
    }

    // Seed default units
    const defaultUnits = [
      { name: 'Kilogram', symbol: 'kg', description: 'Weight measurement' },
      { name: 'Gram', symbol: 'g', description: 'Weight measurement' },
      { name: 'Piece', symbol: 'pcs', description: 'Count measurement' },
      { name: 'Dozen', symbol: 'dz', description: 'Count measurement (12 pieces)' },
      { name: 'Liter', symbol: 'L', description: 'Volume measurement' },
      { name: 'Bundle', symbol: 'bdl', description: 'Bundle measurement' }
    ];

    for (const unitData of defaultUnits) {
      await Unit.findOneAndUpdate(
        { name: unitData.name },
        unitData,
        { upsert: true, new: true }
      );
    }

    console.log('Default data seeded successfully');
  } catch (error) {
    console.error('Error seeding default data:', error);
  }
};