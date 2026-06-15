import { useState, useRef } from 'react';
import SignatureStyles from './SignatureStyles';

const EnhancedSignaturePad = ({ onSave, onClose, onFinalize, documentId }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState(null);
  const [signatureType, setSignatureType] = useState('draw'); // 'draw', 'type', 'upload'
  const [typedName, setTypedName] = useState('');
  const [previewUrl, setPreviewUrl] = useState(null);

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    setIsDrawing(true);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    ctx.lineTo(x, y);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setPreviewUrl(null);
  };

    const finalizeAndSign = async () => {
    if (onFinalize) {
      await onFinalize();
    }
    onClose();
  };

  const drawTypedSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.font = `40px ${selectedStyle?.font || 'cursive'}`;
    ctx.fillStyle = '#000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(typedName || 'Signature', canvas.width / 2, canvas.height / 2);
  };

const saveSignature = () => {
  if (signatureType === 'draw') {
    const canvas = canvasRef.current;
    const dataUrl = canvas.toDataURL('image/png');
    onSave(dataUrl, null, selectedStyle?.id || 'classic');
  } else if (signatureType === 'type') {
    // For text signature, pass the text and style
    onSave(null, typedName || 'Signature', selectedStyle?.id || 'classic');
  }
  onClose();
};

  const handleTypeChange = (e) => {
    setTypedName(e.target.value);
    if (signatureType === 'type') {
      setTimeout(drawTypedSignature, 10);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000] p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
        <div className="p-6">
          <h3 className="text-xl font-semibold mb-4">Sign Your Document</h3>
          
          {/* Signature Type Tabs */}
          <div className="flex space-x-2 mb-6 border-b">
            <button
              onClick={() => setSignatureType('draw')}
              className={`px-4 py-2 ${signatureType === 'draw' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500'}`}
            >
              ✍️ Draw Signature
            </button>
            <button
              onClick={() => setSignatureType('type')}
              className={`px-4 py-2 ${signatureType === 'type' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500'}`}
            >
              ⌨️ Type Signature
            </button>
          </div>

          {/* Signature Styles */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Choose Signature Style
            </label>
            <SignatureStyles selectedStyle={selectedStyle} onSelectStyle={setSelectedStyle} />
          </div>

          {/* Canvas for Drawing */}
          {signatureType === 'draw' && (
            <div className="mb-4">
              <div className="border-2 border-gray-300 rounded-lg mb-2 bg-white">
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={200}
                  className="w-full cursor-crosshair"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  style={{ touchAction: 'none' }}
                />
              </div>
              <p className="text-xs text-gray-500">Draw your signature using mouse or touch</p>
            </div>
          )}

          {/* Type Signature */}
{signatureType === 'type' && (
  <div className="mb-4">
    <input
      type="text"
      value={typedName}
      onChange={handleTypeChange}
      placeholder="Type your name here..."
      className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      style={{ 
        fontFamily: selectedStyle?.fontFamily || 'cursive', 
        fontSize: '24px' 
      }}
    />
    <div className="border-2 border-gray-300 rounded-lg p-4 bg-gray-50 min-h-[150px] flex items-center justify-center">
      <span style={{ 
        fontFamily: selectedStyle?.fontFamily || 'cursive', 
        fontSize: '32px',
        fontStyle: selectedStyle?.fontStyle || 'normal',
        fontWeight: selectedStyle?.fontWeight || 'normal',
        textTransform: selectedStyle?.textTransform || 'none',
        letterSpacing: selectedStyle?.letterSpacing || 'normal'
      }}>
        {typedName || 'Your Signature Preview'}
      </span>
    </div>
  </div>
)}

          {/* Preview */}
          {previewUrl && (
            <div className="mb-4 p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-green-800 mb-2">✓ Signature created!</p>
              <img src={previewUrl} alt="Signature preview" className="h-12" />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={clearCanvas}
              className="px-4 py-2 border rounded-md hover:bg-gray-50"
            >
              Clear
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 border rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={saveSignature}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Save Signature
            </button>
            <button
                onClick={finalizeAndSign}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
                Finalize & Generate Signed PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedSignaturePad;