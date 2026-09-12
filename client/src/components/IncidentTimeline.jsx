import React from 'react';

const IncidentTimeline = ({ incidents = [] }) => {
  if (!incidents || incidents.length === 0) {
    return (
      <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-6 text-center text-xs text-slate-400">
        🎉 No incidents recorded! This monitor has been stable.
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
    <div className="bg-slate-800 border border-slate-700/70 rounded-xl overflow-hidden shadow-lg space-y-4 p-5">
      <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
        <h3 className="font-semibold text-slate-100 text-sm flex items-center space-x-2">
          <span>🚨 Incident History</span>
          <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full font-normal">
            {incidents.length}
          </span>
        </h3>
      </div>

      <div className="space-y-3">
        {incidents.map((incident) => {
          const isOngoing = incident.status === 'ongoing';

          return (
            <div
              key={incident._id}
              className={`p-4 rounded-lg border text-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
                isOngoing
                  ? 'bg-red-500/10 border-red-500/30 text-red-200'
                  : 'bg-slate-900/60 border-slate-700/60 text-slate-300'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  {isOngoing ? (
                    <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-red-500 text-white animate-pulse">
                      ONGOING INCIDENT
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      RESOLVED
                    </span>
                  )}
                  <span className="font-medium text-slate-200">{incident.reason}</span>
                </div>
                <div className="text-slate-400 text-[11px]">
                  Started: {new Date(incident.startedAt).toLocaleString()}
                  {incident.resolvedAt && (
                    <span> • Resolved: {new Date(incident.resolvedAt).toLocaleString()}</span>
                  )}
                </div>
              </div>

              <div className="text-right flex sm:flex-col justify-between items-center sm:items-end">
                <span className="text-slate-400">Duration</span>
                <span className="font-semibold text-slate-200 font-mono">
                  {formatDuration(incident.durationSeconds)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default IncidentTimeline;
