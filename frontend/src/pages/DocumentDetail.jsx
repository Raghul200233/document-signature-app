import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { documentAPI } from '../services/api';
import DraggableSignature from '../components/DraggableSignature';

const DocumentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSignatureCreator, setShowSignatureCreator] = useState(false);
  const [signedPdfUrl, setSignedPdfUrl] = useState(null);
  const pdfContainerRef = useRef(null);

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
    fetchDocument(); // Refresh to get updated document
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
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <button 
            onClick={() => navigate('/dashboard')} 
            className="text-indigo-600 hover:text-indigo-800 flex items-center gap-2"
          >
            ← Back to Dashboard
          </button>
          
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

          {/* Signing Options */}
          <div className="p-6 border-t">
            {isSigned ? (
              <div className="text-center py-8 bg-green-50 rounded-lg">
                <div className="text-green-500 text-5xl mb-3">✓</div>
                <p className="text-green-600 font-medium mb-4">Document has been signed!</p>
                <button
                  onClick={handleDownloadSigned}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Download Signed PDF
                </button>
              </div>
            ) : (
              <div className="text-center py-8">
                <button
                  onClick={() => setShowSignatureCreator(true)}
                  className="px-8 py-4 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 text-lg font-semibold flex items-center gap-3 mx-auto"
                >
                  <span className="text-2xl">✍️</span>
                  Sign This Document
                </button>
                <p className="text-gray-500 text-sm mt-4">
                  1. Click the button above<br/>
                  2. Type your name and choose a style<br/>
                  3. Drag the signature to where you want it on the PDF<br/>
                  4. Click Save to generate your signed document
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

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

export default DocumentDetail;