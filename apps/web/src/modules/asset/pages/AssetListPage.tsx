import React, { useState } from 'react';
import { useAssets, useDeleteAsset, useCategories } from '../api';
import { AssetTable } from '../components/AssetTable';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/auth.store';

export function AssetListPage() {
  const user = useAuthStore((state) => state.user);
  const isManager = user?.role === 'ADMIN' || user?.role === 'ASSET_MANAGER';

  // Filters state
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [status, setStatus] = useState('');
  const [condition, setCondition] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const { data: categories = [], isLoading: loadingCats } = useCategories();
  
  const { data, isLoading, refetch } = useAssets({
    page,
    limit: 10,
    search,
    categoryId,
    status,
    condition,
    sortBy,
    sortOrder,
  });

  const { mutate: deleteAsset } = useDeleteAsset();

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this asset? This cannot be undone.')) {
      deleteAsset(id, {
        onSuccess: () => toast.success('Asset deleted successfully'),
        onError: (err: any) => toast.error(err.message || 'Failed to delete asset'),
      });
    }
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
    setPage(1);
  };

  const handleResetFilters = () => {
    setSearch('');
    setCategoryId('');
    setStatus('');
    setCondition('');
    setSortBy('createdAt');
    setSortOrder('desc');
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Title block */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Asset Directory</h1>
          <p className="text-sm text-gray-500 mt-1">Manage and track hardware, software, and physical items in your organization.</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => refetch()}
            title="Refresh assets"
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          {isManager && (
            <Link
              to="/assets/new"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 shadow transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Register Asset
            </Link>
          )}
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-4">
        <div className="flex items-center space-x-2 text-gray-700 font-semibold text-sm">
          <Filter className="w-4 h-4" />
          <span>Filters & Search</span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search tag, name or serial..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-10 w-full rounded-lg border border-gray-300 p-3 sm:text-sm focus:border-blue-500 focus:outline-none transition-colors"
            />
          </div>

          {/* Category dropdown */}
          <select
            value={categoryId}
            onChange={(e) => {
              setCategoryId(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-lg border border-gray-300 p-3 sm:text-sm focus:border-blue-500 focus:outline-none transition-colors"
          >
            <option value="">All Categories</option>
            {categories.map((cat: any) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          {/* Status dropdown */}
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-lg border border-gray-300 p-3 sm:text-sm focus:border-blue-500 focus:outline-none transition-colors"
          >
            <option value="">All Statuses</option>
            <option value="AVAILABLE">Available</option>
            <option value="ALLOCATED">Allocated</option>
            <option value="RESERVED">Reserved</option>
            <option value="UNDER_MAINTENANCE">Under Maintenance</option>
            <option value="DISPOSED">Disposed</option>
          </select>

          {/* Condition dropdown */}
          <select
            value={condition}
            onChange={(e) => {
              setCondition(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-lg border border-gray-300 p-3 sm:text-sm focus:border-blue-500 focus:outline-none transition-colors"
          >
            <option value="">All Conditions</option>
            <option value="NEW">New</option>
            <option value="GOOD">Good</option>
            <option value="FAIR">Fair</option>
            <option value="POOR">Poor</option>
            <option value="BROKEN">Broken</option>
          </select>
        </div>

        {(search || categoryId || status || condition) && (
          <div className="flex justify-end pt-2">
            <button
              onClick={handleResetFilters}
              className="text-xs font-bold text-gray-500 hover:text-blue-600 transition-colors"
            >
              Reset All Filters
            </button>
          </div>
        )}
      </div>

      {/* Assets Table */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-lg border border-gray-100 shadow-sm">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mb-3" />
          <span className="text-sm font-semibold text-gray-500">Loading asset records...</span>
        </div>
      ) : (
        <AssetTable
          assets={data?.assets || []}
          onDelete={handleDelete}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
          page={page}
          limit={10}
          total={data?.total || 0}
          onPageChange={(p) => setPage(p)}
        />
      )}
    </div>
  );
}
