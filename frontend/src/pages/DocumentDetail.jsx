import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { documentAPI, signatureAPI } from '../services/api';
import SimpleSignatureModal from '../components/SimpleSignatureModal';

const DocumentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [existingSignature, setExistingSignature] = useState(null);

  useEffect(() => {
    fetchDocument();
    checkExistingSignature();
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

  const checkExistingSignature = async () => {
    try {
      const response = await signatureAPI.getByDocument(id);
      const signedSig = response.signatures?.find(s => s.status === 'signed');
      if (signedSig) {
        setExistingSignature(signedSig);
      }
    } catch (error) {
      console.error('Failed to check signature:', error);
    }
  };

  const handleSign = async () => {
    setShowSignatureModal(true);
  };

  const handleSaveSignature = async (fullName, style) => {
    setIsSigning(true);
    try {
      // First create a signature field
      const createResponse = await signatureAPI.create({
        documentId: id,
        signerName: fullName,
        pageNumber: 1
      });

      if (createResponse.success) {
        // Then submit the signature
        const submitResponse = await signatureAPI.submitSignature(
          createResponse.signature.token,
          fullName,
          style
        );

        if (submitResponse.success) {
          alert('✅ Document signed successfully!');
          setShowSignatureModal(false);
          fetchDocument();
          navigate('/dashboard');
        }
      }
    } catch (error) {
      console.error('Failed to sign:', error);
      alert('❌ Failed to sign document. Please try again.');
    } finally {
      setIsSigning(false);
    }
  };

  const handleDownloadSigned = () => {
    if (document?.signed_file_path) {
      window.open(document.signed_file_path, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!document) return null;

  const isSigned = document.status === 'signed' || existingSignature;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <button onClick={() => navigate('/dashboard')} className="text-indigo-600 hover:text-indigo-800">
            ← Back to Dashboard
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* PDF Preview */}
          <div className="p-6 border-b">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{document.title}</h1>
            <iframe
              src={document.file_path}
              className="w-full h-[600px] border rounded-lg"
              title="PDF Preview"
            />
          </div>

          {/* Signing Options */}
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Signing options</h2>
            
            {isSigned ? (
              <div className="text-center py-8">
                <div className="text-green-500 text-5xl mb-3">✓</div>
                <p className="text-green-600 font-medium">Document has been signed!</p>
                {document.signed_file_path && (
                  <button
                    onClick={handleDownloadSigned}
                    className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Download Signed PDF
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Simple Signature Option */}
                <div 
                  onClick={handleSign}
                  className="border-2 border-indigo-200 rounded-xl p-6 cursor-pointer hover:border-indigo-500 hover:shadow-lg transition-all"
                >
                  <div className="text-4xl mb-3">✍️</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Simple Signature</h3>
                  <p className="text-gray-500 text-sm">Type your name and choose a style</p>
                  <div className="mt-4 text-indigo-600 text-sm">Click to sign →</div>
                </div>

                {/* Digital Signature Option */}
                <div className="border-2 border-gray-200 rounded-xl p-6 opacity-50">
                  <div className="text-4xl mb-3">🔐</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Digital Signature</h3>
                  <p className="text-gray-500 text-sm">Coming soon</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Signature Modal */}
      {showSignatureModal && (
        <SimpleSignatureModal
          onSave={handleSaveSignature}
          onClose={() => setShowSignatureModal(false)}
        />
      )}
    </div>
  );
};

export default DocumentDetail;