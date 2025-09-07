import React, { useState, useRef } from 'react';
import { Icon } from '../types';
import { ANIME_CHARACTERS, FAMOUS_PERSONALITIES } from '../constants';
import { generateStyledImage, fileToBase64 } from '../services/geminiService';
import ImagePreview from './ImagePreview';
import { SparklesIcon, UploadIcon } from './Icons';

type Category = 'famous' | 'anime';

const MeetYourIcons: React.FC = () => {
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [filePreview, setFilePreview] = useState<string | null>(null);
    const [category, setCategory] = useState<Category>('famous');
    const [selectedIcon, setSelectedIcon] = useState<Icon>(FAMOUS_PERSONALITIES[0]);
    const [customIcon, setCustomIcon] = useState('');
    const [action, setAction] = useState('');
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

    const handleCategoryChange = (newCategory: Category) => {
        setCategory(newCategory);
        if (newCategory === 'famous') {
            setSelectedIcon(FAMOUS_PERSONALITIES[0]);
        } else {
            setSelectedIcon(ANIME_CHARACTERS[0]);
        }
        setCustomIcon('');
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

        if (selectedIcon === 'Custom...' && !customIcon.trim()) {
            setError("Please enter a name for your custom icon.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setGeneratedImages(null);

        try {
            const { base64, mimeType } = await fileToBase64(uploadedFile);
            const finalIcon = selectedIcon === 'Custom...' ? customIcon.trim() : selectedIcon;
            let prompt;

            if (action.trim()) {
                prompt = `Create a new, realistic image of the person from the uploaded photo and ${finalIcon}. In the image, they should be ${action.trim()}. The scene should be dynamic and reflect this action. The background should be appropriate for the activity. Make sure the lighting, shadows, and interaction between the two individuals are consistent and believable for a high-quality composition.`;
            } else {
                prompt = `Create a new, realistic image featuring the person from the uploaded photo alongside ${finalIcon}. They should appear to be interacting naturally, like in a posed meeting or a candid scene. The background should be appropriate for both individuals. Make sure the lighting and shadows are consistent for a believable composition.`;
            }

            const imageUrls = await generateStyledImage(base64, mimeType, prompt, numberOfImages);
            setGeneratedImages(imageUrls);
        } catch (err) {
            setError(err instanceof Error ? err.message : "An unknown error occurred while creating your meeting.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };
    
    const currentIconList = category === 'famous' ? FAMOUS_PERSONALITIES : ANIME_CHARACTERS;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-dark-card p-6 rounded-lg border border-dark-border">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-light-text mb-2">Upload Your Photo</label>
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
                        <label className="block text-sm font-medium text-light-text mb-2">
                            Choose a Category
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => handleCategoryChange('famous')}
                                className={`p-3 text-center rounded-md text-sm font-semibold transition-all duration-200 border-2 ${category === 'famous' ? 'bg-brand-primary border-brand-secondary text-white' : 'bg-dark-bg border-dark-border hover:border-brand-secondary'}`}
                            >
                                Famous Personalities
                            </button>
                            <button
                                type="button"
                                onClick={() => handleCategoryChange('anime')}
                                className={`p-3 text-center rounded-md text-sm font-semibold transition-all duration-200 border-2 ${category === 'anime' ? 'bg-brand-primary border-brand-secondary text-white' : 'bg-dark-bg border-dark-border hover:border-brand-secondary'}`}
                            >
                                Anime Characters
                            </button>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="icon" className="block text-sm font-medium text-light-text mb-2">Choose an Icon to Meet</label>
                        <select id="icon" value={selectedIcon} onChange={(e) => setSelectedIcon(e.target.value)} className="w-full bg-dark-bg border border-dark-border rounded-md p-3 focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary transition">
                            {currentIconList.map(i => <option key={i} value={i}>{i}</option>)}
                        </select>
                    </div>

                    {selectedIcon === 'Custom...' && (
                        <div>
                           <label htmlFor="customIcon" className="block text-sm font-medium text-light-text mb-2">Describe Custom Icon</label>
                           <input type="text" id="customIcon" value={customIcon} onChange={(e) => setCustomIcon(e.target.value)} placeholder="e.g., Sherlock Holmes" className="w-full bg-dark-bg border border-dark-border rounded-md p-3 focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary transition"/>
                        </div>
                    )}
                    
                    <div>
                        <label htmlFor="action" className="block text-sm font-medium text-light-text mb-2">Action to Perform (Optional)</label>
                        <input type="text" id="action" value={action} onChange={(e) => setAction(e.target.value)} placeholder="e.g., Playing chess, exploring a city" className="w-full bg-dark-bg border border-dark-border rounded-md p-3 focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary transition"/>
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
                        {isLoading ? 'Arranging Meeting...' : 'Meet My Icon'}
                    </button>
                </form>
            </div>
            <ImagePreview srcs={generatedImages} isLoading={isLoading} error={error} loadingMessage="Arranging your iconic meeting..." />
        </div>
    );
};

export default MeetYourIcons;