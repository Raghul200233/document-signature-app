const { getDocumentAuditLogs, getUserAuditLogs, getDocumentActivitySummary } = require('../services/auditService');
const supabase = require('../config/supabase');

// @desc    Get audit logs for a document
// @route   GET /api/audit/document/:documentId
// @access  Private
const getDocumentAudit = async (req, res) => {
  try {
    const { documentId } = req.params;
    const { limit } = req.query;

    // Verify document ownership
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('owner_id')
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    if (document.owner_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    const result = await getDocumentAuditLogs(documentId, limit);
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch audit logs'
      });
    }

    res.json({
      success: true,
      logs: result.logs
    });
  } catch (error) {
    console.error('Get document audit error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get user's audit logs
// @route   GET /api/audit/user
// @access  Private
const getUserAudit = async (req, res) => {
  try {
    const { limit } = req.query;
    const result = await getUserAuditLogs(req.user.id, limit);
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch audit logs'
      });
    }

    res.json({
      success: true,
      logs: result.logs
    });
  } catch (error) {
    console.error('Get user audit error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get document activity summary
// @route   GET /api/audit/document/:documentId/summary
// @access  Private
const getDocumentSummary = async (req, res) => {
  try {
    const { documentId } = req.params;

    // Verify document ownership
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('owner_id')
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    if (document.owner_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    const result = await getDocumentActivitySummary(documentId);
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch activity summary'
      });
    }

    res.json({
      success: true,
      summary: result.summary
    });
  } catch (error) {
    console.error('Get document summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  getDocumentAudit,
  getUserAudit,
  getDocumentSummary
};