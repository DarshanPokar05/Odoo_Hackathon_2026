import React, { useState } from 'react';
import { useAssets, useDeleteAsset } from '../api';
import { AssetTable } from '../components/AssetTable';
import { Link } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { toast } from 'sonner';

export function AssetListPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  
  const { data, isLoading } = useAssets({ page, limit: 20, search });
  const { mutate: deleteAsset } = useDeleteAsset();

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this asset?')) {
      deleteAsset(id, {
        onSuccess: () => toast.success('Asset deleted successfully'),
        onError: (err) => toast.error(err.message),
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Assets</h1>
        <Link
          to="/assets/new"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Asset
        </Link>
      </div>

      <div className="flex items-center px-4 py-2 bg-white border rounded-md max-w-md">
        <Search className="w-5 h-5 text-gray-400 mr-2" />
        <input
          type="text"
          placeholder="Search by tag, name or serial..."
          className="flex-1 outline-none text-sm"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center p-8">Loading assets...</div>
      ) : (
        <AssetTable assets={data?.assets || []} onDelete={handleDelete} />
      )}
    </div>
  );
}
