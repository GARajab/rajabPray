
import { GoogleGenAI } from "@google/genai";

export const getDailyInspiration = async (prayerName: string): Promise<string> => {
  // Safe environment key lookup
  let apiKey: string | undefined;
  
  try {
    // Check various common places for the API key in a browser/static environment
    apiKey = (window as any).process?.env?.API_KEY || (typeof process !== 'undefined' ? process.env?.API_KEY : undefined);
  } catch (e) {
    // Silence errors if process object is restricted
  }
  
  if (!apiKey) {
    console.warn("API_KEY not found. Using fallback inspiration.");
    return "The best of deeds are those done consistently, even if they are small.";
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Provide a short, 1-sentence spiritual reflection or inspiration related to the ${prayerName} prayer or gratitude for the day. Keep it peaceful and uplifting.`,
      config: {
        thinkingConfig: { thinkingBudget: 0 }
      }
    });

    return response.text || "May your heart find peace in every prayer.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "The best of deeds are those done consistently, even if they are small.";
  }
};
