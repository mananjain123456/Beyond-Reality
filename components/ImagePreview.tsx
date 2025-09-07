import React, { useState } from 'react';
import Loader from './Loader';
import { DownloadIcon, EditIcon } from './Icons';
import ImageEditorModal from './ImageEditorModal';
import ImageDetailModal from './ImageDetailModal';

interface ImagePreviewProps {
  srcs: string[] | null;
  isLoading: boolean;
  error: string | null;
  loadingMessage?: string;
}

const ImagePreview: React.FC<ImagePreviewProps> = ({ srcs, isLoading, error, loadingMessage = "Conjuring visuals..." }) => {
  const [editingSrc, setEditingSrc] = useState<string | null>(null);
  const [detailSrc, setDetailSrc] = useState<string | null>(null);

  const handleEdit = (src: string) => {
    setEditingSrc(src);
  };

  const handleCloseEditor = () => {
    setEditingSrc(null);
  };

  const Placeholder = () => (
    <div className="flex items-center justify-center h-full">
      <p className="text-medium-text">Your generated image(s) will appear here</p>
    </div>
  );

  const gridClass = 'grid-cols-2 sm:grid-cols-4';

  return (
    <>
      <div className="w-full aspect-square bg-dark-card border-2 border-dashed border-dark-border rounded-lg relative overflow-hidden transition-all duration-300">
        {isLoading && <div className="absolute inset-0 bg-dark-card/80 z-10 flex items-center justify-center"><Loader message={loadingMessage} /></div>}
        
        {error && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center p-4 text-center">
            <p className="text-red-400">Error: {error}</p>
          </div>
        )}

        {(!srcs || srcs.length === 0) && !isLoading && !error && <Placeholder />}

        {srcs && srcs.length > 0 && !error && (
          <div className={`grid ${gridClass} gap-2 h-full w-full p-2 overflow-y-auto`}>
              {srcs.map((src, index) => (
                  <div 
                    key={index} 
                    className="relative group w-full aspect-square bg-dark-bg rounded-sm cursor-pointer overflow-hidden"
                    onClick={() => setDetailSrc(src)}
                  >
                      <img src={src} alt={`Generated visual ${index + 1}`} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300" />
                      <div 
                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        aria-hidden="true"
                      />
                      <div 
                        className="absolute bottom-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        onClick={(e) => e.stopPropagation()} // Prevent opening modal when clicking buttons
                      >
                          <button
                              onClick={() => handleEdit(src)}
                              className="bg-brand-secondary text-white p-2 rounded-full shadow-lg hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-card focus:ring-brand-accent"
                              aria-label="Edit Image"
                          >
                              <EditIcon className="w-5 h-5" />
                          </button>
                          <a
                              href={src}
                              download={`beyond-reality-creation-${index + 1}.png`}
                              className="bg-brand-primary text-white p-2 rounded-full shadow-lg hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-card focus:ring-brand-accent"
                              aria-label="Download Image"
                          >
                              <DownloadIcon className="w-5 h-5" />
                          </a>
                      </div>
                  </div>
              ))}
          </div>
        )}
      </div>

      {editingSrc && (
        <ImageEditorModal 
          src={editingSrc}
          onClose={handleCloseEditor}
          onSave={() => {
            handleCloseEditor();
          }}
        />
      )}
      
      {detailSrc && (
        <ImageDetailModal 
          src={detailSrc}
          onClose={() => setDetailSrc(null)}
        />
      )}
    </>
  );
};

export default ImagePreview;