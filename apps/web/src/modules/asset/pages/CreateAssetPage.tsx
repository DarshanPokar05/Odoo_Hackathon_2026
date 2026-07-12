import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AssetForm } from '../components/AssetForm';
import { useCreateAsset } from '../api';
import { toast } from 'sonner';

export function CreateAssetPage() {
  const navigate = useNavigate();
  const { mutate: createAsset, isPending } = useCreateAsset();

  const handleSubmit = (data: Record<string, unknown>) => {
    createAsset(data, {
      onSuccess: () => {
        toast.success('Asset registered successfully');
        navigate('/assets');
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Register New Asset</h1>
      <AssetForm onSubmit={handleSubmit} isLoading={isPending} />
    </div>
  );
}
