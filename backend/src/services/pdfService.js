const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const supabase = require('../config/supabase');

const getFontForStyle = async (style, pdfDoc) => {
  const fonts = {
    classic: StandardFonts.Helvetica,
    elegant: StandardFonts.TimesRoman,
    modern: StandardFonts.HelveticaBold,
    handwritten: StandardFonts.Courier,
    formal: StandardFonts.TimesRomanBold,
    script: StandardFonts.CourierOblique,
    bold: StandardFonts.HelveticaBold,
    italic: StandardFonts.TimesRomanItalic
  };
  return await pdfDoc.embedFont(fonts[style] || StandardFonts.Helvetica);
};

const generateSignedPDFWithAllSignatures = async (documentId) => {
  console.log('\n========== STARTING PDF GENERATION ==========');
  console.log('Document ID:', documentId);
  
  try {
    // 1. Get document
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();
    
    if (docError) throw new Error('Document not found');
    console.log('Document:', document.title);
    
    // 2. Get signatures
    const { data: signatures, error: sigError } = await supabase
      .from('signatures')
      .select('*')
      .eq('document_id', documentId)
      .eq('status', 'signed');
    
    if (sigError) throw new Error('Failed to get signatures');
    if (!signatures || signatures.length === 0) {
      throw new Error('No signed signatures found');
    }
    
    console.log('Found', signatures.length, 'signature(s)');
    const signature = signatures[0];
    console.log('Signature text:', signature.signature_text);
    console.log('Signature style:', signature.signature_style);
    console.log('Signature position from DB:', signature.position_x, signature.position_y);
    console.log('Signature size from DB:', signature.width, signature.height);
    
    // 3. Download original PDF
    const { data: pdfData, error: downloadError } = await supabase.storage
      .from('documents')
      .download(document.file_name);
    
    if (downloadError) throw new Error('Failed to download PDF');
    console.log('PDF downloaded, size:', pdfData.size);
    
    // 4. Load PDF
    const pdfBytes = await pdfData.arrayBuffer();
    const pdfDoc = await PDFDocument.load(pdfBytes);
    
    // 5. Get first page
    const pages = pdfDoc.getPages();
    if (pages.length === 0) {
      pages.push(pdfDoc.addPage());
    }
    
    const page = pages[0];
    const { width, height } = page.getSize();
    console.log('Page size:', width, 'x', height);
    
    // 6. Get signature text and style
    const signatureText = signature.signature_text || signature.signer_name || 'Signature';
    const style = signature.signature_style || 'classic';
    
    // 7. USE EXACT POSITION FROM DATABASE - NO MODIFICATION
    const xPos = signature.position_x;
    const yPos = signature.position_y;
    const sigWidth = signature.width || 200;
    const sigHeight = signature.height || 60;
    
    console.log('Drawing signature at EXACT position:', xPos, yPos);
    console.log('With size:', sigWidth, 'x', sigHeight);
    
    // 8. Calculate font size based on box height
    const fontSize = Math.min(24, sigHeight / 2.5);
    
    // 9. Get font and draw signature
    const font = await getFontForStyle(style, pdfDoc);
    
    // Draw the signature text at EXACT coordinates
    page.drawText(signatureText, {
      x: xPos,
      y: yPos + (sigHeight / 2) - (fontSize / 2),
      size: fontSize,
      font: font,
      color: rgb(0, 0, 0),
    });
    
    // Draw underline
    const textWidth = signatureText.length * (fontSize * 0.6);
    page.drawLine({
      start: { x: xPos, y: yPos + (sigHeight / 2) - (fontSize / 2) - 5 },
      end: { x: xPos + Math.min(textWidth, sigWidth - 20), y: yPos + (sigHeight / 2) - (fontSize / 2) - 5 },
      thickness: 1,
      color: rgb(0, 0, 0),
    });
    
    // Draw date
    const dateStr = new Date().toLocaleDateString();
    const dateFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    page.drawText(dateStr, {
      x: xPos,
      y: yPos + (sigHeight / 2) - (fontSize / 2) - 20,
      size: 8,
      font: dateFont,
      color: rgb(0.4, 0.4, 0.4),
    });
    
    console.log('Signature drawn successfully at exact position');
    
    // 10. Save PDF
    const signedPdfBytes = await pdfDoc.save();
    console.log('Signed PDF size:', signedPdfBytes.length);
    
    // 11. Upload to storage
    const fileName = `signed_${Date.now()}_${document.file_name}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('signed-documents')
      .upload(fileName, signedPdfBytes, {
        contentType: 'application/pdf',
        cacheControl: '3600'
      });
    
    if (uploadError) throw new Error('Upload failed: ' + uploadError.message);
    console.log('Uploaded to storage:', fileName);
    
    // 12. Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('signed-documents')
      .getPublicUrl(fileName);
    
    console.log('Signed PDF URL:', publicUrl);
    
    // 13. Update document
    await supabase
      .from('documents')
      .update({
        signed_file_path: publicUrl,
        status: 'signed',
        signature_status: 'completed'
      })
      .eq('id', documentId);
    
    console.log('========== PDF GENERATION COMPLETE ==========\n');
    
    return { success: true, signedPdfUrl: publicUrl };
    
  } catch (error) {
    console.error('PDF generation failed:', error.message);
    throw error;
  }
};

module.exports = {
  generateSignedPDFWithAllSignatures
};