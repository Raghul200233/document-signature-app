const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createSignature,
  getDocumentSignatures,
  submitSignature,
  updateSignaturePosition,
  deleteSignature
} = require('../controllers/signatureController');

// Public route (via token)
router.post('/:token/sign', submitSignature);

// Protected routes
router.use(protect);
router.post('/', createSignature);
router.get('/document/:documentId', getDocumentSignatures);
router.put('/:id', updateSignaturePosition);
router.delete('/:id', deleteSignature);

module.exports = router;