
import { GoogleGenAI, Type } from "@google/genai";
import { Debt, MotivationalMessage } from "../types";

export const getEncouragement = async (
  debts: Debt[], 
  totalPaid: number, 
  monthlyIncome: number = 0
): Promise<MotivationalMessage> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const totalBalance = debts.reduce((sum, d) => sum + d.balance, 0);
  const totalMins = debts.reduce((sum, d) => sum + d.minimumPayment, 0);
  
  const prompt = `Act as a senior debt-relief strategist. 
    Current total debt: $${totalBalance.toFixed(2)}. 
    Total amount paid off so far: $${totalPaid.toFixed(2)}.
    Monthly Net Income: $${monthlyIncome.toFixed(2)}.
    Mandatory Monthly Minimums: $${totalMins.toFixed(2)}.
    Debts list: ${debts.map(d => `${d.name} (Balance: $${d.balance}, Rate: ${d.interestRate}%)`).join(', ')}.
    
    Provide:
    1. A highly encouraging pep talk.
    2. A specific next milestone (e.g. "Paying off the ${debts[0]?.name || 'first card'}").
    3. A practical financial tip.
    4. Strategic advice about their income vs debt (DTI ratio).
    5. A 'healthScore' from 1-100 where 100 is debt-free.
    
    Return the response in JSON format. Do not use beach or sea metaphors.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          pepTalk: { type: Type.STRING },
          nextMilestone: { type: Type.STRING },
          financialTip: { type: Type.STRING },
          budgetAdvice: { type: Type.STRING },
          healthScore: { type: Type.NUMBER }
        },
        required: ["pepTalk", "nextMilestone", "financialTip", "budgetAdvice", "healthScore"]
      }
    }
  });

  try {
    const jsonStr = response.text?.trim() || "{}";
    return JSON.parse(jsonStr);
  } catch (e) {
    return {
      pepTalk: "You're making consistent progress toward total debt freedom.",
      nextMilestone: "Focus on your current high-priority balance to build momentum.",
      financialTip: "Review non-essential monthly subscriptions to increase your snowball power.",
      budgetAdvice: "Aim to keep your debt-to-income ratio below 36% for optimal financial health.",
      healthScore: 50
    };
  }
};
