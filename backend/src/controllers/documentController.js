const Document = require('../models/Document');
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

    const document = await Document.create({
      title: title || req.file.originalname.replace('.pdf', ''),
      description: description || '',
      fileName: req.file.filename,
      originalName: req.file.originalname,
      filePath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      owner: req.user.id,
      status: 'pending',
      signatureStatus: 'not_started'
    });

    res.status(201).json({
      success: true,
      message: 'Document uploaded successfully',
      document: {
        _id: document._id,
        title: document.title,
        description: document.description,
        fileName: document.fileName,
        originalName: document.originalName,
        fileSize: document.fileSize,
        status: document.status,
        signatureStatus: document.signatureStatus,
        createdAt: document.createdAt
      }
    });
  } catch (error) {
    console.error(error);
    // Delete uploaded file if database save fails
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

// @desc    Get all documents for logged-in user
// @route   GET /api/documents
// @access  Private
const getUserDocuments = async (req, res) => {
  try {
    const documents = await Document.find({ owner: req.user.id })
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: documents.length,
      documents
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

// @desc    Get single document by ID
// @route   GET /api/documents/:id
// @access  Private
const getDocumentById = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({ 
        success: false, 
        message: 'Document not found' 
      });
    }
    
    // Check ownership
    if (document.owner.toString() !== req.user.id) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to access this document' 
      });
    }
    
    res.json({
      success: true,
      document
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
    const document = await Document.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({ 
        success: false, 
        message: 'Document not found' 
      });
    }
    
    // Check ownership
    if (document.owner.toString() !== req.user.id) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to download this document' 
      });
    }
    
    // Check if file exists
    if (!fs.existsSync(document.filePath)) {
      return res.status(404).json({ 
        success: false, 
        message: 'File not found on server' 
      });
    }
    
    res.download(document.filePath, document.originalName);
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

// @desc    Delete document
// @route   DELETE /api/documents/:id
// @access  Private
const deleteDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({ 
        success: false, 
        message: 'Document not found' 
      });
    }
    
    // Check ownership
    if (document.owner.toString() !== req.user.id) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to delete this document' 
      });
    }
    
    // Delete file from filesystem
    if (fs.existsSync(document.filePath)) {
      fs.unlinkSync(document.filePath);
    }
    
    await document.deleteOne();
    
    res.json({ 
      success: true, 
      message: 'Document deleted successfully' 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

// @desc    Update document status
// @route   PUT /api/documents/:id/status
// @access  Private
const updateDocumentStatus = async (req, res) => {
  try {
    const { status, signatureStatus } = req.body;
    const document = await Document.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({ 
        success: false, 
        message: 'Document not found' 
      });
    }
    
    if (document.owner.toString() !== req.user.id) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized' 
      });
    }
    
    if (status) document.status = status;
    if (signatureStatus) document.signatureStatus = signatureStatus;
    
    await document.save();
    
    res.json({ 
      success: true, 
      document 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

// @desc    Get document statistics
// @route   GET /api/documents/stats/summary
// @access  Private
const getDocumentStats = async (req, res) => {
  try {
    const total = await Document.countDocuments({ owner: req.user.id });
    const pending = await Document.countDocuments({ 
      owner: req.user.id, 
      status: 'pending' 
    });
    const signed = await Document.countDocuments({ 
      owner: req.user.id, 
      status: 'signed' 
    });
    const inProgress = await Document.countDocuments({ 
      owner: req.user.id, 
      signatureStatus: 'in_progress' 
    });
    
    res.json({
      success: true,
      stats: {
        total,
        pending,
        signed,
        inProgress
      }
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
  uploadDocument,
  getUserDocuments,
  getDocumentById,
  downloadDocument,
  deleteDocument,
  updateDocumentStatus,
  getDocumentStats
};