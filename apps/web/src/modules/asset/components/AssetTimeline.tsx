import React from 'react';
import { AssetHistory } from '../types';
import { Plus, Edit3, ArrowLeftRight, Wrench, CheckCircle, Info } from 'lucide-react';

interface AssetTimelineProps {
  timeline: AssetHistory[];
}

export function AssetTimeline({ timeline }: AssetTimelineProps) {
  if (!timeline || timeline.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center bg-gray-50 border border-dashed rounded-lg p-6">
        <Info className="w-8 h-8 text-gray-400 mb-2" />
        <h3 className="font-semibold text-gray-700 text-sm">No activity recorded</h3>
        <p className="text-xs text-gray-500 max-w-xs mt-1">This asset has no historical log events.</p>
      </div>
    );
  }

  const getActionConfig = (action: string) => {
    switch (action.toUpperCase()) {
      case 'CREATED':
        return {
          bgColor: 'bg-emerald-100 text-emerald-700 border-emerald-200',
          icon: Plus,
        };
      case 'UPDATED':
        return {
          bgColor: 'bg-blue-100 text-blue-700 border-blue-200',
          icon: Edit3,
        };
      case 'ALLOCATED':
      case 'RETURNED':
      case 'TRANSFERRED':
        return {
          bgColor: 'bg-indigo-100 text-indigo-700 border-indigo-200',
          icon: ArrowLeftRight,
        };
      case 'MAINTENANCE':
      case 'UNDER_MAINTENANCE':
        return {
          bgColor: 'bg-amber-100 text-amber-700 border-amber-200',
          icon: Wrench,
        };
      case 'DISPOSED':
      case 'DELETED':
        return {
          bgColor: 'bg-rose-100 text-rose-700 border-rose-200',
          icon: Info,
        };
      default:
        return {
          bgColor: 'bg-gray-100 text-gray-700 border-gray-200',
          icon: CheckCircle,
        };
    }
  };

  return (
    <div className="flow-root pt-4">
      <ul className="-mb-8">
        {timeline.map((event, eventIdx) => {
          const config = getActionConfig(event.action);
          const IconComponent = config.icon;
          return (
            <li key={event.id}>
              <div className="relative pb-8">
                {eventIdx !== timeline.length - 1 ? (
                  <span className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                ) : null}
                <div className="relative flex space-x-3">
                  <div>
                    <span className={`h-10 w-10 rounded-full flex items-center justify-center ring-8 ring-white border ${config.bgColor}`}>
                      <IconComponent className="w-5 h-5" />
                    </span>
                  </div>
                  <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {event.action.replace('_', ' ')}
                      </p>
                      {event.remarks && (
                        <p className="text-sm text-gray-500 mt-0.5">{event.remarks}</p>
                      )}
                      
                      {event.performer && (
                        <p className="text-xs text-gray-400 mt-1">
                          by <span className="font-medium text-gray-600">{event.performer.firstName} {event.performer.lastName}</span> ({event.performer.email})
                        </p>
                      )}
                    </div>
                    <div className="whitespace-nowrap text-right text-xs text-gray-500 font-medium">
                      <time dateTime={event.performedAt}>
                        {new Date(event.performedAt).toLocaleString()}
                      </time>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
