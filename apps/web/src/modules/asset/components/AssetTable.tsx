import React from 'react';
import { Asset } from '../types';
import { Edit2, Eye, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

interface AssetTableProps {
  assets: Asset[];
  onDelete: (id: string) => void;
}

export function AssetTable({ assets, onDelete }: AssetTableProps) {
  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow">
      <table className="w-full text-left text-sm text-gray-500">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
          <tr>
            <th className="px-6 py-3">Tag</th>
            <th className="px-6 py-3">Name</th>
            <th className="px-6 py-3">Category</th>
            <th className="px-6 py-3">Status</th>
            <th className="px-6 py-3">Condition</th>
            <th className="px-6 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {assets.map((asset) => (
            <tr key={asset.id} className="bg-white border-b hover:bg-gray-50">
              <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                {asset.assetTag}
              </td>
              <td className="px-6 py-4">{asset.name}</td>
              <td className="px-6 py-4">{asset.category?.name || '-'}</td>
              <td className="px-6 py-4">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  asset.status === 'AVAILABLE' ? 'bg-green-100 text-green-800' :
                  asset.status === 'ALLOCATED' ? 'bg-blue-100 text-blue-800' :
                  asset.status === 'UNDER_MAINTENANCE' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {asset.status}
                </span>
              </td>
              <td className="px-6 py-4">{asset.condition}</td>
              <td className="px-6 py-4 text-right">
                <div className="flex items-center justify-end space-x-3">
                  <Link to={`/assets/${asset.id}`} className="text-blue-600 hover:text-blue-900">
                    <Eye className="w-4 h-4" />
                  </Link>
                  <Link to={`/assets/${asset.id}/edit`} className="text-gray-600 hover:text-gray-900">
                    <Edit2 className="w-4 h-4" />
                  </Link>
                  <button onClick={() => onDelete(asset.id)} className="text-red-600 hover:text-red-900">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {assets.length === 0 && (
            <tr>
              <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                No assets found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
