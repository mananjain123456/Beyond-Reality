import React, { useState, useRef } from 'react';
import { CommercialStyle } from '../types';
import { COMMERCIAL_STYLES } from '../constants';
import { generateCommercialImage, fileToBase64 } from '../services/geminiService';
import { SparklesIcon, MegaphoneIcon, UploadIcon } from './Icons';
import ImagePreview from './ImagePreview';

interface ImageUploaderProps {
    file: File | null;
    preview: string | null;
    onFileChange: (file: File) => void;
    title: string;
    id: string;
}

const Uploader: React.FC<ImageUploaderProps> = ({ file, preview, onFileChange, title, id }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            onFileChange(selectedFile);
        }
    };

    return (
        <div>
            <label className="block text-sm font-medium text-light-text mb-2">{title}</label>
            <label
                htmlFor={id}
                className="mt-1 flex justify-center h-40 px-4 py-2 border-2 border-dark-border border-dashed rounded-md cursor-pointer hover:border-brand-secondary transition"
                role="button"
                aria-label={preview ? `Change ${title}. Current file: ${file?.name}` : `Upload ${title}`}
            >
                <div className="space-y-1 text-center flex flex-col justify-center items-center">
                    {preview ? (
                        <img src={preview} alt="Preview" className="mx-auto max-h-24 w-auto object-contain rounded" />
                    ) : (
                        <UploadIcon className="mx-auto h-10 w-10 text-medium-text" />
                    )}
                    <div className="flex text-sm text-medium-text">
                        <p className="pl-1 text-xs">{file ? file.name : 'Click to upload'}</p>
                    </div>
                </div>
            </label>
            <input id={id} type="file" className="sr-only" ref={fileInputRef} onChange={handleFileChange} accept="image/*" />
        </div>
    );
};


const CommercialCreator: React.FC = () => {
    const [productName, setProductName] = useState('');
    const [productDescription, setProductDescription] = useState('');
    const [targetAudience, setTargetAudience] = useState('');
    const [style, setStyle] = useState<CommercialStyle>(CommercialStyle.Photorealistic);
    const [customStyle, setCustomStyle] = useState('');
    const [productImage, setProductImage] = useState<{ file: File | null; preview: string | null }>({ file: null, preview: null });
    const [modelImage, setModelImage] = useState<{ file: File | null; preview: string | null }>({ file: null, preview: null });
    const [numberOfImages, setNumberOfImages] = useState(1);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [generatedImages, setGeneratedImages] = useState<string[] | null>(null);

    const handleProductImageChange = async (file: File) => {
        const { base64 } = await fileToBase64(file);
        setProductImage({ file, preview: `data:${file.type};base64,${base64}` });
    };

    const handleModelImageChange = async (file: File) => {
        const { base64 } = await fileToBase64(file);
        setModelImage({ file, preview: `data:${file.type};base64,${base64}` });
    };

    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value, 10);
        if (!isNaN(value) && value >= 1 && value <= 4) {
            setNumberOfImages(value);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!productName.trim() || !productDescription.trim() || !targetAudience.trim()) {
            setError("Please fill out Product Name, Description, and Target Audience.");
            return;
        }
        if (style === CommercialStyle.Custom && !customStyle.trim()) {
            setError("Please describe the custom commercial style.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setGeneratedImages(null);

        const finalStyle = style === CommercialStyle.Custom ? customStyle.trim() : style;

        try {
            const productImgData = productImage.file ? await fileToBase64(productImage.file) : undefined;
            const modelImgData = modelImage.file ? await fileToBase64(modelImage.file) : undefined;

            const imageUrls = await generateCommercialImage(
                { productName, productDescription, targetAudience, style: finalStyle },
                numberOfImages,
                productImgData,
                modelImgData
            );
            
            setGeneratedImages(imageUrls);

        } catch (err) {
            setError(err instanceof Error ? err.message : "An unknown error occurred while creating the ad images.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-dark-card p-6 rounded-lg border border-dark-border self-start">
                 <div className="text-center mb-6">
                    <MegaphoneIcon className="w-12 h-12 mx-auto text-brand-secondary" />
                    <h2 className="text-2xl font-bold mt-2">Ad Image Generator</h2>
                    <p className="text-medium-text text-sm">Create stunning, high-quality commercial images.</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="productName" className="block text-sm font-medium text-light-text mb-2">Product Name</label>
                        <input id="productName" type="text" className="w-full bg-dark-bg border border-dark-border rounded-md p-2.5 focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary transition" placeholder="e.g., Quantum Sneakers" value={productName} onChange={(e) => setProductName(e.target.value)} />
                    </div>
                    <div>
                        <label htmlFor="productDescription" className="block text-sm font-medium text-light-text mb-2">Product Description</label>
                        <textarea id="productDescription" rows={3} className="w-full bg-dark-bg border border-dark-border rounded-md p-2.5 focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary transition" placeholder="e.g., Shoes that let you walk on air." value={productDescription} onChange={(e) => setProductDescription(e.target.value)} />
                    </div>
                    <div>
                        <label htmlFor="targetAudience" className="block text-sm font-medium text-light-text mb-2">Target Audience</label>
                        <input id="targetAudience" type="text" className="w-full bg-dark-bg border border-dark-border rounded-md p-2.5 focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary transition" placeholder="e.g., Athletes, tech enthusiasts" value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Uploader id="commercial-uploader-product" file={productImage.file} preview={productImage.preview} onFileChange={handleProductImageChange} title="Product (Optional)" />
                        <Uploader id="commercial-uploader-model" file={modelImage.file} preview={modelImage.preview} onFileChange={handleModelImageChange} title="Celebrity/Model (Optional)" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-light-text mb-2">Commercial Style</label>
                        <select value={style} onChange={(e) => setStyle(e.target.value as CommercialStyle)} className="w-full bg-dark-bg border border-dark-border rounded-md p-2.5 focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary transition">
                            {COMMERCIAL_STYLES.map((s) => (<option key={s} value={s}>{s}</option>))}
                        </select>
                    </div>
                    {style === CommercialStyle.Custom && (
                         <div>
                            <label htmlFor="customStyle" className="block text-sm font-medium text-light-text mb-2">Describe Custom Style</label>
                            <input type="text" id="customStyle" value={customStyle} onChange={(e) => setCustomStyle(e.target.value)} placeholder="e.g., 1980s synthwave aesthetic" className="w-full bg-dark-bg border border-dark-border rounded-md p-2.5 focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary transition"/>
                        </div>
                    )}
                    <div>
                        <label htmlFor="numberOfImages" className="block text-sm font-medium text-light-text mb-2">Number of Ad Images (1-4)</label>
                        <input type="number" id="numberOfImages" value={numberOfImages} onChange={handleNumberChange} min="1" max="4" className="w-full bg-dark-bg border border-dark-border rounded-md p-2.5 focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary transition" />
                    </div>
                    <button type="submit" disabled={isLoading} className="w-full flex items-center justify-center gap-2 bg-brand-primary text-white font-bold py-3 px-4 rounded-md hover:bg-brand-secondary transition-colors duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed">
                        <SparklesIcon className="w-5 h-5" />
                        {isLoading ? 'Generating Ads...' : 'Generate Ad Images'}
                    </button>
                </form>
            </div>
            
            <ImagePreview 
                srcs={generatedImages} 
                isLoading={isLoading} 
                error={error} 
                loadingMessage="Generating your ad campaign..."
            />
        </div>
    );
};

export default CommercialCreator;