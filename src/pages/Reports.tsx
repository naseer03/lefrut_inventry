import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, 
  Download, 
  Calendar, 
  User, 
  Package, 
  TrendingUp, 
  DollarSign, 
  Printer,
  Search,
  Filter,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

interface ReportData {
  sales: {
    totalSales: number;
    totalQuantity: number;
    totalTransactions: number;
    cashSales: number;
    upiSales: number;
    cardSales: number;
    profit: number;
    profitMargin: number;
  };
  products: Array<{
    _id: string;
    name: string;
    totalSold: number;
    totalRevenue: number;
    totalProfit: number;
    avgPrice: number;
  }>;
  users: Array<{
    _id: string;
    fullName: string;
    totalSales: number;
    totalTransactions: number;
    avgTransactionValue: number;
  }>;
  timeline: Array<{
    _id: string;
    date: string;
    totalSales: number;
    totalTransactions: number;
    totalQuantity: number;
  }>;
  categories: Array<{
    _id: string;
    name: string;
    totalSales: number;
    totalQuantity: number;
    productCount: number;
  }>;
  expenses: {
    totalExpenses: number;
    fuelCosts: number;
    operationalCosts: number;
    breakdown: Array<{
      type: string;
      amount: number;
    }>;
  };
}

const Reports: React.FC = () => {
  const { hasPermission } = useAuth();
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState('sales');
  const [timeframe, setTimeframe] = useState('monthly');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [selectedUser, setSelectedUser] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [users, setUsers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchSupportingData();
    generateReport();
  }, []);

  useEffect(() => {
    generateReport();
  }, [reportType, timeframe, dateRange, selectedUser, selectedProduct, selectedCategory]);

  const fetchSupportingData = async () => {
    try {
      const [usersRes, productsRes, categoriesRes] = await Promise.all([
        api.get('/staff'),
        api.get('/products'),
        api.get('/categories')
      ]);
      setUsers(usersRes.data);
      setProducts(productsRes.data);
      setCategories(categoriesRes.data);
    } catch (error) {
      console.error('Failed to fetch supporting data:', error);
    }
  };

  const generateReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        reportType,
        timeframe,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        userId: selectedUser,
        productId: selectedProduct,
        categoryId: selectedCategory
      });

      const response = await api.get(`/reports/generate?${params}`);
      setReportData(response.data);
    } catch (error) {
      toast.error('Failed to generate report');
      console.error('Report generation error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Business Report - ${reportType.toUpperCase()}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 20px; 
              color: #333;
              line-height: 1.6;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #333;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .report-title {
              font-size: 24px;
              font-weight: bold;
              margin-bottom: 10px;
            }
            .report-meta {
              font-size: 14px;
              color: #666;
            }
            .section {
              margin-bottom: 30px;
            }
            .section-title {
              font-size: 18px;
              font-weight: bold;
              margin-bottom: 15px;
              border-bottom: 1px solid #ddd;
              padding-bottom: 5px;
            }
            .stats-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
              gap: 20px;
              margin-bottom: 20px;
            }
            .stat-item {
              border: 1px solid #ddd;
              padding: 15px;
              border-radius: 5px;
            }
            .stat-label {
              font-size: 12px;
              color: #666;
              text-transform: uppercase;
            }
            .stat-value {
              font-size: 20px;
              font-weight: bold;
              color: #333;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 15px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 8px 12px;
              text-align: left;
            }
            th {
              background-color: #f5f5f5;
              font-weight: bold;
            }
            tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            .footer {
              margin-top: 40px;
              text-align: center;
              font-size: 12px;
              color: #666;
              border-top: 1px solid #ddd;
              padding-top: 20px;
            }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="report-title">Fruit Business Management System</div>
            <div class="report-title">${reportType.toUpperCase()} REPORT</div>
            <div class="report-meta">
              Period: ${dateRange.startDate} to ${dateRange.endDate}<br>
              Generated on: ${new Date().toLocaleString()}
            </div>
          </div>
          ${printContent.innerHTML}
          <div class="footer">
            This report was generated automatically by the Fruit Business Management System
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const exportToCSV = () => {
    if (!reportData) return;

    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Add header
    csvContent += `Business Report - ${reportType.toUpperCase()}\n`;
    csvContent += `Period: ${dateRange.startDate} to ${dateRange.endDate}\n`;
    csvContent += `Generated: ${new Date().toLocaleString()}\n\n`;

    // Add sales summary
    if (reportData.sales) {
      csvContent += "SALES SUMMARY\n";
      csvContent += "Metric,Value\n";
      csvContent += `Total Sales,₹${reportData.sales.totalSales.toLocaleString()}\n`;
      csvContent += `Total Transactions,${reportData.sales.totalTransactions}\n`;
      csvContent += `Total Quantity,${reportData.sales.totalQuantity}\n`;
      csvContent += `Cash Sales,₹${reportData.sales.cashSales.toLocaleString()}\n`;
      csvContent += `UPI Sales,₹${reportData.sales.upiSales.toLocaleString()}\n`;
      csvContent += `Card Sales,₹${reportData.sales.cardSales.toLocaleString()}\n`;
      csvContent += `Profit,₹${reportData.sales.profit.toLocaleString()}\n`;
      csvContent += `Profit Margin,${reportData.sales.profitMargin.toFixed(2)}%\n\n`;
    }

    // Add product details
    if (reportData.products?.length > 0) {
      csvContent += "PRODUCT PERFORMANCE\n";
      csvContent += "Product Name,Total Sold,Revenue,Profit,Avg Price\n";
      reportData.products.forEach(product => {
        csvContent += `"${product.name}",${product.totalSold},₹${product.totalRevenue.toLocaleString()},₹${product.totalProfit.toLocaleString()},₹${product.avgPrice.toFixed(2)}\n`;
      });
      csvContent += "\n";
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `business_report_${reportType}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getQuickTimeframe = (period: string) => {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        return;
    }

    setDateRange({
      startDate: startDate.toISOString().split('T')[0],
      endDate: now.toISOString().split('T')[0]
    });
  };

  if (!hasPermission('sales', 'view')) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-white mb-2">Access Denied</h3>
            <p className="text-gray-400">You don't have permission to view reports.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Business Reports</h1>
            <p className="text-gray-300 mt-1">Comprehensive analytics and reporting dashboard</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2"
            >
              <Printer className="h-4 w-4" />
              Print
            </button>
            <button
              onClick={exportToCSV}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">Report Type</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="sales">Sales Report</option>
                <option value="products">Product Performance</option>
                <option value="users">Staff Performance</option>
                <option value="categories">Category Analysis</option>
                <option value="income">Income Statement</option>
                <option value="comprehensive">Comprehensive Report</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">Timeframe</label>
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">Start Date</label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">End Date</label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="text-sm text-gray-300 mr-2">Quick filters:</span>
            {['today', 'week', 'month', 'quarter', 'year'].map((period) => (
              <button
                key={period}
                onClick={() => getQuickTimeframe(period)}
                className="px-3 py-1 text-xs bg-white/10 hover:bg-white/20 text-white rounded-md transition-colors"
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
          </div>

          {/* Additional Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">Filter by Staff</label>
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Staff</option>
                {users.map((user) => (
                  <option key={user._id} value={user._id}>
                    {user.fullName} ({user.employeeId})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">Filter by Product</label>
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Products</option>
                {products.map((product) => (
                  <option key={product._id} value={product._id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">Filter by Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Categories</option>
                {categories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Report Content */}
        <div ref={printRef} className="space-y-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : reportData ? (
            <>
              {/* Sales Summary */}
              {reportData.sales && (
                <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6">
                  <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Sales Overview
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <div className="text-sm text-gray-400 mb-1">Total Sales</div>
                      <div className="text-2xl font-bold text-white">₹{reportData.sales.totalSales.toLocaleString()}</div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <div className="text-sm text-gray-400 mb-1">Total Transactions</div>
                      <div className="text-2xl font-bold text-white">{reportData.sales.totalTransactions}</div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <div className="text-sm text-gray-400 mb-1">Items Sold</div>
                      <div className="text-2xl font-bold text-white">{reportData.sales.totalQuantity}</div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <div className="text-sm text-gray-400 mb-1">Total Profit</div>
                      <div className="text-2xl font-bold text-green-400">₹{reportData.sales.profit.toLocaleString()}</div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <div className="text-sm text-gray-400 mb-1">Cash Sales</div>
                      <div className="text-2xl font-bold text-white">₹{reportData.sales.cashSales.toLocaleString()}</div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <div className="text-sm text-gray-400 mb-1">Digital Sales</div>
                      <div className="text-2xl font-bold text-white">₹{(reportData.sales.upiSales + reportData.sales.cardSales).toLocaleString()}</div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <div className="text-sm text-gray-400 mb-1">Profit Margin</div>
                      <div className="text-2xl font-bold text-blue-400">{reportData.sales.profitMargin.toFixed(2)}%</div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <div className="text-sm text-gray-400 mb-1">Avg Transaction</div>
                      <div className="text-2xl font-bold text-white">₹{(reportData.sales.totalSales / reportData.sales.totalTransactions).toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Product Performance */}
              {reportData.products && reportData.products.length > 0 && (
                <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6">
                  <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Top Performing Products
                  </h2>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/20">
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Product Name</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Units Sold</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Revenue</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Profit</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Avg Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.products.slice(0, 10).map((product, index) => (
                          <tr key={product._id} className="border-b border-white/10 hover:bg-white/5">
                            <td className="py-3 px-4 text-white font-medium">{product.name}</td>
                            <td className="py-3 px-4 text-gray-300">{product.totalSold}</td>
                            <td className="py-3 px-4 text-green-400 font-medium">₹{product.totalRevenue.toLocaleString()}</td>
                            <td className="py-3 px-4 text-blue-400 font-medium">₹{product.totalProfit.toLocaleString()}</td>
                            <td className="py-3 px-4 text-gray-300">₹{product.avgPrice.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Staff Performance */}
              {reportData.users && reportData.users.length > 0 && (
                <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6">
                  <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Staff Performance
                  </h2>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/20">
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Staff Member</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Total Sales</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Transactions</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Avg Transaction Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.users.map((user, index) => (
                          <tr key={user._id} className="border-b border-white/10 hover:bg-white/5">
                            <td className="py-3 px-4 text-white font-medium">{user.fullName}</td>
                            <td className="py-3 px-4 text-green-400 font-medium">₹{user.totalSales.toLocaleString()}</td>
                            <td className="py-3 px-4 text-gray-300">{user.totalTransactions}</td>
                            <td className="py-3 px-4 text-gray-300">₹{user.avgTransactionValue.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Category Analysis */}
              {reportData.categories && reportData.categories.length > 0 && (
                <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6">
                  <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Category Performance
                  </h2>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/20">
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Category</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Revenue</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Units Sold</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Products</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.categories.map((category, index) => (
                          <tr key={category._id} className="border-b border-white/10 hover:bg-white/5">
                            <td className="py-3 px-4 text-white font-medium">{category.name}</td>
                            <td className="py-3 px-4 text-green-400 font-medium">₹{category.totalSales.toLocaleString()}</td>
                            <td className="py-3 px-4 text-gray-300">{category.totalQuantity}</td>
                            <td className="py-3 px-4 text-gray-300">{category.productCount}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Timeline Analysis */}
              {reportData.timeline && reportData.timeline.length > 0 && (
                <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6">
                  <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Sales Timeline
                  </h2>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/20">
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Date</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Sales</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Transactions</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Items Sold</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.timeline.slice(-10).map((item, index) => (
                          <tr key={item._id} className="border-b border-white/10 hover:bg-white/5">
                            <td className="py-3 px-4 text-white font-medium">{new Date(item.date).toLocaleDateString()}</td>
                            <td className="py-3 px-4 text-green-400 font-medium">₹{item.totalSales.toLocaleString()}</td>
                            <td className="py-3 px-4 text-gray-300">{item.totalTransactions}</td>
                            <td className="py-3 px-4 text-gray-300">{item.totalQuantity}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Expenses */}
              {reportData.expenses && (
                <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6">
                  <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Expense Summary
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <div className="text-sm text-gray-400 mb-1">Total Expenses</div>
                      <div className="text-2xl font-bold text-red-400">₹{reportData.expenses.totalExpenses.toLocaleString()}</div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <div className="text-sm text-gray-400 mb-1">Fuel Costs</div>
                      <div className="text-2xl font-bold text-orange-400">₹{reportData.expenses.fuelCosts.toLocaleString()}</div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <div className="text-sm text-gray-400 mb-1">Operational Costs</div>
                      <div className="text-2xl font-bold text-yellow-400">₹{reportData.expenses.operationalCosts.toLocaleString()}</div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <div className="text-sm text-gray-400 mb-1">Net Profit</div>
                      <div className="text-2xl font-bold text-green-400">₹{(reportData.sales?.profit || 0 - reportData.expenses.totalExpenses).toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Print-only content with proper styling */}
              <style jsx>{`
                @media print {
                  body * {
                    visibility: hidden;
                  }
                  .print-content, .print-content * {
                    visibility: visible;
                  }
                  .print-content {
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 100%;
                  }
                  .section {
                    margin-bottom: 30px;
                    page-break-inside: avoid;
                  }
                  .section-title {
                    font-size: 18px;
                    font-weight: bold;
                    margin-bottom: 15px;
                    border-bottom: 1px solid #ddd;
                    padding-bottom: 5px;
                    color: #333;
                  }
                  .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 20px;
                    margin-bottom: 20px;
                  }
                  .stat-item {
                    border: 1px solid #ddd;
                    padding: 15px;
                    border-radius: 5px;
                    background: white;
                  }
                  .stat-label {
                    font-size: 12px;
                    color: #666;
                    text-transform: uppercase;
                    margin-bottom: 5px;
                  }
                  .stat-value {
                    font-size: 20px;
                    font-weight: bold;
                    color: #333;
                  }
                  table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 15px;
                    background: white;
                  }
                  th, td {
                    border: 1px solid #ddd;
                    padding: 8px 12px;
                    text-align: left;
                    color: #333;
                  }
                  th {
                    background-color: #f5f5f5;
                    font-weight: bold;
                  }
                  tr:nth-child(even) {
                    background-color: #f9f9f9;
                  }
                }
              `}</style>
            </>
          ) : (
            <div className="text-center py-12">
              <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-white mb-2">No Data Available</h3>
              <p className="text-gray-400">No data found for the selected criteria. Try adjusting your filters.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Reports;