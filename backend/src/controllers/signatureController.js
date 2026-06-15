const supabase = require('../config/supabase');
const crypto = require('crypto');

// @desc    Create signature placement
const createSignature = async (req, res) => {
  try {
    const {
      documentId,
      signerName,
      pageNumber = 1
    } = req.body;

    console.log('Creating signature:', { documentId, signerName });

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

    if (document.owner_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
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
        signature_data: '',
        signature_text: '',
        signature_style: 'classic',
        position_x: 100,
        position_y: 750,
        page_number: pageNumber,
        width: 300,
        height: 80,
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

    console.log('Signature created:', signature.id);

    res.status(201).json({
      success: true,
      signature: {
        id: signature.id,
        signerName: signature.signer_name,
        token: signature.token,
        status: signature.status
      }
    });

  } catch (error) {
    console.error('Create signature error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Submit signature (sign the document)
const submitSignature = async (req, res) => {
  try {
    const { token } = req.params;
    const { signatureText, style } = req.body;

    console.log('Submitting signature for token:', token, 'Style:', style);

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

    // Update signature with text and style
    const { error: updateError } = await supabase
      .from('signatures')
      .update({
        signature_text: signatureText,
        signature_style: style || 'classic',
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

    // Get current signatures count
    const { data: allSignatures, error: countError } = await supabase
      .from('signatures')
      .select('id')
      .eq('document_id', signature.document_id)
      .eq('status', 'signed');

    const signedCount = allSignatures?.length || 1;
    
    // Get document to check required signatures
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('required_signatures')
      .eq('id', signature.document_id)
      .single();

    // Update document signature count
    await supabase
      .from('documents')
      .update({
        signatures_completed: signedCount
      })
      .eq('id', signature.document_id);

    // Check if all signatures are completed
    let signedPdfUrl = null;
    const requiredSignatures = document?.required_signatures || 1;
    
    if (signedCount >= requiredSignatures) {
      try {
        const { generateSignedPDFWithAllSignatures } = require('../services/pdfService');
        const result = await generateSignedPDFWithAllSignatures(signature.document_id);
        signedPdfUrl = result.signedPdfUrl;
        
        await supabase
          .from('documents')
          .update({
            status: 'signed',
            signature_status: 'completed'
          })
          .eq('id', signature.document_id);
      } catch (pdfError) {
        console.error('PDF generation error:', pdfError);
      }
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

    console.log('Fetching signatures for document:', documentId);

    const { data: signatures, error: sigError } = await supabase
      .from('signatures')
      .select('*')
      .eq('document_id', documentId)
      .order('created_at', { ascending: true });

    if (sigError) {
      return res.status(500).json({
        success: false,
        message: 'Error fetching signatures'
      });
    }

    const formattedSignatures = signatures.map(sig => ({
      id: sig.id,
      signerName: sig.signer_name,
      positionX: sig.position_x,
      positionY: sig.position_y,
      status: sig.status,
      token: sig.token,
      signatureText: sig.signature_text,
      signatureStyle: sig.signature_style
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
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createSignature,
  getDocumentSignatures,
  submitSignature,
  deleteSignature
};