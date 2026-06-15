import { useState } from 'react';

const SIGNATURE_STYLES = [
  { id: 'classic', name: 'Classic', font: 'cursive', example: 'John Doe' },
  { id: 'elegant', name: 'Elegant', font: 'Georgia, serif', example: 'John Doe' },
  { id: 'modern', name: 'Modern', font: 'Arial, sans-serif', example: 'John Doe' },
  { id: 'handwritten', name: 'Handwritten', font: '"Comic Sans MS", cursive', example: 'John Doe' },
  { id: 'formal', name: 'Formal', font: '"Times New Roman", serif', example: 'John Doe' },
  { id: 'bold', name: 'Bold', font: 'Impact, sans-serif', example: 'JOHN DOE' },
  { id: 'script', name: 'Script', font: '"Lucida Handwriting", cursive', example: 'John Doe' },
  { id: 'vintage', name: 'Vintage', font: '"Courier New", monospace', example: 'JOHN DOE' }
];

const SimpleSignatureModal = ({ onSave, onClose }) => {
  const [fullName, setFullName] = useState('');
  const [selectedStyle, setSelectedStyle] = useState(SIGNATURE_STYLES[0]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) {
      alert('Please enter your name');
      return;
    }
    
    setIsLoading(true);
    try {
      await onSave(fullName, selectedStyle.id);
    } finally {
      setIsLoading(false);
    }
  };

  const getStylePreview = (style) => {
    return {
      fontFamily: style.font,
      fontSize: '28px',
      fontWeight: style.id === 'bold' ? 'bold' : 'normal',
      textTransform: style.id === 'vintage' ? 'uppercase' : 'none',
      letterSpacing: style.id === 'modern' ? '2px' : 'normal'
    };
  };

  return (
    <div className="fixed inset-0 z-[10000] bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold text-gray-900">Set your signature details</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">
              ×
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Full Name Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full name:
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Your name"
              autoFocus
            />
          </div>

          {/* Signature Style Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Signature Style:
            </label>
            <select
              value={selectedStyle.id}
              onChange={(e) => setSelectedStyle(SIGNATURE_STYLES.find(s => s.id === e.target.value))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {SIGNATURE_STYLES.map(style => (
                <option key={style.id} value={style.id}>
                  {style.name}
                </option>
              ))}
            </select>
          </div>

          {/* Preview Section */}
          <div className="bg-gray-50 rounded-lg p-4">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Preview:
            </label>
            <div 
              className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center"
              style={getStylePreview(selectedStyle)}
            >
              {fullName || selectedStyle.example}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !fullName}
              className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : 'Sign'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SimpleSignatureModal;