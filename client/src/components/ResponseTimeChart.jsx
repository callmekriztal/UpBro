import React from 'react';

/**
 * Precision Monospaced Response Time SVG Chart
 */
const ResponseTimeChart = ({ checks = [] }) => {
  if (!checks || checks.length === 0) {
    return (
      <div className="h-32 flex items-center justify-center text-xs font-mono text-[#8B94A3] bg-[#161B22] border border-[#262C36] rounded-md">
        No response time data collected yet.
      </div>
    );
  }

  const sortedChecks = [...checks].sort((a, b) => new Date(a.checkedAt) - new Date(b.checkedAt)).slice(-30);
  const times = sortedChecks.map((c) => c.responseTime || 0);
  const maxTime = Math.max(...times, 100);
  const minTime = Math.min(...times, 0);

  const svgWidth = 600;
  const svgHeight = 140;
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
    <div className="bg-[#161B22] border border-[#262C36] rounded-md p-4 space-y-3">
      <div className="flex items-center justify-between text-xs font-mono">
        <span className="text-[#E6E8EB] font-medium">Response time (ms)</span>
        <span className="text-[#8B94A3]">Max: {maxTime}ms</span>
      </div>

      <div className="w-full overflow-x-auto">
        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-32 overflow-visible">
          {/* Grid lines */}
          <line x1={padding} y1={padding} x2={svgWidth - padding} y2={padding} stroke="#262C36" strokeDasharray="3 3" />
          <line x1={padding} y1={svgHeight / 2} x2={svgWidth - padding} y2={svgHeight / 2} stroke="#262C36" strokeDasharray="3 3" />
          <line x1={padding} y1={svgHeight - padding} x2={svgWidth - padding} y2={svgHeight - padding} stroke="#262C36" />

          {/* Trend line */}
          <path d={pathD} fill="none" stroke="#E8A33D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

          {/* Data points */}
          {points.map((pt, i) => (
            <circle
              key={i}
              cx={pt.x}
              cy={pt.y}
              r="3.5"
              fill={pt.success ? '#3FB950' : '#F85149'}
              stroke="#0E1116"
              strokeWidth="1.5"
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
