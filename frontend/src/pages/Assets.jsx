import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { assetsApi } from '../api/assetsApi';
import { categoriesApi } from '../api/categoriesApi';
import { departmentsApi } from '../api/departmentsApi';
import { TagChip } from '../components/TagChip';
import { useAuth } from '../hooks/useAuth';

export function Assets() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [filters, setFilters] = useState({ search: '', categoryId: '', status: '', departmentId: '' });

  // Registration modal state
  const [showRegModal, setShowRegModal] = useState(false);
  const [form, setForm] = useState({
    name: '',
    categoryId: '',
    serialNumber: '',
    location: 'HQ Store Room',
    departmentId: '',
    isBookable: false,
    customFields: {},
  });

  // History Detail drawer state
  const [selectedAssetForHistory, setSelectedAssetForHistory] = useState(null);

  // Queries
  const { data: assetsData, isLoading: assetsLoading } = useQuery({
    queryKey: ['assets', filters],
    queryFn: () => assetsApi.list(filters),
  });
  const assets = Array.isArray(assetsData?.data)
    ? assetsData.data
    : assetsData?.data?.items || [];

  const { data: catsData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.list(),
  });
  const categories = Array.isArray(catsData?.data?.categories)
    ? catsData.data.categories
    : Array.isArray(catsData?.data)
    ? catsData.data
    : [];

  const { data: deptsData } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentsApi.list(),
  });
  const departments = Array.isArray(deptsData?.data?.departments)
    ? deptsData.data.departments
    : Array.isArray(deptsData?.data)
    ? deptsData.data
    : [];

  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['assetHistory', selectedAssetForHistory?.id],
    queryFn: () => assetsApi.getHistory(selectedAssetForHistory?.id),
    enabled: Boolean(selectedAssetForHistory?.id),
  });

  const selectedCategory = categories.find((c) => c.id === form.categoryId);
  const customFieldsSchema = (() => {
    const raw = selectedCategory?.custom_fields;
    if (Array.isArray(raw)) return raw;
    if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        return [];
      }
    }
    return [];
  })();

  // Mutations
  const createAssetMutation = useMutation({
    mutationFn: (payload) => assetsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      setShowRegModal(false);
      setForm({
        name: '',
        categoryId: '',
        serialNumber: '',
        location: 'HQ Store Room',
        departmentId: '',
        isBookable: false,
        customFields: {},
      });
    },
  });

  const handleCustomFieldChange = (fieldName, fieldType, rawValue) => {
    let value = rawValue;
    if (fieldType === 'number') value = Number(rawValue);
    if (fieldType === 'boolean') value = rawValue === 'true' || rawValue === true;

    setForm((prev) => ({
      ...prev,
      customFields: {
        ...prev.customFields,
        [fieldName]: value,
      },
    }));
  };

  const handleSubmitReg = (e) => {
    e.preventDefault();
    createAssetMutation.mutate({
      ...form,
      departmentId: form.departmentId || null,
      serialNumber: form.serialNumber || null,
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-textPrimary">Asset Directory</h1>
          <p className="text-sm text-textSecondary mt-1">
            Enterprise hardware, AV equipment, and laboratory instruments
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search by tag, serial, or QR code..."
            value={filters.search}
            onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
            className="w-64 bg-surface border border-border rounded-[6px] px-3 py-2 text-xs font-mono text-textPrimary focus:outline-none focus:border-accent"
          />
          {['Admin', 'AssetManager'].includes(user?.role) && (
            <button
              onClick={() => {
                createAssetMutation.reset();
                setShowRegModal(true);
              }}
              className="px-4 py-2 rounded-[6px] bg-accent text-bg font-mono text-xs font-semibold uppercase tracking-wider hover:opacity-90 transition-opacity"
            >
              + Register Asset
            </button>
          )}
        </div>
      </div>

      {/* Filter Row: Category / Status / Department */}
      <div className="flex flex-wrap items-center gap-3 bg-surface border border-border p-3 rounded-[8px]">
        <select
          value={filters.categoryId}
          onChange={(e) => setFilters((prev) => ({ ...prev, categoryId: e.target.value }))}
          className="bg-surfaceAlt border border-border rounded-[6px] px-3 py-1.5 text-xs font-mono text-textPrimary focus:outline-none focus:border-accent"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          value={filters.status}
          onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
          className="bg-surfaceAlt border border-border rounded-[6px] px-3 py-1.5 text-xs font-mono text-textPrimary focus:outline-none focus:border-accent"
        >
          <option value="">All Lifecycle Statuses</option>
          <option value="Available">Available</option>
          <option value="Allocated">Allocated</option>
          <option value="Reserved">Reserved</option>
          <option value="Under Maintenance">Under Maintenance</option>
          <option value="Lost">Lost</option>
          <option value="Retired">Retired</option>
        </select>

        <select
          value={filters.departmentId}
          onChange={(e) => setFilters((prev) => ({ ...prev, departmentId: e.target.value }))}
          className="bg-surfaceAlt border border-border rounded-[6px] px-3 py-1.5 text-xs font-mono text-textPrimary focus:outline-none focus:border-accent"
        >
          <option value="">All Departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </div>

      {/* Asset Table */}
      <div className="bg-surface border border-border rounded-[8px] overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border bg-surfaceAlt text-xs font-mono uppercase text-textSecondary">
              <th className="py-3 px-4">Tag</th>
              <th className="py-3 px-4">Name</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Location</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-sm font-mono">
            {assetsLoading ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-textSecondary">
                  Loading assets...
                </td>
              </tr>
            ) : assets.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-textSecondary">
                  No assets match current criteria.
                </td>
              </tr>
            ) : (
              assets.map((asset) => (
                <tr key={asset.id} className="hover:bg-surfaceAlt/50">
                  <td className="py-3 px-4 font-bold text-accent font-mono">{asset.asset_tag}</td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-textPrimary">{asset.name}</div>
                    {asset.serial_number && (
                      <div className="text-[11px] text-textSecondary">SN: {asset.serial_number}</div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-textSecondary">{asset.category_name}</td>
                  <td className="py-3 px-4">
                    <TagChip
                      status={
                        asset.status === 'Available'
                          ? 'AVAILABLE'
                          : asset.status === 'Allocated'
                          ? 'ALLOCATED'
                          : asset.status === 'Reserved'
                          ? 'RESERVED'
                          : 'MAINTENANCE'
                      }
                      label={asset.status}
                    />
                  </td>
                  <td className="py-3 px-4 text-textSecondary">{asset.location}</td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => setSelectedAssetForHistory(asset)}
                      className="text-xs text-accent hover:underline"
                    >
                      History Timeline
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* REGISTER ASSET MODAL */}
      {showRegModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <form
            onSubmit={handleSubmitReg}
            className="bg-surface border border-border rounded-[8px] w-full max-w-xl p-6 space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <h3 className="font-display font-bold text-lg text-textPrimary">Register New Asset</h3>

            {createAssetMutation.isError && (
              <div className="p-3 rounded-[6px] bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono">
                {createAssetMutation.error?.response?.data?.error?.message ||
                  createAssetMutation.error?.message ||
                  'Failed to register asset. Please check input fields.'}
              </div>
            )}

            <div className="space-y-3 font-mono text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-textSecondary mb-1">Asset Name *</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-surfaceAlt border border-border rounded-[6px] px-3 py-2 text-textPrimary focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-textSecondary mb-1">Asset Category *</label>
                  <select
                    required
                    value={form.categoryId}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, categoryId: e.target.value, customFields: {} }))
                    }
                    className="w-full bg-surfaceAlt border border-border rounded-[6px] px-3 py-2 text-textPrimary focus:outline-none focus:border-accent"
                  >
                    <option value="">Select Category...</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-textSecondary mb-1">Serial Number</label>
                  <input
                    type="text"
                    value={form.serialNumber}
                    onChange={(e) => setForm((prev) => ({ ...prev, serialNumber: e.target.value }))}
                    className="w-full bg-surfaceAlt border border-border rounded-[6px] px-3 py-2 text-textPrimary focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-textSecondary mb-1">Physical Location *</label>
                  <input
                    type="text"
                    required
                    value={form.location}
                    onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
                    className="w-full bg-surfaceAlt border border-border rounded-[6px] px-3 py-2 text-textPrimary focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-textSecondary mb-1">Department</label>
                  <select
                    value={form.departmentId}
                    onChange={(e) => setForm((prev) => ({ ...prev, departmentId: e.target.value }))}
                    className="w-full bg-surfaceAlt border border-border rounded-[6px] px-3 py-2 text-textPrimary focus:outline-none focus:border-accent"
                  >
                    <option value="">Org-Wide Pool</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={form.isBookable}
                      onChange={(e) => setForm((prev) => ({ ...prev, isBookable: e.target.checked }))}
                    />
                    <span className="text-textPrimary font-semibold">Allow Resource Bookings</span>
                  </label>
                </div>
              </div>

              {/* DYNAMIC CATEGORY CUSTOM FIELDS */}
              {customFieldsSchema.length > 0 && (
                <div className="border-t border-border pt-3 space-y-3">
                  <div className="font-semibold text-accent">
                    Category Dynamic Custom Fields ({selectedCategory?.name})
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {customFieldsSchema.map((field) => (
                      <div key={field.field_name}>
                        <label className="block text-textSecondary mb-1">
                          {field.field_name} ({field.field_type}) {field.required && '*'}
                        </label>
                        {field.field_type === 'boolean' ? (
                          <select
                            required={field.required}
                            onChange={(e) =>
                              handleCustomFieldChange(
                                field.field_name,
                                field.field_type,
                                e.target.value
                              )
                            }
                            className="w-full bg-surfaceAlt border border-border rounded-[6px] px-3 py-2 text-textPrimary"
                          >
                            <option value="">Select...</option>
                            <option value="true">True / Yes</option>
                            <option value="false">False / No</option>
                          </select>
                        ) : (
                          <input
                            type={field.field_type === 'date' ? 'date' : field.field_type === 'number' ? 'number' : 'text'}
                            required={field.required}
                            onChange={(e) =>
                              handleCustomFieldChange(
                                field.field_name,
                                field.field_type,
                                e.target.value
                              )
                            }
                            className="w-full bg-surfaceAlt border border-border rounded-[6px] px-3 py-2 text-textPrimary"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setShowRegModal(false)}
                className="px-4 py-2 rounded-[6px] border border-border text-xs font-mono text-textSecondary hover:text-textPrimary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createAssetMutation.isPending}
                className="px-4 py-2 rounded-[6px] bg-accent text-bg text-xs font-mono font-semibold uppercase hover:opacity-90"
              >
                {createAssetMutation.isPending ? 'Registering...' : 'Complete Registration'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ASSET HISTORY DRAWER / MODAL */}
      {selectedAssetForHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60">
          <div className="bg-surface border-l border-border h-full w-full max-w-lg p-6 overflow-y-auto space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h3 className="font-display font-bold text-lg text-textPrimary">Lifecycle Timeline</h3>
                <p className="text-xs font-mono text-accent">{selectedAssetForHistory.asset_tag} — {selectedAssetForHistory.name}</p>
              </div>
              <button
                onClick={() => setSelectedAssetForHistory(null)}
                className="text-textSecondary hover:text-textPrimary font-mono text-sm"
              >
                ✕ Close
              </button>
            </div>

            {historyLoading ? (
              <div className="p-8 text-center text-textSecondary font-mono text-xs">
                Loading asset timeline...
              </div>
            ) : (
              <div className="space-y-4 font-mono text-xs">
                {historyData?.data?.history?.length === 0 ? (
                  <p className="text-textSecondary italic">No historical allocations or maintenance events recorded.</p>
                ) : (
                  historyData?.data?.history?.map((event, i) => (
                    <div key={i} className="border-l-2 border-accent pl-4 py-1 space-y-1">
                      <div className="flex items-center justify-between text-textSecondary">
                        <span>{event.event_type}</span>
                        <span>{event.event_date ? new Date(event.event_date).toLocaleDateString() : ''}</span>
                      </div>
                      <div className="font-semibold text-textPrimary">{event.action_summary}</div>
                      {event.notes && <div className="text-textSecondary text-[11px]">Notes: {event.notes}</div>}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Assets;
