import React from 'react';

const IncidentTimeline = ({ incidents = [] }) => {
  if (!incidents || incidents.length === 0) {
    return (
      <div className="bg-[#161B22] border border-[#262C36] rounded-md p-5 text-xs text-[#8B94A3]">
        No incidents recorded. Target endpoint has maintained stability.
      </div>
    );
  }

  const formatDuration = (seconds) => {
    if (!seconds) return 'Ongoing';
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const remainingSecs = seconds % 60;
    return `${mins}m ${remainingSecs}s`;
  };

  return (
    <div className="bg-[#161B22] border border-[#262C36] rounded-md p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-[#262C36] pb-3">
        <h3 className="font-semibold text-sm text-[#E6E8EB]">Incidents</h3>
        <span className="text-xs font-mono text-[#8B94A3]">{incidents.length} total</span>
      </div>

      {/* Simple vertical timeline with hairline connector */}
      <div className="relative pl-6 space-y-5 border-l border-[#262C36] ml-2 my-2">
        {incidents.map((incident) => {
          const isOngoing = incident.status === 'ongoing';

          return (
            <div key={incident._id} className="relative space-y-1 text-xs">
              {/* Timeline Indicator Dot */}
              <span
                className={`absolute -left-[31px] top-1 w-2.5 h-2.5 rounded-full border-2 border-[#161B22] ${
                  isOngoing ? 'bg-[#F85149] animate-status-down' : 'bg-[#3FB950]'
                }`}
              />

              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                <div className="font-medium text-[#E6E8EB]">
                  {incident.reason}
                  {isOngoing && <span className="ml-2 text-[#F85149] font-mono">(Ongoing)</span>}
                </div>
                <div className="font-mono text-[#8B94A3] text-right">
                  Duration: {formatDuration(incident.durationSeconds)}
                </div>
              </div>

              <div className="font-mono text-[#8B94A3] text-[11px]">
                Started {new Date(incident.startedAt).toLocaleString()}
                {incident.resolvedAt && (
                  <span> — Resolved {new Date(incident.resolvedAt).toLocaleString()}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default IncidentTimeline;
