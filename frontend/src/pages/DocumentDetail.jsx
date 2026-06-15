import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { documentAPI } from '../services/api';
import DragDropPDFEditor from '../components/DragDropPDFEditor';

const DocumentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);

  useEffect(() => {
    fetchDocument();
  }, [id]);

  const fetchDocument = async () => {
    try {
      const response = await documentAPI.getById(id);
      setDocument(response.document);
    } catch (error) {
      console.error('Failed to fetch document:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4">Loading document...</p>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white rounded-lg p-8 text-center">
          <p className="text-red-600">Document not found</p>
          <button 
            onClick={() => navigate('/dashboard')} 
            className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Back Button */}
        <button
          onClick={() => navigate('/dashboard')}
          className="mb-4 flex items-center space-x-2 text-gray-600 hover:text-gray-900"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Back to Dashboard</span>
        </button>

        {/* Document Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{document.title}</h1>
              {document.description && (
                <p className="text-gray-600 mt-2">{document.description}</p>
              )}
              <div className="flex gap-3 mt-2">
                <span className="text-sm text-gray-500">
                  Uploaded: {new Date(document.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
            <button
              onClick={() => setShowEditor(true)}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center space-x-2 text-lg transition"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              <span>Add Signatures (Drag & Drop)</span>
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-6">
          <h3 className="font-semibold text-indigo-900 mb-3 flex items-center">
            <span className="text-2xl mr-2">📝</span>
            How to add signatures:
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>Click <strong className="text-indigo-600">"Add Signatures (Drag & Drop)"</strong> button above</li>
            <li>Click <strong className="text-indigo-600">"+ Add Signature Box"</strong> in the editor</li>
            <li><strong className="text-indigo-600">Click and drag</strong> the gray bar on the signature box to move it</li>
            <li>Enter the signer's name in the text box</li>
            <li>Click <strong className="text-indigo-600">"Save Field"</strong> to save the signature position</li>
            <li>Click <strong className="text-indigo-600">"Sign Here"</strong> to draw/type your signature with 15+ styles</li>
          </ol>
        </div>
      </div>

      {/* Simple Drag & Drop Editor */}
      {showEditor && (
        <DragDropPDFEditor
          documentId={id}
          fileUrl={document.file_path}
          onClose={() => setShowEditor(false)}
          onSave={fetchDocument}
        />
      )}
    </div>
  );
};

export default DocumentDetail;