const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  signDocument,
  signDocumentWithAllSignatures,
  downloadSignedPDF,
  getSignedPDFStatus
} = require('../controllers/pdfController');

// All routes are protected
router.use(protect);

// Sign document routes
router.post('/sign', signDocument);
router.post('/:documentId/sign-all', signDocumentWithAllSignatures);
router.get('/:documentId/status', getSignedPDFStatus);
router.get('/:documentId/download', downloadSignedPDF);

module.exports = router;