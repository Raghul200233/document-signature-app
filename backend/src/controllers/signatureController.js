const supabase = require('../config/supabase');
const crypto = require('crypto');

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

    console.log('Creating signature at EXACT position:', { positionX, positionY, width, height });

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
        page_number: pageNumber,
        width: width,
        height: height,
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

// @desc    Submit signature
const submitSignature = async (req, res) => {
  try {
    const { token } = req.params;
    const { signatureText, style } = req.body;

    console.log('Submitting signature:', { token, signatureText, style });

    if (!signatureText) {
      return res.status(400).json({
        success: false,
        message: 'Signature text is required'
      });
    }

    // Find signature by token
    const { data: signature, error: findError } = await supabase
      .from('signatures')
      .select('*')
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
        signature_text: signatureText,
        signature_style: style || 'classic',
        status: 'signed',
        signed_at: new Date().toISOString()
      })
      .eq('id', signature.id);

    if (updateError) {
      console.error('Update error:', updateError);
      return res.status(500).json({
        success: false,
        message: 'Failed to update signature'
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
      .eq('id', signature.document_id);

    // Generate signed PDF
    let signedPdfUrl = null;
    try {
      const { generateSignedPDFWithAllSignatures } = require('../services/pdfService');
      const result = await generateSignedPDFWithAllSignatures(signature.document_id);
      signedPdfUrl = result.signedPdfUrl;
    } catch (pdfError) {
      console.error('PDF generation error:', pdfError);
    }

    res.json({
      success: true,
      message: 'Signature saved successfully!',
      signedPdfUrl: signedPdfUrl
    });

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
        signerName: s.signer_name,
        positionX: s.position_x,
        positionY: s.position_y,
        status: s.status,
        token: s.token,
        signatureText: s.signature_text,
        signatureStyle: s.signature_style
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete signature
const deleteSignature = async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('signatures').delete().eq('id', id);
    if (error) throw error;
    res.json({ success: true, message: 'Signature deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createSignature,
  submitSignature,
  getDocumentSignatures,
  deleteSignature
};