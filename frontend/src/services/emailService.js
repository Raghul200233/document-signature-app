const nodemailer = require('nodemailer');

// Configure email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Send signature request email
const sendSignatureRequest = async (signerEmail, signerName, documentTitle, signatureToken, documentId) => {
  try {
    const signatureLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/sign/${signatureToken}`;
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: signerEmail,
      subject: `Please sign "${documentTitle}" - Document Signature Request`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #4f46e5; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">Document Signature Request</h1>
          </div>
          
          <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
            <p>Dear <strong>${signerName}</strong>,</p>
            
            <p>You have been requested to sign the document: <strong>${documentTitle}</strong></p>
            
            <p>Please click the button below to review and sign this document:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${signatureLink}" 
                 style="background-color: #4f46e5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Review & Sign Document
              </a>
            </div>
            
            <p>This link will expire in 7 days.</p>
            
            <hr style="margin: 20px 0; border-color: #e5e7eb;">
            
            <p style="color: #6b7280; font-size: 12px;">
              If you didn't expect this request, please ignore this email.<br>
              This is an automated message, please do not reply.
            </p>
          </div>
        </div>
      `,
      text: `
        Document Signature Request
        
        Dear ${signerName},
        
        You have been requested to sign the document: ${documentTitle}
        
        Please click the link below to review and sign this document:
        ${signatureLink}
        
        This link will expire in 7 days.
        
        If you didn't expect this request, please ignore this email.
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: error.message };
  }
};

// Send signature completion notification
const sendSignatureCompleteNotification = async (ownerEmail, documentTitle, signerName) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: ownerEmail,
      subject: `"${documentTitle}" has been signed`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #10b981; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">Document Signed ✓</h1>
          </div>
          
          <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
            <p>Good news!</p>
            
            <p><strong>${signerName}</strong> has signed the document: <strong>${documentTitle}</strong></p>
            
            <p>You can now download the signed document from your dashboard.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard" 
                 style="background-color: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Go to Dashboard
              </a>
            </div>
          </div>
        </div>
      `,
      text: `
        Document Signed ✓
        
        ${signerName} has signed the document: ${documentTitle}
        
        You can now download the signed document from your dashboard.
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Notification email sent:', info.messageId);
    return { success: true };
  } catch (error) {
    console.error('Notification email error:', error);
    return { success: false };
  }
};

module.exports = {
  sendSignatureRequest,
  sendSignatureCompleteNotification
};