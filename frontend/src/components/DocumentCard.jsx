import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { documentAPI } from '../services/api';

const DocumentCard = ({ document, onDelete, onStatusUpdate }) => {
  const navigate = useNavigate();
  const [showOptions, setShowOptions] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleCardClick = () => {
    navigate(`/document/${document.id}`);
  };

  const handleDownload = async (e) => {
    e.stopPropagation();
    setDownloading(true);
    setShowOptions(false);
    
    try {
      const response = await documentAPI.download(document.id);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = document.original_name || 'document.pdf';
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
        await documentAPI.delete(document.id);
        onDelete(document.id);
      } catch (error) {
        console.error('Delete failed:', error);
      }
    }
    setShowOptions(false);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      signed: 'bg-green-50 text-green-700 border-green-200',
      expired: 'bg-red-50 text-red-700 border-red-200',
      cancelled: 'bg-gray-50 text-gray-700 border-gray-200'
    };
    return badges[status] || 'bg-gray-50 text-gray-700 border-gray-200';
  };

  return (
    <div 
      onClick={handleCardClick}
      className="bg-white rounded-xl border border-gray-100 hover:shadow-lg transition-all duration-200 cursor-pointer group"
    >
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
              {document.title}
            </h3>
            {document.description && (
              <p className="text-sm text-gray-500 mt-1 truncate">{document.description}</p>
            )}
          </div>
          
          <div className="relative ml-3 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowOptions(!showOptions)}
              className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
            
            {showOptions && (
              <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-xl border border-gray-100 py-1 z-20">
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  {downloading ? 'Downloading...' : 'Download'}
                </button>
                <button
                  onClick={handleDelete}
                  className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 mt-3">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(document.status)}`}>
            {document.status}
          </span>
          <span className="text-xs text-gray-400">{formatFileSize(document.file_size)}</span>
          <span className="text-xs text-gray-400">•</span>
          <span className="text-xs text-gray-400">
            {new Date(document.created_at).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default DocumentCard;