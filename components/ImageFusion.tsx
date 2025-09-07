import React, { useState, useRef } from 'react';
import { fileToBase64, generateFusedImage } from '../services/geminiService';
import ImagePreview from './ImagePreview';
import { SparklesIcon, PuzzlePieceIcon, UploadIcon } from './Icons';

interface ImageUploaderProps {
    file: File | null;
    preview: string | null;
    onFileChange: (file: File) => void;
    title: string;
}

const Uploader: React.FC<ImageUploaderProps> = ({ file, preview, onFileChange, title }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onFileChange(file);
        }
    };

    return (
        <div>
            <label className="block text-sm font-medium text-light-text mb-2">{title}</label>
            <div 
                onClick={() => fileInputRef.current?.click()}
                className="mt-1 flex justify-center h-48 px-6 pt-5 pb-6 border-2 border-dark-border border-dashed rounded-md cursor-pointer hover:border-brand-secondary transition"
            >
                <div className="space-y-1 text-center flex flex-col justify-center items-center">
                    {preview ? (
                        <img src={preview} alt="Preview" className="mx-auto max-h-32 w-auto object-contain" />
                    ) : (
                        <UploadIcon className="mx-auto h-12 w-12 text-medium-text" />
                    )}
                    <div className="flex text-sm text-medium-text">
                        <p className="pl-1">{file ? file.name : 'Click to upload'}</p>
                    </div>
                </div>
            </div>
            <input type="file" className="sr-only" ref={fileInputRef} onChange={handleFileChange} accept="image/*" />
        </div>
    );
};


const ImageFusion: React.FC = () => {
    const [image1, setImage1] = useState<{ file: File | null; preview: string | null }>({ file: null, preview: null });
    const [image2, setImage2] = useState<{ file: File | null; preview: string | null }>({ file: null, preview: null });
    const [prompt, setPrompt] = useState('');
    const [numberOfImages, setNumberOfImages] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [generatedImages, setGeneratedImages] = useState<string[] | null>(null);

    const handleFile1Change = async (file: File) => {
        const { base64 } = await fileToBase64(file);
        setImage1({ file, preview: `data:${file.type};base64,${base64}` });
    };

    const handleFile2Change = async (file: File) => {
        const { base64 } = await fileToBase64(file);
        setImage2({ file, preview: `data:${file.type};base64,${base64}` });
    };

    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value, 10);
        if (isNaN(value)) {
            setNumberOfImages(1);
            return;
        }
        if (value >= 1 && value <= 20) {
            setNumberOfImages(value);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!image1.file || !image2.file) {
            setError("Please upload both images.");
            return;
        }
        if (!prompt.trim()) {
            setError("Please provide a prompt to guide the fusion.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setGeneratedImages(null);

        try {
            const img1Data = await fileToBase64(image1.file);
            const img2Data = await fileToBase64(image2.file);

            const imageUrls = await generateFusedImage(
                { base64: img1Data.base64, mimeType: img1Data.mimeType },
                { base64: img2Data.base64, mimeType: img2Data.mimeType },
                prompt,
                numberOfImages
            );
            setGeneratedImages(imageUrls);
        } catch (err) {
            setError(err instanceof Error ? err.message : "An unknown error occurred during image fusion.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-dark-card p-6 rounded-lg border border-dark-border">
                <div className="text-center mb-6">
                    <PuzzlePieceIcon className="w-12 h-12 mx-auto text-brand-secondary" />
                    <h2 className="text-2xl font-bold mt-2">Image Fusion</h2>
                    <p className="text-medium-text">Combine two images with a prompt to create something new.</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Uploader file={image1.file} preview={image1.preview} onFileChange={handleFile1Change} title="Image 1 (e.g., a person)" />
                        <Uploader file={image2.file} preview={image2.preview} onFileChange={handleFile2Change} title="Image 2 (e.g., clothing)" />
                    </div>

                    <div>
                        <label htmlFor="prompt" className="block text-sm font-medium text-light-text mb-2">
                            Fusion Prompt
                        </label>
                        <textarea
                            id="prompt"
                            rows={3}
                            className="w-full bg-dark-bg border border-dark-border rounded-md p-3 focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary transition"
                            placeholder="e.g., Put the person from Image 1 in the jacket from Image 2"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                        />
                    </div>
                    
                    <div>
                        <label htmlFor="numberOfImages" className="block text-sm font-medium text-light-text mb-2">
                           Number of Images (1-20)
                        </label>
                        <input
                            type="number"
                            id="numberOfImages"
                            value={numberOfImages}
                            onChange={handleNumberChange}
                            min="1"
                            max="20"
                            className="w-full bg-dark-bg border border-dark-border rounded-md p-3 focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary transition"
                        />
                    </div>


                    <button type="submit" disabled={isLoading} className="w-full flex items-center justify-center gap-2 bg-brand-primary text-white font-bold py-3 px-4 rounded-md hover:bg-brand-secondary transition-colors duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed">
                        <SparklesIcon className="w-5 h-5" />
                        {isLoading ? 'Fusing Images...' : 'Fuse Images'}
                    </button>
                </form>
            </div>
            <ImagePreview srcs={generatedImages} isLoading={isLoading} error={error} loadingMessage="Fusing your images..." />
        </div>
    );
};

export default ImageFusion;