
import { GoogleGenAI, Type } from "@google/genai";

export const GeminiService = {
  analyzeSymptoms: async (symptoms: string, patientHistory: string[]): Promise<string> => {
    // Initialisation avec la clé process.env.API_KEY fournie par AI Studio
    // Fix: Using correct instance creation and text contents structure
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    try {
      const prompt = `
        Tu es un expert médical de haut niveau au Maroc. 
        Analyse les symptômes : ${symptoms}
        Antécédents : ${patientHistory.join(', ') || 'Aucun'}
        
        Réponds en Markdown :
        1. 3 hypothèses de diagnostics.
        2. Examens recommandés.
        3. Conduite à tenir.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
          thinkingConfig: { thinkingBudget: 4000 },
          temperature: 0.2,
        },
      });

      return response.text || "Impossible de générer l'analyse.";
    } catch (error) {
      console.error("Gemini Error:", error);
      return "Service IA indisponible.";
    }
  },

  generatePrescriptionSuggestion: async (diagnosis: string): Promise<string[]> => {
    // Fix: Creating new instance for each call to ensure latest API key
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    try {
        const prompt = `Suggère une liste de médicaments (DCI + Posologie) pour : "${diagnosis}". Retourne un tableau JSON de chaînes de caractères.`;

        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                temperature: 0.1
            }
        });

        const text = response.text;
        return text ? JSON.parse(text) : [];
    } catch (e) {
        return [];
    }
  }
};
