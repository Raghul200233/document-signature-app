const supabase = require('../config/supabase');

// Log an action
const logAction = async ({
  documentId,
  userId,
  action,
  details = {},
  ipAddress = null,
  userAgent = null
}) => {
  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .insert({
        document_id: documentId,
        user_id: userId,
        action: action,
        details: details,
        ip_address: ipAddress,
        user_agent: userAgent
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, log: data };
  } catch (error) {
    console.error('Audit log error:', error);
    return { success: false, error: error.message };
  }
};

// Get audit logs for a document
const getDocumentAuditLogs = async (documentId, limit = 50) => {
  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*, profiles(name, email)')
      .eq('document_id', documentId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return { success: true, logs: data };
  } catch (error) {
    console.error('Get audit logs error:', error);
    return { success: false, error: error.message };
  }
};

// Get all audit logs for a user
const getUserAuditLogs = async (userId, limit = 100) => {
  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*, documents(title)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return { success: true, logs: data };
  } catch (error) {
    console.error('Get user audit logs error:', error);
    return { success: false, error: error.message };
  }
};

// Get document activity summary
const getDocumentActivitySummary = async (documentId) => {
  try {
    // Get all logs for document
    const { data, error } = await supabase
      .from('audit_logs')
      .select('action, created_at')
      .eq('document_id', documentId);

    if (error) throw error;

    // Calculate summary
    const summary = {
      total: data.length,
      views: data.filter(l => l.action === 'view').length,
      downloads: data.filter(l => l.action === 'download').length,
      signatures: data.filter(l => l.action === 'signature_submitted').length,
      uploads: data.filter(l => l.action === 'upload').length,
      timeline: data.map(l => ({
        action: l.action,
        date: l.created_at
      }))
    };

    return { success: true, summary };
  } catch (error) {
    console.error('Activity summary error:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  logAction,
  getDocumentAuditLogs,
  getUserAuditLogs,
  getDocumentActivitySummary
};