import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingsApi } from '../api/bookingsApi';
import { assetsApi } from '../api/assetsApi';
import { TagChip } from '../components/TagChip';
import { useAuth } from '../hooks/useAuth';

const HOURS = [
  8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20
];

export function Bookings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Selected date (defaults to today formatted YYYY-MM-DD)
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    return now.toISOString().split('T')[0];
  });

  // Assets query for bookable resources
  const { data: assetsData } = useQuery({
    queryKey: ['assets'],
    queryFn: () => assetsApi.list(),
  });
  const allAssets = Array.isArray(assetsData?.data)
    ? assetsData.data
    : assetsData?.data?.items || assetsData?.data?.data || [];
  const bookableAssets = allAssets.filter(
    (a) => a.is_bookable && !['Lost', 'Retired', 'Disposed'].includes(a.status)
  );

  const [selectedAssetId, setSelectedAssetId] = useState('');

  // Default selectedAssetId when loaded
  const currentAssetId = useMemo(() => {
    if (selectedAssetId) return selectedAssetId;
    if (bookableAssets.length > 0) return bookableAssets[0].id;
    return '';
  }, [selectedAssetId, bookableAssets]);

  const currentAsset = bookableAssets.find((a) => a.id === currentAssetId);

  // Bookings for selected date & resource
  const { data: bookingsData, isLoading } = useQuery({
    queryKey: ['bookings', currentAssetId, selectedDate],
    queryFn: () =>
      bookingsApi.list({
        resourceAssetId: currentAssetId,
      }),
    enabled: Boolean(currentAssetId),
  });

  const allBookings = Array.isArray(bookingsData?.data)
    ? bookingsData.data
    : bookingsData?.data?.items || [];

  // Filter bookings for the selected date
  const dayBookings = useMemo(() => {
    return allBookings.filter((b) => {
      if (b.status === 'Cancelled') return false;
      const bDate = new Date(b.start_time).toISOString().split('T')[0];
      return bDate === selectedDate;
    });
  }, [allBookings, selectedDate]);

  // Modal / Form state
  const [showBookModal, setShowBookModal] = useState(false);
  const [bookForm, setBookForm] = useState({
    startHour: '09:00',
    endHour: '10:00',
    purpose: '',
  });
  const [apiError, setApiError] = useState(null);

  // Draft requested start/end on the current day
  const requestedSlot = useMemo(() => {
    if (!bookForm.startHour || !bookForm.endHour) return null;
    const [sh, sm] = bookForm.startHour.split(':').map(Number);
    const [eh, em] = bookForm.endHour.split(':').map(Number);
    const startNum = sh + sm / 60;
    const endNum = eh + em / 60;
    if (endNum <= startNum) return null;
    return {
      startNum,
      endNum,
      label: `${bookForm.startHour} to ${bookForm.endHour}`,
    };
  }, [bookForm.startHour, bookForm.endHour]);

  // Pre-check overlap inline
  const overlappingBooking = useMemo(() => {
    if (!requestedSlot) return null;
    return dayBookings.find((b) => {
      const bStart = new Date(b.start_time);
      const bEnd = new Date(b.end_time);
      const bStartNum = bStart.getHours() + bStart.getMinutes() / 60;
      const bEndNum = bEnd.getHours() + bEnd.getMinutes() / 60;
      return bStartNum < requestedSlot.endNum && bEndNum > requestedSlot.startNum;
    });
  }, [dayBookings, requestedSlot]);

  // Create booking mutation
  const createMutation = useMutation({
    mutationFn: async () => {
      if (!currentAssetId) throw new Error('Please select a resource asset');
      if (overlappingBooking) {
        throw new Error(
          `Overlaps with existing booking (${overlappingBooking.booked_by_name || 'Booked'}). Slot is unavailable.`
        );
      }
      const startTime = new Date(`${selectedDate}T${bookForm.startHour}:00`).toISOString();
      const endTime = new Date(`${selectedDate}T${bookForm.endHour}:00`).toISOString();
      return bookingsApi.create({
        resourceAssetId: currentAssetId,
        startTime,
        endTime,
        purpose: bookForm.purpose,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      setShowBookModal(false);
      setBookForm({ startHour: '09:00', endHour: '10:00', purpose: '' });
      setApiError(null);
    },
    onError: (err) => {
      const msg =
        err?.response?.data?.error?.message ||
        err?.message ||
        'Failed to book slot. Overlaps with existing reservation.';
      setApiError(msg);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id) => bookingsApi.cancel(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bookings'] }),
  });

  // Calculate top/height % for vertical grid block (8:00 to 20:00 = 12 hours total)
  const getPositionStyles = (startNum, endNum) => {
    const gridStart = 8;
    const gridSpan = 12; // 8am to 8pm
    const clampedStart = Math.max(gridStart, startNum);
    const clampedEnd = Math.min(gridStart + gridSpan, endNum);
    const topPercent = ((clampedStart - gridStart) / gridSpan) * 100;
    const heightPercent = ((clampedEnd - clampedStart) / gridSpan) * 100;
    return {
      top: `${topPercent}%`,
      height: `${Math.max(4, heightPercent)}%`,
    };
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-textPrimary">Resource Booking</h1>
          <p className="text-sm text-textSecondary mt-1">
            Single-resource daily time-slot schedule with real-time conflict prevention
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Resource Picker */}
          <select
            value={currentAssetId}
            onChange={(e) => setSelectedAssetId(e.target.value)}
            className="bg-surface border border-border rounded-[8px] px-3 py-2 text-xs font-mono text-textPrimary focus:outline-none focus:border-accent"
          >
            {bookableAssets.length === 0 && <option value="">No Bookable Assets</option>}
            {bookableAssets.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} ({a.asset_tag})
              </option>
            ))}
          </select>

          {/* Date Picker */}
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-surface border border-border rounded-[8px] px-3 py-2 text-xs font-mono text-textPrimary focus:outline-none focus:border-accent"
          />

          {/* Book Slot Button */}
          <button
            onClick={() => {
              setApiError(null);
              setShowBookModal(true);
            }}
            disabled={!currentAssetId}
            className="px-4 py-2 rounded-[8px] bg-accent text-bg text-xs font-mono font-semibold uppercase tracking-wider hover:opacity-90 disabled:opacity-50"
          >
            + Book A Slot
          </button>
        </div>
      </div>

      {/* Selected Resource Title Card */}
      <div className="bg-surface border border-border rounded-[8px] p-4 flex items-center justify-between">
        <div>
          <span className="text-xs font-mono text-accent uppercase tracking-wider">
            Active Schedule View
          </span>
          <h3 className="font-display font-bold text-lg text-textPrimary">
            {currentAsset ? `${currentAsset.name} (${currentAsset.asset_tag})` : 'Select a resource'}
            {' — '}
            <span className="text-textSecondary font-mono text-sm">
              {new Date(selectedDate).toLocaleDateString(undefined, {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </h3>
        </div>

        {requestedSlot && (
          <div className="text-xs font-mono text-right">
            {overlappingBooking ? (
              <span className="text-red-400 font-bold bg-red-500/10 px-2.5 py-1 rounded-[4px] border border-red-500/30">
                Requested {requestedSlot.label} — conflict, slot is unavailable
              </span>
            ) : (
              <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-[4px] border border-emerald-500/30">
                Requested {requestedSlot.label} — Slot Available
              </span>
            )}
          </div>
        )}
      </div>

      {/* SINGLE-RESOURCE SINGLE-DAY VERTICAL TIME-SLOT GRID */}
      <div className="bg-surface border border-border rounded-[8px] p-6">
        <div className="relative border-l border-border pl-16">
          {/* Hourly time rows */}
          <div className="space-y-0 divide-y divide-border/40">
            {HOURS.map((hr) => (
              <div key={hr} className="h-16 relative flex items-start">
                <span className="absolute -left-14 top-0 text-xs font-mono text-textSecondary">
                  {hr === 12 ? '12:00 PM' : hr > 12 ? `${hr - 12}:00 PM` : `${hr}:00 AM`}
                </span>
              </div>
            ))}
          </div>

          {/* ABSOLUTE OVERLAY FOR BOOKING BLOCKS */}
          <div className="absolute inset-x-0 top-0 bottom-0 pl-16 pr-4 pointer-events-none">
            {/* Existing solid bookings */}
            {dayBookings.map((b) => {
              const bStart = new Date(b.start_time);
              const bEnd = new Date(b.end_time);
              const startNum = bStart.getHours() + bStart.getMinutes() / 60;
              const endNum = bEnd.getHours() + bEnd.getMinutes() / 60;
              const styles = getPositionStyles(startNum, endNum);

              return (
                <div
                  key={b.id}
                  style={styles}
                  className="absolute left-16 right-4 rounded-[6px] bg-accent/20 border-l-4 border-accent p-2.5 flex items-center justify-between pointer-events-auto transition-all hover:bg-accent/30"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-textPrimary">
                        Booked — {b.booked_by_name || 'Team Member'}
                      </span>
                      <TagChip status={b.status?.toUpperCase() || 'UPCOMING'} />
                    </div>
                    <p className="text-xs text-textSecondary mt-0.5">
                      {b.purpose || 'Reserved Resource Slot'} —{' '}
                      <span className="font-mono">
                        {bStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} to{' '}
                        {bEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </p>
                  </div>

                  {(b.booked_by === user?.id || ['Admin', 'AssetManager'].includes(user?.role)) && (
                    <button
                      onClick={() => cancelMutation.mutate(b.id)}
                      className="text-[11px] font-mono text-red-400 hover:text-red-300 px-2 py-1 rounded bg-surface border border-border"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              );
            })}

            {/* Requested draft slot visual representation */}
            {showBookModal && requestedSlot && (
              <div
                style={getPositionStyles(requestedSlot.startNum, requestedSlot.endNum)}
                className={`absolute left-16 right-4 rounded-[6px] border-2 border-dashed p-2.5 flex items-center justify-between ${
                  overlappingBooking
                    ? 'border-red-500 bg-red-500/15 text-red-400'
                    : 'border-emerald-500 bg-emerald-500/15 text-emerald-400'
                }`}
              >
                <div className="font-mono text-xs font-bold">
                  {overlappingBooking ? (
                    <span>
                      Requested {requestedSlot.label} — conflict, slot is unavailable (Overlaps
                      with {overlappingBooking.booked_by_name})
                    </span>
                  ) : (
                    <span>
                      Requested {requestedSlot.label} — No Overlap (Ready to submit)
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* BOOKING LIST TABLE BELOW GRID */}
      <div className="bg-surface border border-border rounded-[8px] overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="font-display font-bold text-sm text-textPrimary">
            Day Reservations List ({dayBookings.length})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-surfaceAlt text-[11px] font-mono uppercase text-textSecondary">
                <th className="py-3 px-6">Time Slot</th>
                <th className="py-3 px-6">Booked By</th>
                <th className="py-3 px-6">Purpose</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-xs font-mono">
              {dayBookings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-textSecondary">
                    No bookings scheduled for this date.
                  </td>
                </tr>
              ) : (
                dayBookings.map((b) => {
                  const bStart = new Date(b.start_time);
                  const bEnd = new Date(b.end_time);
                  return (
                    <tr key={b.id} className="hover:bg-surfaceAlt/50">
                      <td className="py-3 px-6 text-textPrimary">
                        {bStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} –{' '}
                        {bEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-6 text-textPrimary">{b.booked_by_name || b.booked_by}</td>
                      <td className="py-3 px-6 text-textSecondary">{b.purpose || '—'}</td>
                      <td className="py-3 px-6">
                        <TagChip status={b.status?.toUpperCase() || 'UPCOMING'} />
                      </td>
                      <td className="py-3 px-6 text-right">
                        {(b.booked_by === user?.id || ['Admin', 'AssetManager'].includes(user?.role)) && (
                          <button
                            onClick={() => cancelMutation.mutate(b.id)}
                            className="text-red-400 hover:text-red-300 underline"
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE BOOKING MODAL */}
      {showBookModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-surface border border-border rounded-[8px] w-full max-w-md p-6 space-y-4">
            <h3 className="font-display font-bold text-lg text-textPrimary">
              Book Resource Slot
            </h3>

            {apiError && (
              <div className="p-3 rounded-[6px] bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono">
                {apiError}
              </div>
            )}

            {overlappingBooking && !apiError && (
              <div className="p-3 rounded-[6px] bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono">
                Requested {requestedSlot?.label} — conflict, slot is unavailable. Overlaps with{' '}
                {overlappingBooking.booked_by_name || 'an existing booking'}.
              </div>
            )}

            <div className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-textSecondary mb-1">Start Time (HH:MM)</label>
                <input
                  type="time"
                  value={bookForm.startHour}
                  onChange={(e) => setBookForm((prev) => ({ ...prev, startHour: e.target.value }))}
                  className="w-full bg-surfaceAlt border border-border rounded-[6px] px-3 py-2 text-textPrimary focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-textSecondary mb-1">End Time (HH:MM)</label>
                <input
                  type="time"
                  value={bookForm.endHour}
                  onChange={(e) => setBookForm((prev) => ({ ...prev, endHour: e.target.value }))}
                  className="w-full bg-surfaceAlt border border-border rounded-[6px] px-3 py-2 text-textPrimary focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-textSecondary mb-1">Purpose / Note</label>
                <input
                  type="text"
                  placeholder="e.g. Procurement Team Sprint Planning"
                  value={bookForm.purpose}
                  onChange={(e) => setBookForm((prev) => ({ ...prev, purpose: e.target.value }))}
                  className="w-full bg-surfaceAlt border border-border rounded-[6px] px-3 py-2 text-textPrimary focus:outline-none focus:border-accent"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowBookModal(false)}
                className="px-4 py-2 rounded-[6px] border border-border text-xs font-mono text-textSecondary hover:text-textPrimary"
              >
                Close
              </button>
              <button
                disabled={Boolean(overlappingBooking) || createMutation.isPending}
                onClick={() => createMutation.mutate()}
                className="px-4 py-2 rounded-[6px] bg-accent text-bg text-xs font-mono font-semibold uppercase hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Confirm Booking
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Bookings;
