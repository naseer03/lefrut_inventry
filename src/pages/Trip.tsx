import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Calendar, Eye, MapPin, CheckCircle, Clock, Truck, Users, Package, DollarSign, Fuel, Receipt, X, Play, Square, Edit, PlusCircle, Printer } from 'lucide-react';
import Layout from '../components/Layout';
import TripModal from '../components/TripModal';
import TripDetailModal from '../components/TripDetailModal';
import TripProductModal from '../components/TripProductModal';
import api from '../services/api';

interface Trip {
  _id: string;
  truckId: {
    _id: string;
    truckId: string;
    vehicleNumber: string;
    capacity: number;
  };
  routeId: {
    _id: string;
    name: string;
    description: string;
  };
  tripDate: string;
  startTime: string;
  startLocation: string;
  driverId: {
    _id: string;
    fullName: string;
    employeeId: string;
  };
  salespersonId?: {
    _id: string;
    fullName: string;
    employeeId: string;
  };
  helperId?: {
    _id: string;
    fullName: string;
    employeeId: string;
  };
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  totalValue: number;
  totalItems: number;
  fuelAdded?: number;
  tripNotes?: string;
  dispatchItems: Array<{
    itemName: string;
    quantity: number;
    costPrice: number;
    totalCost: number;
  }>;
  createdAt: string;
}

const Trip: React.FC = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [managingTrip, setManagingTrip] = useState<Trip | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    planned: 0,
    inProgress: 0,
    completed: 0,
    cancelled: 0
  });

  // Fetch trips data
  const fetchTrips = async () => {
    try {
      setLoading(true);
      const response = await api.get('/truck-trips');
      const tripsData = response.data.trips || [];
      setTrips(tripsData);
      
      // Calculate stats
      const statsData = {
        total: tripsData.length,
        planned: tripsData.filter((t: Trip) => t.status === 'planned').length,
        inProgress: tripsData.filter((t: Trip) => t.status === 'in_progress').length,
        completed: tripsData.filter((t: Trip) => t.status === 'completed').length,
        cancelled: tripsData.filter((t: Trip) => t.status === 'cancelled').length
      };
      setStats(statsData);
      
    } catch (error: any) {
      console.error('Error fetching trips:', error);
      // Use sample data if API fails
      setTrips([
        {
          _id: '1',
          truckId: { _id: 'truck1', truckId: 'T001', vehicleNumber: 'MH12AB1234', capacity: 2000 },
          routeId: { _id: 'route1', name: 'North Zone Route', description: 'North zone delivery route' },
          tripDate: '2024-01-15',
          startTime: '06:00',
          startLocation: 'Main Warehouse',
          driverId: { _id: 'driver1', fullName: 'Rajesh Kumar', employeeId: 'EMP001' },
          salespersonId: { _id: 'sales1', fullName: 'Priya Sharma', employeeId: 'EMP004' },
          helperId: { _id: 'helper1', fullName: 'Mohan Das', employeeId: 'EMP007' },
          status: 'planned',
          totalValue: 15000,
          totalItems: 50,
          dispatchItems: [
            { itemName: 'Fresh Oranges', quantity: 20, costPrice: 60, totalCost: 1200 },
            { itemName: 'Alphonso Mangoes', quantity: 15, costPrice: 40, totalCost: 600 }
          ],
          createdAt: '2024-01-14T10:00:00Z'
        },
        {
          _id: '2',
          truckId: { _id: 'truck2', truckId: 'T002', vehicleNumber: 'MH12CD5678', capacity: 1500 },
          routeId: { _id: 'route2', name: 'South Zone Route', description: 'South zone delivery route' },
          tripDate: '2024-01-16',
          startTime: '07:00',
          startLocation: 'Main Warehouse',
          driverId: { _id: 'driver2', fullName: 'Suresh Patil', employeeId: 'EMP002' },
          salespersonId: { _id: 'sales2', fullName: 'Rahul Verma', employeeId: 'EMP005' },
          status: 'in_progress',
          totalValue: 12000,
          totalItems: 40,
          dispatchItems: [
            { itemName: 'Bananas', quantity: 25, costPrice: 50, totalCost: 1250 },
            { itemName: 'Apples', quantity: 10, costPrice: 80, totalCost: 800 }
          ],
          createdAt: '2024-01-15T09:00:00Z'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  const handleCreateTrip = () => {
    setEditingTrip(null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingTrip(null);
  };

  const handleSaveTrip = (tripData: Trip) => {
    if (editingTrip) {
      // Update existing trip
      setTrips(trips.map(t => t._id === editingTrip._id ? tripData : t));
    } else {
      // Add new trip
      setTrips([...trips, tripData]);
    }
    setShowModal(false);
    setEditingTrip(null);
    fetchTrips(); // Refresh the list
  };

  const handleEditTrip = (trip: Trip) => {
    if (trip.status === 'planned') {
      setEditingTrip(trip);
      setShowModal(true);
    }
  };

  const handleViewDetails = (trip: Trip) => {
    setSelectedTrip(trip);
    setShowDetailModal(true);
  };

  const handleCloseDetailModal = () => {
    setShowDetailModal(false);
    setSelectedTrip(null);
  };

  const handlePrintTrip = (trip: Trip) => {
    // Create a new window for printing
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      alert('Please allow popups to print trip details');
      return;
    }

    // Generate the print content with gray theme
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Trip Details Report - ${trip._id?.slice(-6).toUpperCase()}</title>
        <style>
          @media print {
            body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
            .no-print { display: none !important; }
            .print-header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #d1d5db; }
            .print-header h1 { font-size: 28px; font-weight: bold; margin-bottom: 5px; color: #1f2937; }
            .print-header p { font-size: 14px; color: #6b7280; margin: 2px 0; }
            .section { background: #f9fafb; border: 1px solid #d1d5db; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
            .section h3 { color: #1f2937; font-size: 18px; margin-bottom: 15px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 15px; margin-bottom: 20px; }
            .info-card { background: #f3f4f6; border: 1px solid #d1d5db; border-radius: 6px; padding: 15px; }
            .info-card h4 { color: #1f2937; font-size: 14px; margin-bottom: 10px; }
            .info-card p { color: #4b5563; font-size: 12px; margin: 3px 0; }
            .status-badge { display: inline-block; background: #e5e7eb; color: #374151; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 500; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th { background: #f3f4f6; color: #1f2937; font-weight: bold; padding: 12px; text-align: left; border: 1px solid #d1d5db; }
            td { padding: 12px; border: 1px solid #d1d5db; color: #4b5563; }
            .total-row { background: #f3f4f6; font-weight: bold; color: #1f2937; }
            .signature-section { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-top: 30px; }
            .signature-box { border: 2px dashed #9ca3af; border-radius: 8px; height: 120px; display: flex; align-items: center; justify-content: center; text-align: center; }
            .signature-box .text { color: #6b7280; font-size: 12px; }
            .print-footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 2px solid #d1d5db; }
            .print-footer p { font-size: 12px; color: #6b7280; margin: 2px 0; }
            .summary-grid { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 15px; background: #f3f4f6; border: 1px solid #d1d5db; border-radius: 6px; padding: 15px; }
            .summary-item { text-align: center; }
            .summary-item .label { color: #6b7280; font-size: 11px; }
            .summary-item .value { color: #1f2937; font-size: 14px; font-weight: 600; }
          }
        </style>
      </head>
      <body>
        <div class="print-header">
          <h1>Trip Details Report</h1>
          <p>Fruit Business Management System</p>
          <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
        </div>

        <div class="section">
          <h3>Trip #${trip._id?.slice(-6).toUpperCase() || 'N/A'}</h3>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <div style="color: #4b5563; font-size: 14px;">
              <p><strong>Vehicle:</strong> ${trip.truckId?.vehicleNumber || 'N/A'}</p>
              <p><strong>Route:</strong> ${trip.routeId?.name || 'N/A'}</p>
              <p><strong>Date:</strong> ${new Date(trip.tripDate).toLocaleDateString()}</p>
            </div>
            <div class="status-badge">${getStatusText(trip.status)}</div>
          </div>

          <div class="info-grid">
            <div class="info-card">
              <h4>Trip Time</h4>
              <p><strong>Start:</strong> ${trip.startTime}</p>
              <p><strong>Location:</strong> ${trip.startLocation}</p>
            </div>
            <div class="info-card">
              <h4>Staff</h4>
              <p><strong>Driver:</strong> ${trip.driverId?.fullName || 'N/A'}</p>
              ${trip.salespersonId ? `<p><strong>Sales:</strong> ${trip.salespersonId.fullName}</p>` : ''}
              ${trip.helperId ? `<p><strong>Helper:</strong> ${trip.helperId.fullName}</p>` : ''}
            </div>
            <div class="info-card">
              <h4>Items</h4>
              <p><strong>Total Items:</strong> ${trip.totalItems}</p>
              <p><strong>Products:</strong> ${trip.dispatchItems?.length || 0}</p>
            </div>
            <div class="info-card">
              <h4>Value</h4>
              <p><strong>Total Value:</strong> ₹${trip.totalValue?.toLocaleString() || '0'}</p>
              <p><strong>Fuel Added:</strong> ${trip.fuelAdded || 0}L</p>
            </div>
          </div>
        </div>

        ${trip.dispatchItems && trip.dispatchItems.length > 0 ? `
        <div class="section">
          <h3>Dispatch Items</h3>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Quantity</th>
                <th>Cost Price</th>
                <th>Total Cost</th>
              </tr>
            </thead>
            <tbody>
              ${trip.dispatchItems.map((item: any) => `
                <tr>
                  <td>${item.itemName}</td>
                  <td>${item.quantity}</td>
                  <td>₹${item.costPrice}</td>
                  <td>₹${item.totalCost}</td>
                </tr>
              `).join('')}
              <tr class="total-row">
                <td colspan="3" style="text-align: right;"><strong>Total Value:</strong></td>
                <td><strong>₹${trip.totalValue?.toLocaleString() || '0'}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
        ` : ''}

        ${trip.tripNotes ? `
        <div class="section">
          <h3>Trip Notes</h3>
          <div style="background: white; padding: 15px; border: 1px solid #d1d5db; border-radius: 6px; color: #4b5563;">
            ${trip.tripNotes.replace(/\n/g, '<br>')}
          </div>
        </div>
        ` : ''}

        <div class="section">
          <h3 style="text-align: center;">Authorization</h3>
          <div class="signature-section">
            <div>
              <h4 style="text-align: center; color: #1f2937; margin-bottom: 10px;">Truck Driver</h4>
              <p style="text-align: center; color: #6b7280; font-size: 12px; margin-bottom: 15px;">${trip.driverId?.fullName || 'Driver Name'}</p>
              <div class="signature-box">
                <div class="text">
                  <div>Driver Signature</div>
                  <div style="margin-top: 5px;">Date: ${new Date().toLocaleDateString()}</div>
                </div>
              </div>
            </div>
            <div>
              <h4 style="text-align: center; color: #1f2937; margin-bottom: 10px;">Warehouse Manager</h4>
              <p style="text-align: center; color: #6b7280; font-size: 12px; margin-bottom: 15px;">Manager Name</p>
              <div class="signature-box">
                <div class="text">
                  <div>Manager Signature</div>
                  <div style="margin-top: 5px;">Date: ${new Date().toLocaleDateString()}</div>
                </div>
              </div>
            </div>
          </div>

          <div class="summary-grid" style="margin-top: 30px;">
            <div class="summary-item">
              <div class="label">Trip ID</div>
              <div class="value">#${trip._id?.slice(-6).toUpperCase() || 'N/A'}</div>
            </div>
            <div class="summary-item">
              <div class="label">Vehicle</div>
              <div class="value">${trip.truckId?.vehicleNumber || 'N/A'}</div>
            </div>
            <div class="summary-item">
              <div class="label">Route</div>
              <div class="value">${trip.routeId?.name || 'N/A'}</div>
            </div>
            <div class="summary-item">
              <div class="label">Status</div>
              <div class="value">${getStatusText(trip.status)}</div>
            </div>
          </div>
        </div>

        <div class="print-footer">
          <p>This document was generated by the Fruit Business Management System</p>
          <p>Page 1 of 1 | Trip #${trip._id?.slice(-6).toUpperCase() || 'N/A'}</p>
        </div>

        <div class="no-print" style="text-align: center; margin-top: 20px;">
          <button onclick="window.print()" style="background: #3b82f6; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-size: 14px;">
            Print Trip Details
          </button>
          <button onclick="window.close()" style="background: #6b7280; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-size: 14px; margin-left: 10px;">
            Close
          </button>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  const handleAddProducts = (trip: Trip) => {
    if (trip.status === 'planned' || trip.status === 'in_progress') {
      setManagingTrip(trip);
      setShowProductModal(true);
    }
  };

  const handleCloseProductModal = () => {
    setShowProductModal(false);
    setManagingTrip(null);
  };

  const handleProductsUpdated = (updatedTrip: Trip) => {
    setTrips(trips.map(t => t._id === updatedTrip._id ? updatedTrip : t));
    setShowProductModal(false);
    setManagingTrip(null);
    fetchTrips(); // Refresh the list
  };

  // New function to handle starting a trip
  const handleStartTrip = async (trip: Trip) => {
    try {
      if (trip.status !== 'planned') {
        alert('Only planned trips can be started!');
        return;
      }

      const confirmed = window.confirm(`Are you sure you want to start trip #${trip._id.slice(-6).toUpperCase()}?`);
      if (!confirmed) return;

      const response = await api.patch(`/truck-trips/${trip._id}/status`, {
        status: 'in_progress'
      });

      if (response.data.message) {
        alert('Trip started successfully!');
        fetchTrips(); // Refresh the trips list
      } else {
        alert('Failed to start trip. Please try again.');
      }
    } catch (error: any) {
      console.error('Error starting trip:', error);
      alert('Error starting trip. Please try again.');
    }
  };

  // New function to handle cancelling a trip
  const handleCancelTrip = async (trip: Trip) => {
    try {
      if (trip.status === 'completed' || trip.status === 'cancelled') {
        alert('Cannot cancel completed or already cancelled trips!');
        return;
      }

      const confirmed = window.confirm(`Are you sure you want to cancel trip #${trip._id.slice(-6).toUpperCase()}? This action cannot be undone.`);
      if (!confirmed) return;

      const response = await api.patch(`/truck-trips/${trip._id}/status`, {
        status: 'cancelled'
      });

      if (response.data.message) {
        alert('Trip cancelled successfully!');
        fetchTrips(); // Refresh the trips list
      } else {
        alert('Failed to cancel trip. Please try again.');
      }
    } catch (error: any) {
      console.error('Error cancelling trip:', error);
      alert('Error cancelling trip. Please try again.');
    }
  };

  // New function to handle completing a trip
  const handleCompleteTrip = async (trip: Trip) => {
    try {
      if (trip.status !== 'in_progress') {
        alert('Only in-progress trips can be completed!');
        return;
      }

      const confirmed = window.confirm(`Are you sure you want to complete trip #${trip._id.slice(-6).toUpperCase()}?`);
      if (!confirmed) return;

      const response = await api.patch(`/truck-trips/${trip._id}/status`, {
        status: 'completed'
      });

      if (response.data.message) {
        alert('Trip completed successfully!');
        fetchTrips(); // Refresh the trips list
      } else {
        alert('Failed to complete trip. Please try again.');
      }
    } catch (error: any) {
      console.error('Error completing trip:', error);
      alert('Error completing trip. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planned': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'in_progress': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'completed': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'cancelled': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'planned': return <Calendar className="h-4 w-4" />;
      case 'in_progress': return <Clock className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <X className="h-4 w-4" />;
      default: return <Calendar className="h-4 w-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'planned': return 'Planned';
      case 'in_progress': return 'In Progress';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  // Filter trips based on active tab and search
  const filteredTrips = trips.filter(trip => {
    const matchesTab = activeTab === 'all' || trip.status === activeTab;
    const matchesSearch = trip.truckId.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         trip.routeId.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         trip.driverId.fullName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || trip.status === statusFilter;
    const matchesDate = !dateFilter || trip.tripDate === dateFilter;
    
    return matchesTab && matchesSearch && matchesStatus && matchesDate;
  });

  return (
    <Layout>
      <div className="space-y-8">
        {/* Enhanced Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 rounded-2xl border border-white/20 p-8">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5"></div>
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent mb-2">
                Trip Management
              </h1>
              <p className="text-gray-300 text-lg">Manage truck trips and route operations with precision</p>
            </div>
            <button
              onClick={handleCreateTrip}
              className="group relative bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 flex items-center gap-3 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
              <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
              <span>Create Trip</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/20 rounded-2xl border border-blue-500/20 p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-300 text-sm font-medium">Total Trips</p>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
              </div>
              <div className="p-3 bg-blue-500/20 rounded-xl">
                <Truck className="h-6 w-6 text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/20 rounded-2xl border border-yellow-500/20 p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-300 text-sm font-medium">Planned</p>
                <p className="text-2xl font-bold text-white">{stats.planned}</p>
              </div>
              <div className="p-3 bg-yellow-500/20 rounded-xl">
                <Calendar className="h-6 w-6 text-yellow-400" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/20 rounded-2xl border border-orange-500/20 p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-300 text-sm font-medium">In Progress</p>
                <p className="text-2xl font-bold text-white">{stats.inProgress}</p>
              </div>
              <div className="p-3 bg-orange-500/20 rounded-xl">
                <Clock className="h-6 w-6 text-orange-400" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500/10 to-green-600/20 rounded-2xl border border-green-500/20 p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-300 text-sm font-medium">Completed</p>
                <p className="text-2xl font-bold text-white">{stats.completed}</p>
              </div>
              <div className="p-3 bg-green-500/20 rounded-xl">
                <CheckCircle className="h-6 w-6 text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-500/10 to-red-600/20 rounded-2xl border border-red-500/20 p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-300 text-sm font-medium">Cancelled</p>
                <p className="text-2xl font-bold text-white">{stats.cancelled}</p>
              </div>
              <div className="p-3 bg-red-500/20 rounded-xl">
                <X className="h-6 w-6 text-red-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs and Filters */}
        <div className="bg-gradient-to-br from-white/5 to-white/10 rounded-2xl border border-white/10 p-6 backdrop-blur-sm">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Tabs */}
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'all', label: 'All Trips', count: stats.total },
                { id: 'planned', label: 'Planned', count: stats.planned },
                { id: 'in_progress', label: 'In Progress', count: stats.inProgress },
                { id: 'completed', label: 'Completed', count: stats.completed },
                { id: 'cancelled', label: 'Cancelled', count: stats.cancelled }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 flex items-center gap-2 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                      : 'bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className="px-2 py-1 bg-white/20 rounded-lg text-xs">
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search trips..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                />
              </div>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
              >
                <option value="all">All Status</option>
                <option value="planned">Planned</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
              />
            </div>
          </div>
        </div>

        {/* Trips List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-gray-400 mt-4">Loading trips...</p>
            </div>
          ) : filteredTrips.length === 0 ? (
            <div className="text-center py-12">
              <Truck className="h-16 w-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-300 mb-2">No trips found</h3>
              <p className="text-gray-500">Create your first trip to get started</p>
            </div>
          ) : (
            filteredTrips.map(trip => (
              <div key={trip._id} className="bg-gradient-to-br from-white/5 to-white/10 rounded-2xl border border-white/10 p-6 backdrop-blur-sm hover:border-white/20 transition-all duration-300">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-white mb-2">
                          Trip #{trip._id.slice(-6).toUpperCase()}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-gray-300">
                          <div className="flex items-center gap-2">
                            <Truck className="h-4 w-4" />
                            <span>{trip.truckId.vehicleNumber}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            <span>{trip.routeId.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>{new Date(trip.tripDate).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className={`px-4 py-2 rounded-xl border ${getStatusColor(trip.status)} flex items-center gap-2`}>
                        {getStatusIcon(trip.status)}
                        <span className="font-medium">{getStatusText(trip.status)}</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="bg-white/5 rounded-xl p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <Users className="h-5 w-5 text-blue-400" />
                          <h4 className="font-semibold text-white">Staff</h4>
                        </div>
                        <div className="space-y-1 text-sm text-gray-300">
                          <p><span className="text-blue-400">Driver:</span> {trip.driverId.fullName}</p>
                          {trip.salespersonId && (
                            <p><span className="text-green-400">Sales:</span> {trip.salespersonId.fullName}</p>
                          )}
                          {trip.helperId && (
                            <p><span className="text-purple-400">Helper:</span> {trip.helperId.fullName}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="bg-white/5 rounded-xl p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <Package className="h-5 w-5 text-green-400" />
                          <h4 className="font-semibold text-white">Items</h4>
                        </div>
                        <div className="space-y-1 text-sm text-gray-300">
                          <p><span className="text-green-400">Total Items:</span> {trip.totalItems}</p>
                          <p><span className="text-green-400">Products:</span> {trip.dispatchItems.length}</p>
                        </div>
                      </div>
                      
                      <div className="bg-white/5 rounded-xl p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <DollarSign className="h-5 w-5 text-yellow-400" />
                          <h4 className="font-semibold text-white">Value</h4>
                        </div>
                        <div className="space-y-1 text-sm text-gray-300">
                          <p><span className="text-yellow-400">Total Value:</span> ₹{trip.totalValue.toLocaleString()}</p>
                          <p><span className="text-yellow-400">Start Time:</span> {trip.startTime}</p>
                        </div>
                      </div>
                    </div>
                    
                    {trip.dispatchItems.length > 0 && (
                      <div className="bg-white/5 rounded-xl p-4">
                        <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          Dispatch Items
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {trip.dispatchItems.map((item, index) => (
                            <div key={index} className="bg-white/5 rounded-lg p-3">
                              <p className="font-medium text-white text-sm">{item.itemName}</p>
                              <p className="text-gray-400 text-xs">
                                Qty: {item.quantity} | Price: ₹{item.costPrice} | Total: ₹{item.totalCost}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-4 py-2 rounded-xl font-medium transition-all duration-300 flex items-center gap-2" onClick={() => handleViewDetails(trip)}>
                      <Eye className="h-4 w-4" />
                      View Details
                    </button>
                    <button className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white px-4 py-2 rounded-xl font-medium transition-all duration-300 flex items-center gap-2" onClick={() => handlePrintTrip(trip)}>
                      <Printer className="h-4 w-4" />
                      Print Details
                    </button>
                    
                    {trip.status === 'planned' && (
                      <>
                        <button className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white px-4 py-2 rounded-xl font-medium transition-all duration-300 flex items-center gap-2" onClick={() => handleStartTrip(trip)}>
                          <Play className="h-4 w-4" />
                          Start Trip
                        </button>
                        <button className="bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white px-4 py-2 rounded-xl font-medium transition-all duration-300 flex items-center gap-2" onClick={() => handleEditTrip(trip)}>
                          <Edit className="h-4 w-4" />
                          Edit Trip
                        </button>
                        <button className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white px-4 py-2 rounded-xl font-medium transition-all duration-300 flex items-center gap-2" onClick={() => handleAddProducts(trip)}>
                          <PlusCircle className="h-4 w-4" />
                          Manage Products
                        </button>
                      </>
                    )}
                    
                    {trip.status === 'in_progress' && (
                      <>
                        <button className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white px-4 py-2 rounded-xl font-medium transition-all duration-300 flex items-center gap-2" onClick={() => handleCompleteTrip(trip)}>
                          <CheckCircle className="h-4 w-4" />
                          Complete Trip
                        </button>
                        <button className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white px-4 py-2 rounded-xl font-medium transition-all duration-300 flex items-center gap-2" onClick={() => handleAddProducts(trip)}>
                          <PlusCircle className="h-4 w-4" />
                          Manage Products
                        </button>
                        <button className="bg-gradient-to-r from-red-500 to-blue-600 hover:from-red-600 hover:to-blue-700 text-white px-4 py-2 rounded-xl font-medium transition-all duration-300 flex items-center gap-2" onClick={() => handleCancelTrip(trip)}>
                          <X className="h-4 w-4" />
                          Cancel Trip
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      
      {/* Trip Modal */}
      <TripModal
        isOpen={showModal}
        onClose={handleCloseModal}
        onSave={handleSaveTrip}
        editingTrip={editingTrip}
      />

      {/* Trip Detail Modal */}
      <TripDetailModal
        isOpen={showDetailModal}
        onClose={handleCloseDetailModal}
        trip={selectedTrip}
      />

      {/* Trip Product Modal */}
      <TripProductModal
        isOpen={showProductModal}
        onClose={handleCloseProductModal}
        onSave={handleProductsUpdated}
        trip={managingTrip}
      />
    </Layout>
  );
};

export default Trip; 