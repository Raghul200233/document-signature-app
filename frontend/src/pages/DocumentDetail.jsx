import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { documentAPI } from '../services/api';
import SignaturePlacement from '../components/SignaturePlacement';
import PDFViewer from '../components/PDFViewer';

const DocumentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetchDocument();
  }, [id]);

  const fetchDocument = async () => {
    try {
      const response = await documentAPI.getById(id);
      setDocument(response.document);
    } catch (error) {
      console.error('Failed to fetch document:', error);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleSignatureAdded = () => {
    fetchDocument(); // Refresh document to update status
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4">Loading document...</p>
        </div>
      </div>
    );
  }

  if (!document) return null;

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{document.title}</h1>
              {document.description && (
                <p className="text-gray-600 mt-2">{document.description}</p>
              )}
              <div className="flex items-center space-x-4 mt-4">
                <span className={`px-2 py-1 text-xs rounded-full ${
                  document.status === 'signed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {document.status}
                </span>
                <span className="text-sm text-gray-500">
                  Uploaded: {new Date(document.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
            <button
              onClick={() => setShowPreview(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Preview PDF
            </button>
          </div>
        </div>

        {/* Signature Placement Section */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Signature Management
          </h2>
          <SignaturePlacement
            documentId={id}
            onSignatureAdded={handleSignatureAdded}
          />
        </div>
      </div>

      {/* PDF Preview Modal */}
      {showPreview && (
        <PDFViewer
          fileUrl={document.file_path}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
};

export default DocumentDetail;