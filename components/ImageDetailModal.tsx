import React, { useEffect, useState } from 'react';
import { DownloadIcon, ShareIcon, CloseIcon } from './Icons';

interface ImageDetailModalProps {
  src: string;
  onClose: () => void;
}

const ImageDetailModal: React.FC<ImageDetailModalProps> = ({ src, onClose }) => {
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    // Check for Web Share API support (for files)
    if (navigator.share && typeof navigator.canShare === 'function') {
      // Create a dummy file to check if the browser can share it.
      const dummyFile = new File([""], "dummy.png", { type: "image/png" });
      if (navigator.canShare({ files: [dummyFile] })) {
        setCanShare(true);
      }
    }
  }, []);

  const handleShare = async () => {
    if (!canShare) {
      alert("Sharing is not supported on your browser or device.");
      return;
    }

    try {
      const response = await fetch(src);
      const blob = await response.blob();
      const file = new File([blob], 'beyond-reality-creation.png', { type: blob.type });

      await navigator.share({
        title: 'My AI Creation',
        text: 'Check out this image I created with Beyond Reality!',
        files: [file],
      });
    } catch (error) {
      // Avoid alerting the user if they deliberately canceled the share dialog
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Error sharing image:', error);
        alert('An error occurred while trying to share the image.');
      }
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-dark-bg/90 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-dark-card border border-dark-border rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col relative"
        onClick={(e) => e.stopPropagation()} // Prevent closing modal when clicking inside
      >
        <button 
          onClick={onClose}
          className="absolute -top-4 -right-4 bg-brand-primary text-white p-2 rounded-full z-10 focus:outline-none focus:ring-2 focus:ring-brand-secondary"
          aria-label="Close"
        >
          <CloseIcon className="w-6 h-6" />
        </button>

        <div className="flex-grow p-4 flex items-center justify-center overflow-hidden">
            <img src={src} alt="Generated visual detail" className="max-w-full max-h-[70vh] object-contain" />
        </div>
        
        <div className="flex-shrink-0 p-4 border-t border-dark-border bg-dark-bg/50 rounded-b-lg flex flex-wrap justify-center sm:justify-end items-center gap-4">
          <a
            href={src}
            download={`beyond-reality-creation.png`}
            className="flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2 bg-brand-secondary text-white font-semibold rounded-md hover:bg-opacity-80 transition"
            aria-label="Download Image"
          >
            <DownloadIcon className="w-5 h-5" />
            Download
          </a>
          {canShare && (
            <button
              onClick={handleShare}
              className="flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2 bg-brand-accent text-dark-bg font-semibold rounded-md hover:bg-opacity-80 transition"
              aria-label="Share Image"
            >
              <ShareIcon className="w-5 h-5" />
              Share
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageDetailModal;