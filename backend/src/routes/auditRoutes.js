const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getDocumentAudit,
  getUserAudit,
  getDocumentSummary
} = require('../controllers/auditController');

// All routes are protected
router.use(protect);

router.get('/user', getUserAudit);
router.get('/document/:documentId', getDocumentAudit);
router.get('/document/:documentId/summary', getDocumentSummary);

module.exports = router;