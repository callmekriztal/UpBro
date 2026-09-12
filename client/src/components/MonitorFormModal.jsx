import React, { useState, useEffect } from 'react';

const MonitorFormModal = ({ isOpen, onClose, onSubmit, initialData = null, title = 'Add monitor' }) => {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [interval, setInterval] = useState(5);
  const [timeout, setTimeout] = useState(5000);
  const [expectedStatus, setExpectedStatus] = useState(200);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setUrl(initialData.url || '');
      setInterval(initialData.interval || 5);
      setTimeout(initialData.timeout || 5000);
      setExpectedStatus(initialData.expectedStatus || 200);
    } else {
      setName('');
      setUrl('');
      setInterval(5);
      setTimeout(5000);
      setExpectedStatus(200);
    }
    setError('');
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Monitor name is required');
      return;
    }

    if (!url.trim()) {
      setError('Target URL is required');
      return;
    }

    try {
      const parsedUrl = new URL(url);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        setError('URL must use http:// or https:// protocol');
        return;
      }
    } catch (e) {
      setError('Enter a valid URL (e.g. https://api.example.com/health)');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        url: url.trim(),
        method: 'GET',
        interval: Number(interval),
        timeout: Number(timeout),
        expectedStatus: Number(expectedStatus)
      });
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save monitor configuration');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0E1116]/80 backdrop-blur-xs">
      <div className="bg-[#161B22] border border-[#262C36] rounded-md shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex justify-between items-center px-5 py-3.5 border-b border-[#262C36]">
          <h3 className="text-sm font-semibold text-[#E6E8EB]">{title}</h3>
          <button
            onClick={onClose}
            className="text-[#8B94A3] hover:text-[#E6E8EB] transition-colors text-lg"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="bg-[#F85149]/10 border border-[#F85149]/30 text-[#F85149] text-xs px-3 py-2 rounded font-mono">
              {error}
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-xs text-[#8B94A3]">Monitor name</label>
            <input
              type="text"
              placeholder="Auth Service API"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-1.5 bg-[#0E1116] border border-[#262C36] rounded text-[#E6E8EB] text-xs focus:outline-none focus:border-[#E8A33D]"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs text-[#8B94A3]">Target URL</label>
            <input
              type="url"
              placeholder="https://api.example.com/health"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-3 py-1.5 bg-[#0E1116] border border-[#262C36] rounded text-[#E6E8EB] text-xs font-mono focus:outline-none focus:border-[#E8A33D]"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="block text-xs text-[#8B94A3]">Interval (mins)</label>
              <input
                type="number"
                min="1"
                value={interval}
                onChange={(e) => setInterval(e.target.value)}
                className="w-full px-3 py-1.5 bg-[#0E1116] border border-[#262C36] rounded text-[#E6E8EB] text-xs font-mono focus:outline-none focus:border-[#E8A33D]"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs text-[#8B94A3]">Timeout (ms)</label>
              <input
                type="number"
                min="500"
                step="500"
                value={timeout}
                onChange={(e) => setTimeout(e.target.value)}
                className="w-full px-3 py-1.5 bg-[#0E1116] border border-[#262C36] rounded text-[#E6E8EB] text-xs font-mono focus:outline-none focus:border-[#E8A33D]"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs text-[#8B94A3]">Status code</label>
              <input
                type="number"
                value={expectedStatus}
                onChange={(e) => setExpectedStatus(e.target.value)}
                className="w-full px-3 py-1.5 bg-[#0E1116] border border-[#262C36] rounded text-[#E6E8EB] text-xs font-mono focus:outline-none focus:border-[#E8A33D]"
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-[#262C36]">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-[#8B94A3] hover:text-[#E6E8EB] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-3.5 py-1.5 text-xs font-semibold bg-[#E8A33D] hover:bg-[#D9942E] text-[#0E1116] rounded transition-colors disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Save monitor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MonitorFormModal;
