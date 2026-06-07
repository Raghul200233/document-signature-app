const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const upload = require('../config/multer');
const {
  uploadDocument,
  getUserDocuments,
  getDocumentById,
  downloadDocument,
  deleteDocument,
  updateDocumentStatus
} = require('../controllers/documentController');

// All routes are protected
router.use(protect);

// Upload route with multer middleware
router.post('/upload', upload.single('document'), uploadDocument);

// Get all user documents
router.get('/', getUserDocuments);

// Get, update, delete specific document
router.route('/:id')
  .get(getDocumentById)
  .delete(deleteDocument);

// Download document
router.get('/:id/download', downloadDocument);

// Update document status
router.put('/:id/status', updateDocumentStatus);

module.exports = router;