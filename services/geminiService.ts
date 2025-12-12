import { GoogleGenAI, Type } from "@google/genai";
import { ReceiptAnalysis } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeReceiptImage = async (base64Image: string): Promise<ReceiptAnalysis> => {
  try {
    // Remove data URL prefix if present to get raw base64
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpg|jpeg|webp);base64,/, "");

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg', // Assuming jpeg for simplicity from camera
              data: cleanBase64
            }
          },
          {
            text: "Analyze this receipt image. Extract the total amount, the merchant name, and the date."
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            amount: { type: Type.NUMBER, description: "The total amount paid." },
            merchant: { type: Type.STRING, description: "The name of the business or merchant." },
            date: { type: Type.STRING, description: "The date on the receipt in YYYY-MM-DD format." }
          },
          required: ["amount", "merchant"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    return JSON.parse(text) as ReceiptAnalysis;
  } catch (error) {
    console.error("Error analyzing receipt:", error);
    throw error;
  }
};