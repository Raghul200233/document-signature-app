const mongoose = require('mongoose');

const signatureSchema = new mongoose.Schema({
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true
  },
  signerEmail: {
    type: String,
    required: true
  },
  signerName: {
    type: String,
    required: true
  },
  signatureData: {
    type: String, // Base64 or path to signature image
    required: true
  },
  position: {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    page: { type: Number, default: 1 }
  },
  status: {
    type: String,
    enum: ['pending', 'signed', 'declined', 'expired'],
    default: 'pending'
  },
  signedAt: {
    type: Date,
    default: null
  },
  ipAddress: {
    type: String,
    default: null
  },
  userAgent: {
    type: String,
    default: null
  },
  token: {
    type: String,
    unique: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Signature', signatureSchema);