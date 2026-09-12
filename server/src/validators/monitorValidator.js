const validateMonitorInput = (req, res, next) => {
  const { name, url, interval, timeout, expectedStatus } = req.body;

  if (req.method === 'POST' || name !== undefined) {
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ message: 'Monitor name is required' });
    }
  }

  if (req.method === 'POST' || url !== undefined) {
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ message: 'Valid URL is required' });
    }
    try {
      const parsedUrl = new URL(url);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        return res.status(400).json({ message: 'URL must start with http:// or https://' });
      }
    } catch (e) {
      return res.status(400).json({ message: 'Invalid URL format' });
    }
  }

  if (interval !== undefined) {
    if (typeof interval !== 'number' || interval < 1) {
      return res.status(400).json({ message: 'Interval must be a positive number of at least 1 minute' });
    }
  }

  if (timeout !== undefined) {
    if (typeof timeout !== 'number' || timeout < 500) {
      return res.status(400).json({ message: 'Timeout must be a positive number of at least 500ms' });
    }
  }

  if (expectedStatus !== undefined) {
    if (typeof expectedStatus !== 'number' || expectedStatus < 100 || expectedStatus > 599) {
      return res.status(400).json({ message: 'Expected status must be a valid HTTP status code (100-599)' });
    }
  }

  next();
};

module.exports = {
  validateMonitorInput
};
