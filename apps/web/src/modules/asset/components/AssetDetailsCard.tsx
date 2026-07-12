import React from 'react';
import { Asset } from '../types';

interface AssetDetailsCardProps {
  asset: Asset;
}

export function AssetDetailsCard({ asset }: AssetDetailsCardProps) {
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-200">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center space-x-6">
          <div className="flex-shrink-0">
            {/* Placeholder for QR Code */}
            <div className="w-32 h-32 bg-gray-100 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300">
              <span className="text-xs text-gray-500 mb-1">QR CODE</span>
              <span className="font-mono text-xs font-bold">{asset.assetTag}</span>
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900">{asset.name}</h3>
            <p className="text-sm font-medium text-gray-500 mt-1">{asset.category?.name}</p>
            
            <dl className="mt-4 grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Asset Tag</dt>
                <dd className="mt-1 text-sm text-gray-900 font-mono font-bold">{asset.assetTag}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    asset.status === 'AVAILABLE' ? 'bg-green-100 text-green-800' :
                    asset.status === 'ALLOCATED' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {asset.status}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Condition</dt>
                <dd className="mt-1 text-sm text-gray-900">{asset.condition}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Serial Number</dt>
                <dd className="mt-1 text-sm text-gray-900">{asset.serialNumber || 'N/A'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Location</dt>
                <dd className="mt-1 text-sm text-gray-900">{asset.location || 'N/A'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Acquisition Cost</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {asset.acquisitionCost ? `$${asset.acquisitionCost}` : 'N/A'}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
