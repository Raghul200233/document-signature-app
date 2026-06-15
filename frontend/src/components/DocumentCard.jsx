// frontend/src/components/DocumentCard.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { documentAPI } from '../services/api';

const DocumentCard = ({ document, onDelete, onStatusUpdate }) => {
  const navigate = useNavigate();
  const [showOptions, setShowOptions] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleCardClick = () => {
    const docId = document.id || document._id;
    navigate(`/document/${docId}`);
  };

  const handleDownload = async (e) => {
    e.stopPropagation();
    setDownloading(true);
    setShowOptions(false);
    
    try {
      const docId = document.id || document._id;
      const response = await documentAPI.download(docId);
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = document.original_name || document.fileName || 'document.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download document');
    } finally {
      setDownloading(false);
    }
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (window.confirm(`Delete "${document.title}"?`)) {
      try {
        await documentAPI.delete(document.id || document._id);
        onDelete(document.id || document._id);
      } catch (error) {
        console.error('Delete failed:', error);
      }
    }
    setShowOptions(false);
  };

  const handleStatusUpdate = async (e, newStatus, newSignatureStatus) => {
    e.stopPropagation();
    try {
      await documentAPI.updateStatus(document.id || document._id, {
        status: newStatus,
        signatureStatus: newSignatureStatus
      });
      onStatusUpdate?.(document.id || document._id, newStatus, newSignatureStatus);
      setShowStatusMenu(false);
      setShowOptions(false);
    } catch (error) {
      console.error('Status update failed:', error);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      signed: 'bg-green-100 text-green-800',
      expired: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getSignatureStatusColor = (status) => {
    const colors = {
      not_started: 'bg-gray-100 text-gray-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div 
      onClick={handleCardClick}
      className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer group"
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3 flex-1">
            <div className="text-3xl">📄</div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                {document.title}
              </h3>
            </div>
          </div>
          
          <div className="relative z-20" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => {
                setShowOptions(!showOptions);
                setShowStatusMenu(false);
              }}
              className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
            
            {showOptions && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-xl z-50 border py-1">
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  {downloading ? 'Downloading...' : 'Download'}
                </button>
                
                <div className="border-t my-1"></div>
                
                <div className="relative">
                  <button
                    onClick={() => setShowStatusMenu(!showStatusMenu)}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center justify-between"
                  >
                    <span>Update Status</span>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  
                  {showStatusMenu && (
                    <div className="absolute left-full top-0 ml-1 w-40 bg-white rounded-md shadow-xl z-50 border py-1">
                      <button onClick={(e) => handleStatusUpdate(e, 'pending', 'not_started')} className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100">
                        📄 Pending
                      </button>
                      <button onClick={(e) => handleStatusUpdate(e, 'pending', 'in_progress')} className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100">
                        ✍️ In Progress
                      </button>
                      <button onClick={(e) => handleStatusUpdate(e, 'signed', 'completed')} className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100">
                        ✅ Signed
                      </button>
                      <button onClick={(e) => handleStatusUpdate(e, 'cancelled', 'not_started')} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100">
                        ❌ Cancel
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="border-t my-1"></div>
                
                <button
                  onClick={handleDelete}
                  className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
        
        {document.description && (
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {document.description}
          </p>
        )}
        
        <div className="flex flex-wrap gap-2 mb-3">
          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(document.status)}`}>
            {document.status}
          </span>
          <span className={`px-2 py-1 text-xs rounded-full ${getSignatureStatusColor(document.signature_status || document.signatureStatus)}`}>
            {(document.signature_status || document.signatureStatus)?.replace('_', ' ') || 'Not started'}
          </span>
        </div>
        
        <div className="text-sm text-gray-500">
          <div className="flex items-center justify-between">
            <span>{formatFileSize(document.file_size || document.fileSize)}</span>
            <span>{formatDate(document.created_at || document.createdAt)}</span>
          </div>
        </div>
      </div>
      
      <div className="bg-gray-50 px-6 py-3 border-t">
        <div className="flex justify-between text-xs">
          <span className="text-gray-500">ID: {(document.id || document._id).slice(-6)}</span>
          <button
            onClick={handleDownload}
            className="text-indigo-600 hover:text-indigo-800 font-medium"
          >
            Download
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentCard;