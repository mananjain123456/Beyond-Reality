import React, { useState, useRef } from 'react';
import { DreamStyle } from '../types';
import { DREAM_STYLES } from '../constants';
import { generateDreamImage, generateMangaScript, generateStyledImage, fileToBase64 } from '../services/geminiService';
import ImagePreview from './ImagePreview';
import { SparklesIcon, UploadIcon, CloseIcon } from './Icons';

const DreamVisualizer: React.FC = () => {
    const [story, setStory] = useState('');
    const [style, setStyle] = useState<DreamStyle>(DreamStyle.Cinematic);
    const [numberOfImages, setNumberOfImages] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [generatedImages, setGeneratedImages] = useState<string[]>([]);
    const [loadingMessage, setLoadingMessage] = useState("Conjuring visuals...");

    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [filePreview, setFilePreview] = useState<string | null>(null);
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

    const handleClearFile = () => {
        setUploadedFile(null);
        setFilePreview(null);
        if(fileInputRef.current) {
            fileInputRef.current.value = "";
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
        if (!story.trim()) {
            setError("Please enter a dream, memory, or story.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setGeneratedImages([]);
        setLoadingMessage("Conjuring visuals...");

        try {
            // Workflow 1: User has uploaded an image
            if (uploadedFile) {
                const { base64, mimeType } = await fileToBase64(uploadedFile);
                let prompt = '';
                 if (style === DreamStyle.Manga) {
                    prompt = `Redraw the uploaded image as a single, dynamic manga panel that captures the essence of this story: '${story}'. Use a classic black and white manga art style with expressive characters, dynamic action lines, and screentones for shading. The entire image must be a complete transformation.`;
                } else {
                    prompt = `Transform the provided image based on this story: "${story}", in the style of ${style}.`;
                }
                setLoadingMessage(`Styling your image...`);
                const imageUrls = await generateStyledImage(base64, mimeType, prompt, numberOfImages);
                setGeneratedImages(imageUrls);

            // Workflow 2: No image, text-to-image generation
            } else {
                 if (style === DreamStyle.Manga && numberOfImages > 1) {
                    setLoadingMessage("Generating manga story script...");
                    const scriptPages = await generateMangaScript(story, numberOfImages);
                    const allImageUrls: string[] = [];
                    for (let i = 0; i < scriptPages.length; i++) {
                        const pageScript = scriptPages[i];
                        setLoadingMessage(`Generating manga page ${i + 1} of ${scriptPages.length}...`);
                        const prompt = `Create a full, dynamic, black and white manga page with multiple panels that tells a story based on the following scene description: '${pageScript}'. The panels must have a clear narrative flow. Use classic manga art style with expressive characters, dynamic action lines, and screentones for shading. The entire image must be a single, cohesive manga page layout.`;
                        const [imageUrl] = await generateDreamImage(prompt, 1);
                        allImageUrls.push(imageUrl);
                        setGeneratedImages([...allImageUrls]);
                    }
                } else {
                    let prompt = '';
                    if (style === DreamStyle.Manga) {
                        prompt = `Create a full, dynamic, black and white manga page with multiple panels that tells a story based on the following theme: '${story}'. The panels should have a clear narrative flow, showing different moments or perspectives of the story. Use classic manga art style with expressive characters, dynamic action lines, and screentones for shading. The entire image should be a single, cohesive manga page layout.`;
                    } else {
                        prompt = `${story}, in the style of ${style}.`;
                    }
                    setLoadingMessage(`Generating ${numberOfImages} image(s)...`);
                    const imageUrls = await generateDreamImage(prompt, numberOfImages);
                    setGeneratedImages(imageUrls);
                }
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "An unknown error occurred.");
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
                        <label htmlFor="story" className="block text-sm font-medium text-light-text mb-2">
                            Your Dream, Memory, or Story
                        </label>
                        <textarea
                            id="story"
                            rows={5}
                            className="w-full bg-dark-bg border border-dark-border rounded-md p-3 focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary transition"
                            placeholder="e.g., A lone astronaut discovering a glowing forest on a distant moon..."
                            value={story}
                            onChange={(e) => setStory(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-light-text mb-2">Upload Image (Optional)</label>
                         <div 
                            onClick={() => !filePreview && fileInputRef.current?.click()}
                            className="mt-1 flex justify-center items-center h-28 px-6 pt-5 pb-6 border-2 border-dark-border border-dashed rounded-md transition relative"
                        >
                            {filePreview ? (
                                <>
                                    <img src={filePreview} alt="Preview" className="max-h-full w-auto object-contain rounded" />
                                    <button 
                                        type="button"
                                        onClick={handleClearFile}
                                        className="absolute top-1 right-1 bg-dark-bg/70 text-white p-1 rounded-full hover:bg-red-500 transition-colors"
                                        aria-label="Remove image"
                                    >
                                        <CloseIcon className="w-4 h-4" />
                                    </button>
                                </>
                            ) : (
                                <div className="space-y-1 text-center cursor-pointer hover:text-brand-secondary">
                                    <UploadIcon className="mx-auto h-10 w-10 text-medium-text" />
                                    <p className="text-xs text-medium-text">Click to upload an image</p>
                                </div>
                            )}
                        </div>
                        <input id="file-upload" name="file-upload" type="file" className="sr-only" ref={fileInputRef} onChange={handleFileChange} accept="image/*" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-light-text mb-2">
                            Choose a Visual Style
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {DREAM_STYLES.map((s) => (
                                <button
                                    key={s}
                                    type="button"
                                    onClick={() => setStyle(s)}
                                    className={`p-3 text-center rounded-md text-sm font-semibold transition-all duration-200 border-2 ${style === s ? 'bg-brand-primary border-brand-secondary text-white' : 'bg-dark-bg border-dark-border hover:border-brand-secondary'}`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
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

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-2 bg-brand-primary text-white font-bold py-3 px-4 rounded-md hover:bg-brand-secondary transition-colors duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed"
                    >
                        <SparklesIcon className="w-5 h-5" />
                        {isLoading ? 'Visualizing...' : 'Visualize Dream'}
                    </button>
                </form>
            </div>
            
            <ImagePreview 
                srcs={generatedImages} 
                isLoading={isLoading} 
                error={error} 
                loadingMessage={loadingMessage} 
            />
        </div>
    );
};

export default DreamVisualizer;