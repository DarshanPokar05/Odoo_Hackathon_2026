import React, { useState } from 'react';
import { useAssets, useDeleteAsset } from '../api';
import { AssetTable } from '../components/AssetTable';
import { Link } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { LoadingScreen } from '../../../components/shared/LoadingScreen';
import { EmptyState } from '../../../components/shared/EmptyState';

export function AssetListPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  
  const { data, isLoading, isError } = useAssets({ page, limit: 20, search });
  const { mutate: deleteAsset } = useDeleteAsset();

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this asset?')) {
      deleteAsset(id, {
        onSuccess: () => toast.success('Asset deleted successfully'),
        onError: (err: Error) => toast.error(err.message || 'Failed to delete asset'),
      });
    }
  };

  if (isLoading) return <LoadingScreen message="Loading assets..." />;

  if (isError) return (
    <EmptyState 
      title="Failed to load assets" 
      description="There was an error connecting to the server."
      icon={<div className="h-12 w-12 text-red-500 mb-4 mx-auto rounded-full bg-red-100 flex items-center justify-center">!</div>}
    />
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Assets</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your organization's physical and digital assets.</p>
        </div>
        <Button asChild>
          <Link to="/assets/new">
            <Plus className="w-4 h-4 mr-2" />
            Add Asset
          </Link>
        </Button>
      </div>

      <div className="flex items-center px-3 bg-white border border-gray-300 rounded-md max-w-md shadow-sm">
        <Search className="w-4 h-4 text-gray-400 mr-2" />
        <Input
          type="text"
          placeholder="Search by tag, name or serial..."
          className="flex-1 border-0 focus-visible:ring-0 shadow-none px-0"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </div>

      {!data?.assets || data.assets.length === 0 ? (
        <EmptyState 
          title="No assets found" 
          description={search ? "Try adjusting your search criteria." : "Get started by adding your first asset."}
          action={
            <Button asChild className="mt-4">
              <Link to="/assets/new">Add Asset</Link>
            </Button>
          }
        />
      ) : (
        <AssetTable assets={data.assets} onDelete={handleDelete} />
      )}
    </div>
  );
}
