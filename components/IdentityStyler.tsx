import React, { useState, useRef } from 'react';
import { Persona } from '../types';
import { PERSONAS } from '../constants';
import { generateStyledImage, fileToBase64 } from '../services/geminiService';
import ImagePreview from './ImagePreview';
import { SparklesIcon, UploadIcon } from './Icons';

const IdentityStyler: React.FC = () => {
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [filePreview, setFilePreview] = useState<string | null>(null);
    const [persona, setPersona] = useState<Persona>(PERSONAS[0]);
    const [customPersona, setCustomPersona] = useState('');
    const [timePlace, setTimePlace] = useState('');
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
            setError("Please upload a photo of yourself.");
            return;
        }
        
        if (persona === 'Custom...' && !customPersona.trim()) {
            setError("Please describe your custom look in the text box.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setGeneratedImages(null);

        try {
            const { base64, mimeType } = await fileToBase64(uploadedFile);
            
            const finalPersona = persona === 'Custom...' ? customPersona.trim() : persona;

            let prompt = `Transform the person in the image into a ${finalPersona}.`;
            if (timePlace.trim()) {
                prompt += ` The setting is ${timePlace.trim()}.`;
            }
            prompt += " Maintain the original person's key facial features but adapt their clothing, hair, and the background to fit the new identity. The final image should be photorealistic and high-quality."

            const imageUrls = await generateStyledImage(base64, mimeType, prompt, numberOfImages);
            setGeneratedImages(imageUrls);
        } catch (err) {
            setError(err instanceof Error ? err.message : "An unknown error occurred while styling your identity.");
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
                        <label className="block text-sm font-medium text-light-text mb-2">Upload Your Photo</label>
                        <label 
                            htmlFor="file-upload-identity"
                            className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dark-border border-dashed rounded-md cursor-pointer hover:border-brand-secondary transition"
                            role="button"
                            aria-label={filePreview ? `Change photo. Current file: ${uploadedFile?.name}` : "Upload your photo"}
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
                        </label>
                        <input id="file-upload-identity" name="file-upload" type="file" className="sr-only" ref={fileInputRef} onChange={handleFileChange} accept="image/*" />
                    </div>

                    <div>
                        <label htmlFor="persona" className="block text-sm font-medium text-light-text mb-2">Choose a Look/Persona</label>
                        <select id="persona" value={persona} onChange={(e) => setPersona(e.target.value)} className="w-full bg-dark-bg border border-dark-border rounded-md p-3 focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary transition">
                            {PERSONAS.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>

                    {persona === 'Custom...' && (
                        <div>
                            <label htmlFor="customPersona" className="block text-sm font-medium text-light-text mb-2">Describe Custom Look</label>
                            <input type="text" id="customPersona" value={customPersona} onChange={(e) => setCustomPersona(e.target.value)} placeholder="e.g., A steampunk inventor" className="w-full bg-dark-bg border border-dark-border rounded-md p-3 focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary transition"/>
                        </div>
                    )}

                     <div>
                        <label htmlFor="timePlace" className="block text-sm font-medium text-light-text mb-2">Optional: Time & Place</label>
                        <input type="text" id="timePlace" value={timePlace} onChange={(e) => setTimePlace(e.target.value)} placeholder="e.g., Mars Colony, 2080" className="w-full bg-dark-bg border border-dark-border rounded-md p-3 focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary transition"/>
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
                        {isLoading ? 'Styling...' : 'Style My Identity'}
                    </button>
                </form>
            </div>
            <ImagePreview srcs={generatedImages} isLoading={isLoading} error={error} loadingMessage="Styling your new identity..." />
        </div>
    );
};

export default IdentityStyler;