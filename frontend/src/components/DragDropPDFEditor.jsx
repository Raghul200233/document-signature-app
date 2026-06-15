import { useState, useRef, useEffect } from 'react';
import SignaturePad from './SignaturePad';
import { signatureAPI } from '../services/api';

const SimpleDragDrop = ({ documentId, fileUrl, onClose, onSave }) => {
  const [signatureFields, setSignatureFields] = useState([]);
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [selectedField, setSelectedField] = useState(null);
  const [dragging, setDragging] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
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
    }
  };

  const addSignatureField = () => {
    const newField = {
      id: Date.now(),
      signerName: 'New Signer',
      x: 100,
      y: 100,
      width: 200,
      height: 80,
      isNew: true,
      status: 'pending'
    };
    setSignatureFields([...signatureFields, newField]);
  };

  const handleMouseDown = (e, field) => {
    e.preventDefault();
    e.stopPropagation();
    
    const rect = e.currentTarget.getBoundingClientRect();
    const containerRect = containerRef.current?.getBoundingClientRect();
    
    setDragging(field.id);
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleMouseMove = (e) => {
    if (dragging === null) return;
    
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) return;
    
    let newX = e.clientX - containerRect.left - dragOffset.x;
    let newY = e.clientY - containerRect.top - dragOffset.y;
    
    // Constrain within container
    newX = Math.max(0, Math.min(newX, containerRect.width - 200));
    newY = Math.max(0, Math.min(newY, containerRect.height - 80));
    
    setSignatureFields(fields =>
      fields.map(field =>
        field.id === dragging ? { ...field, x: newX, y: newY } : field
      )
    );
  };

  const handleMouseUp = () => {
    setDragging(null);
  };

  useEffect(() => {
    if (dragging !== null) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, dragOffset]);

  const handleSaveField = async (field) => {
    try {
      const response = await signatureAPI.create({
        documentId: documentId,
        signerName: field.signerName,
        positionX: field.x,
        positionY: field.y,
        width: field.width,
        height: field.height,
        pageNumber: 1
      });
      
      setSignatureFields(fields =>
        fields.map(f =>
          f.id === field.id ? { ...response.signature, isNew: false, x: field.x, y: field.y } : f
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
        // Update the signature field with the drawn signature
        setSignatureFields(fields =>
          fields.map(f =>
            f.id === selectedField.id ? { ...f, status: 'signed', signatureData: signatureData } : f
          )
        );
        
        setShowSignaturePad(false);
        alert('Signature saved successfully!');
        onSave?.();
      } catch (error) {
        console.error('Failed to save signature:', error);
        alert('Error saving signature');
      }
    }
  };

  const deleteField = (fieldId) => {
    setSignatureFields(fields => fields.filter(f => f.id !== fieldId));
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black bg-opacity-90 flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 text-white p-4 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Drag & Drop Signature Editor</h2>
          <p className="text-sm text-gray-400">Click and drag signature boxes to position them</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={addSignatureField}
            className="px-4 py-2 bg-indigo-600 rounded-lg hover:bg-indigo-700 transition"
          >
            + Add Signature Box
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition"
          >
            Close
          </button>
        </div>
      </div>

      {/* PDF Container */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-auto p-8 relative"
        style={{ position: 'relative' }}
      >
        <div className="relative inline-block shadow-2xl">
          {/* PDF Iframe */}
          <iframe
            src={fileUrl}
            className="w-[800px] h-[1000px] border-0"
            title="PDF Document"
          />
          
          {/* Draggable Signature Fields Overlay */}
          {signatureFields.map((field) => (
            <div
              key={field.id}
              className="absolute cursor-move group"
              style={{
                left: field.x,
                top: field.y,
                width: field.width,
                height: field.height,
                zIndex: dragging === field.id ? 100 : 10
              }}
              onMouseDown={(e) => handleMouseDown(e, field)}
            >
              <div className="border-2 border-indigo-500 rounded-lg bg-white bg-opacity-95 shadow-lg h-full flex flex-col">
                {/* Drag Handle */}
                <div className="bg-indigo-100 rounded-t-lg cursor-move p-1 text-center text-[10px] text-indigo-600">
                  ⋮⋮⋮ DRAG TO MOVE ⋮⋮⋮
                </div>
                
                {/* Content */}
                <div className="p-2 flex-1 flex flex-col">
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
                    className="text-sm font-medium border border-gray-300 rounded px-2 py-1 mb-2 focus:border-indigo-500 focus:outline-none"
                    placeholder="Signer name"
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                  />
                  
                  {field.status !== 'signed' ? (
                    <button
                      onClick={() => handleSign(field)}
                      className="text-xs bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-700 transition"
                    >
                      Sign Here
                    </button>
                  ) : (
                    <div className="text-center">
                      <div className="text-green-600 text-xs mb-1">✓ Signed</div>
                      {field.signatureData && (
                        <img 
                          src={field.signatureData} 
                          alt="Signature" 
                          className="h-8 object-contain mx-auto"
                        />
                      )}
                    </div>
                  )}
                  
                  {field.isNew && (
                    <button
                      onClick={() => handleSaveField(field)}
                      className="mt-2 text-xs bg-green-600 text-white py-1 rounded hover:bg-green-700 transition"
                    >
                      Save Field
                    </button>
                  )}
                  
                  <button
                    onClick={() => deleteField(field.id)}
                    className="mt-1 text-xs text-red-500 hover:text-red-700 transition"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Signature Pad Modal */}
      {showSignaturePad && (
        <SignaturePad
          onSave={handleSignatureSave}
          onClose={() => setShowSignaturePad(false)}
        />
      )}
    </div>
  );
};

export default SimpleDragDrop;