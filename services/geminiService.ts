import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

// API_KEY is expected to be set in the environment.
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export const estimateCaloriesFromImage = async (base64ImageData: string, mimeType: string): Promise<string> => {
  if (!API_KEY) {
    // This check is more for robustness, App.tsx also checks and informs user.
    throw new Error("API_KEY is not configured. Please set the VITE_GEMINI_API_KEY environment variable.");
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY });

  const imagePart = {
    inlineData: {
      mimeType: mimeType, // Use the dynamic mimeType from the uploaded file
      data: base64ImageData,
    },
  };

  const textPart = {
    text: "Analyze the food in this image. Provide an estimated total calorie count. If possible, list the food items you identify and their individual calorie estimates. Format the response as plain text. For example: 'Total Estimated Calories: X kcal. Identified items: Item A (Y kcal), Item B (Z kcal).' If you cannot identify food or estimate calories, please state that clearly.",
  };

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-04-17', 
      contents: { parts: [imagePart, textPart] },
       // No thinkingConfig for this use case to prioritize quality.
    });
    
    const estimationText = response.text;
    if (!estimationText || estimationText.trim() === "") {
        // This case might occur if the model filters its own output or returns nothing.
        throw new Error("The AI returned an empty or invalid response. It might be unable to analyze this image.");
    }
    return estimationText;

  } catch (error: any) {
    console.error("Gemini API error details:", error); 
    // Attempt to provide a more user-friendly error message
    if (error && typeof error === 'object' && 'message' in error) {
        // Check for common API error messages if known, otherwise use the generic one
        if (String(error.message).includes("API key not valid")) {
             throw new Error("The configured API key is invalid. Please check your API key.");
        }
         throw new Error(`AI analysis failed: ${error.message}`);
    }
    throw new Error("An unexpected error occurred while communicating with the AI. Please try again later.");
  }
};
