const supabase = require('../config/supabase');
const crypto = require('crypto');
const { logAction } = require('../services/auditService');

// @desc    Create signature placement
const createSignature = async (req, res) => {
  try {
    const {
      documentId,
      signerName,
      positionX = 100,
      positionY = 100,
      width = 200,
      height = 60,
      pageNumber = 1
    } = req.body;

    console.log('Creating signature at position:', { documentId, signerName, positionX, positionY });

    if (!documentId || !signerName) {
      return res.status(400).json({
        success: false,
        message: 'Document ID and signer name are required'
      });
    }

    // Verify document ownership
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Generate unique token
    const token = crypto.randomBytes(32).toString('hex');

    // Create signature record
    const { data: signature, error: insertError } = await supabase
      .from('signatures')
      .insert({
        document_id: documentId,
        signer_name: signerName,
        signer_email: `${signerName.replace(/\s/g, '').toLowerCase()}@signature.local`,
        position_x: positionX,
        position_y: positionY,
        width: width,
        height: height,
        page_number: pageNumber,
        status: 'pending',
        token: token
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      return res.status(500).json({
        success: false,
        message: 'Database error: ' + insertError.message
      });
    }

    // Update document signature status
    await supabase
      .from('documents')
      .update({ signature_status: 'in_progress' })
      .eq('id', documentId);

    // Log the action
    await logAction({
      documentId: documentId,
      userId: req.user.id,
      action: 'signature_created',
      details: { signerName: signerName, position: { x: positionX, y: positionY } },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(201).json({
      success: true,
      signature: {
        id: signature.id,
        signerName: signature.signer_name,
        token: signature.token,
        status: signature.status,
        positionX: signature.position_x,
        positionY: signature.position_y
      }
    });

  } catch (error) {
    console.error('Create signature error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
};

// @desc    Create and submit signature in ONE call
const createAndSubmitSignature = async (req, res) => {
  try {
    const {
      documentId,
      signerName,
      positionX,
      positionY,
      width = 200,
      height = 60,
      style = 'classic',
      pageNumber = 1
    } = req.body;

    console.log('Quick sign request:', { documentId, signerName, positionX, positionY });

    if (!documentId || !signerName) {
      return res.status(400).json({
        success: false,
        message: 'Document ID and signer name are required'
      });
    }

    // Verify document ownership
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Generate unique token
    const token = crypto.randomBytes(32).toString('hex');

    // Create and sign in ONE operation
    const { data: signature, error: insertError } = await supabase
      .from('signatures')
      .insert({
        document_id: documentId,
        signer_name: signerName,
        signer_email: `${signerName.replace(/\s/g, '').toLowerCase()}@signature.local`,
        signature_text: signerName,
        signature_style: style,
        position_x: positionX,
        position_y: positionY,
        width: width,
        height: height,
        page_number: pageNumber,
        status: 'signed',
        signed_at: new Date().toISOString(),
        token: token,
        ip_address: req.ip || 'unknown',
        user_agent: req.headers['user-agent'] || 'unknown'
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      return res.status(500).json({
        success: false,
        message: 'Database error: ' + insertError.message
      });
    }

    // Update document
    await supabase
      .from('documents')
      .update({
        signatures_completed: 1,
        status: 'signed',
        signature_status: 'completed'
      })
      .eq('id', documentId);

    // Generate PDF asynchronously (don't wait)
    let signedPdfUrl = null;
    try {
      const { generateSignedPDFWithAllSignatures } = require('../services/pdfService');
      const result = await generateSignedPDFWithAllSignatures(documentId);
      signedPdfUrl = result.signedPdfUrl;
    } catch (pdfError) {
      console.error('PDF generation error:', pdfError);
    }

    res.json({
      success: true,
      message: 'Document signed successfully!',
      signedPdfUrl: signedPdfUrl
    });

  } catch (error) {
    console.error('Quick sign error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
};


// @desc    Create signature with email
const createSignatureWithEmail = async (req, res) => {
  try {
    const {
      documentId,
      signerName,
      signerEmail,
      positionX = 100,
      positionY = 700,
      pageNumber = 1
    } = req.body;

    console.log('Creating signature with email for:', signerEmail);

    if (!documentId || !signerName || !signerEmail) {
      return res.status(400).json({
        success: false,
        message: 'Document ID, signer name and email are required'
      });
    }

    // Verify document ownership
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('*, profiles(email)')
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Generate unique token
    const token = crypto.randomBytes(32).toString('hex');

    // Create signature record
    const { data: signature, error: insertError } = await supabase
      .from('signatures')
      .insert({
        document_id: documentId,
        signer_name: signerName,
        signer_email: signerEmail,
        position_x: positionX,
        position_y: positionY,
        page_number: pageNumber,
        status: 'pending',
        token: token
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      return res.status(500).json({
        success: false,
        message: 'Database error: ' + insertError.message
      });
    }

    // Update document signature status
    await supabase
      .from('documents')
      .update({ 
        signature_status: 'in_progress'
      })
      .eq('id', documentId);

    // Send email (you can implement this later)
    // const { sendSignatureRequest } = require('../services/emailService');
    // await sendSignatureRequest(signerEmail, signerName, document.title, token, documentId);

    res.status(201).json({
      success: true,
      signature: {
        id: signature.id,
        signerName: signature.signer_name,
        signerEmail: signature.signer_email,
        token: signature.token,
        status: signature.status
      }
    });

  } catch (error) {
    console.error('Create signature with email error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
};

// @desc    Submit signature (sign the document)
const submitSignature = async (req, res) => {
  try {
    const { token } = req.params;
    const { signatureText, style, fontSize } = req.body;

    console.log('Submitting signature:', { token, signatureText, style, fontSize });

    if (!signatureText) {
      return res.status(400).json({
        success: false,
        message: 'Signature text is required'
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

    // Update signature with text, style, and font size
    const { error: updateError } = await supabase
      .from('signatures')
      .update({
        signature_text: signatureText,
        signature_style: style || 'classic',
        signature_font_size: fontSize || 32,
        status: 'signed',
        signed_at: new Date().toISOString(),
        ip_address: req.ip || 'unknown',
        user_agent: req.headers['user-agent'] || 'unknown'
      })
      .eq('id', signature.id);

    if (updateError) {
      console.error('Update error:', updateError);
      return res.status(500).json({
        success: false,
        message: 'Failed to update signature: ' + updateError.message
      });
    }

    // ... rest of the function continues
  } catch (error) {
    console.error('Submit signature error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
};

// @desc    Get signatures for a document
const getDocumentSignatures = async (req, res) => {
  try {
    const { documentId } = req.params;

    console.log('Fetching signatures for document:', documentId);

    const { data: signatures, error: sigError } = await supabase
      .from('signatures')
      .select('*')
      .eq('document_id', documentId)
      .order('created_at', { ascending: true });

    if (sigError) {
      console.error('Fetch signatures error:', sigError);
      return res.status(500).json({
        success: false,
        message: 'Error fetching signatures'
      });
    }

    const formattedSignatures = signatures.map(sig => ({
      id: sig.id,
      signerName: sig.signer_name,
      signerEmail: sig.signer_email,
      positionX: sig.position_x,
      positionY: sig.position_y,
      width: sig.width,
      height: sig.height,
      status: sig.status,
      token: sig.token,
      signatureText: sig.signature_text,
      signatureStyle: sig.signature_style,
      signedAt: sig.signed_at
    }));

    res.json({
      success: true,
      signatures: formattedSignatures
    });

  } catch (error) {
    console.error('Get signatures error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get signature by token (public)
const getSignatureByToken = async (req, res) => {
  try {
    const { token } = req.params;

    const { data: signature, error } = await supabase
      .from('signatures')
      .select('*, documents(*)')
      .eq('token', token)
      .single();

    if (error || !signature) {
      return res.status(404).json({
        success: false,
        message: 'Invalid or expired signature link'
      });
    }

    if (signature.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `This signature request is already ${signature.status}`
      });
    }

    res.json({
      success: true,
      signature: {
        id: signature.id,
        signerName: signature.signer_name,
        signerEmail: signature.signer_email,
        documentId: signature.document_id,
        documentTitle: signature.documents?.title,
        documentUrl: signature.documents?.file_path,
        positionX: signature.position_x,
        positionY: signature.position_y,
        status: signature.status
      }
    });

  } catch (error) {
    console.error('Get signature by token error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete signature
const deleteSignature = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('signatures')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ success: true, message: 'Signature deleted' });
  } catch (error) {
    console.error('Delete signature error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createSignature,
  createSignatureWithEmail,
  submitSignature,
  getDocumentSignatures,
  getSignatureByToken,
  deleteSignature,
  createAndSubmitSignature
};