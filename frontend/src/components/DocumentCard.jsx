import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { documentAPI } from '../services/api';
import PDFViewer from './PDFViewer';

const DocumentCard = ({ document, onDelete, onStatusUpdate }) => {
  const navigate = useNavigate();
  const [showOptions, setShowOptions] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  // Format file size from bytes to readable format
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format date to readable format
  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Handle document preview
  const handlePreview = (e) => {
    e.stopPropagation();
    setShowPreview(true);
    setShowOptions(false);
  };

  // Handle document download
  const handleDownload = async (e) => {
    e.stopPropagation();
    setDownloading(true);
    setShowOptions(false);
    
    try {
      const response = await documentAPI.download(document.id || document._id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', document.original_name || document.fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download document. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  // Handle document delete
  const handleDelete = async (e) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete "${document.title}"? This action cannot be undone.`)) {
      try {
        await documentAPI.delete(document.id || document._id);
        onDelete(document.id || document._id);
      } catch (error) {
        console.error('Delete failed:', error);
        alert('Failed to delete document. Please try again.');
      }
    }
    setShowOptions(false);
  };

  // Handle status update
  const handleStatusUpdate = async (e, newStatus, newSignatureStatus) => {
    e.stopPropagation();
    try {
      await documentAPI.updateStatus(document.id || document._id, {
        status: newStatus,
        signatureStatus: newSignatureStatus
      });
      onStatusUpdate?.(document.id || document._id, newStatus, newSignatureStatus);
      setShowStatusMenu(false);
    } catch (error) {
      console.error('Status update failed:', error);
      alert('Failed to update status. Please try again.');
    }
  };

  // Navigate to document detail page
  const handleCardClick = () => {
    navigate(`/document/${document.id || document._id}`);
  };

  // Get status color based on document status
  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      signed: 'bg-green-100 text-green-800',
      expired: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
      draft: 'bg-blue-100 text-blue-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  // Get signature status color
  const getSignatureStatusColor = (status) => {
    const colors = {
      not_started: 'bg-gray-100 text-gray-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch(status) {
      case 'pending':
        return '⏳';
      case 'signed':
        return '✓✅';
      case 'expired':
        return '⌛⚠️';
      case 'cancelled':
        return '❌';
      default:
        return '📄';
    }
  };

  // Get signature status icon
  const getSignatureStatusIcon = (status) => {
    switch(status) {
      case 'not_started':
        return '📝';
      case 'in_progress':
        return '✍️';
      case 'completed':
        return '✅';
      case 'rejected':
        return '❌';
      default:
        return '📋';
    }
  };

  return (
    <>
      <div 
        onClick={handleCardClick}
        className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer group"
      >
        {/* Card Header with Icon and Options */}
        <div className="p-6">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-3 flex-1">
              <div className="text-3xl group-hover:scale-110 transition-transform duration-200">
                {getStatusIcon(document.status)}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                  {document.title}
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  ID: {(document.id || document._id).slice(-8)}
                </p>
              </div>
            </div>
            
            {/* Options Menu */}
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setShowOptions(!showOptions)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>
              
              {/* Dropdown Menu */}
              {showOptions && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg z-10 border py-1">
                  <button
                    onClick={handlePreview}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span>Quick Preview</span>
                  </button>
                  
                  <button
                    onClick={handleDownload}
                    disabled={downloading}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2 disabled:opacity-50"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span>{downloading ? 'Downloading...' : 'Download'}</span>
                  </button>
                  
                  <div className="border-t my-1"></div>
                  
                  {/* Status Update Submenu */}
                  <div className="relative">
                    <button
                      onClick={() => setShowStatusMenu(!showStatusMenu)}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center justify-between"
                    >
                      <span className="flex items-center space-x-2">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span>Update Status</span>
                      </span>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    
                    {showStatusMenu && (
                      <div className="absolute left-full top-0 ml-1 w-48 bg-white rounded-md shadow-lg z-20 border">
                        <button
                          onClick={(e) => handleStatusUpdate(e, 'pending', 'not_started')}
                          className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                        >
                          📄 Pending
                        </button>
                        <button
                          onClick={(e) => handleStatusUpdate(e, 'pending', 'in_progress')}
                          className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                        >
                          ✍️ In Progress
                        </button>
                        <button
                          onClick={(e) => handleStatusUpdate(e, 'signed', 'completed')}
                          className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                        >
                          ✅ Signed
                        </button>
                        <button
                          onClick={(e) => handleStatusUpdate(e, 'pending', 'rejected')}
                          className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                        >
                          ❌ Rejected
                        </button>
                        <button
                          onClick={(e) => handleStatusUpdate(e, 'cancelled', 'not_started')}
                          className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                        >
                          🚫 Cancel
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div className="border-t my-1"></div>
                  
                  <button
                    onClick={handleDelete}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center space-x-2"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span>Delete</span>
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* Description */}
          {document.description && (
            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
              {document.description}
            </p>
          )}
          
          {/* Status Badges */}
          <div className="flex flex-wrap gap-2 mb-3">
            <div className="flex items-center space-x-1">
              <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(document.status)}`}>
                {getStatusIcon(document.status)} {document.status}
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <span className={`px-2 py-1 text-xs rounded-full ${getSignatureStatusColor(document.signature_status || document.signatureStatus)}`}>
                {getSignatureStatusIcon(document.signature_status || document.signatureStatus)} {(document.signature_status || document.signatureStatus)?.replace('_', ' ')}
              </span>
            </div>
          </div>
          
          {/* Document Metadata */}
          <div className="text-sm text-gray-500 space-y-2">
            <div className="flex items-center justify-between">
              <span className="flex items-center space-x-1">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                <span>{formatFileSize(document.file_size || document.fileSize)}</span>
              </span>
              <span className="flex items-center space-x-1">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>{formatDate(document.created_at)}</span>
              </span>
            </div>
            
            {/* Signature Progress */}
            {(document.signatures_completed !== undefined || document.required_signatures !== undefined) && (
              <div className="mt-2">
                <div className="flex justify-between text-xs mb-1">
                  <span>Signature Progress</span>
                  <span>{document.signatures_completed || 0}/{document.required_signatures || 1}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div 
                    className="bg-green-600 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${((document.signatures_completed || 0) / (document.required_signatures || 1)) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Footer with Quick Actions */}
        <div className="bg-gray-50 px-6 py-3 border-t">
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-500">
              {document.status === 'signed' ? '✓ Fully signed' : 'Awaiting signatures'}
            </span>
            <div className="flex space-x-3">
              <button
                onClick={handlePreview}
                className="text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
              >
                Preview
              </button>
              <button
                onClick={handleDownload}
                className="text-gray-600 hover:text-gray-800 font-medium transition-colors"
              >
                Download
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* PDF Preview Modal */}
      {showPreview && (
        <PDFViewer 
          fileUrl={document.file_path || document.filePath}
          onClose={() => setShowPreview(false)}
        />
      )}
    </>
  );
};

export default DocumentCard;