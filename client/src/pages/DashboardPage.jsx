import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import MonitorFormModal from '../components/MonitorFormModal';

const DashboardPage = () => {
  const [monitors, setMonitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMonitor, setEditingMonitor] = useState(null);

  const fetchMonitors = async () => {
    try {
      const res = await api.get('/monitors');
      setMonitors(res.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load monitors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonitors();
    const interval = setInterval(fetchMonitors, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleCreateOrUpdate = async (formData) => {
    if (editingMonitor) {
      await api.patch(`/monitors/${editingMonitor._id}`, formData);
    } else {
      await api.post('/monitors', formData);
    }
    fetchMonitors();
  };

  const handleTogglePause = async (e, monitor) => {
    e.stopPropagation();
    try {
      const endpoint = monitor.isActive ? `/monitors/${monitor._id}/pause` : `/monitors/${monitor._id}/resume`;
      await api.post(endpoint);
      fetchMonitors();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update monitor state');
    }
  };

  const handleDelete = async (e, monitorId) => {
    e.stopPropagation();
    if (!window.confirm('Remove this monitor and all associated check records?')) return;
    try {
      await api.delete(`/monitors/${monitorId}`);
      fetchMonitors();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete monitor');
    }
  };

  const openCreateModal = () => {
    setEditingMonitor(null);
    setIsModalOpen(true);
  };

  const openEditModal = (e, monitor) => {
    e.stopPropagation();
    setEditingMonitor(monitor);
    setIsModalOpen(true);
  };

  const formatLastChecked = (dateStr) => {
    if (!dateStr) return 'Never';
    const diffSecs = Math.floor((new Date() - new Date(dateStr)) / 1000);
    if (diffSecs < 30) return 'Just now';
    if (diffSecs < 60) return `${diffSecs}s ago`;
    const mins = Math.floor(diffSecs / 60);
    if (mins < 60) return `${mins}m ago`;
    return new Date(dateStr).toLocaleTimeString();
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-[#262C36] pb-4">
        <div>
          <h1 className="text-xl font-semibold text-[#E6E8EB]">Monitors</h1>
          <p className="text-xs text-[#8B94A3] mt-0.5">Active endpoint health and background check status</p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-3.5 py-1.5 bg-[#E8A33D] hover:bg-[#D9942E] text-[#0E1116] font-semibold text-xs rounded transition-colors"
        >
          Add monitor
        </button>
      </div>

      {error && (
        <div className="bg-[#F85149]/10 border border-[#F85149]/30 text-[#F85149] text-xs px-4 py-2.5 rounded font-mono">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-xs text-[#8B94A3] font-mono">
          Loading monitor state...
        </div>
      ) : monitors.length === 0 ? (
        <div className="bg-[#161B22] border border-[#262C36] rounded-md p-8 text-center space-y-3">
          <p className="text-sm font-medium text-[#E6E8EB]">No monitors configured yet.</p>
          <p className="text-xs text-[#8B94A3] max-w-sm mx-auto">
            Add an HTTP endpoint URL to start automated background uptime checks and latency tracking.
          </p>
          <button
            onClick={openCreateModal}
            className="px-3.5 py-1.5 bg-[#E8A33D] hover:bg-[#D9942E] text-[#0E1116] font-semibold text-xs rounded transition-colors"
          >
            Add monitor
          </button>
        </div>
      ) : (
        /* Dense Table Panel */
        <div className="bg-[#161B22] border border-[#262C36] rounded-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-[#161B22] text-[#8B94A3] border-b border-[#262C36] font-medium">
                <tr>
                  <th className="w-8 px-4 py-3 text-center"></th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Target URL</th>
                  <th className="px-4 py-3 text-right">24h Uptime</th>
                  <th className="px-4 py-3 text-right">Interval</th>
                  <th className="px-4 py-3 text-right">Last checked</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262C36]">
                {monitors.map((monitor) => {
                  const isUp = monitor.currentStatus === 'up';
                  const isDown = monitor.currentStatus === 'down';

                  return (
                    <tr
                      key={monitor._id}
                      className="hover:bg-[#1C222B] transition-colors group"
                    >
                      {/* Status indicator dot */}
                      <td className="px-4 py-3.5 text-center">
                        {!monitor.isActive ? (
                          <span
                            className="inline-block w-2.5 h-2.5 rounded-full bg-[#8B94A3]"
                            title="Paused"
                          />
                        ) : isUp ? (
                          <span
                            className="inline-block w-2.5 h-2.5 rounded-full bg-[#3FB950]"
                            title="Online"
                          />
                        ) : isDown ? (
                          <span
                            className="inline-block w-2.5 h-2.5 rounded-full bg-[#F85149] animate-status-down"
                            title="Down"
                          />
                        ) : (
                          <span
                            className="inline-block w-2.5 h-2.5 rounded-full bg-[#8B94A3]"
                            title="Pending initial check"
                          />
                        )}
                      </td>

                      {/* Name */}
                      <td className="px-4 py-3.5 font-semibold text-[#E6E8EB]">
                        <Link
                          to={`/monitors/${monitor._id}`}
                          className="hover:text-[#E8A33D] transition-colors"
                        >
                          {monitor.name}
                        </Link>
                      </td>

                      {/* URL (mono, muted) */}
                      <td className="px-4 py-3.5 font-mono text-[#8B94A3] max-w-xs truncate" title={monitor.url}>
                        {monitor.url}
                      </td>

                      {/* Uptime % (mono) */}
                      <td className="px-4 py-3.5 text-right font-mono text-[#E6E8EB]">
                        {monitor.uptimePercentage !== null ? `${monitor.uptimePercentage}%` : '—'}
                      </td>

                      {/* Interval (mono) */}
                      <td className="px-4 py-3.5 text-right font-mono text-[#8B94A3]">
                        {monitor.interval}m
                      </td>

                      {/* Last checked (mono, muted) */}
                      <td className="px-4 py-3.5 text-right font-mono text-[#8B94A3]">
                        {formatLastChecked(monitor.lastCheckedAt)}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right space-x-3">
                        <Link
                          to={`/monitors/${monitor._id}`}
                          className="text-[#8B94A3] hover:text-[#E6E8EB] transition-colors"
                        >
                          View
                        </Link>
                        <button
                          onClick={(e) => handleTogglePause(e, monitor)}
                          className="text-[#8B94A3] hover:text-[#E6E8EB] transition-colors"
                        >
                          {monitor.isActive ? 'Pause' : 'Resume'}
                        </button>
                        <button
                          onClick={(e) => openEditModal(e, monitor)}
                          className="text-[#8B94A3] hover:text-[#E6E8EB] transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={(e) => handleDelete(e, monitor._id)}
                          className="text-[#F85149] hover:underline transition-colors"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <MonitorFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateOrUpdate}
        initialData={editingMonitor}
        title={editingMonitor ? 'Edit monitor settings' : 'Add monitor'}
      />
    </div>
  );
};

export default DashboardPage;
