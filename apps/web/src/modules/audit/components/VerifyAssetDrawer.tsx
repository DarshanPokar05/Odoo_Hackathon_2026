import { useState } from 'react';
import { useVerifyAssets } from '../api';
import { useQuery } from '@tanstack/react-query';
import { fetchApi } from '@/services/api';
import { VerificationStatus } from '../types';

export function VerifyAssetDrawer({ auditId, onClose }: { auditId: string, onClose: () => void }) {
  const { mutate: verifyAssets, isPending } = useVerifyAssets(auditId);
  const [assetId, setAssetId] = useState('');
  const [status, setStatus] = useState<VerificationStatus>(VerificationStatus.VERIFIED);
  const [remarks, setRemarks] = useState('');
  
  // We should ideally search for assets in the department, but we'll fetch a list for demo
  const { data: assets } = useQuery({
    queryKey: ['assets'],
    queryFn: () => fetchApi<{ data: Array<{ id: string; name: string; assetTag: string }> }>('/assets'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetId) return;

    verifyAssets(
      { items: [{ assetId, verificationStatus: status, remarks }] },
      { onSuccess: () => {
          setAssetId('');
          setRemarks('');
          setStatus(VerificationStatus.VERIFIED);
      }}
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        <section className="absolute inset-y-0 right-0 pl-10 max-w-full flex">
          <div className="w-screen max-w-md">
            <div className="h-full flex flex-col bg-white shadow-xl overflow-y-scroll">
              <div className="px-4 py-6 sm:px-6 bg-indigo-600 text-white">
                <div className="flex items-start justify-between">
                  <h2 className="text-lg font-medium">Verify Asset</h2>
                  <button onClick={onClose} className="text-white hover:text-gray-200">
                    <span className="sr-only">Close panel</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="mt-6 relative flex-1 px-4 sm:px-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Asset</label>
                    <select
                      required
                      value={assetId}
                      onChange={(e) => setAssetId(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                    >
                      <option value="">Select an asset to verify</option>
                      {assets?.data?.map((asset: { id: string; name: string; assetTag: string }) => (
                        <option key={asset.id} value={asset.id}>{asset.name} ({asset.assetTag})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as VerificationStatus)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                    >
                      <option value={VerificationStatus.VERIFIED}>Verified</option>
                      <option value={VerificationStatus.MISSING}>Missing</option>
                      <option value={VerificationStatus.DAMAGED}>Damaged</option>
                    </select>
                  </div>
                  {(status === VerificationStatus.MISSING || status === VerificationStatus.DAMAGED) && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Remarks / Description</label>
                      <textarea
                        required
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                        rows={3}
                      />
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={isPending || !assetId}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    {isPending ? 'Saving...' : 'Save Verification'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
