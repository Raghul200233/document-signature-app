// backend/src/controllers/documentController.js
const supabase = require('../config/supabase');
const fs = require('fs');
const path = require('path');

// @desc    Upload a new document
// @route   POST /api/documents/upload
// @access  Private
const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No file uploaded' 
      });
    }

    const { title, description } = req.body;
    
    // Upload file to Supabase Storage
    const fileBuffer = fs.readFileSync(req.file.path);
    const fileExt = path.extname(req.file.originalname);
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}${fileExt}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(fileName, fileBuffer, {
        contentType: 'application/pdf',
        cacheControl: '3600',
        upsert: false
      });
    
    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw uploadError;
    }
    
    // Get public URL - THIS IS IMPORTANT
    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(fileName);
    
    console.log('File uploaded, public URL:', publicUrl);
    
    // Save document metadata to database
    const { data: document, error: dbError } = await supabase
      .from('documents')
      .insert({
        title: title || req.file.originalname.replace('.pdf', ''),
        description: description || '',
        file_name: fileName,
        original_name: req.file.originalname,
        file_path: publicUrl,  // Store the public URL
        file_size: req.file.size,
        mime_type: req.file.mimetype,
        owner_id: req.user.id,
        status: 'pending',
        signature_status: 'not_started'
      })
      .select()
      .single();
    
    if (dbError) {
      console.error('DB error:', dbError);
      throw dbError;
    }
    
    // Delete local file after upload
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(201).json({
      success: true,
      message: 'Document uploaded successfully',
      document
    });
  } catch (error) {
    console.error('Upload error:', error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// @desc    Get all documents for logged-in user with filters, search, and pagination
// @route   GET /api/documents
// @access  Private
const getUserDocuments = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      signatureStatus,
      search,
      sortBy = 'created_at',  // Changed from 'createdAt' to 'created_at'
      sortOrder = 'desc'
    } = req.query;

    // Build query
    let query = supabase
      .from('documents')
      .select('*', { count: 'exact' })
      .eq('owner_id', req.user.id);

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    
    if (signatureStatus && signatureStatus !== 'all') {
      query = query.eq('signature_status', signatureStatus);
    }
    
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Apply sorting - use snake_case column names
    const validSortColumns = ['created_at', 'updated_at', 'title', 'file_size', 'status'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
    query = query.order(sortColumn, { ascending: sortOrder === 'asc' });

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: documents, error, count } = await query;

    if (error) throw error;

    res.json({
      success: true,
      documents,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
};

// @desc    Get single document by ID
// @route   GET /api/documents/:id
// @access  Private
const getDocumentById = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('Fetching document with ID:', id);
    console.log('User ID:', req.user.id);

    // Get document with signature count
    const { data: document, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Supabase error:', error);
      return res.status(404).json({ 
        success: false, 
        message: 'Document not found',
        error: error.message 
      });
    }
    
    if (!document) {
      console.error('No document found for ID:', id);
      return res.status(404).json({ 
        success: false, 
        message: 'Document not found' 
      });
    }
    
    // Check ownership
    if (document.owner_id !== req.user.id) {
      console.error('Unauthorized - Owner:', document.owner_id, 'User:', req.user.id);
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to access this document' 
      });
    }
    
    console.log('Document found:', document.title);
    
    // Get signatures for this document
    const { data: signatures, error: sigError } = await supabase
      .from('signatures')
      .select('*')
      .eq('document_id', id);
    
    if (sigError) {
      console.error('Error fetching signatures:', sigError);
    }
    
    res.json({
      success: true,
      document: {
        ...document,
        signatures: signatures || []
      }
    });
  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
};

// @desc    Debug - Check signature data
// @route   GET /api/documents/:id/debug-signature
// @access  Private
const debugSignature = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get signatures
    const { data: signatures, error } = await supabase
      .from('signatures')
      .select('*')
      .eq('document_id', id);
    
    res.json({
      success: true,
      signatures: signatures,
      count: signatures?.length || 0
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get signatures for a document
// @route   GET /api/documents/:id/signatures
// @access  Private
const getDocumentSignatures = async (req, res) => {
  try {
    const { id } = req.params;

    // Verify ownership
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('owner_id')
      .eq('id', id)
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

    // Get signatures
    const { data: signatures, error } = await supabase
      .from('signatures')
      .select('*')
      .eq('document_id', id)
      .order('created_at', { ascending: true });

    if (error) throw error;

    res.json({
      success: true,
      signatures
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Download document file
// @route   GET /api/documents/:id/download
// @access  Private
const downloadDocument = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('Download requested for document ID:', id);

    // Get document from database
    const { data: document, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !document) {
      console.error('Document not found:', error);
      return res.status(404).json({ 
        success: false, 
        message: 'Document not found' 
      });
    }
    
    // Check ownership
    if (document.owner_id !== req.user.id) {
      console.error('Unauthorized access');
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized' 
      });
    }
    
    console.log('Downloading file from storage:', document.file_name);
    
    // Download from Supabase Storage
    const { data, error: downloadError } = await supabase.storage
      .from('documents')
      .download(document.file_name);
    
    if (downloadError) {
      console.error('Storage download error:', downloadError);
      return res.status(404).json({ 
        success: false, 
        message: 'File not found in storage' 
      });
    }
    
    console.log('File downloaded successfully, size:', data.size);
    console.log('File type:', data.type);
    
    // Convert to buffer if needed
    const buffer = Buffer.from(await data.arrayBuffer());
    
    // Set correct headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(document.original_name)}"`);
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Cache-Control', 'no-cache');
    
    // Send the buffer
    return res.send(buffer);
    
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
};

// @desc    Delete document
// @route   DELETE /api/documents/:id
// @access  Private
const deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if document exists and user owns it
    const { data: document, error: fetchError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError || !document) {
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
    
    // Delete document (cascade will handle audit_logs and signatures)
    const { error: deleteError } = await supabase
      .from('documents')
      .delete()
      .eq('id', id);
    
    if (deleteError) throw deleteError;
    
    // Delete from storage
    await supabase.storage
      .from('documents')
      .remove([document.file_name]);
    
    res.json({ 
      success: true, 
      message: 'Document deleted successfully' 
    });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
};

// @desc    Update document status
// @route   PUT /api/documents/:id/status
// @access  Private
const updateDocumentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, signatureStatus } = req.body;
    
    const { data: document, error: fetchError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError || !document) {
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
    
    const updateData = {};
    if (status) updateData.status = status;
    if (signatureStatus) updateData.signature_status = signatureStatus;
    
    const { data: updated, error } = await supabase
      .from('documents')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    // Create audit log
    await supabase.from('audit_logs').insert({
      user_id: req.user.id,
      document_id: document.id,
      action: 'status_update',
      details: { old_status: document.status, new_status: status, old_signature_status: document.signature_status, new_signature_status: signatureStatus },
      ip_address: req.ip,
      user_agent: req.headers['user-agent']
    });
    
    res.json({ 
      success: true, 
      document: updated,
      message: 'Status updated successfully'
    });
  } catch (error) {
    console.error('Status update error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
};

// @desc    Get document statistics
// @route   GET /api/documents/stats/summary
// @access  Private
const getDocumentStats = async (req, res) => {
  try {
    const { data: documents, error } = await supabase
      .from('documents')
      .select('status, signature_status')
      .eq('owner_id', req.user.id);
    
    if (error) throw error;
    
    const stats = {
      total: documents.length,
      pending: documents.filter(d => d.status === 'pending').length,
      signed: documents.filter(d => d.status === 'signed').length,
      expired: documents.filter(d => d.status === 'expired').length,
      cancelled: documents.filter(d => d.status === 'cancelled').length,
      inProgress: documents.filter(d => d.signature_status === 'in_progress').length,
      completed: documents.filter(d => d.signature_status === 'completed').length,
      notStarted: documents.filter(d => d.signature_status === 'not_started').length
    };
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
};

// @desc    Search documents
// @route   GET /api/documents/search
// @access  Private
const searchDocuments = async (req, res) => {
  try {
    const { q, limit = 20 } = req.query;
    
    if (!q) {
      return res.status(400).json({ 
        success: false, 
        message: 'Search query is required' 
      });
    }

    const { data: documents, error } = await supabase
      .from('documents')
      .select('*')
      .eq('owner_id', req.user.id)
      .or(`title.ilike.%${q}%,description.ilike.%${q}%`)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    res.json({
      success: true,
      documents,
      count: documents.length,
      searchTerm: q
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
};

// @desc    Get recent documents
// @route   GET /api/documents/recent
// @access  Private
const getRecentDocuments = async (req, res) => {
  try {
    const { limit = 5 } = req.query;

    const { data: documents, error } = await supabase
      .from('documents')
      .select('*')
      .eq('owner_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    res.json({
      success: true,
      documents
    });
  } catch (error) {
    console.error('Recent documents error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
};

// @desc    Get documents by status
// @route   GET /api/documents/status/:status
// @access  Private
const getDocumentsByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const { limit = 50 } = req.query;

    const { data: documents, error } = await supabase
      .from('documents')
      .select('*')
      .eq('owner_id', req.user.id)
      .eq('status', status)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    res.json({
      success: true,
      documents,
      count: documents.length,
      status
    });
  } catch (error) {
    console.error('Get by status error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
};

module.exports = {
  uploadDocument,
  getUserDocuments,
  getDocumentById,
  downloadDocument,
  deleteDocument,
  updateDocumentStatus,
  getDocumentStats,
  searchDocuments,
  getRecentDocuments,
  getDocumentSignatures,
  getDocumentsByStatus
};