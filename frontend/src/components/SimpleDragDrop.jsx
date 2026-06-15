import { useState, useRef, useEffect } from 'react';
import EnhancedSignaturePad from './EnhancedSignaturePad';
import { signatureAPI } from '../services/api';

const SimpleDragDrop = ({ documentId, fileUrl, onClose, onSave }) => {
  const [fields, setFields] = useState([]);
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [selectedField, setSelectedField] = useState(null);
  const [loading, setLoading] = useState(false);
  const [savingFieldId, setSavingFieldId] = useState(null);
  const containerRef = useRef(null);

  // Load existing signatures on mount
  useEffect(() => {
    loadSignatures();
  }, [documentId]);

  const loadSignatures = async () => {
    try {
      const response = await signatureAPI.getByDocument(documentId);
      const loadedFields = (response.signatures || []).map(sig => ({
        id: sig.id,
        signerName: sig.signerName,
        x: sig.positionX || 200,
        y: sig.positionY || 500,
        width: sig.width || 250,
        height: sig.height || 80,
        status: sig.status || 'pending',
        signatureData: sig.signatureData || null,
        token: sig.token,
        isFromDB: true
      }));
      setFields(loadedFields);
    } catch (error) {
      console.error('Failed to load signatures:', error);
    }
  };

  // Add a new signature field
  const addField = () => {
    const newField = {
      id: `temp_${Date.now()}`,
      signerName: '',
      x: 250,
      y: 500,
      width: 250,
      height: 80,
      status: 'pending',
      signatureData: null,
      isNew: true
    };
    setFields([...fields, newField]);
  };

  // Update field property
  const updateField = (id, updates) => {
    setFields(fields.map(field => 
      field.id === id ? { ...field, ...updates } : field
    ));
  };

  // Save new field to database
  const saveFieldToDatabase = async (field) => {
    if (!field.signerName.trim()) {
      alert('Please enter signer name');
      return false;
    }

    setSavingFieldId(field.id);
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
      
      if (response.success) {
        // Replace temp field with real one from database
        setFields(prevFields => 
          prevFields.map(f => 
            f.id === field.id ? {
              ...response.signature,
              x: field.x,
              y: field.y,
              width: field.width,
              height: field.height,
              signerName: field.signerName,
              isNew: false,
              isFromDB: true
            } : f
          )
        );
        alert('✅ Signature field saved successfully!');
        return true;
      }
    } catch (error) {
      console.error('Failed to save:', error);
      alert('❌ Error saving signature field');
      return false;
    } finally {
      setSavingFieldId(null);
    }
  };

  // Open signature pad for signing
  const openSignaturePad = (field) => {
    setSelectedField(field);
    setShowSignaturePad(true);
  };

  // Save drawn signature
const saveSignature = async (signatureData, signatureText, style) => {
  if (!selectedField) return;

  setLoading(true);
  try {
    let response;
    
    if (selectedField.isNew) {
      // First save the field
      const saved = await saveFieldToDatabase(selectedField);
      if (saved) {
        // Find the newly saved field
        const updatedField = fields.find(f => f.signerName === selectedField.signerName && !f.isNew);
        if (updatedField) {
          response = await signatureAPI.submitSignature(updatedField.token, signatureData, signatureText, style);
        }
      }
    } else {
      // Submit signature directly
      response = await signatureAPI.submitSignature(selectedField.token, signatureData, signatureText, style);
    }
    
    if (response && response.success) {
      updateField(selectedField.id, {
        status: 'signed',
        signatureData: signatureData || signatureText,
        signedAt: new Date()
      });
      
      alert('✅ Signature saved! Generating signed PDF...');
      
      setTimeout(() => {
        onClose();
        onSave?.(); // This will refresh the dashboard
      }, 1500);
    }
  } catch (error) {
    console.error('Failed to save signature:', error);
    alert('❌ Error saving signature');
  } finally {
    setLoading(false);
    setShowSignaturePad(false);
    setSelectedField(null);
  }
};

  // Delete field
  const deleteField = async (fieldId) => {
    if (window.confirm('Remove this signature field?')) {
      const field = fields.find(f => f.id === fieldId);
      if (field && !field.isNew && field.id.toString().includes('-')) {
        try {
          await signatureAPI.delete(fieldId);
        } catch (error) {
          console.error('Failed to delete:', error);
        }
      }
      setFields(fields.filter(f => f.id !== fieldId));
    }
  };

  // Update position via slider
  const updatePosition = (id, axis, value) => {
    setFields(fields.map(field => 
      field.id === id ? { ...field, [axis]: parseInt(value) } : field
    ));
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black bg-opacity-90 flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 text-white p-4 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Signature Editor</h2>
          <p className="text-sm text-gray-400">Add signature fields and position them using sliders</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={addField}
            className="px-4 py-2 bg-indigo-600 rounded-lg hover:bg-indigo-700 transition"
          >
            + Add Signature Field
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition"
          >
            Close
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* PDF Preview */}
        <div className="flex-1 overflow-auto p-4" ref={containerRef}>
          <div className="relative inline-block shadow-2xl">
            <iframe
              src={fileUrl}
              className="w-[800px] h-[1000px] border-0"
              title="PDF Document"
            />
            
            {/* Signature Position Overlay */}
            {fields.map((field) => (
              <div
                key={field.id}
                className="absolute border-2 border-dashed rounded-lg flex items-center justify-center"
                style={{
                  left: field.x,
                  top: field.y,
                  width: field.width,
                  height: field.height,
                  borderColor: field.status === 'signed' ? '#22c55e' : '#6366f1',
                  backgroundColor: field.status === 'signed' ? 'rgba(34,197,94,0.1)' : 'rgba(99,102,241,0.1)'
                }}
              >
                <span className="text-sm font-medium" style={{ color: field.status === 'signed' ? '#22c55e' : '#6366f1' }}>
                  {field.status === 'signed' ? '✓ Signed' : (field.signerName || 'Signature Here')}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Controls Panel */}
        <div className="w-96 bg-gray-800 p-4 overflow-y-auto">
          <h3 className="text-white font-semibold mb-4">Signature Fields</h3>
          
          {fields.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              <p>No signature fields</p>
              <button onClick={addField} className="mt-2 text-indigo-400 hover:text-indigo-300">
                + Add your first signature
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {fields.map((field) => (
                <div key={field.id} className="bg-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="text-white font-medium">
                      {field.signerName || 'New Field'}
                    </h4>
                    <button
                      onClick={() => deleteField(field.id)}
                      className="text-red-400 hover:text-red-300 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                  
                  {/* Signer Name */}
                  <div className="mb-3">
                    <label className="text-gray-300 text-sm block mb-1">Signer Name</label>
                    <input
                      type="text"
                      value={field.signerName}
                      onChange={(e) => updateField(field.id, { signerName: e.target.value })}
                      className="w-full px-3 py-2 rounded bg-gray-600 text-white border border-gray-500 focus:border-indigo-500 focus:outline-none"
                      placeholder="Enter signer name"
                      disabled={field.status === 'signed' || savingFieldId === field.id}
                    />
                  </div>
                  
                  {/* X Position */}
                  <div className="mb-3">
                    <label className="text-gray-300 text-sm block mb-1">X Position: {field.x}px</label>
                    <input
                      type="range"
                      min="0"
                      max="700"
                      value={field.x}
                      onChange={(e) => updatePosition(field.id, 'x', e.target.value)}
                      className="w-full"
                      disabled={field.status === 'signed'}
                    />
                  </div>
                  
                  {/* Y Position */}
                  <div className="mb-3">
                    <label className="text-gray-300 text-sm block mb-1">Y Position: {field.y}px</label>
                    <input
                      type="range"
                      min="0"
                      max="950"
                      value={field.y}
                      onChange={(e) => updatePosition(field.id, 'y', e.target.value)}
                      className="w-full"
                      disabled={field.status === 'signed'}
                    />
                  </div>
                  
                  {/* Actions */}
                  <div className="mt-3 pt-3 border-t border-gray-600">
                    {field.status === 'signed' ? (
                      <div className="text-green-400 text-sm flex items-center justify-between">
                        <span>✓ Signed</span>
                        {field.signatureData && (
                          <img src={field.signatureData} alt="Signature" className="h-8" />
                        )}
                      </div>
                    ) : field.isNew ? (
                      <button
                        onClick={() => saveFieldToDatabase(field)}
                        disabled={!field.signerName || savingFieldId === field.id}
                        className="w-full py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                      >
                        {savingFieldId === field.id ? 'Saving...' : 'Save Field'}
                      </button>
                    ) : (
                      <button
                        onClick={() => openSignaturePad(field)}
                        disabled={loading}
                        className="w-full py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
                      >
                        Sign Here
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Guide */}
          <div className="mt-6 p-3 bg-gray-700 rounded-lg">
            <p className="text-gray-300 text-xs">
              📍 <strong>Position Guide:</strong><br />
              • X: 100-250 = Left side<br />
              • X: 250-450 = Center<br />
              • X: 450-600 = Right side<br />
              • Y: 500-700 = Bottom of page<br />
              • Y: 100-300 = Top of page
            </p>
          </div>
        </div>
      </div>

      {/* Signature Pad */}
      {showSignaturePad && (
        <EnhancedSignaturePad
          onSave={saveSignature}
          onClose={() => {
            setShowSignaturePad(false);
            setSelectedField(null);
          }}
        />
      )}
    </div>
  );
};

export default SimpleDragDrop;