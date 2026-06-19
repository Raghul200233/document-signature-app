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
    italic: StandardFonts.TimesRomanItalic,
    vintage: StandardFonts.Courier,
    artistic: StandardFonts.TimesRomanItalic,
    professional: StandardFonts.HelveticaBold
  };
  return await pdfDoc.embedFont(fonts[style] || StandardFonts.Helvetica);
};

const generateSignedPDFWithAllSignatures = async (documentId) => {
  console.log('Generating signed PDF for:', documentId);
  
  try {
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();
    
    if (docError) throw new Error('Document not found');

    const { data: signatures, error: sigError } = await supabase
      .from('signatures')
      .select('*')
      .eq('document_id', documentId)
      .eq('status', 'signed');
    
    if (sigError) throw new Error('Failed to get signatures');
    if (!signatures || signatures.length === 0) {
      throw new Error('No signed signatures found');
    }

    // Download PDF
    const { data: pdfData, error: downloadError } = await supabase.storage
      .from('documents')
      .download(document.file_name);
    
    if (downloadError) throw new Error('Failed to download PDF');

    const pdfBytes = await pdfData.arrayBuffer();
    const pdfDoc = await PDFDocument.load(pdfBytes);
    
    const pages = pdfDoc.getPages();
    if (pages.length === 0) {
      pages.push(pdfDoc.addPage());
    }
    
    const page = pages[0];
    const { width, height } = page.getSize();

    // Draw all signatures
    for (const sig of signatures) {
      const signatureText = sig.signature_text || sig.signer_name || 'Signature';
      const style = sig.signature_style || 'classic';
      const fontSize = Math.min(28, (sig.height || 60) / 2.5);
      
      let xPos = sig.position_x || 100;
      let yPos = sig.position_y || 100;
      const sigWidth = sig.width || 250;
      const sigHeight = sig.height || 80;
      
      xPos = Math.min(Math.max(xPos, 10), width - sigWidth - 10);
      yPos = Math.min(Math.max(yPos, 10), height - sigHeight - 10);
      
      const font = await getFontForStyle(style, pdfDoc);
      const yOffset = (sigHeight / 2) - (fontSize / 2);
      
      page.drawText(signatureText, {
        x: xPos + 10,
        y: yPos + yOffset + 5,
        size: fontSize,
        font: font,
        color: rgb(0, 0, 0),
      });
      
      // Underline
      const textWidth = signatureText.length * (fontSize * 0.6);
      page.drawLine({
        start: { x: xPos + 10, y: yPos + yOffset - 2 },
        end: { x: xPos + 10 + Math.min(textWidth, sigWidth - 30), y: yPos + yOffset - 2 },
        thickness: 1.5,
        color: rgb(0, 0, 0),
      });
    }

    // Save PDF
    const signedPdfBytes = await pdfDoc.save();
    const fileName = `signed_${Date.now()}_${document.file_name}`;
    
    const { error: uploadError } = await supabase.storage
      .from('signed-documents')
      .upload(fileName, signedPdfBytes, {
        contentType: 'application/pdf',
        cacheControl: '3600'
      });
    
    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('signed-documents')
      .getPublicUrl(fileName);

    await supabase
      .from('documents')
      .update({
        signed_file_path: publicUrl,
        status: 'signed',
        signature_status: 'completed'
      })
      .eq('id', documentId);

    return { success: true, signedPdfUrl: publicUrl };
    
  } catch (error) {
    console.error('PDF generation error:', error.message);
    throw error;
  }
};

module.exports = {
  generateSignedPDFWithAllSignatures
};