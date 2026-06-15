import { useState, useRef, useEffect } from 'react';
import { Rnd } from 'react-rnd';
import EnhancedSignaturePad from './EnhancedSignaturePad';
import { signatureAPI } from '../services/api';

const DragDropPDFEditor = ({ documentId, fileUrl, onClose, onSave }) => {
  const [signatureFields, setSignatureFields] = useState([]);
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [selectedField, setSelectedField] = useState(null);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef(null);

  useEffect(() => {
    loadExistingSignatures();
  }, [documentId]);

  const loadExistingSignatures = async () => {
    try {
      const response = await signatureAPI.getByDocument(documentId);
      setSignatureFields(response.signatures || []);
    } catch (error) {
      console.error('Failed to load signatures:', error);
    } finally {
      setLoading(false);
    }
  };

  const addSignatureField = () => {
    const newField = {
      id: Date.now(),
      signerName: 'New Signer',
      positionX: 100,
      positionY: 100,
      width: 200,
      height: 80,
      isNew: true
    };
    setSignatureFields([...signatureFields, newField]);
  };

  const handleDragStop = (id, x, y) => {
    setSignatureFields(fields =>
      fields.map(field =>
        field.id === id ? { ...field, positionX: x, positionY: y } : field
      )
    );
  };

  const handleResize = (id, width, height, x, y) => {
    setSignatureFields(fields =>
      fields.map(field =>
        field.id === id ? { ...field, width, height, positionX: x, positionY: y } : field
      )
    );
  };

  const handleSaveField = async (field) => {
    try {
      const response = await signatureAPI.create({
        documentId: documentId,
        signerName: field.signerName,
        positionX: field.positionX,
        positionY: field.positionY,
        width: field.width,
        height: field.height,
        pageNumber: 1
      });
      
      // Update field with real ID
      setSignatureFields(fields =>
        fields.map(f =>
          f.id === field.id ? { ...response.signature, isNew: false } : f
        )
      );
      
      alert('Signature field added! You can now sign it.');
    } catch (error) {
      console.error('Failed to save field:', error);
      alert('Error adding signature field');
    }
  };

  const handleSign = (field) => {
    setSelectedField(field);
    setShowSignaturePad(true);
  };

  const handleSignatureSave = async (signatureData) => {
    if (selectedField) {
      try {
        await signatureAPI.submitSignature(selectedField.token, signatureData);
        alert('Signature saved successfully!');
        setShowSignaturePad(false);
        onSave?.();
      } catch (error) {
        console.error('Failed to save signature:', error);
        alert('Error saving signature');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black bg-opacity-90 flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 text-white p-4 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Drag & Drop Signature Editor</h2>
          <p className="text-sm text-gray-400">Drag signature boxes to position them on the PDF</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={addSignatureField}
            className="px-4 py-2 bg-indigo-600 rounded-lg hover:bg-indigo-700"
          >
            + Add Signature Box
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600"
          >
            Close
          </button>
        </div>
      </div>

      {/* PDF Container */}
      <div className="flex-1 overflow-auto p-8" ref={containerRef}>
        <div className="relative inline-block shadow-2xl">
          <iframe
            src={fileUrl}
            className="w-[800px] h-[1000px] border-0"
            title="PDF Document"
            onLoad={() => setLoading(false)}
          />
          
          {/* Draggable Signature Fields Overlay */}
          {!loading && signatureFields.map((field) => (
            <Rnd
              key={field.id}
              position={{ x: field.positionX, y: field.positionY }}
              size={{ width: field.width, height: field.height }}
              onDragStop={(e, d) => handleDragStop(field.id, d.x, d.y)}
              onResizeStop={(e, direction, ref, delta, position) =>
                handleResize(field.id, ref.offsetWidth, ref.offsetHeight, position.x, position.y)
              }
              bounds="parent"
              className="absolute"
              minWidth={150}
              minHeight={60}
            >
              <div className="border-2 border-indigo-500 rounded-lg bg-white bg-opacity-90 shadow-lg cursor-move group">
                <div className="p-3">
                  <div className="flex justify-between items-start mb-2">
                    <input
                      type="text"
                      value={field.signerName}
                      onChange={(e) => {
                        setSignatureFields(fields =>
                          fields.map(f =>
                            f.id === field.id ? { ...f, signerName: e.target.value } : f
                          )
                        );
                      }}
                      className="text-sm font-medium border-b border-gray-300 focus:border-indigo-500 outline-none bg-transparent"
                      placeholder="Signer name"
                      onClick={(e) => e.stopPropagation()}
                    />
                    {field.status !== 'signed' && (
                      <button
                        onClick={() => handleSign(field)}
                        className="text-xs bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-700"
                      >
                        Sign
                      </button>
                    )}
                  </div>
                  <div className="border-t border-indigo-200 pt-2">
                    <p className="text-xs text-gray-500 text-center">Sign Here</p>
                  </div>
                  {field.isNew && (
                    <button
                      onClick={() => handleSaveField(field)}
                      className="mt-2 w-full text-xs bg-green-600 text-white py-1 rounded hover:bg-green-700"
                    >
                      Save Field
                    </button>
                  )}
                  {field.status === 'signed' && (
                    <div className="mt-2 text-center text-green-600 text-xs">
                      ✓ Signed
                    </div>
                  )}
                </div>
                {/* Drag Handle */}
                <div className="absolute top-0 left-0 right-0 h-4 bg-indigo-100 rounded-t-lg cursor-move opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="text-center text-[10px] text-indigo-600">⋮⋮⋮ DRAG ⋮⋮⋮</div>
                </div>
              </div>
            </Rnd>
          ))}
        </div>
      </div>

      {/* Signature Pad Modal */}
      {showSignaturePad && (
        <EnhancedSignaturePad
          onSave={handleSignatureSave}
          onClose={() => setShowSignaturePad(false)}
        />
      )}
    </div>
  );
};

export default DragDropPDFEditor;