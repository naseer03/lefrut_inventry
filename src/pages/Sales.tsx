import React, { useState, useEffect } from 'react';
import { Search, Filter, Calendar, DollarSign, TrendingUp, ShoppingCart, CreditCard } from 'lucide-react';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

interface Sale {
  _id: string;
  tripId: {
    tripDate: string;
  } | null;
  productId: {
    name: string;
    sellingPrice: number;
  };
  quantitySold: number;
  unitPrice: number;
  totalAmount: number;
  paymentMode: string;
  paymentStatus: string;
  customerName: string;
  customerPhone: string;
  saleType?: string;
  createdAt: string;
}

interface SalesSummary {
  totalSales: number;
  totalQuantity: number;
  totalTransactions: number;
  cashSales: number;
  upiSales: number;
  cardSales: number;
}

const Sales: React.FC = () => {
  const { hasPermission } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [filteredSales, setFilteredSales] = useState<Sale[]>([]);
  const [summary, setSummary] = useState<SalesSummary>({
    totalSales: 0,
    totalQuantity: 0,
    totalTransactions: 0,
    cashSales: 0,
    upiSales: 0,
    cardSales: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [saleTypeFilter, setSaleTypeFilter] = useState('all');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    fetchSales();
    fetchSummary();
  }, []);

  useEffect(() => {
    let filtered = sales.filter(sale =>
      sale.productId.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.customerPhone?.includes(searchTerm)
    );

    if (paymentFilter !== 'all') {
      filtered = filtered.filter(sale => sale.paymentMode === paymentFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(sale => sale.paymentStatus === statusFilter);
    }

    if (saleTypeFilter !== 'all') {
      if (saleTypeFilter === 'standalone') {
        filtered = filtered.filter(sale => !sale.tripId);
      } else if (saleTypeFilter === 'trip') {
        filtered = filtered.filter(sale => sale.tripId);
      }
    }

    if (dateRange.startDate && dateRange.endDate) {
      filtered = filtered.filter(sale => {
        const saleDate = new Date(sale.createdAt).toISOString().split('T')[0];
        return saleDate >= dateRange.startDate && saleDate <= dateRange.endDate;
      });
    }

    setFilteredSales(filtered);
  }, [sales, searchTerm, paymentFilter, statusFilter, saleTypeFilter, dateRange]);

  const fetchSales = async () => {
    try {
      const response = await api.get('/sales');
      setSales(response.data);
    } catch (error) {
      toast.error('Failed to fetch sales');
      console.error('Fetch sales error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const params = new URLSearchParams();
      if (dateRange.startDate) params.append('startDate', dateRange.startDate);
      if (dateRange.endDate) params.append('endDate', dateRange.endDate);
      
      const response = await api.get(`/sales/summary?${params}`);
      setSummary(response.data);
    } catch (error) {
      console.error('Failed to fetch sales summary:', error);
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-500/20 text-green-300';
      case 'pending': return 'bg-yellow-500/20 text-yellow-300';
      case 'failed': return 'bg-red-500/20 text-red-300';
      default: return 'bg-gray-500/20 text-gray-300';
    }
  };

  const getPaymentModeColor = (mode: string) => {
    switch (mode) {
      case 'Cash': return 'bg-green-500/20 text-green-300';
      case 'UPI': return 'bg-blue-500/20 text-blue-300';
      case 'Card': return 'bg-purple-500/20 text-purple-300';
      default: return 'bg-gray-500/20 text-gray-300';
    }
  };

  const getSaleTypeDisplay = (sale: Sale) => {
    if (sale.tripId) {
      return {
        text: 'Trip Sale',
        color: 'bg-blue-500/20 text-blue-300',
        date: new Date(sale.tripId.tripDate).toLocaleDateString()
      };
    } else {
      return {
        text: 'Mobile Sale',
        color: 'bg-purple-500/20 text-purple-300',
        date: 'Standalone'
      };
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-3xl font-bold text-white">Sales Dashboard</h1>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm font-medium">Total Sales</p>
                <p className="text-2xl font-bold text-white">₹{summary.totalSales.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm font-medium">Transactions</p>
                <p className="text-2xl font-bold text-white">{summary.totalTransactions}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <ShoppingCart className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm font-medium">Cash Sales</p>
                <p className="text-2xl font-bold text-white">₹{summary.cashSales.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm font-medium">Digital Sales</p>
                <p className="text-2xl font-bold text-white">₹{(summary.upiSales + summary.cardSales).toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search sales..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Payment Methods</option>
              <option value="Cash">Cash</option>
              <option value="UPI">UPI</option>
              <option value="Card">Card</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>

            <select
              value={saleTypeFilter}
              onChange={(e) => setSaleTypeFilter(e.target.value)}
              className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Sale Types</option>
              <option value="standalone">Mobile Sales</option>
              <option value="trip">Trip Sales</option>
            </select>

            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Sales Table */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/20">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Product</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Customer</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Quantity</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Amount</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Payment</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Type</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredSales.map((sale) => {
                  const saleType = getSaleTypeDisplay(sale);
                  return (
                    <tr key={sale._id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-white">{sale.productId.name}</p>
                          <p className="text-sm text-gray-400">₹{sale.unitPrice} per unit</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-white">{sale.customerName || 'Walk-in Customer'}</p>
                          <p className="text-sm text-gray-400">{sale.customerPhone || 'No phone'}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">{sale.quantitySold}</td>
                      <td className="px-6 py-4 text-sm font-medium text-white">₹{sale.totalAmount}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPaymentModeColor(sale.paymentMode)}`}>
                          {sale.paymentMode}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPaymentStatusColor(sale.paymentStatus)}`}>
                          {sale.paymentStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${saleType.color}`}>
                          {saleType.text}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">
                        {new Date(sale.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {filteredSales.length === 0 && (
          <div className="text-center py-12">
            <TrendingUp className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-white mb-2">No Sales Found</h3>
            <p className="text-gray-400">
              {searchTerm ? 'No sales match your search criteria.' : 'No sales data available.'}
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Sales;