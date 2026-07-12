import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAsset, useAssetTimeline } from '../api';
import { AssetDetailsCard } from '../components/AssetDetailsCard';
import { AssetTimeline } from '../components/AssetTimeline';
import { Edit2, ArrowLeft } from 'lucide-react';

export function AssetDetailsPage() {
  const { id } = useParams<{ id: string }>();
  
  const { data: asset, isLoading: isLoadingAsset } = useAsset(id!);
  const { data: timeline, isLoading: isLoadingTimeline } = useAssetTimeline(id!);

  if (isLoadingAsset || isLoadingTimeline) {
    return <div className="flex justify-center p-8">Loading details...</div>;
  }

  if (!asset) {
    return <div>Asset not found</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between mb-4">
        <Link to="/assets" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700">
          <ArrowLeft className="mr-1 w-4 h-4" />
          Back to Assets
        </Link>
        <Link
          to={`/assets/${asset.id}/edit`}
          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          <Edit2 className="mr-2 w-4 h-4" />
          Edit Asset
        </Link>
      </div>

      <AssetDetailsCard asset={asset} />

      <div className="bg-white shadow rounded-lg border border-gray-200 mt-6 p-6">
        <h3 className="text-lg font-medium text-gray-900 border-b pb-3">Asset History</h3>
        <AssetTimeline timeline={timeline || []} />
      </div>
    </div>
  );
}
