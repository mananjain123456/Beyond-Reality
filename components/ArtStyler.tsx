import React, { useState, useRef } from 'react';
import { ArtStyle } from '../types';
import { ART_STYLES } from '../constants';
import { generateStyledImage, fileToBase64 } from '../services/geminiService';
import ImagePreview from './ImagePreview';
import { SparklesIcon, UploadIcon } from './Icons';

const getDetailedArtPrompt = (style: ArtStyle, customStyle: string): string => {
    const finalStyle = style === ArtStyle.Custom ? customStyle.trim() : style;

    switch (style) {
        case ArtStyle.Ghibli:
            return "Make the entire uploaded image, including the person and the background, look like a scene from a Ghibli Studio anime. The person's features should be redrawn in the Ghibli art style, with expressive eyes and softer lines, while still being recognizable. The background should be lush, painterly, and detailed, with soft, warm lighting. The overall result should be a complete transformation of the photo into a beautiful, hand-drawn Ghibli-style illustration.";
        case ArtStyle.Impressionism:
            return "Make the entire uploaded image look like an Impressionist painting by artists like Monet or Renoir. The subject(s) and the background should dissolve into short, thick brushstrokes of pure color. Focus on capturing the play of light and atmosphere across the whole scene, not on fine details. The final image should be a complete artistic interpretation where the entire photo is transformed into the Impressionist style.";
        case ArtStyle.Cubism:
            return "Completely transform the uploaded photo into the Cubist art style. Deconstruct the person and all objects in the image, then reassemble them from multiple viewpoints using geometric shapes and fragmented planes. The entire composition, from subject to background, should be flattened and abstracted in the style of Picasso or Braque, while ensuring the original subject remains identifiable.";
        case ArtStyle.PopArt:
            return "Make the entire uploaded image look like a classic Pop Art piece in the style of Andy Warhol or Roy Lichtenstein. The person in the photo should be redrawn with bold, graphic outlines, flat areas of vibrant, saturated color, and potentially Ben-Day dots for shading. The background should also be simplified and stylized to match this aesthetic. It should be a total conversion into a high-impact, graphic art style.";
        case ArtStyle.Steampunk:
            return "Redraw the person and scene from the uploaded image with a complete Steampunk aesthetic. The person's clothing should be redesigned with Victorian flair, incorporating elements like goggles, gears, and brass fittings, while keeping their face recognizable. The background and any objects should be infused with retrofuturistic, steam-powered technology. The entire image should have a color palette of copper, bronze, and dark tones, transforming the photo into a Steampunk world.";
        case ArtStyle.Synthwave:
            return "Make the entire uploaded image look like 1980s Synthwave art. The person in the photo should be bathed in neon light, with dramatic pink and blue highlights. Redraw their clothing and the background to fit the retro-futuristic aesthetic, incorporating elements like glowing grid lines, chrome surfaces, and a digital sunset. The entire photo must be transformed into a vibrant, neon-drenched scene.";
        case ArtStyle.Custom:
        default:
             return `Make the entire uploaded image, including the person and the background, look like it was created in the following art style: ${finalStyle}. The person's features, clothing, and the environment should all be completely redrawn to match this aesthetic. The final result should be a total transformation of the photo into the requested art style, not just a filter or background change.`;
    }
};


const ArtStyler: React.FC = () => {
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [filePreview, setFilePreview] = useState<string | null>(null);
    const [style, setStyle] = useState<ArtStyle>(ART_STYLES[0]);
    const [customStyle, setCustomStyle] = useState('');
    const [numberOfImages, setNumberOfImages] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [generatedImages, setGeneratedImages] = useState<string[] | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setUploadedFile(file);
            setError(null);
            const { base64 } = await fileToBase64(file);
            setFilePreview(`data:${file.type};base64,${base64}`);
        }
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
        if (!uploadedFile) {
            setError("Please upload a photo.");
            return;
        }

        if (style === ArtStyle.Custom && !customStyle.trim()) {
            setError("Please describe the custom art style.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setGeneratedImages(null);

        try {
            const { base64, mimeType } = await fileToBase64(uploadedFile);
            
            const prompt = getDetailedArtPrompt(style, customStyle);

            const imageUrls = await generateStyledImage(base64, mimeType, prompt, numberOfImages);
            setGeneratedImages(imageUrls);
        } catch (err) {
            setError(err instanceof Error ? err.message : "An unknown error occurred while applying the art style.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-dark-card p-6 rounded-lg border border-dark-border">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-light-text mb-2">Upload Photo</label>
                        <div 
                            onClick={() => fileInputRef.current?.click()}
                            className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dark-border border-dashed rounded-md cursor-pointer hover:border-brand-secondary transition"
                        >
                            <div className="space-y-1 text-center">
                                {filePreview ? (
                                    <img src={filePreview} alt="Preview" className="mx-auto h-24 w-24 object-cover rounded-full" />
                                ) : (
                                    <UploadIcon className="mx-auto h-12 w-12 text-medium-text" />
                                )}
                                <div className="flex text-sm text-medium-text">
                                    <p className="pl-1">{uploadedFile ? uploadedFile.name : 'Click to upload an image'}</p>
                                </div>
                            </div>
                        </div>
                        <input id="file-upload" name="file-upload" type="file" className="sr-only" ref={fileInputRef} onChange={handleFileChange} accept="image/*" />
                    </div>

                    <div>
                        <label htmlFor="style" className="block text-sm font-medium text-light-text mb-2">Choose an Art Style</label>
                        <select id="style" value={style} onChange={(e) => setStyle(e.target.value as ArtStyle)} className="w-full bg-dark-bg border border-dark-border rounded-md p-3 focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary transition">
                            {ART_STYLES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>

                    {style === ArtStyle.Custom && (
                        <div>
                            <label htmlFor="customStyle" className="block text-sm font-medium text-light-text mb-2">Describe Custom Style</label>
                            <input type="text" id="customStyle" value={customStyle} onChange={(e) => setCustomStyle(e.target.value)} placeholder="e.g., Psychedelic vaporwave" className="w-full bg-dark-bg border border-dark-border rounded-md p-3 focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary transition"/>
                        </div>
                    )}

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
                        {isLoading ? 'Stylizing...' : 'Apply Art Style'}
                    </button>
                </form>
            </div>
            <ImagePreview srcs={generatedImages} isLoading={isLoading} error={error} loadingMessage="Applying artistic flair..." />
        </div>
    );
};

export default ArtStyler;