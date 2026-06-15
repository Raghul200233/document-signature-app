const { generateSignedPDF, generateSignedPDFWithAllSignatures } = require('../services/pdfService');
const supabase = require('../config/supabase');

// Generate signed PDF for a specific signature
const signDocument = async (req, res) => {
  try {
    const { documentId, signatureId } = req.body;

    if (!documentId || !signatureId) {
      return res.status(400).json({
        success: false,
        message: 'Document ID and Signature ID are required'
      });
    }

    // Verify ownership
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

    const result = await generateSignedPDF(documentId, signatureId);

    res.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Sign document error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to sign document'
    });
  }
};

// Generate signed PDF with all signatures
const signDocumentWithAllSignatures = async (req, res) => {
  try {
    const { documentId } = req.params;

    // Verify ownership
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

    const result = await generateSignedPDFWithAllSignatures(documentId);

    res.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Sign document error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to sign document'
    });
  }
};

// Download signed PDF
const downloadSignedPDF = async (req, res) => {
  try {
    const { documentId } = req.params;

    const { data: document, error } = await supabase
      .from('documents')
      .select('signed_file_path, owner_id')
      .eq('id', documentId)
      .single();

    if (error || !document) {
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

    if (!document.signed_file_path) {
      return res.status(404).json({
        success: false,
        message: 'Signed document not found. Please sign the document first.'
      });
    }

    // Redirect to signed file URL
    res.json({
      success: true,
      downloadUrl: document.signed_file_path
    });

  } catch (error) {
    console.error('Download signed PDF error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get signed PDF status
const getSignedPDFStatus = async (req, res) => {
  try {
    const { documentId } = req.params;

    const { data: document, error } = await supabase
      .from('documents')
      .select('signed_file_path, status, signature_status')
      .eq('id', documentId)
      .single();

    if (error || !document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    res.json({
      success: true,
      hasSignedPDF: !!document.signed_file_path,
      signedFileUrl: document.signed_file_path,
      status: document.status,
      signatureStatus: document.signature_status
    });

  } catch (error) {
    console.error('Get signed PDF status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  signDocument,
  signDocumentWithAllSignatures,
  downloadSignedPDF,
  getSignedPDFStatus
};