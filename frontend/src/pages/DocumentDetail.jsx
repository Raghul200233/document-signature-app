import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Rnd } from 'react-rnd';
import { documentAPI } from '../services/api';
import AuditTimeline from '../components/AuditTimeline';
import SignatureSidebar from '../components/SignatureSidebar';

const DocumentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [signedPdfUrl, setSignedPdfUrl] = useState(null);
  const [isSigned, setIsSigned] = useState(false);
  const [activeTab, setActiveTab] = useState('info');
  const [showSidebar, setShowSidebar] = useState(true);
  const pdfContainerRef = useRef(null);
  const dropOverlayRef = useRef(null);

  // Signature state - stored in parent
  const [signature, setSignature] = useState(null);
  const [isPlaced, setIsPlaced] = useState(false);
  const [signatureData, setSignatureData] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Rnd position and size
  const [rndPosition, setRndPosition] = useState({ x: 100, y: 100 });
  const [rndSize, setRndSize] = useState({ width: 200, height: 60 });

  // Font size calculated from height
  const getFontSize = (height) => {
    return Math.max(16, Math.min(72, height * 0.5));
  };

  useEffect(() => {
    if (id) {
      fetchDocument();
    }
  }, [id]);

  const fetchDocument = async () => {
    try {
      setLoading(true);
      const response = await documentAPI.getById(id);

      if (response.success && response.document) {
        setDocument(response.document);
        if (response.document.signed_file_path) {
          setSignedPdfUrl(response.document.signed_file_path);
          setIsSigned(true);
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

  const handlePlaceSignature = (data) => {
    setSignatureData(data);
  };

  // Handle drop on overlay
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const dragData = JSON.parse(e.dataTransfer.getData('application/json'));
      console.log('Drag data:', dragData);

      const containerRect = pdfContainerRef.current?.getBoundingClientRect();
      if (!containerRect) {
        throw new Error('Could not determine position');
      }

      // EXACT mouse position relative to container
      const x = e.clientX - containerRect.left;
      const y = e.clientY - containerRect.top;

      console.log('Drop position (exact):', { x, y });

      // Ensure position is within bounds
      const boundedX = Math.max(0, Math.min(x, containerRect.width - 200));
      const boundedY = Math.max(0, Math.min(y, containerRect.height - 60));

      setRndPosition({ x: boundedX, y: boundedY });
      setRndSize({ width: 200, height: 60 });
      setSignature({
        text: dragData.text,
        style: dragData.style,
        fontFamily: dragData.fontFamily || 'cursive',
        fontStyle: dragData.fontStyle || 'normal',
        fontWeight: dragData.fontWeight || 'normal'
      });
      setIsPlaced(true);
      setSignatureData(dragData);

    } catch (error) {
      console.error('Drop error:', error);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
  };

  const handleDragStop = (e, d) => {
    const containerRect = pdfContainerRef.current?.getBoundingClientRect();
    if (containerRect) {
      const newX = Math.max(0, Math.min(d.x, containerRect.width - rndSize.width));
      const newY = Math.max(0, Math.min(d.y, containerRect.height - rndSize.height));
      setRndPosition({ x: newX, y: newY });
    }
  };

  const handleResizeStop = (e, direction, ref, delta, position) => {
    const newWidth = parseInt(ref.style.width);
    const newHeight = parseInt(ref.style.height);
    setRndSize({ width: newWidth, height: newHeight });
    setRndPosition({ x: position.x, y: position.y });
  };

  const handleSign = async () => {
    if (!isPlaced || !signature) {
      alert('Please drag your signature onto the document first');
      return;
    }

    setIsSaving(true);
    try {
      const containerRect = pdfContainerRef.current?.getBoundingClientRect();
      if (!containerRect) {
        throw new Error('Could not determine position');
      }

      const positionX = Math.round(rndPosition.x);
      const positionY = Math.round(rndPosition.y);
      const width = Math.round(rndSize.width);
      const height = Math.round(rndSize.height);

      console.log('Saving signature:', { positionX, positionY, width, height });

      const token = localStorage.getItem('token');

      // SINGLE API CALL for speed
      const response = await fetch('http://localhost:3003/api/signatures/quick-sign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          documentId: id,
          signerName: signature.text,
          positionX: positionX,
          positionY: positionY,
          width: width,
          height: height,
          style: signature.style,
          pageNumber: 1
        })
      });

      const data = await response.json();
      
      if (data.success) {
        alert('✅ Document signed successfully!');
        if (data.signedPdfUrl) {
          setSignedPdfUrl(data.signedPdfUrl);
        }
        setIsSigned(true);
        setIsPlaced(false);
        setSignature(null);
        await fetchDocument();
      } else {
        throw new Error(data.message || 'Failed to sign');
      }
    } catch (error) {
      console.error('Failed to sign:', error);
      alert('❌ Failed to sign: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadSigned = () => {
    const url = signedPdfUrl || document?.signed_file_path;
    if (url) {
      window.open(url, '_blank');
    } else {
      alert('No signed PDF available yet.');
    }
  };

  const removeSignature = () => {
    setIsPlaced(false);
    setSignature(null);
    setSignatureData(null);
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

          <div className="flex items-center gap-3">
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
            {isPlaced && (
              <button
                onClick={removeSignature}
                className="text-red-600 hover:text-red-800 text-sm"
              >
                Remove Signature
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="flex h-[800px]">
            {/* PDF Viewer */}
            <div className={`flex-1 ${showSidebar ? '' : 'w-full'}`}>
              <div className="p-4 border-b">
                <h1 className="text-xl font-semibold text-gray-900">{document.title}</h1>
                <div className="flex gap-3 mt-1">
                  <span className={`text-xs px-2 py-1 rounded-full ${document.status === 'signed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {document.status}
                  </span>
                </div>
              </div>

              {/* PDF Container with Drop Overlay */}
              <div
                ref={pdfContainerRef}
                className="h-[720px] overflow-auto relative"
                style={{ position: 'relative' }}
              >
                {/* PDF Iframe */}
                <iframe
                  src={pdfUrl}
                  className="w-full h-full border-0"
                  title="PDF Document"
                  style={{ pointerEvents: isPlaced ? 'none' : 'auto' }}
                />

                {/* DROP OVERLAY - This captures the drop event */}
                <div
                  ref={dropOverlayRef}
                  className="absolute inset-0 z-10"
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  style={{
                    pointerEvents: isPlaced ? 'none' : 'auto',
                    cursor: 'copy'
                  }}
                />

                {/* Signature Overlay - Rnd for Drag + Resize */}
                {isPlaced && signature && (
                  <Rnd
                    position={rndPosition}
                    size={rndSize}
                    onDragStop={handleDragStop}
                    onResizeStop={handleResizeStop}
                    bounds="parent"
                    minWidth={100}
                    minHeight={40}
                    maxWidth={500}
                    maxHeight={150}
                    className="absolute z-20"
                    dragHandleClassName="drag-handle"
                  >
                    <div
                      className="bg-white rounded-lg border-2 border-indigo-500 shadow-lg p-2 h-full w-full flex items-center justify-center"
                      style={{
                        fontFamily: signature.fontFamily || 'cursive',
                        fontSize: `${getFontSize(rndSize.height)}px`,
                        fontStyle: signature.fontStyle || 'normal',
                        fontWeight: signature.fontWeight || 'normal',
                        color: '#000',
                        cursor: 'move'
                      }}
                    >
                      <span className="drag-handle w-full h-full flex items-center justify-center select-none">
                        {signature.text}
                      </span>
                      {/* Resize handle indicator */}
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-indigo-500 rounded-full cursor-se-resize" />
                    </div>
                  </Rnd>
                )}

                {/* Floating Sign Button - appears when signature is placed */}
                {isPlaced && !isSigned && (
                  <div className="absolute bottom-4 right-4 z-30">
                    <button
                      onClick={handleSign}
                      disabled={isSaving}
                      className="px-6 py-3 bg-green-600 text-white rounded-lg shadow-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 flex items-center gap-2"
                    >
                      {isSaving ? (
                        <>
                          <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Signing...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Sign Document
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Drop instruction overlay */}
                {!isPlaced && !isSigned && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="bg-white bg-opacity-80 px-6 py-3 rounded-lg shadow-lg border-2 border-dashed border-indigo-300">
                      <p className="text-gray-600 text-sm">Drag your signature from the sidebar and drop it here</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Signature Sidebar - Now with Sign Button inside */}
            {showSidebar && !isSigned && (
              <SignatureSidebar
                documentId={id}
                onPlaceSignature={handlePlaceSignature}
                onSign={handleSign}
                isSigned={isSigned}
                isSaving={isSaving}
              />
            )}

            {/* Signed Status */}
            {showSidebar && isSigned && (
              <div className="w-80 bg-white border-l border-gray-200 flex items-center justify-center p-8">
                <div className="text-center">
                  <div className="text-green-500 text-5xl mb-3">✓</div>
                  <p className="text-green-600 font-medium">Document Signed!</p>
                  <button
                    onClick={handleDownloadSigned}
                    className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Download Signed PDF
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tabs below */}
        <div className="bg-white rounded-xl shadow-lg mt-6 overflow-hidden">
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
              </div>
            )}
            {activeTab === 'audit' && <AuditTimeline documentId={id} />}
          </div>
        </div>
      </div>
    </div>
  );
};

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default DocumentDetail;