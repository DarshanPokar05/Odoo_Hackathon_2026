import React from 'react';
import { Asset } from '../types';
import { Edit2, Eye, Trash2, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';

interface AssetTableProps {
  assets: Asset[];
  onDelete: (id: string) => void;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSort: (column: string) => void;
  page: number;
  limit: number;
  total: number;
  onPageChange: (page: number) => void;
}

export function AssetTable({
  assets,
  onDelete,
  sortBy,
  sortOrder,
  onSort,
  page,
  limit,
  total,
  onPageChange,
}: AssetTableProps) {
  const user = useAuthStore((state) => state.user);
  const isManager = user?.role === 'ADMIN' || user?.role === 'ASSET_MANAGER';

  const totalPages = Math.ceil(total / limit);

  const SortHeader = ({ column, label }: { column: string; label: string }) => {
    const isActive = sortBy === column;
    return (
      <button
        onClick={() => onSort(column)}
        className="flex items-center space-x-1 hover:text-gray-900 focus:outline-none"
      >
        <span>{label}</span>
        <ArrowUpDown className={`w-3 h-3 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
      </button>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4">
                <SortHeader column="assetTag" label="Asset Tag" />
              </th>
              <th className="px-6 py-4">
                <SortHeader column="name" label="Asset Name" />
              </th>
              <th className="px-6 py-4">
                <SortHeader column="category" label="Category" />
              </th>
              <th className="px-6 py-4">
                <SortHeader column="status" label="Status" />
              </th>
              <th className="px-6 py-4">
                <SortHeader column="condition" label="Condition" />
              </th>
              <th className="px-6 py-4">
                <SortHeader column="location" label="Location" />
              </th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {assets.map((asset) => (
              <tr key={asset.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-mono font-medium text-gray-900 whitespace-nowrap">
                  {asset.assetTag}
                </td>
                <td className="px-6 py-4 font-medium text-gray-900">{asset.name}</td>
                <td className="px-6 py-4">{asset.category?.name || '-'}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    asset.status === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-800' :
                    asset.status === 'ALLOCATED' ? 'bg-blue-100 text-blue-800' :
                    asset.status === 'RESERVED' ? 'bg-purple-100 text-purple-800' :
                    asset.status === 'UNDER_MAINTENANCE' ? 'bg-amber-100 text-amber-800' :
                    'bg-rose-100 text-rose-800'
                  }`}>
                    {asset.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-0.5 text-xs font-medium rounded border ${
                    asset.condition === 'NEW' ? 'bg-teal-50 text-teal-700 border-teal-200' :
                    asset.condition === 'GOOD' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                    asset.condition === 'FAIR' ? 'bg-gray-50 text-gray-700 border-gray-200' :
                    asset.condition === 'POOR' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                    'bg-red-50 text-red-700 border-red-200'
                  }`}>
                    {asset.condition}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-600">{asset.location || '-'}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <Link
                      to={`/assets/${asset.id}`}
                      title="View Details"
                      className="p-1 text-gray-500 hover:text-gray-900 rounded hover:bg-gray-100 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                    {isManager && (
                      <>
                        <Link
                          to={`/assets/${asset.id}/edit`}
                          title="Edit Asset"
                          className="p-1 text-gray-500 hover:text-blue-600 rounded hover:bg-blue-50 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => onDelete(asset.id)}
                          title="Delete Asset"
                          className="p-1 text-gray-500 hover:text-red-600 rounded hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {assets.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  No assets match the search criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-100">
          <div className="text-sm text-gray-500">
            Showing Page <span className="font-semibold text-gray-700">{page}</span> of{' '}
            <span className="font-semibold text-gray-700">{totalPages}</span> ({total} total assets)
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1}
              className="p-2 border border-gray-300 rounded-md bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page === totalPages}
              className="p-2 border border-gray-300 rounded-md bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
