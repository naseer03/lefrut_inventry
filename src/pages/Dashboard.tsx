import React, { useEffect, useState } from 'react';
import { Users, Shield, MapPin, TrendingUp } from 'lucide-react';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

interface Stats {
  totalUsers: number;
  totalStates: number;
  activeUsers: number;
}

const Dashboard: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const [stats, setStats] = useState<Stats>({ totalUsers: 0, totalStates: 0, activeUsers: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const promises = [];
      
      if (hasPermission('users', 'view')) {
        promises.push(api.get('/users'));
      }
      
      if (hasPermission('states', 'view')) {
        promises.push(api.get('/states'));
      }

      const results = await Promise.allSettled(promises);
      
      let totalUsers = 0;
      let totalStates = 0;
      let activeUsers = 0;

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          if (index === 0 && hasPermission('users', 'view')) {
            totalUsers = result.value.data.length;
            activeUsers = result.value.data.filter((user: any) => user.isActive).length;
          } else if ((index === 1 && hasPermission('users', 'view')) || (index === 0 && !hasPermission('users', 'view'))) {
            totalStates = result.value.data.length;
          }
        }
      });

      setStats({ totalUsers, totalStates, activeUsers });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      name: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      show: hasPermission('users', 'view')
    },
    {
      name: 'Active Users',
      value: stats.activeUsers,
      icon: TrendingUp,
      color: 'from-green-500 to-green-600',
      show: hasPermission('users', 'view')
    },
    {
      name: 'Total States',
      value: stats.totalStates,
      icon: MapPin,
      color: 'from-purple-500 to-purple-600',
      show: hasPermission('states', 'view')
    },
    {
      name: 'Permissions',
      value: user?.role === 'admin' ? 'Full Access' : 'Limited',
      icon: Shield,
      color: 'from-orange-500 to-orange-600',
      show: true
    }
  ].filter(card => card.show);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6">
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome back, {user?.firstName}!
          </h1>
          <p className="text-gray-300">
            Here's what's happening with your system today.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat) => (
            <div
              key={stat.name}
              className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6 hover:bg-white/15 transition-all duration-300"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-300 text-sm font-medium">{stat.name}</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {loading ? '...' : stat.value}
                  </p>
                </div>
                <div className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-lg flex items-center justify-center`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6">
          <h2 className="text-xl font-bold text-white mb-4">System Information</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-white/10">
              <span className="text-gray-300">Your Role</span>
              <span className="text-white font-medium capitalize">{user?.role}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-white/10">
              <span className="text-gray-300">Account Status</span>
              <span className="text-green-400 font-medium">Active</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-gray-300">Last Login</span>
              <span className="text-white font-medium">
                {new Date().toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;