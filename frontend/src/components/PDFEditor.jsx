import { useState, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Rnd } from 'react-rnd';
import signatureAPI from '../services/api';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

const PDFEditor = ({ documentId, fileUrl, onSave, existingSignatures = [] }) => {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [loading, setLoading] = useState(true);
  const [signatures, setSignatures] = useState([]);
  const [selectedSignature, setSelectedSignature] = useState(null);
  const [addingSignature, setAddingSignature] = useState(false);
  const [newSignature, setNewSignature] = useState({
    signerName: '',
    signerEmail: '',
    x: 100,
    y: 100,
    width: 200,
    height: 60
  });
  const [scale, setScale] = useState(1);
  const containerRef = useRef(null);
  const pageRef = useRef(null);

  useEffect(() => {
    // Load existing signatures
    loadSignatures();
  }, [documentId]);

  useEffect(() => {
    // Calculate scale when page loads
    if (pageRef.current) {
      const containerWidth = containerRef.current?.offsetWidth || 800;
      const pageWidth = pageRef.current?.offsetWidth || 600;
      setScale(containerWidth / pageWidth);
    }
  }, [pageRef.current]);

  const loadSignatures = async () => {
    try {
      const response = await signatureAPI.getByDocument(documentId);
      setSignatures(response.signatures || []);
    } catch (error) {
      console.error('Failed to load signatures:', error);
    }
  };

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setLoading(false);
  };

  const handleAddSignature = () => {
    setAddingSignature(true);
    setNewSignature({
      ...newSignature,
      x: 100,
      y: 100
    });
  };

  const handleSaveSignature = async () => {
    if (!newSignature.signerName || !newSignature.signerEmail) {
      alert('Please enter signer name and email');
      return;
    }

    try {
      await signatureAPI.create({
        documentId,
        signerEmail: newSignature.signerEmail,
        signerName: newSignature.signerName,
        positionX: Math.round(newSignature.x / scale),
        positionY: Math.round(newSignature.y / scale),
        pageNumber: pageNumber,
        width: newSignature.width,
        height: newSignature.height
      });
      
      await loadSignatures();
      setAddingSignature(false);
      setNewSignature({
        signerName: '',
        signerEmail: '',
        x: 100,
        y: 100,
        width: 200,
        height: 60
      });
      
      if (onSave) onSave();
    } catch (error) {
      console.error('Failed to save signature:', error);
      alert('Failed to save signature. Please try again.');
    }
  };

  const handleDragStop = async (id, x, y) => {
    try {
      await signatureAPI.updatePosition(id, {
        positionX: Math.round(x / scale),
        positionY: Math.round(y / scale),
        pageNumber: pageNumber
      });
      await loadSignatures();
    } catch (error) {
      console.error('Failed to update position:', error);
    }
  };

  const handleDeleteSignature = async (id) => {
    if (window.confirm('Are you sure you want to remove this signature field?')) {
      try {
        await signatureAPI.delete(id);
        await loadSignatures();
      } catch (error) {
        console.error('Failed to delete signature:', error);
      }
    }
  };

  const goToPrevPage = () => {
    setPageNumber(prev => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setPageNumber(prev => Math.min(prev + 1, numPages));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 text-white p-4 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">PDF Signature Editor</h2>
          <p className="text-sm text-gray-400">Drag and drop signature fields anywhere on the document</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleAddSignature}
            className="px-4 py-2 bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-2"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Add Signature Field</span>
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
          >
            Close Editor
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-gray-800 text-white p-3 flex justify-between items-center">
        <div className="flex space-x-4">
          <button
            onClick={goToPrevPage}
            disabled={pageNumber <= 1}
            className="px-3 py-1 bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600"
          >
            Previous Page
          </button>
          <span className="px-3 py-1">
            Page {pageNumber} of {numPages || '?'}
          </span>
          <button
            onClick={goToNextPage}
            disabled={pageNumber >= numPages}
            className="px-3 py-1 bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600"
          >
            Next Page
          </button>
        </div>
        <div className="text-sm text-gray-400">
          💡 Tip: Click and drag signature fields to reposition them
        </div>
      </div>

      {/* PDF Container with Signature Overlay */}
      <div className="flex-1 overflow-auto p-8" ref={containerRef}>
        <div className="relative inline-block" style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}>
          <div ref={pageRef}>
            <Document
              file={fileUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              loading={
                <div className="flex justify-center p-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                </div>
              }
            >
              <Page
                pageNumber={pageNumber}
                width={800}
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />
            </Document>
          </div>

          {/* Existing Signatures Overlay */}
          {!loading && signatures.map((sig) => (
            <Rnd
              key={sig.id}
              position={{
                x: sig.position_x * scale,
                y: sig.position_y * scale
              }}
              size={{ width: sig.width || 200, height: sig.height || 60 }}
              onDragStop={(e, d) => handleDragStop(sig.id, d.x, d.y)}
              bounds="parent"
              className="absolute cursor-move"
              onClick={() => setSelectedSignature(sig.id)}
            >
              <div
                className={`border-2 rounded-lg p-2 bg-yellow-50 bg-opacity-90 shadow-lg ${
                  selectedSignature === sig.id ? 'border-indigo-500 ring-2 ring-indigo-300' : 'border-yellow-400'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-800">{sig.signer_name}</p>
                    <p className="text-xs text-gray-600">{sig.signer_email}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {sig.status === 'signed' ? '✓ Signed' : '⏳ Pending'}
                    </p>
                  </div>
                  {sig.status === 'pending' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSignature(sig.id);
                      }}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <div className="mt-1 border-t border-yellow-200 pt-1">
                  <p className="text-xs text-gray-500 text-center">Sign Here</p>
                </div>
              </div>
            </Rnd>
          ))}

          {/* New Signature Field (Draggable while adding) */}
          {addingSignature && (
            <Rnd
              position={{ x: newSignature.x, y: newSignature.y }}
              size={{ width: newSignature.width, height: newSignature.height }}
              onDragStop={(e, d) => setNewSignature({ ...newSignature, x: d.x, y: d.y })}
              onResizeStop={(e, direction, ref, delta, position) => {
                setNewSignature({
                  ...newSignature,
                  width: ref.offsetWidth,
                  height: ref.offsetHeight,
                  x: position.x,
                  y: position.y
                });
              }}
              bounds="parent"
              className="absolute"
              minWidth={150}
              minHeight={50}
            >
              <div className="border-2 border-indigo-500 rounded-lg p-3 bg-indigo-50 bg-opacity-95 shadow-xl">
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Signer Name"
                    value={newSignature.signerName}
                    onChange={(e) => setNewSignature({ ...newSignature, signerName: e.target.value })}
                    className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <input
                    type="email"
                    placeholder="Signer Email"
                    value={newSignature.signerEmail}
                    onChange={(e) => setNewSignature({ ...newSignature, signerEmail: e.target.value })}
                    className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex space-x-2 pt-1">
                    <button
                      onClick={handleSaveSignature}
                      className="flex-1 px-2 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setAddingSignature(false)}
                      className="flex-1 px-2 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </Rnd>
          )}
        </div>
      </div>

      {/* Instructions Footer */}
      <div className="bg-gray-900 text-white p-3 text-center text-sm">
        <div className="flex justify-center space-x-6">
          <span>🖱️ Click "Add Signature Field" to create a new signature box</span>
          <span>↔️ Drag signature boxes to reposition them</span>
          <span>📝 Double-click to edit signer details</span>
          <span>🗑️ Click ✕ to remove a signature field</span>
        </div>
      </div>
    </div>
  );
};

export default PDFEditor;