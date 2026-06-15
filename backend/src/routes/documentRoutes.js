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
  updateDocumentStatus,
  getDocumentStats,
  searchDocuments,
  getRecentDocuments
} = require('../controllers/documentController');

// All routes are protected
router.use(protect);

// Stats and search routes (must be before /:id routes)
router.get('/stats/summary', getDocumentStats);
router.get('/search', searchDocuments);
router.get('/recent', getRecentDocuments);

// Upload route with multer middleware
router.post('/upload', upload.single('document'), uploadDocument);

// Get all user documents
router.get('/', getUserDocuments);

// Document by ID routes
router.route('/:id')
  .get(getDocumentById)
  .delete(deleteDocument);

// Download document
router.get('/:id/download', downloadDocument);

// Update document status
router.put('/:id/status', updateDocumentStatus);

module.exports = router;