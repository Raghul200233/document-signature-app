const supabase = require('../config/supabase');
const crypto = require('crypto');

// @desc    Create signature placement
// @route   POST /api/signatures
// @access  Private
const createSignature = async (req, res) => {
  try {
    const {
      documentId,
      signerEmail,
      signerName,
      positionX,
      positionY,
      pageNumber = 1,
      width = 200,
      height = 60
    } = req.body;

    // Verify document ownership
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .eq('owner_id', req.user.id)
      .single();

    if (docError || !document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found or unauthorized'
      });
    }

    // Generate unique token for signature link
    const token = crypto.randomBytes(32).toString('hex');

    // Create signature record
    const { data: signature, error } = await supabase
      .from('signatures')
      .insert({
        document_id: documentId,
        signer_email: signerEmail,
        signer_name: signerName,
        signature_data: '', // Will be filled when actually signed
        position_x: positionX,
        position_y: positionY,
        page_number: pageNumber,
        width: width,
        height: height,
        status: 'pending',
        token: token
      })
      .select()
      .single();

    if (error) throw error;

    // Update document signature status
    await supabase
      .from('documents')
      .update({ 
        signature_status: 'in_progress',
        required_signatures: supabase.raw('required_signatures + 1')
      })
      .eq('id', documentId);

    // Create audit log
    await supabase.from('audit_logs').insert({
      user_id: req.user.id,
      document_id: documentId,
      action: 'signature_created',
      details: { signer_email: signerEmail, position: { x: positionX, y: positionY } },
      ip_address: req.ip,
      user_agent: req.headers['user-agent']
    });

    res.status(201).json({
      success: true,
      signature: {
        id: signature.id,
        signerEmail: signature.signer_email,
        signerName: signature.signer_name,
        position: { x: signature.position_x, y: signature.position_y },
        pageNumber: signature.page_number,
        token: signature.token,
        status: signature.status
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get all signatures for a document
// @route   GET /api/signatures/document/:documentId
// @access  Private
const getDocumentSignatures = async (req, res) => {
  try {
    const { documentId } = req.params;

    // Verify ownership
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .eq('owner_id', req.user.id)
      .single();

    if (docError || !document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Get signatures
    const { data: signatures, error } = await supabase
      .from('signatures')
      .select('*')
      .eq('document_id', documentId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    res.json({
      success: true,
      signatures: signatures.map(s => ({
        id: s.id,
        signerEmail: s.signer_email,
        signerName: s.signer_name,
        position: { x: s.position_x, y: s.position_y },
        pageNumber: s.page_number,
        status: s.status,
        signedAt: s.signed_at,
        width: s.width,
        height: s.height
      }))
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Submit signature (sign the document)
// @route   POST /api/signatures/:token/sign
// @access  Public (via token)
const submitSignature = async (req, res) => {
  try {
    const { token } = req.params;
    const { signatureData } = req.body; // Base64 signature image

    if (!signatureData) {
      return res.status(400).json({
        success: false,
        message: 'Signature data is required'
      });
    }

    // Find signature by token
    const { data: signature, error: findError } = await supabase
      .from('signatures')
      .select('*, documents(*)')
      .eq('token', token)
      .single();

    if (findError || !signature) {
      return res.status(404).json({
        success: false,
        message: 'Invalid or expired signature link'
      });
    }

    if (signature.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Signature already ${signature.status}`
      });
    }

    // Update signature
    const { error: updateError } = await supabase
      .from('signatures')
      .update({
        signature_data: signatureData,
        status: 'signed',
        signed_at: new Date().toISOString(),
        ip_address: req.ip,
        user_agent: req.headers['user-agent']
      })
      .eq('id', signature.id);

    if (updateError) throw updateError;

    // Update document signature count
    const { data: updatedDoc } = await supabase
      .from('documents')
      .update({
        signatures_completed: supabase.raw('signatures_completed + 1')
      })
      .eq('id', signature.document_id)
      .select()
      .single();

    // Check if all signatures are completed
    if (updatedDoc.signatures_completed >= updatedDoc.required_signatures) {
      await supabase
        .from('documents')
        .update({
          status: 'signed',
          signature_status: 'completed'
        })
        .eq('id', signature.document_id);
    }

    // Create audit log
    await supabase.from('audit_logs').insert({
      document_id: signature.document_id,
      action: 'signature_submitted',
      details: { signer_email: signature.signer_email },
      ip_address: req.ip,
      user_agent: req.headers['user-agent']
    });

    res.json({
      success: true,
      message: 'Document signed successfully!'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update signature position
// @route   PUT /api/signatures/:id
// @access  Private
const updateSignaturePosition = async (req, res) => {
  try {
    const { id } = req.params;
    const { positionX, positionY, pageNumber } = req.body;

    const { data: signature, error: findError } = await supabase
      .from('signatures')
      .select('*, documents(*)')
      .eq('id', id)
      .single();

    if (findError || !signature) {
      return res.status(404).json({
        success: false,
        message: 'Signature not found'
      });
    }

    // Verify ownership through document
    if (signature.documents.owner_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const { error } = await supabase
      .from('signatures')
      .update({
        position_x: positionX,
        position_y: positionY,
        page_number: pageNumber
      })
      .eq('id', id);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Signature position updated'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete signature
// @route   DELETE /api/signatures/:id
// @access  Private
const deleteSignature = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: signature, error: findError } = await supabase
      .from('signatures')
      .select('*, documents(*)')
      .eq('id', id)
      .single();

    if (findError || !signature) {
      return res.status(404).json({
        success: false,
        message: 'Signature not found'
      });
    }

    // Verify ownership
    if (signature.documents.owner_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const { error } = await supabase
      .from('signatures')
      .delete()
      .eq('id', id);

    if (error) throw error;

    // Update document required signatures count
    await supabase
      .from('documents')
      .update({
        required_signatures: supabase.raw('required_signatures - 1')
      })
      .eq('id', signature.document_id);

    res.json({
      success: true,
      message: 'Signature deleted successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  createSignature,
  getDocumentSignatures,
  submitSignature,
  updateSignaturePosition,
  deleteSignature
};