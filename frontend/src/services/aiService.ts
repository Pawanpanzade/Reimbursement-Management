import { GoogleGenAI } from "@google/genai";

export async function scanReceipt(base64Image: string) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            { text: "Analyze this receipt and extract the following information in JSON format: amount (number), currency (3-letter code), category (one of: Food, Travel, Supplies, Utilities, Other), description (brief summary), date (YYYY-MM-DD), merchant (name of restaurant/shop)." },
            { inlineData: { mimeType: "image/jpeg", data: base64Image.split(',')[1] || base64Image } }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json"
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("OCR Error:", error);
    return null;
  }
}

export async function getCurrencies() {
  try {
    const response = await fetch("https://restcountries.com/v3.1/all?fields=name,currencies");
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Currency Fetch Error:", error);
    return [];
  }
}
