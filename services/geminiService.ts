
import { GoogleGenAI, Type } from "@google/genai";
import { Debt, MotivationalMessage } from "../types";

export const getEncouragement = async (debts: Debt[], totalPaid: number): Promise<MotivationalMessage> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const totalBalance = debts.reduce((sum, d) => sum + d.balance, 0);
  const prompt = `The user is on a journey to pay off debt. 
    Current total debt: $${totalBalance.toFixed(2)}. 
    Total amount paid off so far: $${totalPaid.toFixed(2)}.
    Debts list: ${debts.map(d => `${d.name} ($${d.balance})`).join(', ')}.
    
    Provide a highly encouraging, professional, and practical response as a supportive financial advisor. 
    Use clear financial terminology (e.g., cash flow, interest savings, financial independence). Do not use beach or sea metaphors.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          pepTalk: { type: Type.STRING, description: "A supportive message focusing on financial progress." },
          nextMilestone: { type: Type.STRING, description: "A specific financial win the user is approaching." },
          financialTip: { type: Type.STRING, description: "A practical, data-driven tip for optimizing their payoff strategy." }
        },
        required: ["pepTalk", "nextMilestone", "financialTip"]
      }
    }
  });

  try {
    const jsonStr = response.text?.trim() || "{}";
    return JSON.parse(jsonStr);
  } catch (e) {
    return {
      pepTalk: "You're making consistent progress toward total debt freedom. Every payment reduces your principal and saves you money in long-term interest costs.",
      nextMilestone: "Focus on your smallest balance first to build psychological momentum and free up monthly cash flow.",
      financialTip: "Consider setting up automated payments to ensure consistency and avoid any potential late fees that could slow your progress."
    };
  }
};
