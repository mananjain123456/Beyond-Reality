import { GoogleGenAI, Modality, Type } from "@google/genai";

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Converts a File object to a base64 encoded string.
 * @param file The file to convert.
 * @returns A promise that resolves with the base64 string and mime type.
 */
export const fileToBase64 = (file: File): Promise<{ base64: string; mimeType: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve({ base64, mimeType: file.type });
    };
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Generates images based on a text prompt using 'imagen-4.0'.
 * Handles requests for more than 16 images by chunking them into multiple API calls.
 * @param prompt The text prompt for image generation.
 * @param numberOfImages The number of images to generate (up to 20).
 * @returns A promise that resolves with an array of base64 data URLs of the generated images.
 */
export const generateDreamImage = async (prompt: string, numberOfImages: number): Promise<string[]> => {
    const MAX_IMAGES_PER_REQUEST = 16;
    const allImageUrls: string[] = [];
    let remainingImages = numberOfImages;

    while (remainingImages > 0) {
        const imagesToGenerate = Math.min(remainingImages, MAX_IMAGES_PER_REQUEST);

        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: {
                numberOfImages: imagesToGenerate,
                outputMimeType: 'image/png',
                aspectRatio: '1:1',
            },
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
            const urls = response.generatedImages.map(img => `data:image/png;base64,${img.image.imageBytes}`);
            allImageUrls.push(...urls);
        } else {
            if (allImageUrls.length === 0) {
                throw new Error("Image generation failed or returned no images on the first attempt.");
            } else {
                console.warn(`A subsequent batch of image generation returned no images. Returning ${allImageUrls.length} images.`);
                break; 
            }
        }
        remainingImages -= imagesToGenerate;
    }

    if (allImageUrls.length === 0 && numberOfImages > 0) {
         throw new Error("Image generation failed to produce any images.");
    }

    return allImageUrls;
};


/**
 * Generates a multi-part manga script based on a story theme.
 * @param storyTheme The theme of the story.
 * @param numberOfPages The exact number of pages the script should be for.
 * @returns A promise that resolves with an array of strings, where each string is a script for one page.
 */
export const generateMangaScript = async (storyTheme: string, numberOfPages: number): Promise<string[]> => {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `You are a creative manga storyboard writer. Based on the theme "${storyTheme}", write a cohesive story script broken down into exactly ${numberOfPages} parts. Each part should be a detailed description for a single manga page, outlining the panels, scenes, character actions, and key moments. The story must flow logically from one part to the next.`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    pages: {
                        type: Type.ARRAY,
                        description: `An array of manga page descriptions, with exactly ${numberOfPages} items.`,
                        items: {
                            type: Type.STRING,
                            description: "A detailed description for a single manga page's content and panels."
                        }
                    }
                }
            },
        },
    });

    try {
        const jsonResponse = JSON.parse(response.text);
        if (jsonResponse.pages && Array.isArray(jsonResponse.pages) && jsonResponse.pages.length > 0) {
            return jsonResponse.pages;
        } else {
            throw new Error("AI did not return the expected script format.");
        }
    } catch (e) {
        console.error("Failed to parse manga script from AI:", response.text, e);
        throw new Error("Failed to generate a valid manga script. The AI's response was not in the correct format.");
    }
};

/**
 * Edits an existing image based on a text prompt using 'gemini-2.5-flash-image-preview'.
 * @param base64ImageData The base64 encoded string of the source image.
 * @param mimeType The MIME type of the source image.
 * @param prompt The text prompt describing the desired edit.
 * @param numberOfImages The number of styled images to generate.
 * @returns A promise that resolves with an array of base64 data URLs of the edited images.
 */
export const generateStyledImage = async (base64ImageData: string, mimeType: string, prompt: string, numberOfImages: number): Promise<string[]> => {
    const generateSingleImage = async (): Promise<string> => {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: {
              parts: [
                {
                  inlineData: {
                    data: base64ImageData,
                    mimeType: mimeType,
                  },
                },
                { text: prompt },
              ],
            },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        });

        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            const base64ImageBytes = part.inlineData.data;
            return `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
          }
        }

        throw new Error("Image editing failed or returned no image part.");
    };

    if (numberOfImages <= 0) {
        return [];
    }
    
    const imagePromises: Promise<string>[] = Array.from({ length: numberOfImages }, () => generateSingleImage());

    const results = await Promise.all(imagePromises);
    return results;
};

/**
 * Fuses two images together based on a text prompt using 'gemini-2.5-flash-image-preview'.
 * @param image1 An object containing the base64 data and mime type for the first image.
 * @param image2 An object containing the base64 data and mime type for the second image.
 * @param prompt The text prompt describing how to fuse the images.
 * @param numberOfImages The number of fused images to generate.
 * @returns A promise that resolves with an array of base64 data URLs of the fused images.
 */
export const generateFusedImage = async (image1: { base64: string, mimeType: string }, image2: { base64: string, mimeType: string }, prompt: string, numberOfImages: number): Promise<string[]> => {
    const generateSingleImage = async (): Promise<string> => {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: {
              parts: [
                { inlineData: { data: image1.base64, mimeType: image1.mimeType } },
                { inlineData: { data: image2.base64, mimeType: image2.mimeType } },
                { text: prompt },
              ],
            },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        });

        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            const base64ImageBytes = part.inlineData.data;
            return `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
          }
        }

        throw new Error("Image fusion failed or returned no image part.");
    };

    if (numberOfImages <= 0) {
        return [];
    }
    
    const imagePromises: Promise<string>[] = Array.from({ length: numberOfImages }, () => generateSingleImage());
    const results = await Promise.all(imagePromises);
    return results;
};


/**
 * Generates a high-quality commercial advertisement image.
 * @param promptDetails Details about the product, audience, and style.
 * @param numberOfImages Number of ad variations to generate.
 * @param productImage Optional product image data.
 * @param modelImage Optional model image data.
 * @returns A promise that resolves with an array of base64 data URLs.
 */
export const generateCommercialImage = async (
    promptDetails: {
        productName: string;
        productDescription: string;
        targetAudience: string;
        style: string;
    },
    numberOfImages: number,
    productImage?: { base64: string; mimeType: string },
    modelImage?: { base64: string; mimeType: string }
): Promise<string[]> => {
    
    const { productName, productDescription, targetAudience, style } = promptDetails;

    let instructions = `
      - Generate a compelling, visually stunning image suitable for a print ad or digital marketing campaign.
      - The composition should be dynamic and focus on making the product desirable to the target audience.
      - The overall mood, lighting, and environment must align with the requested visual style.
      - This is a final advertisement, NOT a storyboard scene. The output should be a single, polished image.
    `;

    if (modelImage) {
        instructions += `
      - A celebrity/model image has been provided. **Crucially, you must render this specific person with a high degree of likeness** in the advertisement.
      - Depict this person as the celebrity endorser for the product. They should be interacting with the product in a way that is aspirational and fits the campaign's tone.
      - The final image should look like an authentic endorsement ad featuring this specific individual.
        `;
    }
     if (productImage) {
        instructions += `
      - A product image has been provided. Ensure the product is the hero of the shot, presented in the best possible light and matching the provided image accurately.
        `;
    }

    const finalPrompt = `
      Create a high-quality, professional commercial advertisement image.
      **Product:** "${productName}" - ${productDescription}
      **Target Audience:** ${targetAudience}
      **Visual Style:** ${style}

      **Instructions:**
      ${instructions}
    `;
    
    const generateSingleImage = async (): Promise<string> => {
        const parts: ({ text: string } | { inlineData: { data: string; mimeType: string } })[] = [];
        
        if (productImage) {
            parts.push({ inlineData: { data: productImage.base64, mimeType: productImage.mimeType } });
        }
        if (modelImage) {
            parts.push({ inlineData: { data: modelImage.base64, mimeType: modelImage.mimeType } });
        }
        
        parts.push({ text: finalPrompt });
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: { parts },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        });

        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                const base64ImageBytes = part.inlineData.data;
                return `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
            }
        }
        throw new Error("Commercial image generation failed to return an image.");
    };

    if (numberOfImages <= 0) {
        return [];
    }

    const imagePromises: Promise<string>[] = Array.from({ length: numberOfImages }, () => generateSingleImage());
    const results = await Promise.all(imagePromises);
    return results;
};