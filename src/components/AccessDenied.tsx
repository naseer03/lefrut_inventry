import React from 'react';
import { Truck, Smartphone, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

const AccessDenied: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-yellow-400" />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-white mb-4">Access Restricted</h1>
        
        <div className="space-y-4 text-gray-300 mb-6">
          <p>As a truck driver, you have limited access to the system.</p>
          <p>You can only access the Mobile Sales module for making sales on the go.</p>
        </div>
        
        <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-center gap-2 text-blue-300 mb-2">
            <Truck className="h-5 w-5" />
            <span className="font-medium">Driver Access</span>
          </div>
          <p className="text-sm text-blue-200">
            Use Mobile Sales to process transactions while on your route
          </p>
        </div>
        
        <Link
          to="/mobile-sales"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300"
        >
          <Smartphone className="h-5 w-5" />
          Go to Mobile Sales
        </Link>
      </div>
    </div>
  );
};

export default AccessDenied; 