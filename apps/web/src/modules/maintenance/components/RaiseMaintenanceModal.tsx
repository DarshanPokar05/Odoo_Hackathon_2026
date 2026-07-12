import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MaintenancePriority } from '../types';
import { useRaiseMaintenance } from '../api';

const raiseMaintenanceSchema = z.object({
  assetId: z.string().min(1, 'Asset ID is required'),
  priority: z.nativeEnum(MaintenancePriority),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  photoUrl: z.string().optional(),
});

type FormData = z.infer<typeof raiseMaintenanceSchema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  assetId?: string; // If raised directly from an asset context
}

export function RaiseMaintenanceModal({ isOpen, onClose, assetId }: Props) {
  if (!isOpen) return null;

  const raiseMutation = useRaiseMaintenance();
  
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(raiseMaintenanceSchema) as any,
    defaultValues: {
      assetId: assetId || '',
      priority: MaintenancePriority.LOW,
      description: '',
      photoUrl: '',
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onSubmit = (data: any) => {
    raiseMutation.mutate(data, {
      onSuccess: () => {
        reset();
        onClose();
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30" aria-hidden="true">
      <div className="mx-auto max-w-md w-full rounded bg-white p-6 shadow-xl">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Raise Maintenance Request
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {!assetId && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Asset ID</label>
                <input
                  type="text"
                  {...register('assetId')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="Enter Asset UUID"
                />
                {errors.assetId && <p className="mt-1 text-sm text-red-600">{errors.assetId.message}</p>}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">Priority</label>
              <select
                {...register('priority')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                {Object.values(MaintenancePriority).map(priority => (
                  <option key={priority} value={priority}>{priority}</option>
                ))}
              </select>
              {errors.priority && <p className="mt-1 text-sm text-red-600">{errors.priority.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                {...register('description')}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="Describe the issue in detail..."
              />
              {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={raiseMutation.isPending}
                className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                {raiseMutation.isPending ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </form>
      </div>
    </div>
  );
}
