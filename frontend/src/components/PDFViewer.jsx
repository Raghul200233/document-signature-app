import { useEffect } from 'react';

const PDFViewer = ({ fileUrl, onClose }) => {
  useEffect(() => {
    // Open PDF in new tab when component mounts
    window.open(fileUrl, '_blank');
    // Close the modal immediately
    onClose();
  }, [fileUrl, onClose]);

  // Return null since we're opening in new tab
  return null;
};

export default PDFViewer;