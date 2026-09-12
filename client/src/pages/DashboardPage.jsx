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
      setError(err.response?.data?.message || 'Failed to fetch monitors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonitors();
    // Auto refresh dashboard data every 15 seconds to sync with backend scheduler engine
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
      alert(err.response?.data?.message || 'Failed to update monitor status');
    }
  };

  const handleDelete = async (e, monitorId) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this monitor and all its check history?')) return;
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
    if (!dateStr) return 'Never checked';
    const diffSecs = Math.floor((new Date() - new Date(dateStr)) / 1000);
    if (diffSecs < 30) return 'Just now';
    if (diffSecs < 60) return `${diffSecs}s ago`;
    const mins = Math.floor(diffSecs / 60);
    if (mins < 60) return `${mins}m ago`;
    return new Date(dateStr).toLocaleTimeString();
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Monitors Dashboard</h1>
          <p className="text-sm text-slate-400 mt-1">Live overview of background monitor engines</p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors shadow-sm self-start sm:self-auto"
        >
          <span className="mr-1.5 text-base">+</span> Create Monitor
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-400">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
          <span className="ml-3">Loading live monitor engine...</span>
        </div>
      ) : monitors.length === 0 ? (
        <div className="text-center py-16 bg-slate-800/40 border border-slate-800 rounded-xl p-8 space-y-4">
          <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-2xl text-slate-500">
            📡
          </div>
          <h3 className="text-lg font-medium text-slate-200">No monitors found</h3>
          <p className="text-sm text-slate-400 max-w-sm mx-auto">
            You haven't added any endpoints to monitor yet. Create your first monitor to start background ping checks!
          </p>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
          >
            Create First Monitor
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {monitors.map((monitor) => {
            const isUp = monitor.currentStatus === 'up';
            const isDown = monitor.currentStatus === 'down';

            return (
              <div
                key={monitor._id}
                className="bg-slate-800 border border-slate-700/70 rounded-xl p-5 hover:border-slate-600 transition-all flex flex-col justify-between shadow-lg hover:shadow-indigo-500/5 group"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-100 group-hover:text-indigo-400 transition-colors">
                        {monitor.name}
                      </h3>
                      <p className="text-xs text-slate-400 truncate max-w-[200px] mt-0.5" title={monitor.url}>
                        {monitor.url}
                      </p>
                    </div>

                    {/* Status Badge */}
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

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-700/50 text-xs">
                    <div>
                      <span className="text-slate-400 block">Uptime</span>
                      <span className="text-slate-200 font-semibold">
                        {monitor.uptimePercentage !== null ? `${monitor.uptimePercentage}%` : 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Interval</span>
                      <span className="text-slate-200 font-semibold">{monitor.interval} min</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Last Check</span>
                      <span className="text-slate-200 font-semibold truncate block">
                        {formatLastChecked(monitor.lastCheckedAt)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-700/60 text-xs">
                  <Link
                    to={`/monitors/${monitor._id}`}
                    className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                  >
                    View Details & Incidents →
                  </Link>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(e) => handleTogglePause(e, monitor)}
                      className="px-2 py-1 bg-slate-700/70 hover:bg-slate-700 text-slate-300 rounded transition-colors"
                      title={monitor.isActive ? 'Pause monitoring' : 'Resume monitoring'}
                    >
                      {monitor.isActive ? 'Pause' : 'Resume'}
                    </button>
                    <button
                      onClick={(e) => openEditModal(e, monitor)}
                      className="px-2 py-1 bg-slate-700/70 hover:bg-slate-700 text-slate-300 rounded transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={(e) => handleDelete(e, monitor._id)}
                      className="px-2 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <MonitorFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateOrUpdate}
        initialData={editingMonitor}
        title={editingMonitor ? 'Edit Monitor' : 'Create New Monitor'}
      />
    </div>
  );
};

export default DashboardPage;
