import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { documentAPI } from '../services/api';
import DraggableSignature from '../components/DraggableSignature';
import AuditTimeline from '../components/AuditTimeline';

const DocumentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSignatureCreator, setShowSignatureCreator] = useState(false);
  const [signedPdfUrl, setSignedPdfUrl] = useState(null);
  const pdfContainerRef = useRef(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailData, setEmailData] = useState({ name: '', email: '' });
  const [activeTab, setActiveTab] = useState('info');

  useEffect(() => {
    if (id) {
      fetchDocument();
    }
  }, [id]);

  const fetchDocument = async () => {
    try {
      setLoading(true);
      console.log('Fetching document:', id);
      
      const response = await documentAPI.getById(id);
      console.log('Document response:', response);
      
      if (response.success && response.document) {
        setDocument(response.document);
        if (response.document.signed_file_path) {
          setSignedPdfUrl(response.document.signed_file_path);
        }
        setError(null);
      } else {
        setError('Document not found');
      }
    } catch (error) {
      console.error('Failed to fetch document:', error);
      setError(error.response?.data?.message || 'Failed to load document');
    } finally {
      setLoading(false);
    }
  };

  const handleSignatureSaved = (url) => {
    console.log('Signature saved, PDF URL:', url);
    setSignedPdfUrl(url);
    setShowSignatureCreator(false);
    fetchDocument();
  };

  const handleSendEmailRequest = async () => {
    if (!emailData.name || !emailData.email) {
      alert('Please enter name and email');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3003/api/signatures/with-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          documentId: id,
          signerName: emailData.name,
          signerEmail: emailData.email,
          positionX: 300,
          positionY: 700,
          pageNumber: 1
        })
      });

      const data = await response.json();
      if (data.success) {
        alert('✅ Signature request sent to ' + emailData.email);
        setShowEmailModal(false);
        setEmailData({ name: '', email: '' });
      } else {
        alert('❌ Failed to send request: ' + data.message);
      }
    } catch (error) {
      console.error('Failed to send request:', error);
      alert('❌ Failed to send request');
    }
  };

  const handleDownloadSigned = () => {
    const url = signedPdfUrl || document?.signed_file_path;
    if (url) {
      window.open(url, '_blank');
    } else {
      alert('No signed PDF available yet. Please sign the document first.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading document...</p>
        </div>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white rounded-lg p-8 max-w-md text-center shadow-lg">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <p className="text-red-600 mb-4">{error || 'Document not found'}</p>
          <button 
            onClick={() => navigate('/dashboard')} 
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const isSigned = document.status === 'signed' || !!signedPdfUrl;
  const pdfUrl = signedPdfUrl || document.file_path;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center flex-wrap gap-2">
          <button 
            onClick={() => navigate('/dashboard')} 
            className="text-indigo-600 hover:text-indigo-800 flex items-center gap-2"
          >
            ← Back to Dashboard
          </button>
          
          <div className="flex items-center gap-3">
            {!isSigned && (
              <button
                onClick={() => setShowEmailModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Send for Signature
              </button>
            )}
            
            {isSigned && (
              <button
                onClick={handleDownloadSigned}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download Signed PDF
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 border-b">
            <h1 className="text-2xl font-bold text-gray-900">{document.title}</h1>
            {document.description && (
              <p className="text-gray-500 mt-1">{document.description}</p>
            )}
            <div className="flex gap-3 mt-2">
              <span className={`text-xs px-2 py-1 rounded-full ${document.status === 'signed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                {document.status}
              </span>
              <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                {document.signature_status?.replace('_', ' ')}
              </span>
            </div>
          </div>

          {/* PDF Container */}
          <div 
            ref={pdfContainerRef}
            className="relative bg-gray-100"
            style={{ minHeight: '600px' }}
          >
            <div className="w-full h-[600px] overflow-auto bg-white">
              {pdfUrl ? (
                <iframe
                  src={pdfUrl}
                  className="w-full min-h-[800px] border-0"
                  title="PDF Document"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500">PDF preview not available</p>
                </div>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b">
            <div className="flex">
              <button
                onClick={() => setActiveTab('info')}
                className={`px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'info' 
                    ? 'border-b-2 border-indigo-500 text-indigo-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Document Info
              </button>
              <button
                onClick={() => setActiveTab('signatures')}
                className={`px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'signatures' 
                    ? 'border-b-2 border-indigo-500 text-indigo-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Signatures
              </button>
              <button
                onClick={() => setActiveTab('audit')}
                className={`px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'audit' 
                    ? 'border-b-2 border-indigo-500 text-indigo-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Activity History
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'info' && (
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-500">Document ID</span>
                  <p className="text-sm font-mono bg-gray-50 p-2 rounded">{document.id}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Uploaded</span>
                  <p className="text-sm">{new Date(document.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Size</span>
                  <p className="text-sm">{formatFileSize(document.file_size)}</p>
                </div>
                {document.signed_file_path && (
                  <div>
                    <span className="text-sm text-gray-500">Signed PDF</span>
                    <p className="text-sm text-green-600 break-all">{document.signed_file_path}</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'signatures' && (
              <div>
                {!isSigned ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">No signatures yet</p>
                    <button
                      onClick={() => setShowSignatureCreator(true)}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                      Add Signature
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-8 bg-green-50 rounded-lg">
                    <div className="text-green-500 text-4xl mb-2">✓</div>
                    <p className="text-green-600 font-medium">Document has been signed!</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'audit' && (
              <AuditTimeline documentId={id} />
            )}
          </div>

          {/* Signing Options */}
          {!isSigned && (
            <div className="p-6 border-t bg-gray-50">
              <div className="text-center">
                <button
                  onClick={() => setShowSignatureCreator(true)}
                  className="px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-lg font-semibold flex items-center gap-3 mx-auto"
                >
                  <span className="text-2xl">✍️</span>
                  Sign This Document
                </button>
                <p className="text-gray-500 text-sm mt-3">
                  Click to create your signature and place it on the document
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Send Signature Request</h2>
              <button
                onClick={() => setShowEmailModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Signer Name
                </label>
                <input
                  type="text"
                  value={emailData.name}
                  onChange={(e) => setEmailData({ ...emailData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter signer's name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Signer Email
                </label>
                <input
                  type="email"
                  value={emailData.email}
                  onChange={(e) => setEmailData({ ...emailData, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter signer's email"
                />
              </div>
              
              <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800">
                <p>📧 An email will be sent to the signer with a link to review and sign this document.</p>
              </div>
              
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowEmailModal(false)}
                  className="flex-1 px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendEmailRequest}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Send Request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Signature Creator Modal */}
      {showSignatureCreator && (
        <DraggableSignature
          pdfContainerRef={pdfContainerRef}
          documentId={id}
          onSave={() => setShowSignatureCreator(false)}
          onSigned={handleSignatureSaved}
          onCancel={() => setShowSignatureCreator(false)}
        />
      )}
    </div>
  );
};

// Helper function
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default DocumentDetail;