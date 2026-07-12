import React from 'react';
import { Asset } from '../types';
import { Edit2, Eye, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '../../../components/ui/DataTable';

interface AssetTableProps {
  assets: Asset[];
  onDelete: (id: string) => void;
}

export function AssetTable({ assets, onDelete }: AssetTableProps) {
  const columns: ColumnDef<Asset>[] = [
    {
      accessorKey: 'assetTag',
      header: 'Asset Tag',
      cell: ({ row }) => (
        <span className="font-medium text-gray-900">{row.original.assetTag}</span>
      ),
    },
    {
      accessorKey: 'name',
      header: 'Name',
    },
    {
      accessorKey: 'category.name',
      header: 'Category',
      cell: ({ row }) => row.original.category?.name || '-',
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status;
        const colorClass = 
          status === 'AVAILABLE' ? 'bg-green-100 text-green-800' :
          status === 'ALLOCATED' ? 'bg-blue-100 text-blue-800' :
          status === 'UNDER_MAINTENANCE' ? 'bg-yellow-100 text-yellow-800' :
          'bg-gray-100 text-gray-800';
        
        return (
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${colorClass}`}>
            {status}
          </span>
        );
      },
    },
    {
      accessorKey: 'condition',
      header: 'Condition',
    },
    {
      id: 'actions',
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        const asset = row.original;
        return (
          <div className="flex items-center justify-end space-x-3">
            <Link to={`/assets/${asset.id}`} className="text-blue-600 hover:text-blue-900" aria-label="View asset">
              <Eye className="w-4 h-4" />
            </Link>
            <Link to={`/assets/${asset.id}/edit`} className="text-gray-600 hover:text-gray-900" aria-label="Edit asset">
              <Edit2 className="w-4 h-4" />
            </Link>
            <button 
              onClick={() => onDelete(asset.id)} 
              className="text-red-600 hover:text-red-900"
              aria-label="Delete asset"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        );
      },
    },
  ];

  return <DataTable columns={columns} data={assets} />;
}
