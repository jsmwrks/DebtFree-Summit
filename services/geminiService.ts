
import { GoogleGenAI, Type } from "@google/genai";
import { Debt, MotivationalMessage } from "../types";

export const getEncouragement = async (debts: Debt[], totalPaid: number): Promise<MotivationalMessage> => {
  // Always initialize with named parameters and use process.env.API_KEY directly.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const totalBalance = debts.reduce((sum, d) => sum + d.balance, 0);
  const prompt = `The user is on a journey to pay off debt. 
    Current total debt: $${totalBalance.toFixed(2)}. 
    Total amount paid off so far: $${totalPaid.toFixed(2)}.
    Debts list: ${debts.map(d => `${d.name} ($${d.balance})`).join(', ')}.
    
    Provide a highly encouraging, non-judgmental response as a supportive financial coach. 
    Use a mountain climbing metaphor.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          pepTalk: { type: Type.STRING, description: "A warm, uplifting message focusing on their progress." },
          nextMilestone: { type: Type.STRING, description: "A specific small win they should look forward to." },
          financialTip: { type: Type.STRING, description: "A practical, gentle tip for saving more or managing debt." }
        },
        required: ["pepTalk", "nextMilestone", "financialTip"]
      }
    }
  });

  try {
    // Accessing .text as a property on the GenerateContentResponse object.
    const jsonStr = response.text?.trim() || "{}";
    return JSON.parse(jsonStr);
  } catch (e) {
    return {
      pepTalk: "You're making incredible progress! Every dollar paid is a step closer to the summit of financial freedom.",
      nextMilestone: "Focus on that first small balance—clearing it will feel like reaching a beautiful base camp.",
      financialTip: "Try the 'rounding up' method on your daily purchases to find a few extra dollars each week."
    };
  }
};
