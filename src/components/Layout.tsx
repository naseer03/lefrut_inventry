import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Menu, 
  X, 
  Home, 
  Users, 
  Shield, 
  MapPin, 
  User, 
  LogOut,
  ChevronDown,
  UserCheck,
  Building,
  Briefcase,
  FileText,
  Package,
  Tag,
  Scale,
  ShoppingCart,
  Smartphone
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const { user, logout, hasPermission } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navigationItems = [
    { name: 'Dashboard', href: '/', icon: Home, module: null, action: null },
    { name: 'Staff', href: '/staff', icon: UserCheck, module: 'staff', action: 'view' },
    { name: 'Departments', href: '/departments', icon: Building, module: 'departments', action: 'view' },
    { name: 'Job Roles', href: '/job-roles', icon: Briefcase, module: 'job_roles', action: 'view' },
    { name: 'Document Types', href: '/document-types', icon: FileText, module: 'document_types', action: 'view' },
    { name: 'Products', href: '/products', icon: Package, module: 'products', action: 'view' },
    { name: 'Categories', href: '/categories', icon: Tag, module: 'categories', action: 'view' },
    { name: 'Units', href: '/units', icon: Scale, module: 'units', action: 'view' },
    { name: 'Sales', href: '/sales', icon: ShoppingCart, module: 'sales', action: 'view' },
    { name: 'Mobile Sales', href: '/mobile-sales', icon: Smartphone, module: 'sales', action: 'add' },
    { name: 'Users', href: '/users', icon: Users, module: 'users', action: 'view' },
    { name: 'States', href: '/states', icon: MapPin, module: 'states', action: 'view' },
    { name: 'Permissions', href: '/permissions', icon: Shield, module: 'permissions', action: 'view' }
  ];

  const filteredNavigation = navigationItems.filter(item => 
    !item.module || hasPermission(item.module, item.action!)
  );

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 lg:hidden bg-black bg-opacity-50"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white/10 backdrop-blur-lg border-r border-white/20
        transform transition-transform duration-300 ease-in-out lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-white/20">
          <h1 className="text-xl font-bold text-white">Fruit Business</h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-300 hover:text-white"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <nav className="mt-6 max-h-[calc(100vh-5rem)] overflow-y-auto">
          {filteredNavigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`
                  flex items-center px-6 py-3 text-sm font-medium transition-colors
                  ${isActive 
                    ? 'bg-blue-500/20 text-blue-300 border-r-2 border-blue-400' 
                    : 'text-gray-300 hover:bg-white/10 hover:text-white'
                  }
                `}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Top header */}
        <header className="bg-white/10 backdrop-blur-lg border-b border-white/20">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-300 hover:text-white"
            >
              <Menu className="h-6 w-6" />
            </button>

            <div className="flex items-center space-x-4">
              <div className="relative">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center space-x-3 text-gray-300 hover:text-white transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-white">
                      {user?.firstName.charAt(0)}{user?.lastName.charAt(0)}
                    </span>
                  </div>
                  <span className="hidden md:block text-sm font-medium">
                    {user?.firstName} {user?.lastName}
                  </span>
                  <ChevronDown className="h-4 w-4" />
                </button>

                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white/10 backdrop-blur-lg rounded-lg shadow-lg border border-white/20">
                    <Link
                      to="/profile"
                      className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white"
                      onClick={() => setProfileDropdownOpen(false)}
                    >
                      <User className="mr-3 h-4 w-4" />
                      Profile
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white"
                    >
                      <LogOut className="mr-3 h-4 w-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;