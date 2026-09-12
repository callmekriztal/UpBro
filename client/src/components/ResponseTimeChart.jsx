import React from 'react';

/**
 * Lightweight SVG Response Time Trend Chart Component
 */
const ResponseTimeChart = ({ checks = [] }) => {
  if (!checks || checks.length === 0) {
    return (
      <div className="h-40 flex items-center justify-center text-xs text-slate-500 bg-slate-900/40 rounded-lg border border-slate-800">
        No check data available for response time trend.
      </div>
    );
  }

  // Sort checks chronologically (oldest first for line chart from left to right)
  const sortedChecks = [...checks].sort((a, b) => new Date(a.checkedAt) - new Date(b.checkedAt)).slice(-30);

  const times = sortedChecks.map((c) => c.responseTime || 0);
  const maxTime = Math.max(...times, 100);
  const minTime = Math.min(...times, 0);

  const svgWidth = 600;
  const svgHeight = 150;
  const padding = 20;

  const points = sortedChecks.map((check, index) => {
    const x = padding + (index / (sortedChecks.length - 1 || 1)) * (svgWidth - padding * 2);
    const y = svgHeight - padding - ((check.responseTime - minTime) / (maxTime - minTime || 1)) * (svgHeight - padding * 2);
    return { x, y, responseTime: check.responseTime, success: check.success, date: check.checkedAt };
  });

  const pathD = points.length === 1
    ? `M ${points[0].x} ${points[0].y} L ${svgWidth - padding} ${points[0].y}`
    : points.reduce((acc, point, index) => `${acc} ${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`, '');

  return (
    <div className="bg-slate-900/60 border border-slate-700/60 rounded-xl p-4 space-y-2">
      <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
        <span>Response Time Trend (Last {sortedChecks.length} checks)</span>
        <span className="text-slate-400 font-mono">Max: {maxTime}ms</span>
      </div>

      <div className="w-full overflow-x-auto">
        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-36 overflow-visible">
          {/* Grid lines */}
          <line x1={padding} y1={padding} x2={svgWidth - padding} y2={padding} stroke="#334155" strokeDasharray="3 3" />
          <line x1={padding} y1={svgHeight / 2} x2={svgWidth - padding} y2={svgHeight / 2} stroke="#334155" strokeDasharray="3 3" />
          <line x1={padding} y1={svgHeight - padding} x2={svgWidth - padding} y2={svgHeight - padding} stroke="#334155" />

          {/* Trend line */}
          <path d={pathD} fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* Data points */}
          {points.map((pt, i) => (
            <circle
              key={i}
              cx={pt.x}
              cy={pt.y}
              r="4"
              className={pt.success ? 'fill-emerald-400 stroke-slate-900 stroke-2' : 'fill-red-500 stroke-slate-900 stroke-2'}
            >
              <title>{`${pt.responseTime}ms - ${new Date(pt.date).toLocaleTimeString()}`}</title>
            </circle>
          ))}
        </svg>
      </div>
    </div>
  );
};

export default ResponseTimeChart;
