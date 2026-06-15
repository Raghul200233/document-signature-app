import { useState } from 'react';

const SIGNATURE_STYLES = [
  { id: 'classic', name: 'Classic', icon: '✍️', fontFamily: '"Brush Script MT", cursive', fontStyle: 'normal' },
  { id: 'elegant', name: 'Elegant', icon: '🖋️', fontFamily: 'Georgia, serif', fontStyle: 'italic' },
  { id: 'modern', name: 'Modern', icon: '✨', fontFamily: 'Arial, sans-serif', fontStyle: 'normal', fontWeight: 'bold' },
  { id: 'handwritten', name: 'Handwritten', icon: '📝', fontFamily: '"Comic Sans MS", cursive', fontStyle: 'normal' },
  { id: 'formal', name: 'Formal', icon: '📜', fontFamily: '"Times New Roman", serif', fontStyle: 'normal' },
  { id: 'minimal', name: 'Minimal', icon: '○', fontFamily: 'Arial, sans-serif', fontStyle: 'normal', fontWeight: '300', letterSpacing: '2px' },
  { id: 'bold', name: 'Bold', icon: '💪', fontFamily: 'Impact, sans-serif', fontStyle: 'normal', letterSpacing: '1px' },
  { id: 'script', name: 'Script', icon: '✒️', fontFamily: '"Lucida Handwriting", cursive', fontStyle: 'normal' },
  { id: 'vintage', name: 'Vintage', icon: '🎩', fontFamily: '"Courier New", monospace', fontStyle: 'normal', textTransform: 'uppercase' },
  { id: 'artistic', name: 'Artistic', icon: '🎨', fontFamily: '"Palatino Linotype", serif', fontStyle: 'italic', fontWeight: 'bold' },
  { id: 'signature', name: 'Signature', icon: '📄', fontFamily: '"Segoe Script", cursive', fontStyle: 'normal' },
  { id: 'clean', name: 'Clean', icon: '🧼', fontFamily: 'Verdana, sans-serif', fontStyle: 'normal', fontWeight: '500' },
  { id: 'stylish', name: 'Stylish', icon: '💎', fontFamily: '"Century Gothic", sans-serif', fontStyle: 'normal', textTransform: 'uppercase', letterSpacing: '3px' },
  { id: 'playful', name: 'Playful', icon: '🎈', fontFamily: '"Comic Neue", cursive', fontStyle: 'normal', fontWeight: 'bold' },
  { id: 'professional', name: 'Professional', icon: '💼', fontFamily: 'Calibri, sans-serif', fontStyle: 'normal', fontWeight: '600' }
];

const SignatureStyles = ({ selectedStyle, onSelectStyle }) => {
  // Build style object for preview
  const getStyleObject = (style) => ({
    fontFamily: style.fontFamily,
    fontStyle: style.fontStyle,
    fontWeight: style.fontWeight || 'normal',
    textTransform: style.textTransform || 'none',
    letterSpacing: style.letterSpacing || 'normal',
    fontSize: '10px'
  });

  return (
    <div className="grid grid-cols-5 gap-3 mb-4">
      {SIGNATURE_STYLES.map((style) => (
        <button
          key={style.id}
          onClick={() => onSelectStyle(style)}
          className={`p-3 rounded-lg border-2 transition-all ${
            selectedStyle?.id === style.id
              ? 'border-indigo-500 bg-indigo-50 shadow-md'
              : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
          }`}
        >
          <div className="text-2xl mb-1">{style.icon}</div>
          <div className="text-xs font-medium">{style.name}</div>
          <div className="text-[10px] text-gray-500 mt-1" style={getStyleObject(style)}>
            Aa
          </div>
        </button>
      ))}
    </div>
  );
};

export default SignatureStyles;