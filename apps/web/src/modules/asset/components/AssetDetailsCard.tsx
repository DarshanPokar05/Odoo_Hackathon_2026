import React, { useState } from 'react';
import { Asset } from '../types';
import { QrCode, FileText, Image as ImageIcon, Briefcase, Calendar, DollarSign, MapPin, Tag, ShieldAlert } from 'lucide-react';

interface AssetDetailsCardProps {
  asset: Asset;
}

export function AssetDetailsCard({ asset }: AssetDetailsCardProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'qr' | 'media' | 'docs'>('details');

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
    window.location.origin + '/assets/' + asset.id
  )}`;

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Tabs Header */}
      <div className="flex border-b border-gray-100 bg-gray-50/50">
        <button
          onClick={() => setActiveTab('details')}
          className={`flex-1 sm:flex-none flex items-center justify-center space-x-2 py-4 px-6 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'details'
              ? 'border-blue-600 text-blue-600 bg-white shadow-sm'
              : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-100/50'
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>Details</span>
        </button>
        <button
          onClick={() => setActiveTab('qr')}
          className={`flex-1 sm:flex-none flex items-center justify-center space-x-2 py-4 px-6 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'qr'
              ? 'border-blue-600 text-blue-600 bg-white shadow-sm'
              : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-100/50'
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span>QR View</span>
        </button>
        <button
          onClick={() => setActiveTab('media')}
          className={`flex-1 sm:flex-none flex items-center justify-center space-x-2 py-4 px-6 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'media'
              ? 'border-blue-600 text-blue-600 bg-white shadow-sm'
              : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-100/50'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span>Photos ({asset.images?.length || 0})</span>
        </button>
        <button
          onClick={() => setActiveTab('docs')}
          className={`flex-1 sm:flex-none flex items-center justify-center space-x-2 py-4 px-6 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'docs'
              ? 'border-blue-600 text-blue-600 bg-white shadow-sm'
              : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-100/50'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Docs ({asset.documents?.length || 0})</span>
        </button>
      </div>

      {/* Tab Contents */}
      <div className="p-8">
        {activeTab === 'details' && (
          <div className="space-y-8">
            {/* Header info */}
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-2xl font-bold text-gray-900">{asset.name}</h3>
                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                  asset.status === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-800' :
                  asset.status === 'ALLOCATED' ? 'bg-blue-100 text-blue-800' :
                  asset.status === 'RESERVED' ? 'bg-purple-100 text-purple-800' :
                  asset.status === 'UNDER_MAINTENANCE' ? 'bg-amber-100 text-amber-800' :
                  'bg-rose-100 text-rose-800'
                }`}>
                  {asset.status.replace('_', ' ')}
                </span>
                <span className={`px-2 py-0.5 text-xs font-medium rounded border ${
                  asset.condition === 'NEW' ? 'bg-teal-50 text-teal-700 border-teal-200' :
                  asset.condition === 'GOOD' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                  asset.condition === 'FAIR' ? 'bg-gray-50 text-gray-700 border-gray-200' :
                  asset.condition === 'POOR' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                  'bg-red-50 text-red-700 border-red-200'
                }`}>
                  Condition: {asset.condition}
                </span>
              </div>
              <p className="text-sm font-semibold text-gray-500 mt-2">
                Category: <span className="text-gray-800">{asset.category?.name || '-'}</span>
              </p>
            </div>

            {/* General Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-gray-100 pt-6">
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Identifiers & Specs</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="block text-xs font-semibold text-gray-400">Asset Tag</span>
                    <span className="font-mono font-bold text-sm text-gray-900">{asset.assetTag}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-gray-400">Serial Number</span>
                    <span className="text-sm font-medium text-gray-900">{asset.serialNumber || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-gray-400">Manufacturer</span>
                    <span className="text-sm font-medium text-gray-900">{asset.manufacturer || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-gray-400">Model</span>
                    <span className="text-sm font-medium text-gray-900">{asset.model || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Location & Booking</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="block text-xs font-semibold text-gray-400">Location</span>
                    <span className="text-sm font-medium text-gray-900 flex items-center mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-gray-400 mr-1" />
                      {asset.location || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-gray-400">Bookable By Employees</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded inline-block mt-0.5 ${
                      asset.isBookable ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-50 text-gray-600 border border-gray-200'
                    }`}>
                      {asset.isBookable ? 'YES' : 'NO'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Financial Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border-t border-gray-100 pt-6">
              <div className="bg-gray-50/50 p-4 rounded-lg border border-gray-100 flex items-center space-x-3">
                <DollarSign className="w-8 h-8 text-blue-500" />
                <div>
                  <span className="block text-xs font-semibold text-gray-400">Procurement Cost</span>
                  <span className="text-lg font-bold text-gray-900">
                    {asset.acquisitionCost ? `$${Number(asset.acquisitionCost).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : 'N/A'}
                  </span>
                </div>
              </div>
              <div className="bg-gray-50/50 p-4 rounded-lg border border-gray-100 flex items-center space-x-3">
                <Briefcase className="w-8 h-8 text-indigo-500" />
                <div>
                  <span className="block text-xs font-semibold text-gray-400">Estimated Current Value</span>
                  <span className="text-lg font-bold text-gray-900">
                    {asset.currentValue ? `$${Number(asset.currentValue).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : 'N/A'}
                  </span>
                </div>
              </div>
              <div className="bg-gray-50/50 p-4 rounded-lg border border-gray-100 flex items-center space-x-3">
                <Calendar className="w-8 h-8 text-emerald-500" />
                <div>
                  <span className="block text-xs font-semibold text-gray-400">Acquisition Date</span>
                  <span className="text-sm font-semibold text-gray-950">
                    {asset.acquisitionDate ? new Date(asset.acquisitionDate).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'qr' && (
          <div className="flex flex-col items-center justify-center space-y-4 py-6 text-center">
            <div className="p-4 bg-white border border-gray-200 rounded-xl shadow-inner">
              <img src={qrUrl} alt="Asset QR Code" className="w-48 h-48" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800">Scan QR Code</p>
              <p className="text-xs text-gray-500 max-w-xs mt-1">
                Scanning this QR code on a mobile device redirects directly to this asset's dashboard profile.
              </p>
            </div>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              Print Tag Label
            </button>
          </div>
        )}

        {activeTab === 'media' && (
          <div>
            {!asset.images || asset.images.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center bg-gray-50 border border-dashed rounded-lg p-6">
                <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
                <h3 className="font-semibold text-gray-700 text-sm">No photos attached</h3>
                <p className="text-xs text-gray-500 max-w-xs mt-1">No images have been linked to this asset record.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {asset.images.map((img) => (
                  <a
                    key={img.id}
                    href={img.imageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="group relative aspect-video rounded-lg overflow-hidden border border-gray-200 bg-gray-50 hover:shadow-md transition-all"
                  >
                    <img src={img.imageUrl} alt="Asset photo" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'docs' && (
          <div>
            {!asset.documents || asset.documents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center bg-gray-50 border border-dashed rounded-lg p-6">
                <FileText className="w-8 h-8 text-gray-400 mb-2" />
                <h3 className="font-semibold text-gray-700 text-sm">No documents attached</h3>
                <p className="text-xs text-gray-500 max-w-xs mt-1">No manuals, invoices, or guides are linked to this asset.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden">
                {asset.documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-5 h-5 text-gray-400" />
                      <div>
                        <span className="font-semibold text-gray-800 text-sm block">{doc.documentName}</span>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded uppercase font-medium mt-0.5 inline-block">
                          {doc.documentType}
                        </span>
                      </div>
                    </div>
                    <a
                      href={doc.documentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      View File &rarr;
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
