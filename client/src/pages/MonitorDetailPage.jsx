import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import MonitorFormModal from '../components/MonitorFormModal';
import ResponseTimeChart from '../components/ResponseTimeChart';
import IncidentTimeline from '../components/IncidentTimeline';

const MonitorDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [monitor, setMonitor] = useState(null);
  const [stats, setStats] = useState(null);
  const [checks, setChecks] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchMonitorData = async () => {
    try {
      const [monitorRes, statsRes, checksRes, incidentsRes] = await Promise.all([
        api.get(`/monitors/${id}`),
        api.get(`/monitors/${id}/stats`),
        api.get(`/monitors/${id}/checks`),
        api.get(`/monitors/${id}/incidents`)
      ]);

      setMonitor(monitorRes.data);
      setStats(statsRes.data);
      setChecks(checksRes.data);
      setIncidents(incidentsRes.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load monitor details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonitorData();
    const interval = setInterval(fetchMonitorData, 10000);
    return () => clearInterval(interval);
  }, [id]);

  const handleUpdateMonitor = async (formData) => {
    await api.patch(`/monitors/${id}`, formData);
    fetchMonitorData();
  };

  const handleTogglePause = async () => {
    try {
      const endpoint = monitor.isActive ? `/monitors/${id}/pause` : `/monitors/${id}/resume`;
      await api.post(endpoint);
      fetchMonitorData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update monitor state');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Remove this monitor and all check records?')) return;
    try {
      await api.delete(`/monitors/${id}`);
      navigate('/dashboard');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete monitor');
    }
  };

  const handleToggleTestEndpoint = async (status, delayMs = 0) => {
    try {
      await api.post('/test-endpoint/toggle', { status, delayMs });
      alert(`Test endpoint set: HTTP ${status}, Delay ${delayMs}ms`);
    } catch (err) {
      alert('Failed to update test endpoint state');
    }
  };

  if (loading) {
    return (
      <div className="py-16 text-center text-xs text-[#8B94A3] font-mono">
        Loading monitor state...
      </div>
    );
  }

  if (error || !monitor) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12 text-center space-y-4">
        <div className="bg-[#F85149]/10 border border-[#F85149]/30 text-[#F85149] text-xs px-4 py-2.5 rounded font-mono">
          {error || 'Monitor not found'}
        </div>
        <Link to="/dashboard" className="inline-block text-[#8B94A3] hover:text-[#E6E8EB] text-xs">
          Back to Monitors list
        </Link>
      </div>
    );
  }

  const isUp = monitor.currentStatus === 'up';
  const isDown = monitor.currentStatus === 'down';

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      {/* Top Header & Action Controls */}
      <div className="space-y-3">
        <Link to="/dashboard" className="text-xs text-[#8B94A3] hover:text-[#E6E8EB] transition-colors">
          Back to Monitors list
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#262C36] pb-4">
          <div className="flex items-center space-x-3">
            <h1 className="text-xl font-semibold text-[#E6E8EB]">{monitor.name}</h1>
            <span className="font-mono text-xs text-[#8B94A3]">{monitor.url}</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleTogglePause}
              className="px-3 py-1 bg-[#161B22] hover:bg-[#1C222B] text-[#E6E8EB] text-xs border border-[#262C36] rounded transition-colors"
            >
              {monitor.isActive ? 'Pause' : 'Resume'}
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-3 py-1 bg-[#161B22] hover:bg-[#1C222B] text-[#E6E8EB] text-xs border border-[#262C36] rounded transition-colors"
            >
              Edit
            </button>
            <button
              onClick={handleDelete}
              className="px-3 py-1 bg-[#161B22] hover:bg-[#1C222B] text-[#F85149] text-xs border border-[#262C36] rounded transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Quiet Horizontal Strip Stats Panel */}
      <div className="bg-[#161B22] border border-[#262C36] rounded-md divide-y sm:divide-y-0 sm:divide-x divide-[#262C36] grid grid-cols-2 sm:grid-cols-4 text-xs">
        <div className="p-4 space-y-0.5">
          <span className="text-[#8B94A3] block">Status</span>
          <div className="flex items-center space-x-2">
            {!monitor.isActive ? (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-[#8B94A3]" />
                <span className="font-medium text-[#8B94A3]">Paused</span>
              </>
            ) : isUp ? (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-[#3FB950]" />
                <span className="font-medium text-[#3FB950]">Online</span>
              </>
            ) : isDown ? (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-[#F85149] animate-status-down" />
                <span className="font-medium text-[#F85149]">Down</span>
              </>
            ) : (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-[#8B94A3]" />
                <span className="font-medium text-[#8B94A3]">Pending</span>
              </>
            )}
          </div>
        </div>

        <div className="p-4 space-y-0.5">
          <span className="text-[#8B94A3] block">24h Uptime</span>
          <span className="font-mono font-medium text-[#E6E8EB]">
            {stats ? `${stats.uptimePercentage}%` : '—'}
          </span>
        </div>

        <div className="p-4 space-y-0.5">
          <span className="text-[#8B94A3] block">24h Avg latency</span>
          <span className="font-mono font-medium text-[#E6E8EB]">
            {stats ? `${stats.avgResponseTime} ms` : '—'}
          </span>
        </div>

        <div className="p-4 space-y-0.5">
          <span className="text-[#8B94A3] block">Check interval</span>
          <span className="font-mono font-medium text-[#E6E8EB]">
            Every {monitor.interval}m
          </span>
        </div>
      </div>

      {/* System Downtime Resumed Quiet Notice */}
      {stats?.systemDowntimeGap && (
        <div className="bg-[#161B22] border border-[#262C36] text-[#8B94A3] text-xs px-4 py-2.5 rounded-md flex items-center justify-between font-mono">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-[#E8A33D]" />
            <span>
              [System Note] Monitoring resumed after reboot/pause (Last check: {new Date(stats.systemDowntimeGap.lastCheckedAt).toLocaleTimeString()})
            </span>
          </div>
          <span className="text-[11px] text-[#8B94A3]/80 hidden sm:inline">Monitoring gap not logged as target outage</span>
        </div>
      )}

      {/* Local Endpoint Simulator Helper (If endpoint points to local test URL) */}
      {monitor.url.includes('/api/test-endpoint/ping') && (
        <div className="bg-[#161B22] border border-[#262C36] rounded-md p-4 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-[#E8A33D]">Local Endpoint Test Simulator</span>
            <span className="font-mono text-[#8B94A3]">Stage 2/3 test helper</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              onClick={() => handleToggleTestEndpoint(200, 0)}
              className="px-2.5 py-1 border border-[#262C36] hover:border-[#3FB950] text-[#3FB950] font-mono rounded transition-colors"
            >
              Set 200 OK
            </button>
            <button
              onClick={() => handleToggleTestEndpoint(500, 0)}
              className="px-2.5 py-1 border border-[#262C36] hover:border-[#F85149] text-[#F85149] font-mono rounded transition-colors"
            >
              Set 500 Error
            </button>
            <button
              onClick={() => handleToggleTestEndpoint(200, monitor.timeout + 1000)}
              className="px-2.5 py-1 border border-[#262C36] hover:border-[#8B94A3] text-[#8B94A3] font-mono rounded transition-colors"
            >
              Set Timeout Delay
            </button>
          </div>
        </div>
      )}

      {/* Response Time Monospaced SVG Chart */}
      <ResponseTimeChart checks={checks} />

      {/* Incident History Timeline */}
      <IncidentTimeline incidents={incidents} />

      {/* Raw Check History Table */}
      <div className="bg-[#161B22] border border-[#262C36] rounded-md overflow-hidden">
        <div className="px-5 py-3 border-b border-[#262C36]">
          <h3 className="font-semibold text-xs text-[#E6E8EB]">Check history</h3>
        </div>

        {checks.length === 0 ? (
          <div className="p-6 text-center text-xs text-[#8B94A3] font-mono">
            No check records captured yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#161B22] text-[#8B94A3] border-b border-[#262C36] font-medium">
                <tr>
                  <th className="px-5 py-2.5">Result</th>
                  <th className="px-5 py-2.5">Status code</th>
                  <th className="px-5 py-2.5">Response time</th>
                  <th className="px-5 py-2.5">Timestamp</th>
                  <th className="px-5 py-2.5">Error details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262C36]">
                {checks.map((check) => (
                  <tr key={check._id} className="hover:bg-[#1C222B] transition-colors font-mono">
                    <td className="px-5 py-2.5">
                      {check.success ? (
                        <span className="text-[#3FB950] font-semibold">SUCCESS</span>
                      ) : (
                        <span className="text-[#F85149] font-semibold">FAILURE</span>
                      )}
                    </td>
                    <td className="px-5 py-2.5 text-[#E6E8EB]">{check.statusCode || '—'}</td>
                    <td className="px-5 py-2.5 text-[#E6E8EB]">{check.responseTime} ms</td>
                    <td className="px-5 py-2.5 text-[#8B94A3]">
                      {new Date(check.checkedAt).toLocaleString()}
                    </td>
                    <td className="px-5 py-2.5 text-[#8B94A3] max-w-xs truncate" title={check.error || ''}>
                      {check.error || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <MonitorFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleUpdateMonitor}
        initialData={monitor}
        title="Edit monitor settings"
      />
    </div>
  );
};

export default MonitorDetailPage;
