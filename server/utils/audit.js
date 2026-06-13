const AuditLog = require("../models/AuditLogs"); // Note: requiring the file 'AuditLogs.js' which exists in models/

/**
 * Logs an audit event.
 * @param {Object} params
 * @param {string} params.documentId  - MongoDB doc ID
 * @param {string} params.action      - One of the enum values
 * @param {string} params.performedBy - Email or user ID
 * @param {string} params.ipAddress   - From req.ip
 * @param {Object} params.metadata    - Any extra context
 */
const logAudit = async ({ documentId, action, performedBy, ipAddress, metadata = {} }) => {
  try {
    await AuditLog.create({ documentId, action, performedBy, ipAddress, metadata });
  } catch (err) {
    // Audit logging should NEVER crash your main flow
    // If it fails, just log to console and move on
    console.error("Audit log failed:", err.message);
  }
};

module.exports = { logAudit };
