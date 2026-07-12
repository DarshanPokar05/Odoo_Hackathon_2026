import React from 'react';
import { AssetHistory } from '../types';

interface AssetTimelineProps {
  timeline: AssetHistory[];
}

export function AssetTimeline({ timeline }: AssetTimelineProps) {
  if (!timeline || timeline.length === 0) {
    return <div className="text-gray-500 py-4">No history available for this asset.</div>;
  }

  return (
    <div className="flow-root mt-6">
      <ul className="-mb-8">
        {timeline.map((event, eventIdx) => (
          <li key={event.id}>
            <div className="relative pb-8">
              {eventIdx !== timeline.length - 1 ? (
                <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
              ) : null}
              <div className="relative flex space-x-3">
                <div>
                  <span className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center ring-8 ring-white">
                    <span className="text-white text-xs font-medium">{event.action.substring(0, 1)}</span>
                  </span>
                </div>
                <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                  <div>
                    <p className="text-sm text-gray-500">
                      <span className="font-medium text-gray-900">{event.action}</span>
                      {event.remarks && <span className="ml-2">- {event.remarks}</span>}
                    </p>
                    {event.performer && (
                      <p className="text-xs text-gray-400 mt-1">
                        by {event.performer.firstName} {event.performer.lastName}
                      </p>
                    )}
                  </div>
                  <div className="whitespace-nowrap text-right text-sm text-gray-500">
                    <time dateTime={event.performedAt}>
                      {new Date(event.performedAt).toLocaleDateString()}
                    </time>
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
