import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AssetForm } from '../components/AssetForm';
import { useAsset, useUpdateAsset } from '../api';
import { toast } from 'sonner';

export function EditAssetPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: asset, isLoading } = useAsset(id!);
  const { mutate: updateAsset, isPending } = useUpdateAsset();

  const handleSubmit = (data: Record<string, unknown>) => {
    updateAsset({ id: id!, data }, {
      onSuccess: () => {
        toast.success('Asset updated successfully');
        navigate('/assets');
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });
  };

  if (isLoading) return <div>Loading...</div>;
  if (!asset) return <div>Asset not found</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Edit Asset: {asset.assetTag}</h1>
      <AssetForm initialData={asset} onSubmit={handleSubmit} isLoading={isPending} />
    </div>
  );
}
