let testEndpointState = {
  status: 200,
  delayMs: 0,
  failReason: null,
  simulatedGlitch: null // 'TRANSIENT_WORKER_GLITCH'
};

/**
 * Endpoint that monitors ping during local dev testing
 * GET /api/test-endpoint/ping
 */
const pingTestEndpoint = async (req, res) => {
  if (testEndpointState.delayMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, testEndpointState.delayMs));
  }

  if (testEndpointState.simulatedGlitch) {
    return res.status(200).json({
      status: 'glitch',
      simulatedGlitch: testEndpointState.simulatedGlitch,
      message: 'Simulated worker infrastructure glitch for BullMQ retry testing'
    });
  }

  if (testEndpointState.status !== 200) {
    return res.status(testEndpointState.status).json({
      message: testEndpointState.failReason || `Simulated error ${testEndpointState.status}`
    });
  }

  res.status(200).json({ status: 'ok', timestamp: new Date() });
};

/**
 * Toggle test endpoint state to simulate failures, delays, or transient worker glitches
 * POST /api/test-endpoint/toggle
 */
const toggleTestEndpoint = (req, res) => {
  const { status, delayMs, failReason, simulatedGlitch } = req.body;

  if (status !== undefined) testEndpointState.status = Number(status);
  if (delayMs !== undefined) testEndpointState.delayMs = Number(delayMs);
  if (failReason !== undefined) testEndpointState.failReason = failReason;
  if (simulatedGlitch !== undefined) testEndpointState.simulatedGlitch = simulatedGlitch;

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
