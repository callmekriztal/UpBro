const express = require('express');
const router = express.Router();
const {
  pingTestEndpoint,
  toggleTestEndpoint,
  getTestEndpointState
} = require('../controllers/testEndpointController');

router.get('/ping', pingTestEndpoint);
router.post('/toggle', toggleTestEndpoint);
router.get('/state', getTestEndpointState);

module.exports = router;
