import { useState, useEffect } from 'react';
import signatureAPI from '../services/api';

const SignaturePlacement = ({ documentId, onSignatureAdded, existingSignatures = [] }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [signerEmail, setSignerEmail] = useState('');
  const [signerName, setSignerName] = useState('');
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [loading, setLoading] = useState(false);
  const [signatures, setSignatures] = useState(existingSignatures);

  useEffect(() => {
    loadSignatures();
  }, [documentId]);

  const loadSignatures = async () => {
    try {
      const response = await signatureAPI.getByDocument(documentId);
      setSignatures(response.signatures);
    } catch (error) {
      console.error('Failed to load signatures:', error);
    }
  };

  const handleAddSignature = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await signatureAPI.create({
        documentId,
        signerEmail,
        signerName,
        positionX: position.x,
        positionY: position.y,
        pageNumber: 1
      });
      
      await loadSignatures();
      setShowAddForm(false);
      setSignerEmail('');
      setSignerName('');
      onSignatureAdded();
    } catch (error) {
      console.error('Failed to add signature:', error);
      alert('Failed to add signature. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSignature = async (id) => {
    if (window.confirm('Are you sure you want to remove this signature request?')) {
      try {
        await signatureAPI.delete(id);
        await loadSignatures();
        onSignatureAdded();
      } catch (error) {
        console.error('Failed to delete signature:', error);
      }
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      signed: 'bg-green-100 text-green-800',
      declined: 'bg-red-100 text-red-800',
      expired: 'bg-gray-100 text-gray-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="mt-6">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-lg font-medium text-gray-900">Signature Fields</h4>
        <button
          onClick={() => setShowAddForm(true)}
          className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
        >
          + Add Signature Field
        </button>
      </div>

      {/* Existing Signatures */}
      {signatures.length > 0 && (
        <div className="space-y-3 mb-4">
          {signatures.map((sig) => (
            <div key={sig.id} className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-gray-900">{sig.signerName}</p>
                  <p className="text-sm text-gray-600">{sig.signerEmail}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(sig.status)}`}>
                      {sig.status}
                    </span>
                    <span className="text-xs text-gray-500">
                      Position: ({sig.position.x}, {sig.position.y})
                    </span>
                  </div>
                  {sig.signedAt && (
                    <p className="text-xs text-gray-500 mt-1">
                      Signed: {new Date(sig.signedAt).toLocaleString()}
                    </p>
                  )}
                </div>
                {sig.status === 'pending' && (
                  <button
                    onClick={() => handleDeleteSignature(sig.id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Signature Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Add Signature Field</h3>
            
            <form onSubmit={handleAddSignature}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Signer Name *
                </label>
                <input
                  type="text"
                  required
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Full name"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Signer Email *
                </label>
                <input
                  type="email"
                  required
                  value={signerEmail}
                  onChange={(e) => setSignerEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="email@example.com"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Signature Position (X, Y)
                </label>
                <div className="flex space-x-3">
                  <input
                    type="number"
                    value={position.x}
                    onChange={(e) => setPosition({ ...position, x: parseInt(e.target.value) })}
                    className="w-24 px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="X"
                  />
                  <input
                    type="number"
                    value={position.y}
                    onChange={(e) => setPosition({ ...position, y: parseInt(e.target.value) })}
                    className="w-24 px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Y"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Tip: Position will be adjusted on PDF (0,0 is top-left)
                </p>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 border rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  {loading ? 'Adding...' : 'Add Signature Field'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Visual Guide for PDF Position */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
        <p className="text-sm text-blue-800">
          💡 <strong>Position Guide:</strong> The signature will appear at coordinates (X, Y) on your PDF.
          X = horizontal position (0 = left edge), Y = vertical position (0 = top edge).
          Recommended position: X: 100-400, Y: 500-700 for bottom of first page.
        </p>
      </div>
    </div>
  );
};

export default SignaturePlacement;