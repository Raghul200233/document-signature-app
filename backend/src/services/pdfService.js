const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const supabase = require('../config/supabase');

const getFontForStyle = async (style, pdfDoc) => {
  const fontMap = {
    classic: StandardFonts.Helvetica,
    elegant: StandardFonts.TimesRoman,
    modern: StandardFonts.HelveticaBold,
    handwritten: StandardFonts.Courier,
    formal: StandardFonts.TimesRomanBold,
    script: StandardFonts.CourierOblique,
    bold: StandardFonts.HelveticaBold,
    italic: StandardFonts.TimesRomanItalic,
    vintage: StandardFonts.Courier,
    artistic: StandardFonts.TimesRomanItalic
  };
  
  const fontKey = fontMap[style] || StandardFonts.Helvetica;
  return await pdfDoc.embedFont(fontKey);
};

const generateSignedPDFWithAllSignatures = async (documentId) => {
  try {
    console.log('Generating signed PDF for document:', documentId);

    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      throw new Error('Document not found');
    }

    const { data: signatures, error: sigError } = await supabase
      .from('signatures')
      .select('*')
      .eq('document_id', documentId)
      .eq('status', 'signed');

    if (sigError) {
      throw new Error('Failed to get signatures');
    }

    if (!signatures || signatures.length === 0) {
      throw new Error('No signed signatures found');
    }

    console.log(`Found ${signatures.length} signatures to embed`);

    // Download original PDF
    const { data: pdfData, error: downloadError } = await supabase.storage
      .from('documents')
      .download(document.file_name);

    if (downloadError) {
      throw new Error('Failed to download PDF: ' + downloadError.message);
    }

    const pdfBytes = await pdfData.arrayBuffer();
    const pdfDoc = await PDFDocument.load(pdfBytes);
    
    // Get first page
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const { height } = firstPage.getSize();

    // Position signature at bottom of page (Y = 100 from bottom)
    const yPosition = 100;
    const xPosition = 100;

    // Get the first signature (or use all)
    const signature = signatures[0];
    
    // Get font based on style
    const font = await getFontForStyle(signature.signature_style, pdfDoc);
    
    // Draw the signature text
    const signatureText = signature.signature_text || signature.signer_name;
    
    firstPage.drawText(signatureText, {
      x: xPosition,
      y: yPosition,
      size: 24,
      font: font,
      color: rgb(0, 0, 0),
    });
    
    // Draw a line under the signature
    firstPage.drawLine({
      start: { x: xPosition, y: yPosition - 5 },
      end: { x: xPosition + 250, y: yPosition - 5 },
      thickness: 1,
      color: rgb(0, 0, 0),
    });

    // Add date below
    const dateStr = new Date(signature.signed_at || Date.now()).toLocaleDateString();
    const dateFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    firstPage.drawText(`Signed: ${dateStr}`, {
      x: xPosition,
      y: yPosition - 25,
      size: 10,
      font: dateFont,
      color: rgb(0.4, 0.4, 0.4),
    });

    // Save signed PDF
    const signedPdfBytes = await pdfDoc.save();
    const signedFileName = `signed_${Date.now()}_${document.file_name}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('signed-documents')
      .upload(signedFileName, signedPdfBytes, {
        contentType: 'application/pdf',
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('signed-documents')
      .getPublicUrl(signedFileName);

    console.log('Signed PDF URL:', publicUrl);

    await supabase
      .from('documents')
      .update({
        signed_file_path: publicUrl,
        status: 'signed',
        signature_status: 'completed'
      })
      .eq('id', documentId);

    return {
      success: true,
      signedPdfUrl: publicUrl,
      message: 'PDF signed successfully'
    };

  } catch (error) {
    console.error('PDF generation error:', error);
    throw error;
  }
};

module.exports = {
  generateSignedPDFWithAllSignatures
};