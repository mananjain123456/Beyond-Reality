import React, { useState, useRef, useEffect, useCallback } from 'react';
import { DownloadIcon } from './Icons';

interface ImageEditorModalProps {
  src: string;
  onClose: () => void;
  onSave: (dataUrl: string) => void;
}

const ImageEditorModal: React.FC<ImageEditorModalProps> = ({ src, onClose, onSave }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rotation, setRotation] = useState(0); // in degrees
  const [brightness, setBrightness] = useState(100); // percentage
  const [contrast, setContrast] = useState(100); // percentage

  const drawImage = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = src;
    img.onload = () => {
      const { width, height } = img;
      
      const rads = rotation * Math.PI / 180;
      const absCos = Math.abs(Math.cos(rads));
      const absSin = Math.abs(Math.sin(rads));
      const newWidth = width * absCos + height * absSin;
      const newHeight = width * absSin + height * absCos;
      
      canvas.width = newWidth;
      canvas.height = newHeight;
      
      ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;

      ctx.save();
      ctx.translate(newWidth / 2, newHeight / 2);
      ctx.rotate(rads);
      ctx.drawImage(img, -width / 2, -height / 2);
      ctx.restore();
    };
  }, [src, rotation, brightness, contrast]);

  useEffect(() => {
    drawImage();
  }, [drawImage]);
  
  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };
  
  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = 'edited-creation.png';
      link.href = dataUrl;
      link.click();
      onSave(dataUrl);
    }
  };

  return (
    <div className="fixed inset-0 bg-dark-bg bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-card border border-dark-border rounded-lg shadow-2xl p-6 w-full max-w-2xl text-light-text">
        <h2 className="text-xl font-bold mb-4">Image Editor</h2>
        
        <div className="mb-4 flex items-center justify-center bg-dark-bg p-2 rounded-md">
            <canvas ref={canvasRef} className="max-w-full max-h-[40vh] object-contain" />
        </div>

        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium mb-1">Brightness: {brightness}%</label>
                <input type="range" min="0" max="200" value={brightness} onChange={(e) => setBrightness(parseInt(e.target.value, 10))} className="w-full h-2 bg-dark-border rounded-lg appearance-none cursor-pointer" />
            </div>
            <div>
                <label className="block text-sm font-medium mb-1">Contrast: {contrast}%</label>
                <input type="range" min="0" max="200" value={contrast} onChange={(e) => setContrast(parseInt(e.target.value, 10))} className="w-full h-2 bg-dark-border rounded-lg appearance-none cursor-pointer" />
            </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <button onClick={handleRotate} className="w-full sm:w-auto px-4 py-2 bg-brand-secondary text-white rounded-md hover:bg-brand-primary transition">
            Rotate 90°
          </button>
          <div className="flex gap-4">
             <button onClick={onClose} className="px-4 py-2 bg-dark-border text-light-text rounded-md hover:bg-gray-600 transition">
                Close
             </button>
             <button onClick={handleDownload} className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white font-bold rounded-md hover:bg-brand-secondary transition">
                <DownloadIcon className="w-5 h-5"/>
                Save & Download
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageEditorModal;