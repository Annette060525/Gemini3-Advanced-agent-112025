
import { GoogleGenAI } from "@google/genai";

export interface GeminiResponse {
  text: string;
  tokens: number;
}

export const callGemini = async (
  apiKey: string,
  modelName: string,
  systemPrompt: string,
  userPrompt: string,
  config: {
    temperature: number;
    topP: number;
    maxTokens: number;
  }
): Promise<GeminiResponse> => {
  if (!apiKey) throw new Error("API Key is required");

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        temperature: config.temperature,
        topP: config.topP,
        maxOutputTokens: config.maxTokens,
      },
    });

    return {
      text: response.text || "",
      tokens: response.usageMetadata?.totalTokenCount || 0,
    };
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

// Helper for OCR using Vision capabilities
export const geminiOcr = async (
  apiKey: string,
  modelName: string,
  base64Images: string[]
): Promise<string> => {
    if (!apiKey) throw new Error("API Key is required");

    const ai = new GoogleGenAI({ apiKey });

    // Construct parts array correctly
    const imageParts = base64Images.map(b64 => ({
        inlineData: {
            mimeType: 'image/png',
            data: b64
        }
    }));
    
    const textPart = { 
        text: "請將這些圖片中的文字完整轉錄（保持原文、段落與標點）。若有表格，請以Markdown表格呈現。Ignore any non-text artifacts." 
    };

    const response = await ai.models.generateContent({
        model: modelName,
        contents: { parts: [...imageParts, textPart] },
    });

    return response.text || "";
}
