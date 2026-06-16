import { useState, useEffect } from 'react';
import { documentAPI } from '../services/api';

const AuditTimeline = ({ documentId }) => {
  const [logs, setLogs] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (documentId) {
      fetchAuditData();
    }
  }, [documentId]);

  const fetchAuditData = async () => {
    try {
      setLoading(true);
      
      // Fetch audit logs
      const token = localStorage.getItem('token');
      const logsResponse = await fetch(`http://localhost:3003/api/audit/document/${documentId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const logsData = await logsResponse.json();
      
      // Fetch summary
      const summaryResponse = await fetch(`http://localhost:3003/api/audit/document/${documentId}/summary`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const summaryData = await summaryResponse.json();
      
      if (logsData.success) setLogs(logsData.logs);
      if (summaryData.success) setSummary(summaryData.summary);
      
    } catch (error) {
      console.error('Failed to fetch audit data:', error);
      setError('Failed to load activity history');
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action) => {
    const icons = {
      upload: '📤',
      download: '📥',
      view: '👁️',
      signature_submitted: '✍️',
      delete: '🗑️',
      status_update: '🔄',
      signature_created: '📝'
    };
    return icons[action] || '📋';
  };

  const getActionColor = (action) => {
    const colors = {
      upload: 'text-blue-600 bg-blue-50',
      download: 'text-green-600 bg-green-50',
      view: 'text-gray-600 bg-gray-50',
      signature_submitted: 'text-purple-600 bg-purple-50',
      delete: 'text-red-600 bg-red-50',
      status_update: 'text-yellow-600 bg-yellow-50',
      signature_created: 'text-indigo-600 bg-indigo-50'
    };
    return colors[action] || 'text-gray-600 bg-gray-50';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8 text-red-600">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-blue-600">{summary.total}</div>
            <div className="text-sm text-blue-600">Total Activities</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-600">{summary.views}</div>
            <div className="text-sm text-green-600">Views</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-purple-600">{summary.signatures}</div>
            <div className="text-sm text-purple-600">Signatures</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-yellow-600">{summary.downloads}</div>
            <div className="text-sm text-yellow-600">Downloads</div>
          </div>
        </div>
      )}

      {/* Timeline */}
      {logs.length === 0 ? (
        <div className="text-center p-8 text-gray-500">
          <p>No activity recorded yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {logs.map((log) => (
            <div key={log.id} className="flex items-start space-x-3 p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className={`p-2 rounded-full ${getActionColor(log.action)}`}>
                <span className="text-xl">{getActionIcon(log.action)}</span>
              </div>
              
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-medium text-gray-900">
                      {log.action.replace('_', ' ').toUpperCase()}
                    </span>
                    {log.profiles && (
                      <span className="text-sm text-gray-600 ml-2">
                        by {log.profiles.name || log.profiles.email}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">
                    {formatDate(log.created_at)}
                  </span>
                </div>
                
                {log.details && Object.keys(log.details).length > 0 && (
                  <div className="mt-1 text-sm text-gray-500">
                    {Object.entries(log.details).map(([key, value]) => (
                      <span key={key} className="mr-3">
                        <span className="text-gray-400">{key}:</span> {String(value)}
                      </span>
                    ))}
                  </div>
                )}
                
                <div className="mt-1 text-xs text-gray-400">
                  {log.ip_address && <span className="mr-3">IP: {log.ip_address}</span>}
                  {log.user_agent && <span>Device: {log.user_agent.substring(0, 50)}...</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AuditTimeline;