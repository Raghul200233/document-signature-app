import { useState, useRef, useEffect } from 'react';

const SIGNATURE_STYLES = [
  { id: 'classic', name: 'Classic', fontFamily: 'cursive' },
  { id: 'elegant', name: 'Elegant', fontFamily: 'Georgia, serif', fontStyle: 'italic' },
  { id: 'modern', name: 'Modern', fontFamily: 'Arial, sans-serif', fontWeight: 'bold' },
  { id: 'handwritten', name: 'Handwritten', fontFamily: '"Comic Sans MS", cursive' },
  { id: 'formal', name: 'Formal', fontFamily: '"Times New Roman", serif' },
  { id: 'bold', name: 'Bold', fontFamily: 'Impact, sans-serif', letterSpacing: '1px' }
];

const DraggableSignature = ({ pdfContainerRef, onSave, onCancel, documentId, onSigned }) => {
  const [name, setName] = useState('');
  const [selectedStyle, setSelectedStyle] = useState(SIGNATURE_STYLES[0]);
  const [position, setPosition] = useState({ x: 400, y: 400 });
  const [size, setSize] = useState({ width: 200, height: 60 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isPlaced, setIsPlaced] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const signatureRef = useRef(null);
  const startPosRef = useRef({ x: 0, y: 0 });
  const startSizeRef = useRef({ width: 0, height: 0 });

  const getStyleObject = () => ({
    fontFamily: selectedStyle.fontFamily,
    fontSize: '32px',
    fontWeight: selectedStyle.fontWeight || 'normal',
    fontStyle: selectedStyle.fontStyle || 'normal',
    letterSpacing: selectedStyle.letterSpacing || 'normal',
    color: '#000',
    cursor: isDragging ? 'grabbing' : 'grab',
    userSelect: 'none',
    padding: '10px 15px',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
    border: '2px solid #6366f1',
    whiteSpace: 'nowrap',
    display: 'inline-block',
    width: size.width,
    height: size.height,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    textAlign: 'center',
    lineHeight: `${size.height - 20}px`
  });

  // Handle drag start
  const handleMouseDown = (e) => {
    if (!isPlaced) return;
    e.preventDefault();
    e.stopPropagation();
    
    // Check if clicking on resize handle
    if (e.target.classList.contains('resize-handle')) {
      const direction = e.target.dataset.direction;
      if (direction) {
        setIsResizing(true);
        setResizeDirection(direction);
        startPosRef.current = { x: e.clientX, y: e.clientY };
        startSizeRef.current = { width: size.width, height: size.height };
        return;
      }
    }
    
    // Otherwise start dragging
    setIsDragging(true);
    const rect = signatureRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  // Handle drag/resize movement
  const handleMouseMove = (e) => {
    if (!isPlaced) return;
    e.preventDefault();
    
    const containerRect = pdfContainerRef.current?.getBoundingClientRect();
    if (!containerRect) return;
    
    if (isDragging) {
      let newX = e.clientX - dragOffset.x;
      let newY = e.clientY - dragOffset.y;
      
      // Constrain to container
      newX = Math.max(containerRect.left, Math.min(newX, containerRect.right - size.width));
      newY = Math.max(containerRect.top, Math.min(newY, containerRect.bottom - size.height));
      
      setPosition({ x: newX, y: newY });
    }
    
    if (isResizing) {
      const deltaX = e.clientX - startPosRef.current.x;
      const deltaY = e.clientY - startPosRef.current.y;
      
      let newWidth = startSizeRef.current.width;
      let newHeight = startSizeRef.current.height;
      
      switch (resizeDirection) {
        case 'e':
          newWidth = Math.max(150, startSizeRef.current.width + deltaX);
          break;
        case 's':
          newHeight = Math.max(50, startSizeRef.current.height + deltaY);
          break;
        case 'se':
          newWidth = Math.max(150, startSizeRef.current.width + deltaX);
          newHeight = Math.max(50, startSizeRef.current.height + deltaY);
          break;
        default:
          break;
      }
      
      setSize({ width: newWidth, height: newHeight });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeDirection(null);
  };

  useEffect(() => {
    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragOffset, size]);

  const handlePlaceSignature = () => {
    if (!name.trim()) {
      alert('Please enter your name');
      return;
    }
    setIsPlaced(true);
    // Center the signature on the screen
    const containerRect = pdfContainerRef.current?.getBoundingClientRect();
    if (containerRect) {
      setPosition({
        x: window.innerWidth / 2 - 100,
        y: window.innerHeight / 2 - 50
      });
    }
  };

  const handleSave = async () => {
    if (!isPlaced) {
      alert('Please place your signature on the PDF first');
      return;
    }

    setIsSaving(true);
    try {
      // Get the exact position where the signature is placed
      const containerRect = pdfContainerRef.current?.getBoundingClientRect();
      const signatureRect = signatureRef.current?.getBoundingClientRect();
      
      if (!containerRect || !signatureRect) {
        throw new Error('Could not determine position');
      }
      
      // Calculate relative position within the PDF container
      const relativeX = Math.max(0, signatureRect.left - containerRect.left);
      const relativeY = Math.max(0, signatureRect.top - containerRect.top);
      const sigWidth = signatureRect.width;
      const sigHeight = signatureRect.height;
      
      console.log('Saving signature at:', { 
        relativeX, 
        relativeY, 
        sigWidth, 
        sigHeight
      });

      const token = localStorage.getItem('token');
      
      const createResponse = await fetch('http://localhost:3003/api/signatures', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          documentId: documentId,
          signerName: name,
          positionX: Math.round(relativeX),
          positionY: Math.round(relativeY),
          width: Math.round(sigWidth),
          height: Math.round(sigHeight),
          pageNumber: 1
        })
      });

      const createData = await createResponse.json();
      if (!createData.success) throw new Error(createData.message);

      const submitResponse = await fetch(`http://localhost:3003/api/signatures/${createData.signature.token}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signatureText: name,
          style: selectedStyle.id
        })
      });

      const submitData = await submitResponse.json();
      if (submitData.success) {
        alert('✅ Document signed successfully!');
        if (onSigned) onSigned(submitData.signedPdfUrl);
        if (onSave) onSave();
      }
    } catch (error) {
      console.error('Failed to save:', error);
      alert('❌ Failed to save signature: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      {/* Modal for creating signature */}
      {!isPlaced && (
        <div className="fixed inset-0 z-[10000] bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b">
              <h2 className="text-2xl font-semibold">Create Your Signature</h2>
              <p className="text-gray-500 text-sm">Type your name and choose a style</p>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Your Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter your full name"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Signature Style</label>
                <div className="grid grid-cols-3 gap-3">
                  {SIGNATURE_STYLES.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => setSelectedStyle(style)}
                      className={`p-3 border-2 rounded-lg transition-all ${
                        selectedStyle.id === style.id
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-indigo-300'
                      }`}
                    >
                      <div style={{ fontFamily: style.fontFamily, fontSize: '24px' }}>Aa</div>
                      <div className="text-xs mt-1">{style.name}</div>
                    </button>
                  ))}
                </div>
              </div>
              {name && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="block text-sm font-medium mb-2">Preview</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                    <div style={getStyleObject()}>{name}</div>
                  </div>
                </div>
              )}
              <div className="flex gap-3">
                <button onClick={onCancel} className="flex-1 px-4 py-3 border rounded-lg">Cancel</button>
                <button onClick={handlePlaceSignature} disabled={!name} className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-lg disabled:opacity-50">
                  Create Signature
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Draggable Signature Overlay - THIS IS WHAT YOU DRAG */}
      {isPlaced && (
        <>
          {/* Instruction overlay */}
          <div className="fixed inset-0 bg-black bg-opacity-30 z-[10001] pointer-events-none">
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-indigo-600 text-white px-6 py-3 rounded-lg shadow-lg">
              ✍️ Drag your signature to the desired position on the PDF | Drag corners to resize
            </div>
          </div>
          
          {/* Draggable Signature - This is clickable and draggable */}
          <div
            ref={signatureRef}
            onMouseDown={handleMouseDown}
            className="fixed z-[10002]"
            style={{
              left: position.x,
              top: position.y,
              position: 'fixed',
              cursor: isDragging ? 'grabbing' : 'grab'
            }}
          >
            <div style={getStyleObject()}>
              {name}
              <div className="text-xs text-gray-400 text-center mt-1">Drag to position</div>
            </div>
            
            {/* Resize Handles */}
            <div 
              className="resize-handle absolute -right-2 -bottom-2 w-4 h-4 bg-indigo-500 rounded-full cursor-se-resize"
              data-direction="se"
              onMouseDown={(e) => { e.stopPropagation(); setIsResizing(true); setResizeDirection('se'); startPosRef.current = { x: e.clientX, y: e.clientY }; startSizeRef.current = { width: size.width, height: size.height }; }}
            ></div>
            <div 
              className="resize-handle absolute -right-2 top-1/2 w-4 h-4 bg-indigo-500 rounded-full cursor-e-resize"
              data-direction="e"
              onMouseDown={(e) => { e.stopPropagation(); setIsResizing(true); setResizeDirection('e'); startPosRef.current = { x: e.clientX, y: e.clientY }; startSizeRef.current = { width: size.width, height: size.height }; }}
            ></div>
            <div 
              className="resize-handle absolute bottom-0 left-1/2 w-4 h-4 bg-indigo-500 rounded-full cursor-s-resize"
              data-direction="s"
              onMouseDown={(e) => { e.stopPropagation(); setIsResizing(true); setResizeDirection('s'); startPosRef.current = { x: e.clientX, y: e.clientY }; startSizeRef.current = { width: size.width, height: size.height }; }}
            ></div>
            
            {/* Save Button */}
            <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-6 py-3 bg-green-600 text-white rounded-lg shadow-lg hover:bg-green-700 flex items-center gap-2 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Save Signed Document
                  </>
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default DraggableSignature;