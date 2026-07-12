import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Asset } from '../types';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { useCategories } from '../api';

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(150),
  categoryId: z.string().uuid('Invalid category ID'),
  serialNumber: z.string().optional(),
  manufacturer: z.string().optional(),
  model: z.string().optional(),
  acquisitionCost: z.number().optional().nullable(),
  location: z.string().optional(),
  condition: z.enum(['NEW', 'GOOD', 'FAIR', 'POOR', 'BROKEN']),
  isBookable: z.boolean().default(false),
});

interface AssetFormProps {
  initialData?: Asset;
  onSubmit: (data: FormData) => void;
  isLoading: boolean;
}

export function AssetForm({ initialData, onSubmit, isLoading }: AssetFormProps) {
  const { data: categoriesResponse, isLoading: isLoadingCategories } = useCategories();
  const categories = categoriesResponse?.data || [];

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Asset Name *</label>
          <Input
            {...register('name')}
            placeholder="e.g., MacBook Pro M3"
            error={errors.name?.message}
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Category *</label>
          <Select
            {...register('categoryId')}
            error={errors.categoryId?.message}
            disabled={isLoadingCategories}
          >
            <option value="">Select Category</option>
            {categories.map((cat: any) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Serial Number</label>
          <Input
            {...register('serialNumber')}
            placeholder="e.g., C02XYZ1234"
            error={errors.serialNumber?.message}
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Manufacturer</label>
          <Input
            {...register('manufacturer')}
            placeholder="e.g., Apple"
            error={errors.manufacturer?.message}
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Model</label>
          <Input
            {...register('model')}
            placeholder="e.g., A2992"
            error={errors.model?.message}
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Acquisition Cost</label>
          <Input
            type="number"
            step="0.01"
            {...register('acquisitionCost', { valueAsNumber: true })}
            placeholder="e.g., 1999.99"
            error={errors.acquisitionCost?.message}
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Location</label>
          <Input
            {...register('location')}
            placeholder="e.g., Building A, Room 101"
            error={errors.location?.message}
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Condition</label>
          <Select {...register('condition')} error={errors.condition?.message}>
            <option value="NEW">New</option>
            <option value="GOOD">Good</option>
            <option value="FAIR">Fair</option>
            <option value="POOR">Poor</option>
            <option value="BROKEN">Broken</option>
          </Select>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="isBookable"
          {...register('isBookable')}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <label htmlFor="isBookable" className="text-sm font-medium text-gray-700">
          Available for Booking
        </label>
      </div>

      <div className="flex justify-end pt-4 border-t border-gray-100">
        <Button
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? 'Saving...' : 'Save Asset'}
        </Button>
      </div>
    </form>
  );
}
