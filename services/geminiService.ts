
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { AnalysisResult, SEOData, GeneratedImage } from "../types";
import { PRODUCT_SHOTS_CONFIG } from "../constants";

// Helper to get AI Client with dynamic key
const getClient = (apiKey?: string) => {
  // Use custom key if provided, otherwise fallback to environment variable
  return new GoogleGenAI({ apiKey: apiKey || process.env.API_KEY });
};

// Helper to convert File to Base64
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Generates a visualization of the model wearing the saree.
 */
export const generateTryOnImage = async (
  sareeImageBase64: string,
  faceImageBase64: string | null,
  figureDesc: string,
  bgDesc: string,
  attireDesc: string,
  apiKey?: string
): Promise<string> => {
  try {
    const ai = getClient(apiKey);
    const parts: any[] = [
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: sareeImageBase64
        }
      }
    ];

    if (faceImageBase64) {
      parts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: faceImageBase64
        }
      });
    }

    const promptText = `
      Generate a photorealistic, high-fashion e-commerce product image of a model wearing the saree shown in the first image.
      
      INPUTS:
      - IMAGE 1: Saree (Texture, Print, Border).
      ${faceImageBase64 ? '- IMAGE 2: Model Face.' : ''}
      
      STRICT REQUIREMENTS:
      1. SAREE: The saree must be an EXACT VISUAL CLONE of Image 1 (Fabric, Print, Border).
      2. FACE: ${faceImageBase64 ? 'The model MUST have the exact facial features of the person in Image 2.' : 'Generate a consistent model face.'}
      3. BACKGROUND: "${bgDesc}"
         - Strictly generate the image in this background setting.
      4. POSE: Standing straight, front-facing, Nivi drape, crisp pleats.
      
      Model Description: ${figureDesc}
      Attire Details: ${attireDesc}
      
      Lighting: Soft, commercial studio lighting.
    `;

    parts.push({ text: promptText });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: parts,
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    const partsResponse = response.candidates?.[0]?.content?.parts;
    if (partsResponse && partsResponse[0]?.inlineData) {
      const base64ImageBytes = partsResponse[0].inlineData.data;
      return `data:image/png;base64,${base64ImageBytes}`;
    }

    throw new Error("No image generated");
  } catch (error) {
    console.error("Error generating try-on image:", error);
    throw error;
  }
};

/**
 * Generates a single product shot based on configuration.
 */
export const generateSingleProductShot = async (
    sareeImageBase64: string,
    faceImageBase64: string | null,
    referenceImageBase64: string | null,
    shotConfig: { id?: string; label?: string; type: 'model' | 'product' | 'source', prompt: string, feedback?: string },
    context: { figureDesc: string, bgDesc: string, attireDesc: string },
    apiKey?: string
): Promise<string> => {
    const ai = getClient(apiKey);
    
    const executeGeneration = async () => {
        // Source images are handled in the calling component, but safety check here
        if (shotConfig.type === 'source') {
            throw new Error("Source image should not be generated via API");
        }

        const useReference = referenceImageBase64 && shotConfig.id !== 'mannequin-view';
        const useFace = shotConfig.type === 'model' && faceImageBase64 && shotConfig.id !== 'mannequin-view';

        // PART 1: Saree Source Image
        const parts: any[] = [
            { inlineData: { mimeType: 'image/jpeg', data: sareeImageBase64 } }
        ];

        let refIndex = -1;
        let faceIndex = -1;
        let nextIndex = 2; // Image 1 is Saree, so next is 2

        // PART 2: Reference Try-On (The Anchor for Consistency)
        if (useReference && referenceImageBase64) {
            const base64Data = referenceImageBase64.includes(',') 
               ? referenceImageBase64.split(',')[1] 
               : referenceImageBase64;
            parts.push({ inlineData: { mimeType: 'image/png', data: base64Data } });
            refIndex = nextIndex;
            nextIndex++;
        }

        // PART 3: Face Image (MANDATORY if provided for consistency)
        if (useFace && faceImageBase64) {
             parts.push({ inlineData: { mimeType: 'image/jpeg', data: faceImageBase64 } });
             faceIndex = nextIndex;
             nextIndex++;
        }

        let finalPrompt = `
        You are an expert fashion photographer generating e-commerce imagery.
        
        INPUTS:
        - IMAGE 1: Saree Product (Source).
        ${useReference ? `- IMAGE ${refIndex}: Reference Look (Lighting/Style Anchor).` : ''}
        ${useFace ? `- IMAGE ${faceIndex}: Model Face (Identity Source).` : ''}
        
        MANDATORY CONFIGURATION:
        
        A. BACKGROUND:
        "${context.bgDesc}"
        - You MUST use this description for the background.
        ${useReference ? `- Do NOT blindly copy the background from Image ${refIndex} if it contradicts the text description. The text description is the authority for the setting.` : ''}
        
        B. FACE IDENTITY:
        ${useFace ? `- CRITICAL: The model MUST have the exact facial features of the person in IMAGE ${faceIndex}.` : ''}
        - Do not create a generic face.
        
        C. SHOT EXECUTION:
        Generate a photorealistic ${shotConfig.label}.
        ${shotConfig.prompt}
        
        ${shotConfig.feedback ? `USER CORRECTION: "${shotConfig.feedback}"` : ''}
        
        VISUAL HARMONY:
        ${useReference ? `- Use Image ${refIndex} for lighting, color grading, and blouse design.` : ''}
        - Ensure the saree (Image 1) is rendered perfectly.
        `;

        parts.push({ text: finalPrompt });

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts },
            config: { responseModalities: [Modality.IMAGE] },
        });

        const resultParts = response.candidates?.[0]?.content?.parts;
        if (resultParts && resultParts[0]?.inlineData) {
            return `data:image/png;base64,${resultParts[0].inlineData.data}`;
        }
        throw new Error("Failed to generate image");
    };

    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
        try {
            return await executeGeneration();
        } catch (error: any) {
            attempts++;
            const isRetryable = error.message?.includes('500') || error.status === 500;
            if (isRetryable && attempts < maxAttempts) {
                const delay = Math.pow(2, attempts - 1) * 1000;
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }
            throw error;
        }
    }
    throw new Error("Failed to generate image after multiple attempts");
};

export const getProductShotConfigs = () => {
    return PRODUCT_SHOTS_CONFIG.map(config => ({
        ...config,
        url: null,
        status: 'idle' as const,
        selected: true,
        feedback: '',
        isRefining: false
    }));
};

export const analyzeSareePotential = async (
    sareeImageBase64: string, 
    attireDesc: string,
    apiKey?: string
): Promise<AnalysisResult> => {
  try {
    const ai = getClient(apiKey);
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
            { inlineData: { mimeType: 'image/jpeg', data: sareeImageBase64 } },
            { 
                text: `Analyze this saree for e-commerce. Context: ${attireDesc}. 
                Estimate Engagement Rate (0-100%), Conversion Rate (0-10%), Rating (0-10). 
                Provide 5 style attributes for radar chart (Traditional, Modern, Occasion, Fabric Quality, Color Vibrancy) 0-100.`
            }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            engagementRate: { type: Type.NUMBER },
            conversionRate: { type: Type.NUMBER },
            rating: { type: Type.NUMBER },
            reasoning: { type: Type.STRING },
            styleMetrics: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  attribute: { type: Type.STRING },
                  value: { type: Type.NUMBER },
                  fullMark: { type: Type.NUMBER }
                }
              }
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No analysis generated");
    return JSON.parse(text) as AnalysisResult;
  } catch (error) {
    console.error("Error analyzing saree:", error);
    return {
      engagementRate: 0,
      conversionRate: 0,
      rating: 0,
      reasoning: "Analysis failed.",
      styleMetrics: []
    };
  }
};

/**
 * Step 4: Generate SEO and SKU Details
 */
export const generateSEODetails = async (
    sareeImageBase64: string,
    fabric: string,
    design: string,
    attireDesc: string,
    apiKey?: string
): Promise<SEOData> => {
    const ai = getClient(apiKey);
     const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
            parts: [
                { inlineData: { mimeType: 'image/jpeg', data: sareeImageBase64 } },
                { 
                    text: `Generate an SEO Title (max 50 characters) and an SEO Product Description (max 50 words) for this saree.
                    
                    Context:
                    - Fabric: ${fabric}
                    - Design: ${design}
                    - Additional Info: ${attireDesc}
                    
                    Note: SKU will be generated programmatically, return empty string for SKU in JSON.
                    ` 
                }
            ]
        },
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    seoTitle: { type: Type.STRING },
                    seoDescription: { type: Type.STRING },
                    sku: { type: Type.STRING } // We will overwrite this in the frontend
                }
            }
        }
    });
    return JSON.parse(response.text || '{}') as SEOData;
};
