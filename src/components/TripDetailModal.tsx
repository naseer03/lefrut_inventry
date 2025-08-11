import React, { useState, useRef } from 'react';
import { X, Printer, Download, Truck, MapPin, Calendar, Clock, Users, Package, DollarSign, Fuel, Receipt, CheckCircle } from 'lucide-react';
import api from '../services/api';

interface TripDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: any;
}

const TripDetailModal: React.FC<TripDetailModalProps> = ({ isOpen, onClose, trip }) => {
  const [isPrinting, setIsPrinting] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !trip) return null;

  const handlePrint = () => {
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

  return (
    <>
      {/* Modal Overlay */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 no-print">
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-white/20 w-full max-w-6xl max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10 no-print">
            <div>
              <h2 className="text-2xl font-bold text-white">Trip Details</h2>
              <p className="text-gray-400">Trip #{trip._id?.slice(-6).toUpperCase() || 'N/A'}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handlePrint}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-4 py-2 rounded-xl font-medium transition-all duration-300 flex items-center gap-2 no-print"
              >
                <Printer className="h-4 w-4" />
                Print
              </button>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-300 no-print"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            <div ref={printRef} className="print-content space-y-6">
              {/* Print Header - Only visible when printing */}
              <div className="print-header hidden print:block print:mb-8">
                <div className="text-center border-b-2 border-gray-300 pb-4 mb-6">
                  <h1 className="text-4xl font-bold text-gray-800 mb-2">Trip Details Report</h1>
                  <p className="text-lg text-gray-600">Fruit Business Management System</p>
                  <p className="text-sm text-gray-500 mt-2">Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</p>
                </div>
              </div>

              {/* Trip Overview */}
              <div className="bg-gradient-to-br from-white/5 to-white/10 rounded-2xl border border-white/10 p-6 print:bg-gray-50 print:border-gray-300 print:rounded-lg">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2 print:text-gray-800">
                      Trip #{trip._id?.slice(-6).toUpperCase() || 'N/A'}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-300 print:text-gray-600">
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4" />
                        <span>{trip.truckId?.vehicleNumber || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{trip.routeId?.name || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(trip.tripDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className={`px-4 py-2 rounded-xl border ${getStatusColor(trip.status)} flex items-center gap-2 print:bg-gray-200 print:text-gray-800 print:border-gray-400`}>
                    {getStatusIcon(trip.status)}
                    <span className="font-medium">{getStatusText(trip.status)}</span>
                  </div>
                </div>

                {/* Trip Information Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white/5 rounded-xl p-4 print:bg-gray-100 print:border print:border-gray-300 print:rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <Clock className="h-5 w-5 text-blue-400 print:text-gray-600" />
                      <h4 className="font-semibold text-white print:text-gray-800">Trip Time</h4>
                    </div>
                    <div className="space-y-1 text-sm text-gray-300 print:text-gray-600">
                      <p><span className="text-blue-400 print:text-gray-700 font-medium">Start:</span> {trip.startTime}</p>
                      <p><span className="text-blue-400 print:text-gray-700 font-medium">Location:</span> {trip.startLocation}</p>
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-xl p-4 print:bg-gray-100 print:border print:border-gray-300 print:rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <Users className="h-5 w-5 text-green-400 print:text-gray-600" />
                      <h4 className="font-semibold text-white print:text-gray-800">Staff</h4>
                    </div>
                    <div className="space-y-1 text-sm text-gray-300 print:text-gray-600">
                      <p><span className="text-green-400 print:text-gray-700 font-medium">Driver:</span> {trip.driverId?.fullName || 'N/A'}</p>
                      {trip.salespersonId && (
                        <p><span className="text-green-400 print:text-gray-700 font-medium">Sales:</span> {trip.salespersonId.fullName}</p>
                      )}
                      {trip.helperId && (
                        <p><span className="text-green-400 print:text-gray-700 font-medium">Helper:</span> {trip.helperId.fullName}</p>
                      )}
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-xl p-4 print:bg-gray-100 print:border print:border-gray-300 print:rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <Package className="h-5 w-5 text-purple-400 print:text-gray-600" />
                      <h4 className="font-semibold text-white print:text-gray-800">Items</h4>
                    </div>
                    <div className="space-y-1 text-sm text-gray-300 print:text-gray-600">
                      <p><span className="text-purple-400 print:text-gray-700 font-medium">Total Items:</span> {trip.totalItems}</p>
                      <p><span className="text-purple-400 print:text-gray-700 font-medium">Products:</span> {trip.dispatchItems?.length || 0}</p>
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-xl p-4 print:bg-gray-100 print:border print:border-gray-300 print:rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <DollarSign className="h-5 w-5 text-yellow-400 print:text-gray-600" />
                      <h4 className="font-semibold text-white print:text-gray-800">Value</h4>
                    </div>
                    <div className="space-y-1 text-sm text-gray-300 print:text-gray-600">
                      <p><span className="text-yellow-400 print:text-gray-700 font-medium">Total Value:</span> ₹{trip.totalValue?.toLocaleString() || '0'}</p>
                      <p><span className="text-yellow-400 print:text-gray-700 font-medium">Fuel Added:</span> {trip.fuelAdded || 0}L</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dispatch Items */}
              {trip.dispatchItems && trip.dispatchItems.length > 0 && (
                <div className="bg-gradient-to-br from-white/5 to-white/10 rounded-2xl border border-white/10 p-6 print:bg-gray-50 print:border-gray-300 print:rounded-lg">
                  <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2 print:text-gray-800">
                    <Package className="h-5 w-5" />
                    Dispatch Items
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm print:border-collapse">
                      <thead>
                        <tr className="border-b border-white/10 print:border-b-2 print:border-gray-400">
                          <th className="text-left py-3 px-4 text-gray-300 font-medium print:text-gray-800 print:bg-gray-200">Item</th>
                          <th className="text-right py-3 px-4 text-gray-300 font-medium print:text-gray-800 print:bg-gray-200">Quantity</th>
                          <th className="text-right py-3 px-4 text-gray-300 font-medium print:text-gray-800 print:bg-gray-200">Cost Price</th>
                          <th className="text-right py-3 px-4 text-gray-300 font-medium print:text-gray-800 print:bg-gray-200">Total Cost</th>
                        </tr>
                      </thead>
                      <tbody>
                        {trip.dispatchItems.map((item: any, index: number) => (
                          <tr key={index} className="border-b border-white/5 print:border-b print:border-gray-300">
                            <td className="py-3 px-4 text-white print:text-gray-800">{item.itemName}</td>
                            <td className="py-3 px-4 text-right text-gray-300 print:text-gray-600">{item.quantity}</td>
                            <td className="py-3 px-4 text-right text-gray-300 print:text-gray-600">₹{item.costPrice}</td>
                            <td className="py-3 px-4 text-right text-white font-medium print:text-gray-800">₹{item.totalCost}</td>
                          </tr>
                        ))}
                        <tr className="bg-white/5 print:bg-gray-100 print:border-t-2 print:border-gray-400">
                          <td colSpan={3} className="py-3 px-4 text-right text-gray-300 font-medium print:text-gray-800">
                            Total Value:
                          </td>
                          <td className="py-3 px-4 text-right text-white font-bold print:text-gray-800">
                            ₹{trip.totalValue?.toLocaleString() || '0'}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Trip Notes */}
              {trip.tripNotes && (
                <div className="bg-gradient-to-br from-white/5 to-white/10 rounded-2xl border border-white/10 p-6 print:bg-gray-50 print:border-gray-300 print:rounded-lg">
                  <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2 print:text-gray-800">
                    <Receipt className="h-5 w-5" />
                    Trip Notes
                  </h3>
                  <p className="text-gray-300 whitespace-pre-wrap print:text-gray-600 print:bg-white print:p-4 print:rounded print:border print:border-gray-300">{trip.tripNotes}</p>
                </div>
              )}

              {/* Signature Section */}
              <div className="bg-gradient-to-br from-white/5 to-white/10 rounded-2xl border border-white/10 p-6 print:bg-gray-50 print:border-gray-300 print:rounded-lg print:mt-8">
                <h3 className="text-xl font-semibold text-white mb-6 text-center print:text-gray-800">Authorization</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Driver Signature */}
                  <div className="space-y-4">
                    <div className="text-center">
                      <h4 className="font-semibold text-white mb-2 print:text-gray-800">Truck Driver</h4>
                      <p className="text-sm text-gray-400 mb-4 print:text-gray-600">{trip.driverId?.fullName || 'Driver Name'}</p>
                    </div>
                    <div className="border-2 border-dashed border-gray-400 rounded-lg h-32 flex items-center justify-center print:border-gray-600 print:h-24">
                      <div className="text-center text-gray-400 print:text-gray-600">
                        <div className="text-xs mb-2">Driver Signature</div>
                        <div className="text-xs">Date: {new Date().toLocaleDateString()}</div>
                      </div>
                    </div>
                  </div>

                  {/* Warehouse Manager Signature */}
                  <div className="space-y-4">
                    <div className="text-center">
                      <h4 className="font-semibold text-white mb-2 print:text-gray-800">Warehouse Manager</h4>
                      <p className="text-sm text-gray-400 mb-4 print:text-gray-600">Manager Name</p>
                    </div>
                    <div className="border-2 border-dashed border-gray-400 rounded-lg h-32 flex items-center justify-center print:border-gray-600 print:h-24">
                      <div className="text-center text-gray-400 print:text-gray-600">
                        <div className="text-xs mb-2">Manager Signature</div>
                        <div className="text-xs">Date: {new Date().toLocaleDateString()}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Trip Summary */}
                <div className="mt-8 p-4 bg-white/5 rounded-xl print:bg-gray-100 print:border print:border-gray-300">
                  <h4 className="font-semibold text-white mb-3 print:text-gray-800">Trip Summary</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400 print:text-gray-600">Trip ID:</span>
                      <p className="text-white font-medium print:text-gray-800">#{trip._id?.slice(-6).toUpperCase() || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 print:text-gray-600">Vehicle:</span>
                      <p className="text-white font-medium print:text-gray-800">{trip.truckId?.vehicleNumber || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 print:text-gray-600">Route:</span>
                      <p className="text-white font-medium print:text-gray-800">{trip.routeId?.name || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 print:text-gray-600">Status:</span>
                      <p className="text-white font-medium print:text-gray-800">{getStatusText(trip.status)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Print Footer */}
              <div className="print-footer hidden print:block print:mt-8 print:pt-4 print:border-t-2 print:border-gray-300">
                <div className="text-center text-sm text-gray-500">
                  <p>This document was generated by the Fruit Business Management System</p>
                  <p>Page 1 of 1 | Trip #{trip._id?.slice(-6).toUpperCase() || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TripDetailModal; 