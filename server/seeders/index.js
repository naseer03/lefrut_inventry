import User from '../models/User.js';
import Permission from '../models/Permission.js';
import State from '../models/State.js';
import Department from '../models/Department.js';
import JobRole from '../models/JobRole.js';
import DocumentType from '../models/DocumentType.js';
import Category from '../models/Category.js';
import Unit from '../models/Unit.js';
import Product from '../models/Product.js';

export const seedDefaultData = async () => {
  try {
    // Seed permissions - Updated with all modules
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
      },
      {
        module: 'trucks',
        displayName: 'Truck Management',
        description: 'Manage truck fleet and operations'
      },
      {
        module: 'routes',
        displayName: 'Route Management',
        description: 'Manage delivery routes'
      },
      {
        module: 'trips',
        displayName: 'Trip Management',
        description: 'Manage truck trips and logistics'
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

    // Seed demo user with limited permissions
    const demoUserExists = await User.findOne({ username: 'demo' });
    if (!demoUserExists) {
      const demoUser = new User({
        username: 'demo',
        email: 'demo@fruitbusiness.com',
        password: 'demo123',
        firstName: 'Demo',
        lastName: 'User',
        role: 'user',
        permissions: [
          { module: 'products', actions: ['view'] },
          { module: 'categories', actions: ['view'] },
          { module: 'sales', actions: ['view', 'add'] },
          { module: 'staff', actions: ['view'] }
        ]
      });
      await demoUser.save();
      console.log('Demo user created');
    }

    // Seed default states - Enhanced list
    const defaultStates = [
      { stateName: 'Andhra Pradesh', description: 'South Indian State known for spices and agriculture' },
      { stateName: 'Telangana', description: 'South Indian State with IT hub Hyderabad' },
      { stateName: 'Karnataka', description: 'South Indian State with IT capital Bangalore' },
      { stateName: 'Tamil Nadu', description: 'South Indian State known for temples and agriculture' },
      { stateName: 'Kerala', description: 'South Indian State known as Gods Own Country' },
      { stateName: 'Maharashtra', description: 'Western Indian State with financial capital Mumbai' },
      { stateName: 'Gujarat', description: 'Western Indian State known for business and trade' },
      { stateName: 'Rajasthan', description: 'Northwestern Indian State known for desert and culture' },
      { stateName: 'Punjab', description: 'Northern Indian State known as granary of India' },
      { stateName: 'Haryana', description: 'Northern Indian State known for agriculture' }
    ];

    for (const stateData of defaultStates) {
      await State.findOneAndUpdate(
        { stateName: stateData.stateName },
        stateData,
        { upsert: true, new: true }
      );
    }

    // Seed default departments - Enhanced list
    const defaultDepartments = [
      { name: 'Fruit Truck Operations', description: 'Mobile fruit selling operations and field sales' },
      { name: 'Warehouse & Storage', description: 'Storage, inventory management and quality control' },
      { name: 'Administration', description: 'Administrative tasks, HR and management' },
      { name: 'Sales & Marketing', description: 'Sales operations, customer service and marketing' },
      { name: 'Logistics & Transportation', description: 'Transportation, delivery and route planning' },
      { name: 'Procurement', description: 'Fruit purchasing, vendor management and sourcing' },
      { name: 'Finance & Accounts', description: 'Financial management, accounting and reporting' },
      { name: 'Quality Control', description: 'Quality assurance and food safety compliance' }
    ];

    for (const deptData of defaultDepartments) {
      await Department.findOneAndUpdate(
        { name: deptData.name },
        deptData,
        { upsert: true, new: true }
      );
    }

    // Seed default job roles - Enhanced list
    const defaultJobRoles = [
      { name: 'Truck Driver', description: 'Vehicle driver for fruit delivery trucks' },
      { name: 'Field Salesperson', description: 'Direct sales to customers in the field' },
      { name: 'Loader/Helper', description: 'Assistant for loading, unloading and handling' },
      { name: 'Route Supervisor', description: 'Supervises truck routes and field operations' },
      { name: 'Warehouse Manager', description: 'Manages warehouse operations and inventory' },
      { name: 'Quality Inspector', description: 'Inspects fruit quality and food safety' },
      { name: 'Procurement Officer', description: 'Handles fruit purchasing and vendor relations' },
      { name: 'Accountant', description: 'Financial management and bookkeeping' },
      { name: 'Operations Manager', description: 'Overall operations management' },
      { name: 'Customer Service Rep', description: 'Customer support and service' },
      { name: 'Inventory Coordinator', description: 'Manages stock levels and inventory tracking' },
      { name: 'Delivery Associate', description: 'Handles delivery and customer interaction' }
    ];

    for (const roleData of defaultJobRoles) {
      await JobRole.findOneAndUpdate(
        { name: roleData.name },
        roleData,
        { upsert: true, new: true }
      );
    }

    // Seed default document types - Enhanced list
    const defaultDocumentTypes = [
      { name: 'Aadhaar Card', description: 'Government identity proof document' },
      { name: 'Driving License', description: 'Valid driving license for vehicle operation' },
      { name: 'PAN Card', description: 'Permanent Account Number for tax purposes' },
      { name: 'Voter ID', description: 'Voter identification card' },
      { name: 'Passport', description: 'Passport for identity verification' },
      { name: 'Bank Passbook', description: 'Bank account details and proof' },
      { name: 'Educational Certificate', description: 'Educational qualification documents' },
      { name: 'Experience Certificate', description: 'Previous work experience proof' },
      { name: 'Medical Certificate', description: 'Health fitness certificate' },
      { name: 'Police Verification', description: 'Police background verification' },
      { name: 'Address Proof', description: 'Residential address verification' },
      { name: 'Photo', description: 'Passport size photographs' }
    ];

    for (const docType of defaultDocumentTypes) {
      await DocumentType.findOneAndUpdate(
        { name: docType.name },
        docType,
        { upsert: true, new: true }
      );
    }

    // Seed default categories - Enhanced list
    const defaultCategories = [
      { name: 'Citrus Fruits', description: 'Oranges, lemons, limes, grapefruits and citrus varieties' },
      { name: 'Tropical Fruits', description: 'Mangoes, pineapples, bananas, papayas and tropical varieties' },
      { name: 'Berries', description: 'Strawberries, blueberries, blackberries and berry varieties' },
      { name: 'Stone Fruits', description: 'Peaches, plums, apricots, cherries and stone varieties' },
      { name: 'Seasonal Fruits', description: 'Seasonal and locally sourced fresh fruits' },
      { name: 'Exotic Fruits', description: 'Dragon fruit, kiwi, passion fruit and exotic varieties' },
      { name: 'Dried Fruits', description: 'Dates, raisins, dried figs and dehydrated fruits' },
      { name: 'Fresh Vegetables', description: 'Leafy greens, root vegetables and fresh produce' },
      { name: 'Organic Produce', description: 'Certified organic fruits and vegetables' },
      { name: 'Value Added', description: 'Fruit juices, pulps and processed products' }
    ];

    for (const categoryData of defaultCategories) {
      await Category.findOneAndUpdate(
        { name: categoryData.name },
        categoryData,
        { upsert: true, new: true }
      );
    }

    // Seed default units - Enhanced list
    const defaultUnits = [
      { name: 'Kilogram', symbol: 'kg', description: 'Weight measurement in kilograms' },
      { name: 'Gram', symbol: 'g', description: 'Weight measurement in grams' },
      { name: 'Piece', symbol: 'pcs', description: 'Count measurement in pieces' },
      { name: 'Dozen', symbol: 'dz', description: 'Count measurement - 12 pieces' },
      { name: 'Liter', symbol: 'L', description: 'Volume measurement in liters' },
      { name: 'Bundle', symbol: 'bdl', description: 'Bundle measurement for grouped items' },
      { name: 'Box', symbol: 'box', description: 'Box packaging unit' },
      { name: 'Crate', symbol: 'crt', description: 'Crate packaging for bulk items' },
      { name: 'Bag', symbol: 'bag', description: 'Bag packaging unit' },
      { name: 'Basket', symbol: 'bkt', description: 'Basket measurement for fruits' },
      { name: 'Quintal', symbol: 'qtl', description: '100 kg measurement unit' },
      { name: 'Ton', symbol: 't', description: '1000 kg measurement unit' }
    ];

    for (const unitData of defaultUnits) {
      await Unit.findOneAndUpdate(
        { name: unitData.name },
        unitData,
        { upsert: true, new: true }
      );
    }

    // Seed sample products
    const sampleProducts = await seedSampleProducts();

    console.log('✅ Default data seeded successfully');
    console.log(`📊 Seeded: ${modules.length} permissions, ${defaultStates.length} states, ${defaultDepartments.length} departments`);
    console.log(`👥 Seeded: ${defaultJobRoles.length} job roles, ${defaultDocumentTypes.length} document types`);
    console.log(`🛍️ Seeded: ${defaultCategories.length} categories, ${defaultUnits.length} units`);
    console.log(`🍎 Seeded: ${sampleProducts} sample products`);
    
  } catch (error) {
    console.error('❌ Error seeding default data:', error);
  }
};

// Helper function to seed sample products
const seedSampleProducts = async () => {
  try {
    // Get required references
    const categories = await Category.find();
    const units = await Unit.find();
    
    if (categories.length === 0 || units.length === 0) {
      console.log('⚠️ Categories or units not found, skipping product seeding');
      return 0;
    }

    const citrusCategory = categories.find(c => c.name === 'Citrus Fruits');
    const tropicalCategory = categories.find(c => c.name === 'Tropical Fruits');
    const seasonalCategory = categories.find(c => c.name === 'Seasonal Fruits');
    
    const kgUnit = units.find(u => u.symbol === 'kg');
    const pcsUnit = units.find(u => u.symbol === 'pcs');
    const dzUnit = units.find(u => u.symbol === 'dz');

    const sampleProducts = [
      {
        name: 'Fresh Oranges',
        categoryId: citrusCategory?._id,
        unitId: kgUnit?._id,
        purchasePrice: 40,
        sellingPrice: 60,
        currentStock: 100,
        minStockLevel: 20,
        maxStockLevel: 500,
        description: 'Fresh, juicy oranges sourced directly from farms',
        isActive: true,
        isPerishable: true
      },
      {
        name: 'Alphonso Mangoes',
        categoryId: tropicalCategory?._id,
        unitId: pcsUnit?._id,
        purchasePrice: 25,
        sellingPrice: 40,
        currentStock: 200,
        minStockLevel: 50,
        maxStockLevel: 1000,
        description: 'Premium Alphonso mangoes - King of fruits',
        isActive: true,
        isPerishable: true
      },
      {
        name: 'Bananas',
        categoryId: tropicalCategory?._id,
        unitId: dzUnit?._id,
        purchasePrice: 30,
        sellingPrice: 50,
        currentStock: 150,
        minStockLevel: 30,
        maxStockLevel: 500,
        description: 'Fresh ripe bananas rich in potassium',
        isActive: true,
        isPerishable: true
      },
      {
        name: 'Red Apples',
        categoryId: seasonalCategory?._id,
        unitId: kgUnit?._id,
        purchasePrice: 80,
        sellingPrice: 120,
        currentStock: 75,
        minStockLevel: 25,
        maxStockLevel: 300,
        description: 'Crisp and sweet red apples',
        isActive: true,
        isPerishable: true
      },
      {
        name: 'Green Grapes',
        categoryId: seasonalCategory?._id,
        unitId: kgUnit?._id,
        purchasePrice: 60,
        sellingPrice: 90,
        currentStock: 50,
        minStockLevel: 15,
        maxStockLevel: 200,
        description: 'Sweet and seedless green grapes',
        isActive: true,
        isPerishable: true
      }
    ];

    let createdCount = 0;
    for (const productData of sampleProducts) {
      if (productData.categoryId && productData.unitId) {
        const existingProduct = await Product.findOne({ name: productData.name });
        if (!existingProduct) {
          await Product.create(productData);
          createdCount++;
        }
      }
    }

    return createdCount;
  } catch (error) {
    console.error('Error seeding sample products:', error);
    return 0;
  }
};