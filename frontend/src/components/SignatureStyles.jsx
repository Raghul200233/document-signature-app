import { useState } from 'react';

const SIGNATURE_STYLES = [
  { id: 'classic', name: 'Classic', icon: '✍️', font: 'cursive', style: 'font-family: "Brush Script MT", cursive;' },
  { id: 'elegant', name: 'Elegant', icon: '🖋️', font: 'Georgia', style: 'font-family: Georgia, serif; font-style: italic;' },
  { id: 'modern', name: 'Modern', icon: '✨', font: 'Arial', style: 'font-family: Arial, sans-serif; font-weight: bold;' },
  { id: 'handwritten', name: 'Handwritten', icon: '📝', font: '"Comic Sans MS", cursive', style: 'font-family: "Comic Sans MS", cursive;' },
  { id: 'formal', name: 'Formal', icon: '📜', font: '"Times New Roman", serif', style: 'font-family: "Times New Roman", serif;' },
  { id: 'minimal', name: 'Minimal', icon: '○', font: 'Arial', style: 'font-family: Arial, sans-serif; font-weight: 300; letter-spacing: 2px;' },
  { id: 'bold', name: 'Bold', icon: '💪', font: 'Impact', style: 'font-family: Impact, sans-serif; letter-spacing: 1px;' },
  { id: 'script', name: 'Script', icon: '✒️', font: '"Lucida Handwriting", cursive', style: 'font-family: "Lucida Handwriting", cursive;' },
  { id: 'vintage', name: 'Vintage', icon: '🎩', font: '"Courier New", monospace', style: 'font-family: "Courier New", monospace; text-transform: uppercase;' },
  { id: 'artistic', name: 'Artistic', icon: '🎨', font: '"Palatino Linotype", serif', style: 'font-family: "Palatino Linotype", serif; font-style: italic; font-weight: bold;' },
  { id: 'signature', name: 'Signature', icon: '📄', font: '"Segoe Script", cursive', style: 'font-family: "Segoe Script", cursive;' },
  { id: 'clean', name: 'Clean', icon: '🧼', font: 'Verdana', style: 'font-family: Verdana, sans-serif; font-weight: 500;' },
  { id: 'stylish', name: 'Stylish', icon: '💎', font: '"Century Gothic", sans-serif', style: 'font-family: "Century Gothic", sans-serif; text-transform: uppercase; letter-spacing: 3px;' },
  { id: 'playful', name: 'Playful', icon: '🎈', font: '"Comic Neue", cursive', style: 'font-family: "Comic Neue", cursive; font-weight: bold;' },
  { id: 'professional', name: 'Professional', icon: '💼', font: 'Calibri', style: 'font-family: Calibri, sans-serif; font-weight: 600;' }
];

const SignatureStyles = ({ selectedStyle, onSelectStyle }) => {
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
          <div className="text-[10px] text-gray-500 mt-1" style={style.style}>
            Aa
          </div>
        </button>
      ))}
    </div>
  );
};

export default SignatureStyles;