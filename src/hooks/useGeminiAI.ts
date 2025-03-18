
import { useState } from "react";
import { toast } from "sonner";

// Gemini AI API key
const API_KEY = "AIzaSyCqoc5W561L0nbQAjceEBQL5na33clCpLQ";

// Types
export interface FarmData {
  location: {
    name: string;
    lat: number;
    lng: number;
  };
  landSize: number;
  soilType: string;
  waterAvailability: number;
  budget: number;
  farmingPriority: "profit" | "balanced" | "sustainability";
  experience?: number;
  previousCrop?: string;
  notes?: string;
}

export interface CropRecommendation {
  name: string;
  description: string;
  estimatedProfit: number;
  marketPrice: number;
  score: number;
  growthPeriod: string;
  waterRequirements: string;
  soilCompatibility: string[];
  isTopPick: boolean;
}

interface GeminiResponse {
  crops: CropRecommendation[];
  reasoning: string;
}

export const useGeminiAI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getCropRecommendations = async (farmData: FarmData): Promise<GeminiResponse | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `As an agricultural AI expert, analyze the following farm data and recommend the 5 most suitable crops.
                    
                    Farm location: ${farmData.location.name}
                    Coordinates: ${farmData.location.lat}, ${farmData.location.lng}
                    Land size: ${farmData.landSize} acres
                    Soil type: ${farmData.soilType}
                    Water availability: ${farmData.waterAvailability} inches per season
                    Budget: $${farmData.budget} per acre
                    Farming priority: ${farmData.farmingPriority}
                    ${farmData.experience ? `Farming experience: ${farmData.experience} years` : ''}
                    ${farmData.previousCrop ? `Previous crop: ${farmData.previousCrop}` : ''}
                    ${farmData.notes ? `Additional notes: ${farmData.notes}` : ''}
                    
                    Return the response as a valid JSON object with the following structure:
                    {
                      "crops": [
                        {
                          "name": "Crop name",
                          "description": "Brief description of why this crop is suitable",
                          "estimatedProfit": Number (profit per acre),
                          "marketPrice": Number (price per unit),
                          "score": Number (0-100 suitability score),
                          "growthPeriod": "Duration in weeks/months",
                          "waterRequirements": "Description of water needs",
                          "soilCompatibility": ["soil type 1", "soil type 2"],
                          "isTopPick": Boolean (true for the most recommended crop)
                        }
                      ],
                      "reasoning": "Brief explanation of the overall recommendation logic"
                    }
                    
                    Ensure the crops are appropriate for the location's climate, the provided soil type, and water availability.
                    Consider profitability based on typical market prices and yields. 
                    Factor in the farmer's budget constraints and priorities (profit vs sustainability).
                    The sum of scores across all crops should add up to approximately 400.`
                  }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.2,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 2048,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`AI request failed: ${response.statusText}`);
      }

      const result = await response.json();
      const textContent = result.candidates[0].content.parts[0].text;
      
      // Extract the JSON part from the response text
      const jsonMatch = textContent.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("Failed to parse AI response as JSON");
      }
      
      const parsedResponse = JSON.parse(jsonMatch[0]) as GeminiResponse;
      return parsedResponse;
    } catch (err: any) {
      const errorMessage = err.message || "Failed to get crop recommendations";
      setError(errorMessage);
      toast.error("Error analyzing farm data", {
        description: errorMessage,
      });
      console.error("Gemini API error:", err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    getCropRecommendations,
    loading,
    error,
  };
};
