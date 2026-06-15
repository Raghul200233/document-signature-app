import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const SIGNATURE_STYLES = [
  { id: 'classic', name: 'Classic', fontFamily: 'cursive' },
  { id: 'elegant', name: 'Elegant', fontFamily: 'Georgia, serif', fontStyle: 'italic' },
  { id: 'modern', name: 'Modern', fontFamily: 'Arial, sans-serif', fontWeight: 'bold' },
  { id: 'handwritten', name: 'Handwritten', fontFamily: '"Comic Sans MS", cursive' }
];

const PublicSignature = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [signatureData, setSignatureData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [name, setName] = useState('');
  const [selectedStyle, setSelectedStyle] = useState(SIGNATURE_STYLES[0]);
  const [isSigning, setIsSigning] = useState(false);
  const [isSigned, setIsSigned] = useState(false);
  const pdfContainerRef = useRef(null);

  useEffect(() => {
    fetchSignatureDetails();
  }, [token]);

  const fetchSignatureDetails = async () => {
    try {
      const response = await fetch(`http://localhost:3003/api/signatures/public/${token}`);
      const data = await response.json();
      
      if (data.success) {
        setSignatureData(data.signature);
        setName(data.signature.signerName);
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError('Failed to load signature request');
    } finally {
      setLoading(false);
    }
  };

  const handleSign = async () => {
    if (!name.trim()) {
      alert('Please enter your name');
      return;
    }

    setIsSigning(true);
    try {
      const response = await fetch(`http://localhost:3003/api/signatures/${token}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signatureText: name,
          style: selectedStyle.id
        })
      });

      const data = await response.json();
      if (data.success) {
        setIsSigned(true);
        alert('✅ Document signed successfully!');
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Failed to sign:', error);
      alert('❌ Failed to sign document');
    } finally {
      setIsSigning(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white rounded-lg p-8 max-w-md text-center shadow-lg">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={() => window.location.href = '/'} className="bg-indigo-600 text-white px-6 py-2 rounded">
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  if (isSigned) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white rounded-lg p-8 max-w-md text-center shadow-lg">
          <div className="text-green-500 text-5xl mb-4">✓</div>
          <h2 className="text-2xl font-bold mb-2">Thank You!</h2>
          <p className="text-gray-600 mb-4">You have successfully signed the document.</p>
          <button onClick={() => window.location.href = '/'} className="bg-indigo-600 text-white px-6 py-2 rounded">
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 border-b bg-indigo-50">
            <h1 className="text-2xl font-bold text-gray-900">Sign Document</h1>
            <p className="text-gray-600">You have been requested to sign: <strong>{signatureData?.documentTitle}</strong></p>
          </div>

          {/* PDF Preview */}
          <div ref={pdfContainerRef} className="relative bg-gray-100" style={{ minHeight: '600px' }}>
            <div className="w-full h-[600px] overflow-auto bg-white">
              <iframe
                src={signatureData?.documentUrl}
                className="w-full min-h-[800px] border-0"
                title="PDF Document"
              />
            </div>
          </div>

          {/* Signature Form */}
          <div className="p-6 border-t">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Add Your Signature</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Your Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter your full name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Signature Style</label>
                <select
                  value={selectedStyle.id}
                  onChange={(e) => setSelectedStyle(SIGNATURE_STYLES.find(s => s.id === e.target.value))}
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {SIGNATURE_STYLES.map(style => (
                    <option key={style.id} value={style.id}>{style.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Preview */}
            {name && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Preview:</p>
                <div style={{ fontFamily: selectedStyle.fontFamily, fontSize: '28px' }}>
                  {name}
                </div>
              </div>
            )}

            <div className="mt-6">
              <button
                onClick={handleSign}
                disabled={isSigning || !name}
                className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-lg font-semibold"
              >
                {isSigning ? 'Signing...' : 'Sign Document'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicSignature;