let testEndpointState = {
  status: 200,
  delayMs: 0,
  failReason: null
};

/**
 * Endpoint that monitors can ping during local dev testing
 * GET /api/test-endpoint/ping
 */
const pingTestEndpoint = async (req, res) => {
  if (testEndpointState.delayMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, testEndpointState.delayMs));
  }

  if (testEndpointState.status !== 200) {
    return res.status(testEndpointState.status).json({
      message: testEndpointState.failReason || `Simulated error ${testEndpointState.status}`
    });
  }

  res.status(200).json({ status: 'ok', timestamp: new Date() });
};

/**
 * Toggle test endpoint state to simulate failures or delays on demand
 * POST /api/test-endpoint/toggle
 */
const toggleTestEndpoint = (req, res) => {
  const { status, delayMs, failReason } = req.body;

  if (status !== undefined) testEndpointState.status = Number(status);
  if (delayMs !== undefined) testEndpointState.delayMs = Number(delayMs);
  if (failReason !== undefined) testEndpointState.failReason = failReason;

  res.json({
    message: 'Test endpoint state updated',
    currentState: testEndpointState
  });
};

const getTestEndpointState = (req, res) => {
  res.json(testEndpointState);
};

module.exports = {
  pingTestEndpoint,
  toggleTestEndpoint,
  getTestEndpointState
};
