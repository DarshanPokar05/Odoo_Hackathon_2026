import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Asset } from '../types';

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(150),
  categoryId: z.string().uuid('Invalid category ID'),
  serialNumber: z.string().optional(),
  manufacturer: z.string().optional(),
  model: z.string().optional(),
  acquisitionCost: z.number().optional(),
  location: z.string().optional(),
  condition: z.enum(['NEW', 'GOOD', 'FAIR', 'POOR', 'BROKEN']),
  isBookable: z.boolean().default(false),
});

type FormData = z.infer<typeof schema>;

interface AssetFormProps {
  initialData?: Asset;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSubmit: (data: any) => void;
  isLoading: boolean;
}

export function AssetForm({ initialData, onSubmit, isLoading }: AssetFormProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { register, handleSubmit, formState: { errors } } = useForm<any>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: {
      name: initialData?.name || '',
      categoryId: initialData?.categoryId || '',
      serialNumber: initialData?.serialNumber || '',
      manufacturer: initialData?.manufacturer || '',
      model: initialData?.model || '',
      acquisitionCost: initialData?.acquisitionCost || undefined,
      location: initialData?.location || '',
      condition: initialData?.condition || 'NEW',
      isBookable: initialData?.isBookable || false,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl bg-white p-6 rounded-lg shadow">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700">Asset Name *</label>
          <input
            {...register('name')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
          />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message as string}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Category ID *</label>
          <input
            {...register('categoryId')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
            placeholder="UUID of Category"
          />
          {errors.categoryId && <p className="mt-1 text-sm text-red-600">{errors.categoryId.message as string}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Serial Number</label>
          <input
            {...register('serialNumber')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Manufacturer</label>
          <input
            {...register('manufacturer')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Model</label>
          <input
            {...register('model')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Condition</label>
          <select
            {...register('condition')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
          >
            <option value="NEW">New</option>
            <option value="GOOD">Good</option>
            <option value="FAIR">Fair</option>
            <option value="POOR">Poor</option>
            <option value="BROKEN">Broken</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {isLoading ? 'Saving...' : 'Save Asset'}
        </button>
      </div>
    </form>
  );
}
