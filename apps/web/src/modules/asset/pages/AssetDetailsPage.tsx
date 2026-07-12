import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAsset, useAssetTimeline } from '../api';
import { AssetDetailsCard } from '../components/AssetDetailsCard';
import { AssetTimeline } from '../components/AssetTimeline';
import { Edit2, ArrowLeft, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';

export function AssetDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const user = useAuthStore((state) => state.user);
  const isManager = user?.role === 'ADMIN' || user?.role === 'ASSET_MANAGER';
  
  const { data: asset, isLoading: isLoadingAsset } = useAsset(id!);
  const { data: timeline, isLoading: isLoadingTimeline } = useAssetTimeline(id!);

  if (isLoadingAsset || isLoadingTimeline) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-lg border border-gray-100 shadow-sm">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-3" />
        <span className="text-sm font-semibold text-gray-500">Loading asset dashboard...</span>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border border-gray-100 shadow-sm p-6">
        <h3 className="text-lg font-bold text-gray-800">Asset Profile Not Found</h3>
        <p className="text-sm text-gray-500 mt-1">The requested asset could not be retrieved from the server.</p>
        <Link to="/assets" className="inline-flex items-center text-sm font-semibold text-blue-600 hover:text-blue-800 hover:underline mt-4">
          &larr; Back to Assets list
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header section */}
      <div className="flex items-center justify-between">
        <Link
          to="/assets"
          className="inline-flex items-center text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="mr-2 w-4 h-4" />
          Back to Directory
        </Link>
        {isManager && (
          <Link
            to={`/assets/${asset.id}/edit`}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-semibold rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <Edit2 className="mr-2 w-4 h-4" />
            Modify Details
          </Link>
        )}
      </div>

      <AssetDetailsCard asset={asset} />

      <div className="bg-white shadow-lg rounded-xl border border-gray-100 p-8">
        <h3 className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-3">Operational History & Logs</h3>
        <AssetTimeline timeline={timeline || []} />
      </div>
    </div>
  );
}
