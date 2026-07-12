import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Asset } from '../types';
import { useCategories } from '../api';
import { Plus, Trash, Image as ImageIcon, FileText } from 'lucide-react';

export const AssetValidationSchema = z.object({
  name: z.string().min(1, 'Name is required').max(150),
  categoryId: z.string().uuid('Please select a category'),
  serialNumber: z.string().optional().nullable(),
  manufacturer: z.string().optional().nullable(),
  model: z.string().optional().nullable(),
  acquisitionDate: z.string().optional().nullable(),
  acquisitionCost: z.coerce.number().min(0, 'Must be positive').optional().nullable(),
  currentValue: z.coerce.number().min(0, 'Must be positive').optional().nullable(),
  location: z.string().optional().nullable(),
  condition: z.enum(['NEW', 'GOOD', 'FAIR', 'POOR', 'BROKEN']),
  isBookable: z.boolean().default(false),
  images: z.array(z.object({
    imageUrl: z.string().url('Must be a valid URL'),
    displayOrder: z.number().default(0)
  })).default([]),
  documents: z.array(z.object({
    documentName: z.string().min(1, 'Document name is required'),
    documentUrl: z.string().url('Must be a valid URL'),
    documentType: z.string().min(1, 'Type is required')
  })).default([])
});

export type FormData = z.infer<typeof AssetValidationSchema>;

interface AssetFormProps {
  initialData?: Asset;
  onSubmit: (data: FormData) => void;
  isLoading: boolean;
}

export function AssetForm({ initialData, onSubmit, isLoading }: AssetFormProps) {
  const { data: categories = [], isLoading: loadingCats } = useCategories();
  const [newImgUrl, setNewImgUrl] = useState('');
  const [newDocName, setNewDocName] = useState('');
  const [newDocUrl, setNewDocUrl] = useState('');
  const [newDocType, setNewDocType] = useState('PDF');

  const { register, handleSubmit, control, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(AssetValidationSchema) as any,
    defaultValues: {
      name: initialData?.name || '',
      categoryId: initialData?.categoryId || '',
      serialNumber: initialData?.serialNumber || '',
      manufacturer: initialData?.manufacturer || '',
      model: initialData?.model || '',
      acquisitionDate: initialData?.acquisitionDate ? new Date(initialData.acquisitionDate).toISOString().split('T')[0] : '',
      acquisitionCost: initialData?.acquisitionCost || null,
      currentValue: initialData?.currentValue || null,
      location: initialData?.location || '',
      condition: initialData?.condition || 'NEW',
      isBookable: initialData?.isBookable || false,
      images: initialData?.images || [],
      documents: initialData?.documents || []
    },
  });

  const { fields: imageFields, append: appendImage, remove: removeImage } = useFieldArray({
    control,
    name: 'images'
  });

  const { fields: documentFields, append: appendDocument, remove: removeDocument } = useFieldArray({
    control,
    name: 'documents'
  });

  const handleAddImage = (e: React.MouseEvent) => {
    e.preventDefault();
    if (newImgUrl.trim()) {
      appendImage({ imageUrl: newImgUrl.trim(), displayOrder: imageFields.length });
      setNewImgUrl('');
    }
  };

  const handleAddDocument = (e: React.MouseEvent) => {
    e.preventDefault();
    if (newDocName.trim() && newDocUrl.trim()) {
      appendDocument({
        documentName: newDocName.trim(),
        documentUrl: newDocUrl.trim(),
        documentType: newDocType
      });
      setNewDocName('');
      setNewDocUrl('');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-4xl bg-white p-8 rounded-xl shadow-lg border border-gray-100">
      <div className="border-b border-gray-100 pb-4">
        <h2 className="text-xl font-semibold text-gray-800">General Information</h2>
        <p className="text-sm text-gray-500 mt-1">Provide core asset characteristics, model details, and categories.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-semibold text-gray-700">Asset Name *</label>
          <input
            {...register('name')}
            className="mt-2 block w-full rounded-lg border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-3 transition-colors"
            placeholder="e.g. MacBook Pro 16"
          />
          {errors.name && <p className="mt-1.5 text-sm text-red-600">{errors.name.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700">Category *</label>
          <select
            {...register('categoryId')}
            className="mt-2 block w-full rounded-lg border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-3 transition-colors"
          >
            <option value="">{loadingCats ? 'Loading categories...' : 'Select Category'}</option>
            {categories.map((cat: any) => (
              <option key={cat.id} value={cat.id}>
                {cat.name} ({cat.code})
              </option>
            ))}
          </select>
          {errors.categoryId && <p className="mt-1.5 text-sm text-red-600">{errors.categoryId.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700">Serial Number</label>
          <input
            {...register('serialNumber')}
            className="mt-2 block w-full rounded-lg border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-3 transition-colors"
            placeholder="e.g. S/N 12345"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700">Manufacturer</label>
          <input
            {...register('manufacturer')}
            className="mt-2 block w-full rounded-lg border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-3 transition-colors"
            placeholder="e.g. Apple, Dell, Lenovo"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700">Model</label>
          <input
            {...register('model')}
            className="mt-2 block w-full rounded-lg border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-3 transition-colors"
            placeholder="e.g. M3 Max 64GB"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700">Location</label>
          <input
            {...register('location')}
            className="mt-2 block w-full rounded-lg border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-3 transition-colors"
            placeholder="e.g. HQ - 4th Floor"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700">Condition *</label>
          <select
            {...register('condition')}
            className="mt-2 block w-full rounded-lg border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-3 transition-colors"
          >
            <option value="NEW">New</option>
            <option value="GOOD">Good</option>
            <option value="FAIR">Fair</option>
            <option value="POOR">Poor</option>
            <option value="BROKEN">Broken</option>
          </select>
        </div>

        <div className="flex items-center mt-8">
          <input
            id="isBookable"
            type="checkbox"
            {...register('isBookable')}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-colors"
          />
          <label htmlFor="isBookable" className="ml-2 block text-sm text-gray-900 font-semibold cursor-pointer">
            Make asset bookable/reservable by employees
          </label>
        </div>
      </div>

      <div className="border-b border-gray-100 pb-4 pt-4">
        <h2 className="text-xl font-semibold text-gray-800">Financial Values</h2>
        <p className="text-sm text-gray-500 mt-1">Specify procurement cost, acquisition date, and estimated current value.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div>
          <label className="block text-sm font-semibold text-gray-700">Acquisition Cost ($)</label>
          <input
            type="number"
            step="0.01"
            {...register('acquisitionCost')}
            className="mt-2 block w-full rounded-lg border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-3 transition-colors"
            placeholder="e.g. 2499.00"
          />
          {errors.acquisitionCost && <p className="mt-1.5 text-sm text-red-600">{errors.acquisitionCost.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700">Current Value ($)</label>
          <input
            type="number"
            step="0.01"
            {...register('currentValue')}
            className="mt-2 block w-full rounded-lg border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-3 transition-colors"
            placeholder="e.g. 2200.00"
          />
          {errors.currentValue && <p className="mt-1.5 text-sm text-red-600">{errors.currentValue.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700">Acquisition Date</label>
          <input
            type="date"
            {...register('acquisitionDate')}
            className="mt-2 block w-full rounded-lg border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-3 transition-colors"
          />
        </div>
      </div>

      <div className="border-b border-gray-100 pb-4 pt-4">
        <h2 className="text-xl font-semibold text-gray-800">Media Attachments (Images)</h2>
        <p className="text-sm text-gray-500 mt-1">Link photos or graphics demonstrating current condition.</p>
      </div>

      <div className="space-y-4">
        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="Paste image URL (e.g. https://images.unsplash.com/...)"
            value={newImgUrl}
            onChange={(e) => setNewImgUrl(e.target.value)}
            className="flex-1 rounded-lg border border-gray-300 p-3 sm:text-sm focus:border-blue-500 focus:outline-none"
          />
          <button
            onClick={handleAddImage}
            className="inline-flex items-center px-4 py-3 border border-transparent text-sm font-semibold rounded-lg text-white bg-gray-800 hover:bg-gray-900 transition-colors"
          >
            <Plus className="w-4 h-4 mr-1" /> Add
          </button>
        </div>

        {imageFields.length > 0 && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 pt-2">
            {imageFields.map((field, idx) => (
              <div key={field.id} className="relative group rounded-lg overflow-hidden border border-gray-200 aspect-video bg-gray-50">
                <img src={field.imageUrl} alt="Asset preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                >
                  <Trash className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-b border-gray-100 pb-4 pt-4">
        <h2 className="text-xl font-semibold text-gray-800">Documents & Guides</h2>
        <p className="text-sm text-gray-500 mt-1">Upload reference catalogs, warranty agreements, or compliance sheets.</p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <input
            type="text"
            placeholder="Document Name (e.g. Warranty Card)"
            value={newDocName}
            onChange={(e) => setNewDocName(e.target.value)}
            className="sm:col-span-2 rounded-lg border border-gray-300 p-3 sm:text-sm focus:border-blue-500 focus:outline-none"
          />
          <select
            value={newDocType}
            onChange={(e) => setNewDocType(e.target.value)}
            className="rounded-lg border border-gray-300 p-3 sm:text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="PDF">PDF</option>
            <option value="Warranty">Warranty</option>
            <option value="Manual">Manual</option>
            <option value="Invoice">Invoice</option>
          </select>
          <input
            type="text"
            placeholder="File URL (e.g. https://...)"
            value={newDocUrl}
            onChange={(e) => setNewDocUrl(e.target.value)}
            className="sm:col-span-3 rounded-lg border border-gray-300 p-3 sm:text-sm focus:border-blue-500 focus:outline-none"
          />
          <button
            onClick={handleAddDocument}
            className="inline-flex items-center justify-center px-4 py-3 border border-transparent text-sm font-semibold rounded-lg text-white bg-gray-800 hover:bg-gray-900 transition-colors"
          >
            <Plus className="w-4 h-4 mr-1" /> Add Doc
          </button>
        </div>

        {documentFields.length > 0 && (
          <div className="divide-y divide-gray-100 border border-gray-100 rounded-lg">
            {documentFields.map((field, idx) => (
              <div key={field.id} className="flex items-center justify-between p-3.5 hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-3">
                  <FileText className="w-5 h-5 text-gray-400" />
                  <div>
                    <span className="font-semibold text-gray-700 text-sm">{field.documentName}</span>
                    <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded uppercase font-medium">{field.documentType}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeDocument(idx)}
                  className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50"
                >
                  <Trash className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-100">
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex justify-center py-3 px-6 border border-transparent shadow-sm text-sm font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Saving Asset...' : 'Save Asset'}
        </button>
      </div>
    </form>
  );
}
