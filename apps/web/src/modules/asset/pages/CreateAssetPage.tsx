import React from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { AssetForm, FormData } from '../components/AssetForm';
import { useCreateAsset } from '../api';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/auth.store';

export function CreateAssetPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const isManager = user?.role === 'ADMIN' || user?.role === 'ASSET_MANAGER';
  
  const { mutate: createAsset, isPending } = useCreateAsset();

  if (!isManager) {
    return <Navigate to="/access-denied" replace />;
  }

  const handleSubmit = (data: FormData) => {
    createAsset(data, {
      onSuccess: () => {
        toast.success('Asset registered successfully');
        navigate('/assets');
      },
      onError: (error) => {
        toast.error(error.message || 'Failed to create asset');
      },
    });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Register New Asset</h1>
        <p className="text-sm text-gray-500 mt-1">Register a hardware machine, tool, license key, or office physical resource.</p>
      </div>
      <AssetForm onSubmit={handleSubmit} isLoading={isPending} />
    </div>
  );
}
