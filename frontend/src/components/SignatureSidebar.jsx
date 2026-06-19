import { useState } from 'react';

const SIGNATURE_STYLES = [
  { id: 'classic', name: 'Classic', fontFamily: 'cursive', fontStyle: 'normal', fontWeight: 'normal' },
  { id: 'elegant', name: 'Elegant', fontFamily: 'Georgia, serif', fontStyle: 'italic', fontWeight: 'normal' },
  { id: 'modern', name: 'Modern', fontFamily: 'Arial, sans-serif', fontStyle: 'normal', fontWeight: 'bold' },
  { id: 'handwritten', name: 'Handwritten', fontFamily: '"Comic Sans MS", cursive', fontStyle: 'normal', fontWeight: 'normal' },
  { id: 'formal', name: 'Formal', fontFamily: '"Times New Roman", serif', fontStyle: 'normal', fontWeight: 'normal' },
  { id: 'bold', name: 'Bold', fontFamily: 'Impact, sans-serif', fontStyle: 'normal', fontWeight: 'bold' },
  { id: 'script', name: 'Script', fontFamily: '"Lucida Handwriting", cursive', fontStyle: 'normal', fontWeight: 'normal' },
  { id: 'vintage', name: 'Vintage', fontFamily: '"Courier New", monospace', fontStyle: 'normal', fontWeight: 'normal' },
  { id: 'artistic', name: 'Artistic', fontFamily: '"Palatino Linotype", serif', fontStyle: 'italic', fontWeight: 'bold' },
  { id: 'professional', name: 'Professional', fontFamily: 'Calibri, sans-serif', fontStyle: 'normal', fontWeight: '600' }
];

const SignatureSidebar = ({ onPlaceSignature, onSign, isSigned, documentId, isSaving }) => {
  const [selectedStyle, setSelectedStyle] = useState(SIGNATURE_STYLES[0]);
  const [signatureText, setSignatureText] = useState('');
  const [setIsSaving] = useState(false);

  const handleDragStart = (e) => {
    if (!signatureText.trim()) {
      e.preventDefault();
      alert('Please enter your signature text first');
      return;
    }

    const dragData = {
      text: signatureText,
      style: selectedStyle.id,
      fontFamily: selectedStyle.fontFamily,
      fontStyle: selectedStyle.fontStyle,
      fontWeight: selectedStyle.fontWeight
    };

    e.dataTransfer.setData('application/json', JSON.stringify(dragData));
    e.dataTransfer.effectAllowed = 'copy';

    // Custom drag image
    const dragImage = document.createElement('div');
    dragImage.textContent = signatureText;
    dragImage.style.cssText = `
      font-family: ${selectedStyle.fontFamily};
      font-size: 32px;
      font-style: ${selectedStyle.fontStyle};
      font-weight: ${selectedStyle.fontWeight};
      padding: 10px 20px;
      background: white;
      border: 2px solid #4f46e5;
      border-radius: 8px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.2);
      color: #000;
      white-space: nowrap;
    `;
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 50, 20);
    setTimeout(() => document.body.removeChild(dragImage), 0);

    if (onPlaceSignature) {
      onPlaceSignature({
        text: signatureText,
        style: selectedStyle.id,
        fontFamily: selectedStyle.fontFamily,
        fontStyle: selectedStyle.fontStyle,
        fontWeight: selectedStyle.fontWeight
      });
    }
  };

  const handleSign = async () => {
    setIsSaving(true);
    try {
      // This will be handled by parent
      if (onSign) {
        await onSign();
      }
    } catch (error) {
      console.error('Failed to sign:', error);
      alert('❌ Failed to sign: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-96 bg-white border-l border-gray-200 h-full flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Signing options</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Signature Text Input */}
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-2">Your Signature</h3>
          <input
            type="text"
            value={signatureText}
            onChange={(e) => setSignatureText(e.target.value)}
            placeholder="Type your name here..."
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* 10 Signature Styles */}
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-2">Signature Style</h3>
          <div className="grid grid-cols-2 gap-2">
            {SIGNATURE_STYLES.map((style) => (
              <button
                key={style.id}
                onClick={() => setSelectedStyle(style)}
                className={`p-2 border-2 rounded-lg text-center transition-all ${
                  selectedStyle.id === style.id
                    ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                    : 'border-gray-200 hover:border-indigo-300'
                }`}
              >
                <div style={{
                  fontFamily: style.fontFamily,
                  fontSize: '16px',
                  fontStyle: style.fontStyle,
                  fontWeight: style.fontWeight,
                  color: '#1f2937'
                }}>
                  Aa
                </div>
                <div className="text-[10px] text-gray-500 mt-1">{style.name}</div>
              </button>
            ))}
          </div>
        </div>

        {/* DRAGGABLE SIGNATURE PREVIEW */}
        {signatureText && (
          <div className="bg-gray-50 rounded-lg p-3 border-2 border-dashed border-indigo-300">
            <p className="text-xs text-gray-500 mb-2">👇 Drag this to the PDF:</p>
            <div
              draggable="true"
              onDragStart={handleDragStart}
              className="inline-block cursor-grab active:cursor-grabbing hover:shadow-lg transition-shadow select-none"
              style={{
                fontFamily: selectedStyle.fontFamily,
                fontSize: '32px',
                fontStyle: selectedStyle.fontStyle,
                fontWeight: selectedStyle.fontWeight,
                color: '#000',
                userSelect: 'none',
                padding: '10px 20px',
                backgroundColor: 'white',
                borderRadius: '8px',
                border: '2px solid #4f46e5',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                display: 'inline-block',
                whiteSpace: 'nowrap'
              }}
            >
              {signatureText}
              <div className="text-[10px] text-gray-400 text-center mt-1">↕ Drag to PDF</div>
            </div>
          </div>
        )}

        {/* Sign Button */}
        {!isSigned && (
          <button
            onClick={handleSign}
            disabled={isSaving}
            className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
          >
            {isSaving ? 'Signing...' : 'Sign Document'}
          </button>
        )}
      </div>
    </div>
  );
};

export default SignatureSidebar;