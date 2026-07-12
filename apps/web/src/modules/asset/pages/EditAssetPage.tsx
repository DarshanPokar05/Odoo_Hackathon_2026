import React from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { AssetForm, FormData } from '../components/AssetForm';
import { useAsset, useUpdateAsset } from '../api';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/auth.store';
import { Loader2 } from 'lucide-react';

export function EditAssetPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const isManager = user?.role === 'ADMIN' || user?.role === 'ASSET_MANAGER';

  const { data: asset, isLoading } = useAsset(id!);
  const { mutate: updateAsset, isPending } = useUpdateAsset();

  if (!isManager) {
    return <Navigate to="/access-denied" replace />;
  }

  const handleSubmit = (data: FormData) => {
    updateAsset({ id: id!, data }, {
      onSuccess: () => {
        toast.success('Asset updated successfully');
        navigate(`/assets/${id}`);
      },
      onError: (error) => {
        toast.error(error.message || 'Failed to update asset');
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-lg border border-gray-100 shadow-sm">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-3" />
        <span className="text-sm font-semibold text-gray-500">Loading asset parameters...</span>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border border-gray-100 shadow-sm p-6">
        <h3 className="text-lg font-bold text-gray-800">Asset Profile Not Found</h3>
        <p className="text-sm text-gray-500 mt-1">The requested asset record does not exist or has been deleted.</p>
        <Navigate to="/assets" replace />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Modify Asset Details</h1>
        <p className="text-sm text-gray-500 mt-1">Updating settings for tag: <span className="font-mono font-bold text-gray-800">{asset.assetTag}</span></p>
      </div>
      <AssetForm initialData={asset} onSubmit={handleSubmit} isLoading={isPending} />
    </div>
  );
}
