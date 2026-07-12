import React from 'react';

/**
 * SIGNATURE COMPONENT — TagChip
 * Physical inventory tag aesthetic with notched left edge.
 */
export function TagChip({ status, label, className = '' }) {
  const normalized = (status || label || '').toLowerCase().trim();

  // Color mapping
  const getColorStyles = () => {
    switch (normalized) {
      case 'available':
      case 'active':
      case 'passed':
      case 'verified':
        return {
          bg: 'rgba(59, 142, 90, 0.15)',
          border: 'var(--status-available)',
          text: 'var(--status-available)',
        };
      case 'allocated':
      case 'in_progress':
      case 'in progress':
        return {
          bg: 'rgba(46, 90, 172, 0.15)',
          border: 'var(--status-allocated)',
          text: 'var(--status-allocated)',
        };
      case 'reserved':
      case 'pending':
        return {
          bg: 'rgba(116, 85, 176, 0.15)',
          border: 'var(--status-reserved)',
          text: 'var(--status-reserved)',
        };
      case 'under maintenance':
      case 'maintenance':
      case 'medium':
        return {
          bg: 'rgba(181, 119, 42, 0.15)',
          border: 'var(--status-maintenance)',
          text: 'var(--status-maintenance)',
        };
      case 'lost':
      case 'overdue':
      case 'high':
      case 'failed':
        return {
          bg: 'rgba(192, 57, 43, 0.15)',
          border: 'var(--status-lost)',
          text: 'var(--status-lost)',
        };
      case 'retired':
      case 'low':
        return {
          bg: 'rgba(107, 114, 128, 0.15)',
          border: 'var(--status-retired)',
          text: 'var(--status-retired)',
        };
      case 'disposed':
        return {
          bg: 'rgba(75, 85, 99, 0.2)',
          border: 'var(--status-retired)',
          text: 'var(--status-retired)',
          strike: true,
        };
      default:
        return {
          bg: 'var(--surface-alt)',
          border: 'var(--border)',
          text: 'var(--text-primary)',
        };
    }
  };

  const styles = getColorStyles();
  const displayLabel = label || status || '';

  return (
    <span
      className={`relative inline-flex items-center pl-3.5 pr-2.5 py-0.5 rounded-[2px] border font-mono text-[12px] uppercase tracking-[0.02em] font-medium leading-tight ${className}`}
      style={{
        backgroundColor: styles.bg,
        borderColor: styles.border,
        color: styles.text,
        textDecoration: styles.strike ? 'line-through' : 'none',
      }}
    >
      {/* Small circular notch cut into left edge (like a physical tag hole) */}
      <span
        className="absolute -left-[4px] top-1/2 -translate-y-1/2 w-[8px] h-[8px] rounded-full border border-r-0"
        style={{
          backgroundColor: 'var(--bg)',
          borderColor: styles.border,
        }}
        aria-hidden="true"
      />
      <span>{displayLabel}</span>
    </span>
  );
}

export default TagChip;
