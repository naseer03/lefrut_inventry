import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Calendar, Clock, MapPin, Truck, Users, Package, DollarSign } from 'lucide-react';
import api from '../services/api';

interface TripModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tripData: any) => void;
  editingTrip?: any;
}

interface DispatchItem {
  id: string;
  item: string;
  itemId: string; // Product ID
  itemName: string; // Product name
  quantity: number;
  costPrice: number;
  totalCost: number;
}

interface Product {
  _id: string;
  name: string;
  sellingPrice: number; // Changed from purchasePrice to sellingPrice
  currentStock: number;
  unitId: {
    _id: string;
    name: string;
    symbol: string;
  };
}

interface Truck {
  _id: string;
  truckId: string;
  vehicleNumber: string;
  capacity: number;
  isActive: boolean;
  defaultDriverId?: {
    _id: string;
    fullName: string;
    employeeId: string;
  };
  defaultRouteId?: {
    _id: string;
    name: string;
  };
}

interface Route {
  _id: string;
  name: string;
  description: string;
  isActive: boolean;
}

interface Staff {
  _id: string;
  fullName: string;
  employeeId: string;
  jobRoles: Array<{
    _id: string;
    name: string;
  }>;
  status: string;
}

const TripModal: React.FC<TripModalProps> = ({ isOpen, onClose, onSave, editingTrip }) => {
  const [formData, setFormData] = useState({
    truck: '',
    tripDate: new Date().toISOString().split('T')[0],
    route: '',
    startTime: '06:00',
    startLocation: 'Main Warehouse',
    driver: '',
    salesperson: '',
    helper: '',
    fuelAdded: '',
    tripNotes: ''
  });

  const [dispatchItems, setDispatchItems] = useState<DispatchItem[]>([]);
  const [newItems, setNewItems] = useState<Array<{
    id: string;
    item: string;
    itemId: string;
    quantity: number;
    costPrice: number;
  }>>([{
    id: '1',
    item: '',
    itemId: '',
    quantity: 0,
    costPrice: 0
  }]);

  // State for data from APIs
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch all data on component mount
  useEffect(() => {
    if (isOpen) {
      fetchAllData();
      
      // If editing, populate form with existing data
      if (editingTrip) {
        setFormData({
          truck: editingTrip.truckId._id,
          tripDate: editingTrip.tripDate,
          route: editingTrip.routeId._id,
          startTime: editingTrip.startTime,
          startLocation: editingTrip.startLocation,
          driver: editingTrip.driverId._id,
          salesperson: editingTrip.salespersonId?._id || '',
          helper: editingTrip.helperId?._id || '',
          fuelAdded: editingTrip.fuelAdded || '',
          tripNotes: editingTrip.tripNotes || ''
        });
        
        // Set dispatch items
        const existingItems = editingTrip.dispatchItems.map((item: any, index: number) => ({
          id: `existing-${index}`,
          item: item.itemName,
          itemId: item.itemId || '',
          itemName: item.itemName,
          quantity: item.quantity,
          costPrice: item.costPrice,
          totalCost: item.totalCost
        }));
        setDispatchItems(existingItems);
        
        // Reset new items
        setNewItems([{
          id: '1',
          item: '',
          itemId: '',
          quantity: 0,
          costPrice: 0
        }]);
      } else {
        // Reset form for new trip
        setFormData({
          truck: '',
          tripDate: new Date().toISOString().split('T')[0],
          route: '',
          startTime: '06:00',
          startLocation: 'Main Warehouse',
          driver: '',
          salesperson: '',
          helper: '',
          fuelAdded: '',
          tripNotes: ''
        });
        setDispatchItems([]);
        setNewItems([{
          id: '1',
          item: '',
          itemId: '',
          quantity: 0,
          costPrice: 0
        }]);
      }
    }
  }, [isOpen, editingTrip]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching data for TripModal...');
      
      const [trucksResponse, routesResponse, staffResponse, productsResponse] = await Promise.all([
        api.get('/trucks').catch(err => {
          console.warn('❌ Failed to fetch trucks:', err.response?.status, err.response?.data);
          return { data: [] };
        }),
        api.get('/routes').catch(err => {
          console.warn('❌ Failed to fetch routes:', err.response?.status, err.response?.data);
          return { data: [] };
        }),
        api.get('/staff').catch(err => {
          console.warn('❌ Failed to fetch staff:', err.response?.status, err.response?.data);
          return { data: [] };
        }),
        api.get('/products').catch(err => {
          console.warn('❌ Failed to fetch products:', err.response?.status, err.response?.data);
          return { data: [] };
        })
      ]);
      
      console.log('✅ API Responses:', {
        trucks: trucksResponse.data?.length || 0,
        routes: routesResponse.data?.length || 0,
        staff: staffResponse.data?.length || 0,
        products: productsResponse.data?.length || 0
      });
      
      // Log sample data structure for debugging
      if (trucksResponse.data?.length > 0) {
        console.log('🚛 Sample truck data:', trucksResponse.data[0]);
      }
      if (staffResponse.data?.length > 0) {
        console.log('👥 Sample staff data:', staffResponse.data[0]);
      }
      if (productsResponse.data?.length > 0) {
        console.log('🍎 Sample product data:', productsResponse.data[0]);
      }
      
      // Safely set data with validation
      const trucksData = Array.isArray(trucksResponse.data) ? trucksResponse.data : [];
      const routesData = Array.isArray(routesResponse.data) ? routesResponse.data : [];
      const staffData = Array.isArray(staffResponse.data) ? staffResponse.data : [];
      const productsData = Array.isArray(productsResponse.data) ? productsResponse.data : [];
      
      setTrucks(trucksData);
      setRoutes(routesData);
      setStaff(staffData);
      setProducts(productsData);
      
      // If no data from API, use fallback data
      if (!trucksData.length) {
        setTrucks([
          { _id: 'truck1', truckId: 'Truck 001', vehicleNumber: 'Truck 001', capacity: 2000, isActive: true },
          { _id: 'truck2', truckId: 'Truck 002', vehicleNumber: 'Truck 002', capacity: 1500, isActive: true },
          { _id: 'truck3', truckId: 'Truck 003', vehicleNumber: 'Truck 003', capacity: 1000, isActive: true }
        ]);
      }
      
      if (!routesData.length) {
        setRoutes([
          { _id: 'route1', name: 'Route A - North Zone', description: 'North zone delivery route', isActive: true },
          { _id: 'route2', name: 'Route B - South Zone', description: 'South zone delivery route', isActive: true },
          { _id: 'route3', name: 'Route C - East Zone', description: 'East zone delivery route', isActive: true },
          { _id: 'route4', name: 'Route D - West Zone', description: 'West zone delivery route', isActive: true }
        ]);
      }
      
      if (!staffData.length) {
        setStaff([
          { _id: 'staff1', fullName: 'Rajesh Kumar', employeeId: 'EMP001', jobRoles: [{ _id: 'driver', name: 'Truck Driver' }], status: 'active' },
          { _id: 'staff2', fullName: 'Suresh Patil', employeeId: 'EMP002', jobRoles: [{ _id: 'driver', name: 'Truck Driver' }], status: 'active' },
          { _id: 'staff3', fullName: 'Amit Singh', employeeId: 'EMP003', jobRoles: [{ _id: 'driver', name: 'Truck Driver' }], status: 'active' },
          { _id: 'staff4', fullName: 'Priya Sharma', employeeId: 'EMP004', jobRoles: [{ _id: 'sales', name: 'Field Salesperson' }], status: 'active' },
          { _id: 'staff5', fullName: 'Rahul Verma', employeeId: 'EMP005', jobRoles: [{ _id: 'sales', name: 'Field Salesperson' }], status: 'active' },
          { _id: 'staff6', fullName: 'Neha Gupta', employeeId: 'EMP006', jobRoles: [{ _id: 'sales', name: 'Field Salesperson' }], status: 'active' },
          { _id: 'staff7', fullName: 'Mohan Das', employeeId: 'EMP007', jobRoles: [{ _id: 'helper', name: 'Loader/Helper' }], status: 'active' },
          { _id: 'staff8', fullName: 'Kishan Lal', employeeId: 'EMP008', jobRoles: [{ _id: 'helper', name: 'Loader/Helper' }], status: 'active' },
          { _id: 'staff9', fullName: 'Ramesh Yadav', employeeId: 'EMP009', jobRoles: [{ _id: 'helper', name: 'Loader/Helper' }], status: 'active' }
        ]);
      }
      
      if (!productsData.length) {
        setProducts([
          {
            _id: 'sample1',
            name: 'Fresh Oranges',
            sellingPrice: 60,
            currentStock: 100,
            unitId: { _id: 'kg', name: 'Kilogram', symbol: 'kg' }
          },
          {
            _id: 'sample2',
            name: 'Alphonso Mangoes',
            sellingPrice: 40,
            currentStock: 200,
            unitId: { _id: 'pcs', name: 'Pieces', symbol: 'pcs' }
          },
          {
            _id: 'sample3',
            name: 'Bananas',
            sellingPrice: 50,
            currentStock: 150,
            unitId: { _id: 'dz', name: 'Dozen', symbol: 'dz' }
          }
        ]);
      }
      
    } catch (error) {
      console.error('Error in fetchAllData:', error);
      // Use fallback data on any error
      setTrucks([
        { _id: 'truck1', truckId: 'Truck 001', vehicleNumber: 'Truck 001', capacity: 2000, isActive: true },
        { _id: 'truck2', truckId: 'Truck 002', vehicleNumber: 'Truck 002', capacity: 1500, isActive: true },
        { _id: 'truck3', truckId: 'Truck 003', vehicleNumber: 'Truck 003', capacity: 1000, isActive: true }
      ]);
      setRoutes([
        { _id: 'route1', name: 'Route A - North Zone', description: 'North zone delivery route', isActive: true },
        { _id: 'route2', name: 'Route B - South Zone', description: 'South zone delivery route', isActive: true },
        { _id: 'route3', name: 'Route C - East Zone', description: 'East zone delivery route', isActive: true },
        { _id: 'route4', name: 'Route D - West Zone', description: 'West zone delivery route', isActive: true }
      ]);
      setStaff([
        { _id: 'staff1', fullName: 'Rajesh Kumar', employeeId: 'EMP001', jobRoles: [{ _id: 'driver', name: 'Truck Driver' }], status: 'active' },
        { _id: 'staff2', fullName: 'Suresh Patil', employeeId: 'EMP002', jobRoles: [{ _id: 'driver', name: 'Truck Driver' }], status: 'active' },
        { _id: 'staff3', fullName: 'Amit Singh', employeeId: 'EMP003', jobRoles: [{ _id: 'driver', name: 'Truck Driver' }], status: 'active' },
        { _id: 'staff4', fullName: 'Priya Sharma', employeeId: 'EMP004', jobRoles: [{ _id: 'sales', name: 'Field Salesperson' }], status: 'active' },
        { _id: 'staff5', fullName: 'Rahul Verma', employeeId: 'EMP005', jobRoles: [{ _id: 'sales', name: 'Field Salesperson' }], status: 'active' },
        { _id: 'staff6', fullName: 'Neha Gupta', employeeId: 'EMP006', jobRoles: [{ _id: 'sales', name: 'Field Salesperson' }], status: 'active' },
        { _id: 'staff7', fullName: 'Mohan Das', employeeId: 'EMP007', jobRoles: [{ _id: 'helper', name: 'Loader/Helper' }], status: 'active' },
        { _id: 'staff8', fullName: 'Kishan Lal', employeeId: 'EMP008', jobRoles: [{ _id: 'helper', name: 'Loader/Helper' }], status: 'active' },
        { _id: 'staff9', fullName: 'Ramesh Yadav', employeeId: 'EMP009', jobRoles: [{ _id: 'helper', name: 'Loader/Helper' }], status: 'active' }
      ]);
      setProducts([
        {
          _id: 'sample1',
          name: 'Fresh Oranges',
          sellingPrice: 60,
          currentStock: 100,
          unitId: { _id: 'kg', name: 'Kilogram', symbol: 'kg' }
        },
        {
          _id: 'sample2',
          name: 'Alphonso Mangoes',
          sellingPrice: 40,
          currentStock: 200,
          unitId: { _id: 'pcs', name: 'Pieces', symbol: 'pcs' }
        },
        {
          _id: 'sample3',
          name: 'Bananas',
          sellingPrice: 50,
          currentStock: 150,
          unitId: { _id: 'dz', name: 'Dozen', symbol: 'dz' }
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Helper functions to filter staff by role
  const getDrivers = () => staff.filter(s => s.jobRoles.some(role => role.name.toLowerCase().includes('driver')));
  const getSalespeople = () => staff.filter(s => s.jobRoles.some(role => role.name.toLowerCase().includes('sales')));
  const getHelpers = () => staff.filter(s => s.jobRoles.some(role => role.name.toLowerCase().includes('helper') || role.name.toLowerCase().includes('loader')));

  const totalValue = dispatchItems.reduce((sum, item) => sum + item.totalCost, 0);
  const totalItems = dispatchItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNewItemChange = (rowId: string, field: string, value: any) => {
    setNewItems(prev => prev.map(item => {
      if (item.id === rowId) {
        const updated = { ...item, [field]: value };
        
        // Auto-calculate cost price when product is selected
        if (field === 'item' || field === 'itemId') {
          const selectedProduct = products.find(p => p._id === value);
          if (selectedProduct) {
            updated.costPrice = selectedProduct.sellingPrice;
          }
        }
        
        return updated;
      }
      return item;
    }));
  };

  const addNewItemRow = () => {
    const newRowId = (newItems.length + 1).toString();
    setNewItems(prev => [...prev, {
      id: newRowId,
      item: '',
      itemId: '',
      quantity: 0,
      costPrice: 0
    }]);
  };

  const removeNewItemRow = (rowId: string) => {
    if (newItems.length > 1) {
      setNewItems(prev => prev.filter(item => item.id !== rowId));
    }
  };

  const addDispatchItems = () => {
    const validItems = newItems.filter(item => item.item && item.quantity > 0 && item.costPrice > 0);
    
    if (validItems.length === 0) {
      alert('Please fill at least one item with valid values');
      return;
    }

    const itemsToAdd: DispatchItem[] = validItems.map(item => {
      const selectedProduct = products.find(p => p._id === item.item);
      return {
        id: Date.now().toString() + Math.random(),
        item: selectedProduct?.name || item.item,
        itemId: selectedProduct?._id || item.itemId,
        itemName: selectedProduct?.name || item.item,
        quantity: item.quantity,
        costPrice: selectedProduct?.sellingPrice || item.costPrice,
        totalCost: item.quantity * (selectedProduct?.sellingPrice || item.costPrice)
      };
    });

    setDispatchItems(prev => [...prev, ...itemsToAdd]);
    
    // Reset new items to single row
    setNewItems([{
      id: '1',
      item: '',
      itemId: '',
      quantity: 0,
      costPrice: 0
    }]);
  };

  const removeDispatchItem = (id: string) => {
    setDispatchItems(prev => prev.filter(item => item.id !== id));
  };

  const handleSubmit = async () => {
    try {
      // Form validation
      const errors = [];
      
      if (!formData.truck) errors.push('Truck is required');
      if (!formData.tripDate) errors.push('Trip date is required');
      if (!formData.route) errors.push('Route is required');
      if (!formData.startTime) errors.push('Start time is required');
      if (!formData.startLocation) errors.push('Start location is required');
      if (!formData.driver) errors.push('Driver is required');
      if (dispatchItems.length === 0) {
        errors.push('At least one dispatch item is required');
      }
      
      if (errors.length > 0) {
        alert(`Please fix the following errors:\n${errors.join('\n')}`);
        return;
      }
      
      // Validate dispatch items
      for (const item of dispatchItems) {
        if (!item.itemId || !item.itemName) {
          alert('All dispatch items must have valid product information');
          return;
        }
        if (item.quantity <= 0) {
          alert(`Quantity must be greater than 0 for ${item.itemName}`);
          return;
        }
        if (item.costPrice <= 0) {
          alert(`Cost price must be greater than 0 for ${item.itemName}`);
          return;
        }
      }
      
      // Prepare trip data
      const tripData = {
        truckId: formData.truck,
        tripDate: formData.tripDate,
        routeId: formData.route,
        startTime: formData.startTime,
        startLocation: formData.startLocation,
        driverId: formData.driver,
        salespersonId: formData.salesperson || null,
        helperId: formData.helper || null,
        fuelAdded: parseFloat(formData.fuelAdded) || 0,
        tripNotes: formData.tripNotes || '',
        dispatchItems: dispatchItems.map(item => ({
          itemId: item.itemId,
          itemName: item.itemName,
          quantity: item.quantity,
          costPrice: item.costPrice,
          totalCost: item.totalCost
        }))
      };
      
      console.log(`🚀 ${editingTrip ? 'Updating' : 'Creating'} trip with data:`, tripData);
      
      // Save trip to database
      let response;
      if (editingTrip) {
        response = await api.put(`/truck-trips/${editingTrip._id}`, tripData);
        console.log('✅ Trip updated successfully:', response.data);
      } else {
        response = await api.post('/truck-trips', tripData);
        console.log('✅ Trip created successfully:', response.data);
      }
      
      // Call the onSave callback with the created/updated trip
      onSave(response.data);
      
      // Close modal
      onClose();
      
    } catch (error: any) {
      console.error(`❌ Error ${editingTrip ? 'updating' : 'creating'} trip:`, error);
      
      if (error.response?.data?.errors) {
        const errorMessages = error.response.data.errors.join('\n');
        alert(`Validation failed:\n${errorMessages}`);
      } else if (error.response?.data?.message) {
        alert(`Error: ${error.response.data.message}`);
      } else {
        alert(`Failed to ${editingTrip ? 'update' : 'create'} trip. Please try again.`);
      }
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl border border-white/20 max-w-5xl w-full max-h-[95vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom-4 duration-500">
        {/* Enhanced Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 p-8 border-b border-white/20">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5"></div>
          <div className="relative flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent mb-2">
                {editingTrip ? 'Edit Trip' : 'Create New Trip'}
              </h2>
              <p className="text-gray-300 text-lg">
                {editingTrip ? 'Modify trip details and inventory' : 'Plan a new truck trip with route and inventory details'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="group p-2 text-gray-400 hover:text-white transition-all duration-300 hover:bg-white/10 rounded-xl"
            >
              <X className="h-6 w-6 group-hover:rotate-90 transition-transform duration-300" />
            </button>
          </div>
        </div>

        <div className="p-8 space-y-8">
          {/* Trip Information */}
          <div className="group">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg mr-3">
                <Truck className="h-5 w-5 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">Trip Information</h3>
            </div>
            <p className="text-gray-400 text-sm mb-6">Basic trip details and scheduling</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="group/field">
                <label className="block text-sm font-medium text-gray-300 mb-3 group-hover/field:text-blue-400 transition-colors duration-300">Select Truck</label>
                <select
                  value={formData.truck}
                  onChange={(e) => handleInputChange('truck', e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:border-white/30"
                  disabled={loading}
                >
                  <option value="">
                    {loading ? 'Loading trucks...' : 'Choose truck'}
                  </option>
                  {trucks.filter(truck => truck.isActive).map(truck => (
                    <option key={truck._id} value={truck._id}>
                      {truck.vehicleNumber} - Capacity: {truck.capacity} kg
                    </option>
                  ))}
                </select>
              </div>
              <div className="group/field">
                <label className="block text-sm font-medium text-gray-300 mb-3 group-hover/field:text-blue-400 transition-colors duration-300">Trip Date</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-hover/field:text-blue-400 transition-colors duration-300 h-4 w-4" />
                  <input
                    type="date"
                    value={formData.tripDate}
                    onChange={(e) => handleInputChange('tripDate', e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:border-white/30"
                  />
                </div>
              </div>
              <div className="group/field">
                <label className="block text-sm font-medium text-gray-300 mb-3 group-hover/field:text-blue-400 transition-colors duration-300">Route</label>
                <select
                  value={formData.route}
                  onChange={(e) => handleInputChange('route', e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:border-white/30"
                  disabled={loading}
                >
                  <option value="">
                    {loading ? 'Loading routes...' : 'Select route'}
                  </option>
                  {routes.filter(route => route.isActive).map(route => (
                    <option key={route._id} value={route._id}>
                      {route.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="group/field">
                <label className="block text-sm font-medium text-gray-300 mb-3 group-hover/field:text-blue-400 transition-colors duration-300">Start Time</label>
                <div className="relative">
                  <Clock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-hover/field:text-blue-400 transition-colors duration-300 h-4 w-4" />
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => handleInputChange('startTime', e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:border-white/30"
                  />
                </div>
              </div>
              <div className="group/field">
                <label className="block text-sm font-medium text-gray-300 mb-3 group-hover/field:text-blue-400 transition-colors duration-300">Start Location</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-hover/field:text-blue-400 transition-colors duration-300 h-4 w-4" />
                  <select
                    value={formData.startLocation}
                    onChange={(e) => handleInputChange('startLocation', e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:border-white/30"
                  >
                    <option value="Main Warehouse">Main Warehouse</option>
                    <option value="Secondary Warehouse">Secondary Warehouse</option>
                    <option value="Distribution Center">Distribution Center</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Staff Assignment */}
          <div className="group">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-gradient-to-br from-green-500/20 to-blue-500/20 rounded-lg mr-3">
                <Users className="h-5 w-5 text-green-400" />
              </div>
              <h3 className="text-xl font-semibold bg-gradient-to-r from-white to-green-200 bg-clip-text text-transparent">Staff Assignment</h3>
            </div>
            <p className="text-gray-400 text-sm mb-6">Assign team members for this trip</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="group/field">
                <label className="block text-sm font-medium text-gray-300 mb-3 group-hover/field:text-green-400 transition-colors duration-300">Driver</label>
                <select
                  value={formData.driver}
                  onChange={(e) => handleInputChange('driver', e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300 hover:border-white/30"
                  disabled={loading}
                >
                  <option value="">
                    {loading ? 'Loading drivers...' : 'Select driver'}
                  </option>
                  {getDrivers().filter(driver => driver.status === 'active').map(driver => (
                    <option key={driver._id} value={driver._id}>
                      {driver.fullName} - {driver.jobRoles.map(role => role.name).join(', ')}
                    </option>
                  ))}
                </select>
              </div>
              <div className="group/field">
                <label className="block text-sm font-medium text-gray-300 mb-3 group-hover/field:text-green-400 transition-colors duration-300">Salesperson</label>
                <select
                  value={formData.salesperson}
                  onChange={(e) => handleInputChange('salesperson', e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300 hover:border-white/30"
                  disabled={loading}
                >
                  <option value="">
                    {loading ? 'Loading salespeople...' : 'Select salesperson'}
                  </option>
                  {getSalespeople().filter(salesperson => salesperson.status === 'active').map(salesperson => (
                    <option key={salesperson._id} value={salesperson._id}>
                      {salesperson.fullName} - {salesperson.jobRoles.map(role => role.name).join(', ')}
                    </option>
                  ))}
                </select>
              </div>
              <div className="group/field">
                <label className="block text-sm font-medium text-gray-300 mb-3 group-hover/field:text-green-400 transition-colors duration-300">Helper (Optional)</label>
                <select
                  value={formData.helper}
                  onChange={(e) => handleInputChange('helper', e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300 hover:border-white/30"
                  disabled={loading}
                >
                  <option value="">
                    {loading ? 'Loading helpers...' : 'No Helper'}
                  </option>
                  {getHelpers().filter(helper => helper.status === 'active').map(helper => (
                    <option key={helper._id} value={helper._id}>
                      {helper.fullName} - {helper.jobRoles.map(role => role.name).join(', ')}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Dispatch Items */}
          <div className="group">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="p-2 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg mr-3">
                  <Package className="h-5 w-5 text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">Dispatch Items</h3>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={addNewItemRow}
                  className="group/btn bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <Plus className="h-4 w-4 group-hover/btn:rotate-90 transition-transform duration-300" />
                  Add Row
                </button>
                <button
                  onClick={addDispatchItems}
                  className="group/btn bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <Package className="h-4 w-4 group-hover/btn:scale-110 transition-transform duration-300" />
                  Add to Dispatch
                </button>
              </div>
            </div>
            <p className="text-gray-400 text-sm mb-6">Select products and quantities for this trip</p>

            {/* Enhanced Items Table */}
            <div className="bg-gradient-to-br from-white/5 to-white/10 rounded-2xl border border-white/10 overflow-hidden backdrop-blur-sm">
              <div className="grid grid-cols-6 gap-4 p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 text-sm font-medium text-gray-300 border-b border-white/10">
                <div>Item</div>
                <div>Quantity</div>
                <div>Selling Price (₹)</div>
                <div>Total Cost (₹)</div>
                <div>Action</div>
                <div></div>
              </div>
              
              {/* Add New Item Row */}
              {newItems.map((item) => (
                <div key={item.id} className="grid grid-cols-6 gap-4 p-4 border-b border-white/10 bg-white/5">
                  <div>
                    <select
                      value={item.item}
                      onChange={(e) => handleNewItemChange(item.id, 'item', e.target.value)}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all duration-300 hover:border-white/30"
                      disabled={loading}
                    >
                      <option value="">
                        {loading ? 'Loading products...' : 'Select item'}
                      </option>
                      {products.map(product => (
                        <option key={product._id} value={product._id}>
                          {product.name} - Stock: {product.currentStock} {product.unitId?.symbol || 'units'}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleNewItemChange(item.id, 'quantity', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all duration-300 hover:border-white/30"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      value={item.costPrice}
                      onChange={(e) => handleNewItemChange(item.id, 'costPrice', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all duration-300 hover:border-white/30"
                      placeholder="0"
                      readOnly
                    />
                  </div>
                  <div className="text-gray-300 text-sm font-medium">
                    ₹{(item.quantity * item.costPrice).toFixed(2)}
                  </div>
                  <div>
                    <button
                      onClick={() => removeNewItemRow(item.id)}
                      className="text-red-400 hover:text-red-300 transition-colors duration-300 p-1 hover:bg-red-400/10 rounded-lg"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div></div>
                </div>
              ))}

              {/* Existing Items */}
              {dispatchItems.map((item) => (
                <div key={item.id} className="grid grid-cols-6 gap-4 p-4 border-b border-white/10 bg-white/5 hover:bg-white/10 transition-colors duration-300">
                  <div className="text-gray-300 font-medium">
                    {item.item}
                    <div className="text-xs text-gray-400 mt-1">
                      {(() => {
                        const product = products.find(p => p._id === item.itemId);
                        return product ? `${product.currentStock} ${product.unitId?.symbol || 'units'} available` : '';
                      })()}
                    </div>
                  </div>
                  <div className="text-gray-300">{item.quantity}</div>
                  <div className="text-gray-300">₹{item.costPrice.toFixed(2)}</div>
                  <div className="text-gray-300 font-medium">₹{item.totalCost.toFixed(2)}</div>
                  <div>
                    <button
                      onClick={() => removeDispatchItem(item.id)}
                      className="text-red-400 hover:text-red-300 transition-colors duration-300 p-1 hover:bg-red-400/10 rounded-lg"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div></div>
                </div>
              ))}
            </div>
          </div>

          {/* Enhanced Dispatch Summary */}
          <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl border border-white/10 p-6 backdrop-blur-sm">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg mr-3">
                <DollarSign className="h-5 w-5 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">Dispatch Summary</h3>
            </div>
            <div className="flex justify-between items-center">
              <div className="text-gray-300 text-lg">
                <span className="font-medium">Total Value:</span> 
                <span className="ml-2 text-2xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">₹{totalValue.toFixed(2)}</span>
              </div>
              <div className="text-gray-300 text-lg">
                <span className="font-medium">Total items:</span> 
                <span className="ml-2 text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">{totalItems} units</span>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="group">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-lg mr-3">
                <Clock className="h-5 w-5 text-yellow-400" />
              </div>
              <h3 className="text-xl font-semibold bg-gradient-to-r from-white to-yellow-200 bg-clip-text text-transparent">Additional Information</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="group/field">
                <label className="block text-sm font-medium text-gray-300 mb-3 group-hover/field:text-yellow-400 transition-colors duration-300">Fuel Added (Liters)</label>
                <input
                  type="text"
                  value={formData.fuelAdded}
                  onChange={(e) => handleInputChange('fuelAdded', e.target.value)}
                  placeholder="0.0, 10.5"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-300 hover:border-white/30"
                />
              </div>
            </div>
            <div className="mt-6 group/field">
              <label className="block text-sm font-medium text-gray-300 mb-3 group-hover/field:text-yellow-400 transition-colors duration-300">Trip Notes</label>
              <textarea
                value={formData.tripNotes}
                onChange={(e) => handleInputChange('tripNotes', e.target.value)}
                placeholder="Any special instructions or notes for this trip"
                rows={3}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-300 hover:border-white/30 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Enhanced Footer */}
        <div className="flex justify-end gap-4 p-8 border-t border-white/20 bg-gradient-to-r from-gray-800/50 to-gray-900/50">
          <button
            onClick={onClose}
            className="px-8 py-3 text-gray-300 border border-white/20 rounded-xl hover:bg-white/10 hover:border-white/30 transition-all duration-300 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            {editingTrip ? 'Update Trip' : 'Create Trip'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TripModal; 