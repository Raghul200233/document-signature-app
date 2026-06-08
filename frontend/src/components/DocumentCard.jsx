import { useState } from 'react';
import { documentAPI } from '../services/api';

const DocumentCard = ({ document, onDelete, onStatusUpdate }) => {
  const [showOptions, setShowOptions] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const response = await documentAPI.download(document._id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', document.originalName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setDownloading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        await documentAPI.delete(document._id);
        onDelete(document._id);
      } catch (error) {
        console.error('Delete failed:', error);
      }
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

  const getStatusIcon = (status) => {
    switch(status) {
      case 'pending':
        return '⏳';
      case 'signed':
        return '✓';
      case 'expired':
        return '⌛';
      default:
        return '📄';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden">
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">{getStatusIcon(document.status)}</div>
            <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
              {document.title}
            </h3>
          </div>
          
          <div className="relative">
            <button
              onClick={() => setShowOptions(!showOptions)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
            
            {showOptions && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border">
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  {downloading ? 'Downloading...' : 'Download'}
                </button>
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
          <span className={`px-2 py-1 text-xs rounded-full ${getSignatureStatusColor(document.signatureStatus)}`}>
            {document.signatureStatus.replace('_', ' ')}
          </span>
        </div>
        
        <div className="text-sm text-gray-500 space-y-1">
          <div className="flex items-center justify-between">
            <span className="flex items-center space-x-1">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <span>{formatFileSize(document.fileSize)}</span>
            </span>
            <span className="flex items-center space-x-1">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{formatDate(document.createdAt)}</span>
            </span>
          </div>
        </div>
      </div>
      
      <div className="bg-gray-50 px-6 py-3 border-t">
        <div className="flex justify-between text-xs text-gray-500">
          <span>ID: {document._id.slice(-6)}</span>
          {document.daysUntilExpiration > 0 && (
            <span>Expires in {document.daysUntilExpiration} days</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentCard;