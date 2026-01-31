
import { GoogleGenAI } from "@google/genai";

export const getDailyInspiration = async (prayerName: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
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
