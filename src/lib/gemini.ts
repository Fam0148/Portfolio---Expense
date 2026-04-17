import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Create instance lazily to avoid top-level crash if key is missing
let genAIInstance: GoogleGenerativeAI | null = null;
const getGenAI = () => {
  if (!genAIInstance && API_KEY) {
    genAIInstance = new GoogleGenerativeAI(API_KEY);
  }
  return genAIInstance;
};

export const analyzeAssetStatement = async (content: string) => {
  if (!API_KEY) {
    throw new Error("VITE_GEMINI_API_KEY is not set in environment variables.");
  }

  const genAI = getGenAI();
  if (!genAI) throw new Error("Failed to initialize Gemini AI.");

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
    Analyze the following financial statement content and extract investment assets (Stocks and Bonds).
    Return a JSON array of objects with the following schema:
    {
      "symbol": "Ticker or Name of asset",
      "name": "Full name of the asset",
      "purchase_date": "YYYY-MM-DD",
      "purchase_price": number,
      "quantity": number,
      "asset_type": "STOCK" | "BOND",
      "tenure": "Optional tenure for bonds (e.g. 12 Months)",
      "ytm": "Optional YTM percentage for bonds (e.g. 10.5)"
    }

    Rules:
    - If it's a Stock, identify the ticker (e.g. RELIANCE, TCS).
    - If it's a Bond, set asset_type to "BOND".
    - Try to infer the purchase date. If not found, use today's date: ${new Date().toISOString().split('T')[0]}.
    - Combine duplicate entries if found.
    - Return ONLY the JSON array. No markdown code blocks.

    Content:
    ${content}
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Clean up potential markdown formatting if Gemini adds it
    const jsonString = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw new Error("Failed to analyze statement. Please check your API key and file content.");
  }
};
