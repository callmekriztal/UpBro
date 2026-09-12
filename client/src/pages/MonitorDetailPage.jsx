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

  // Test Endpoint State Control Helper
  const [testState, setTestState] = useState({ status: 200, delayMs: 0 });

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
    // Poll data every 10 seconds to update live trends as scheduler executes
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
      alert(err.response?.data?.message || 'Failed to update monitor status');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this monitor?')) return;
    try {
      await api.delete(`/monitors/${id}`);
      navigate('/dashboard');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete monitor');
    }
  };

  // Helper to control local test endpoint state directly from UI
  const handleToggleTestEndpoint = async (status, delayMs = 0) => {
    try {
      await api.post('/test-endpoint/toggle', { status, delayMs });
      setTestState({ status, delayMs });
      alert(`Test endpoint updated: Status ${status}, Delay ${delayMs}ms`);
    } catch (err) {
      alert('Failed to update test endpoint state');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-slate-400">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
        <span className="ml-3">Loading live monitor stats & incidents...</span>
      </div>
    );
  }

  if (error || !monitor) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12 text-center space-y-4">
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg">
          {error || 'Monitor not found'}
        </div>
        <Link to="/dashboard" className="inline-block text-indigo-400 hover:underline text-sm font-medium">
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  const isUp = monitor.currentStatus === 'up';
  const isDown = monitor.currentStatus === 'down';

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      {/* Header & Controls */}
      <div className="space-y-3">
        <Link to="/dashboard" className="text-sm font-medium text-indigo-400 hover:text-indigo-300">
          ← Back to Dashboard
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-slate-100">{monitor.name}</h1>
            {!monitor.isActive ? (
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-700 text-slate-400">
                PAUSED
              </span>
            ) : isUp ? (
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1">
                <span className="animate-pulse">●</span> <span>ONLINE</span>
              </span>
            ) : isDown ? (
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/15 text-red-400 border border-red-500/30 flex items-center space-x-1">
                <span className="animate-pulse">●</span> <span>DOWN</span>
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                PENDING
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleTogglePause}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg transition-colors border border-slate-700"
            >
              {monitor.isActive ? 'Pause Monitor' : 'Resume Monitor'}
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg transition-colors border border-slate-700"
            >
              Edit Settings
            </button>
            <button
              onClick={handleDelete}
              className="px-3.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-medium rounded-lg transition-colors border border-red-500/20"
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* 24h Aggregated Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-800 border border-slate-700/70 rounded-xl p-4">
          <span className="text-xs text-slate-400 block font-medium uppercase tracking-wider">24h Uptime</span>
          <span className="text-2xl font-bold text-slate-100 mt-1 block">
            {stats ? `${stats.uptimePercentage}%` : 'N/A'}
          </span>
        </div>
        <div className="bg-slate-800 border border-slate-700/70 rounded-xl p-4">
          <span className="text-xs text-slate-400 block font-medium uppercase tracking-wider">24h Avg Latency</span>
          <span className="text-2xl font-bold text-slate-100 mt-1 block">
            {stats ? `${stats.avgResponseTime} ms` : 'N/A'}
          </span>
        </div>
        <div className="bg-slate-800 border border-slate-700/70 rounded-xl p-4">
          <span className="text-xs text-slate-400 block font-medium uppercase tracking-wider">Total Checks (24h)</span>
          <span className="text-2xl font-bold text-slate-100 mt-1 block">
            {stats ? stats.totalChecks : '0'}
          </span>
        </div>
        <div className="bg-slate-800 border border-slate-700/70 rounded-xl p-4">
          <span className="text-xs text-slate-400 block font-medium uppercase tracking-wider">Check Frequency</span>
          <span className="text-2xl font-bold text-slate-100 mt-1 block">Every {monitor.interval} m</span>
        </div>
      </div>

      {/* Local Test Helper Controls (If monitor points to localhost test endpoint) */}
      {monitor.url.includes('/api/test-endpoint/ping') && (
        <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-indigo-300">
              🧪 Local Endpoint Test Simulator
            </h4>
            <span className="text-[11px] text-indigo-400">
              Current state: {testState.status === 200 ? '🟢 200 OK' : `🔴 HTTP ${testState.status}`}
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Simulate failures on demand to test how the background scheduler & incident manager respond:
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              onClick={() => handleToggleTestEndpoint(200, 0)}
              className="px-3 py-1 bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 text-xs font-medium rounded hover:bg-emerald-600/30 transition-colors"
            >
              Set 200 OK (Resolve Incident)
            </button>
            <button
              onClick={() => handleToggleTestEndpoint(500, 0)}
              className="px-3 py-1 bg-red-600/20 border border-red-500/30 text-red-300 text-xs font-medium rounded hover:bg-red-600/30 transition-colors"
            >
              Set 500 Server Error (Trigger Incident)
            </button>
            <button
              onClick={() => handleToggleTestEndpoint(200, monitor.timeout + 1000)}
              className="px-3 py-1 bg-amber-600/20 border border-amber-500/30 text-amber-300 text-xs font-medium rounded hover:bg-amber-600/30 transition-colors"
            >
              Set Timeout Delay (Trigger Timeout)
            </button>
          </div>
        </div>
      )}

      {/* Response Time SVG Sparkline / Line Chart */}
      <ResponseTimeChart checks={checks} />

      {/* Incident History Timeline */}
      <IncidentTimeline incidents={incidents} />

      {/* Checks History Log Table */}
      <div className="bg-slate-800 border border-slate-700/70 rounded-xl overflow-hidden shadow-lg">
        <div className="px-6 py-4 border-b border-slate-700/60 flex items-center justify-between">
          <h3 className="font-semibold text-slate-100 text-sm">Recent Ping Check Logs ({checks.length})</h3>
        </div>

        {checks.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            Waiting for the background scheduler engine to execute the first ping check...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/60 uppercase font-semibold text-slate-400 tracking-wider border-b border-slate-700/60">
                <tr>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">HTTP Code</th>
                  <th className="px-6 py-3">Response Time</th>
                  <th className="px-6 py-3">Timestamp</th>
                  <th className="px-6 py-3">Error Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {checks.map((check) => (
                  <tr key={check._id} className="hover:bg-slate-750/50 transition-colors">
                    <td className="px-6 py-3.5 font-medium">
                      {check.success ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                          SUCCESS
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-red-500/15 text-red-400 border border-red-500/20">
                          FAILURE
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3.5 font-mono text-slate-200">{check.statusCode || 'N/A'}</td>
                    <td className="px-6 py-3.5 font-mono text-slate-200">{check.responseTime} ms</td>
                    <td className="px-6 py-3.5 text-slate-400">
                      {new Date(check.checkedAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-3.5 text-slate-400 max-w-xs truncate" title={check.error || ''}>
                      {check.error || '-'}
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
        title="Edit Monitor Settings"
      />
    </div>
  );
};

export default MonitorDetailPage;
