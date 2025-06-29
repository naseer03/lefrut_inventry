import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
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
  Smartphone,
  Truck,
  Navigation,
  BarChart3
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
  const { user, logout, hasPermission } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Close dropdown on route change
  useEffect(() => {
    setProfileDropdownOpen(false);
  }, [location.pathname]);

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
    { name: 'Trucks', href: '/trucks', icon: Truck, module: 'trucks', action: 'view' },
    { name: 'Routes', href: '/routes', icon: Navigation, module: 'routes', action: 'view' },
    { name: 'Reports', href: '/reports', icon: BarChart3, module: 'sales', action: 'view' },
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

  const toggleProfileDropdown = () => {
    if (!profileDropdownOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 8,
        right: window.innerWidth - rect.right + window.scrollX
      });
    }
    setProfileDropdownOpen(!profileDropdownOpen);
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
        <header className="bg-white/10 backdrop-blur-lg border-b border-white/20 relative">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-300 hover:text-white"
            >
              <Menu className="h-6 w-6" />
            </button>

            <div className="flex items-center space-x-4">
              {/* Profile Dropdown Button */}
              <div className="relative">
                <button
                  ref={buttonRef}
                  onClick={toggleProfileDropdown}
                  className="flex items-center space-x-3 text-gray-300 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 rounded-lg px-2 py-1"
                  aria-expanded={profileDropdownOpen}
                  aria-haspopup="true"
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-white">
                      {user?.firstName.charAt(0)}{user?.lastName.charAt(0)}
                    </span>
                  </div>
                  <span className="hidden md:block text-sm font-medium">
                    {user?.firstName} {user?.lastName}
                  </span>
                  <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${
                    profileDropdownOpen ? 'rotate-180' : ''
                  }`} />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6">
          {children}
        </main>
      </div>

      {/* Portal Dropdown - Renders at document root to avoid z-index issues */}
      {profileDropdownOpen && createPortal(
        <>
          {/* Invisible overlay to capture outside clicks */}
          <div 
            className="fixed inset-0 z-[9998]"
            onClick={() => setProfileDropdownOpen(false)}
          />
          
          {/* Dropdown Menu rendered at document root */}
          <div 
            ref={dropdownRef}
            className="fixed w-56 bg-white/10 backdrop-blur-lg rounded-xl shadow-xl border border-white/20 animate-in fade-in-0 zoom-in-95 duration-200"
            style={{ 
              zIndex: 9999,
              top: dropdownPosition.top,
              right: dropdownPosition.right
            }}
          >
            {/* User Info Section */}
            <div className="px-4 py-3 border-b border-white/10">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {user?.firstName.charAt(0)}{user?.lastName.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-white">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-gray-400">
                    {user?.email}
                  </p>
                  <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full mt-1 ${
                    user?.role === 'admin' 
                      ? 'bg-purple-500/20 text-purple-300' 
                      : 'bg-blue-500/20 text-blue-300'
                  }`}>
                    {user?.role}
                  </span>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-2">
              <Link
                to="/profile"
                className="flex items-center px-4 py-3 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors duration-150"
                onClick={() => setProfileDropdownOpen(false)}
              >
                <User className="mr-3 h-4 w-4" />
                <span>My Profile</span>
              </Link>
              
              <button
                onClick={() => {
                  setProfileDropdownOpen(false);
                  handleLogout();
                }}
                className="flex items-center w-full px-4 py-3 text-sm text-gray-300 hover:bg-red-500/10 hover:text-red-300 transition-colors duration-150"
              >
                <LogOut className="mr-3 h-4 w-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
};

export default Layout;