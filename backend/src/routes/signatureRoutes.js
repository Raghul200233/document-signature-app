const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createSignature,
  createSignatureWithEmail,
  getDocumentSignatures,
  submitSignature,
  deleteSignature,
  getSignatureByToken,
  createAndSubmitSignature
} = require('../controllers/signatureController');

// Public routes (no authentication needed)
router.get('/public/:token', getSignatureByToken);
router.post('/:token/sign', submitSignature);

// Protected routes
router.use(protect);
router.post('/', createSignature);
router.post('/with-email', createSignatureWithEmail);
router.get('/document/:documentId', getDocumentSignatures);
router.delete('/:id', deleteSignature);
router.post('/quick-sign', createAndSubmitSignature);

module.exports = router;