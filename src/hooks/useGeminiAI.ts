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
  maturityPeriod: string;
  bestPlantingTime?: string;
}

interface GeminiResponse {
  crops: CropRecommendation[];
  reasoning: string;
}

export const useGeminiAI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  const getCropRecommendations = async (farmData: FarmData): Promise<GeminiResponse | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro/generateContent?key=${API_KEY}`,
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
                    
                    IMPORTANT: Your response MUST be a valid JSON object with the following structure:
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
                          "maturityPeriod": "Time from planting to harvest (e.g., 90-120 days)",
                          "bestPlantingTime": "Optimal planting season or months for this location",
                          "isTopPick": Boolean (true for the most recommended crop)
                        }
                      ],
                      "reasoning": "Brief explanation of the overall recommendation logic"
                    }
                    
                    Do NOT include any text, explanations, or markdown outside of this JSON structure.
                    Ensure the JSON is valid and complete with all fields.
                    Make sure the crops are appropriate for the location's climate, soil type, and water availability.
                    Consider profitability based on market prices and yields.
                    Factor in the farmer's budget constraints and priorities (profit vs sustainability).
                    Always designate exactly one crop as isTopPick: true and the rest as false.
                    The sum of scores should be approximately 400.`
                  }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.1,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 2048,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMessage = errorData ? 
          `AI request failed: ${errorData.error?.message || response.statusText}` : 
          `AI request failed: ${response.statusText}`;
          
        console.error("Gemini API HTTP Error:", errorMessage);
        
        if (retryCount < MAX_RETRIES && (response.status === 429 || response.status >= 500)) {
          setRetryCount(prev => prev + 1);
          const delay = Math.pow(2, retryCount) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
          return getCropRecommendations(farmData);
        }
        
        throw new Error(errorMessage);
      }

      setRetryCount(0);
      const result = await response.json();
      
      console.log("Gemini API response structure:", JSON.stringify(result, null, 2));
      
      try {
        const textContent = result.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!textContent) {
          throw new Error("Empty response from AI service");
        }
        
        const jsonMatch = textContent.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error("Failed to parse AI response as JSON");
        }
        
        const parsedResponse = JSON.parse(jsonMatch[0]) as GeminiResponse;
        
        if (!parsedResponse.crops || !Array.isArray(parsedResponse.crops) || parsedResponse.crops.length === 0) {
          throw new Error("Invalid crop recommendations format");
        }
        
        let hasTopPick = false;
        for (const crop of parsedResponse.crops) {
          if (crop.isTopPick) {
            if (hasTopPick) {
              crop.isTopPick = false;
            } else {
              hasTopPick = true;
            }
          }
        }
        
        if (!hasTopPick && parsedResponse.crops.length > 0) {
          const highestScoringCrop = parsedResponse.crops.reduce(
            (prev, current) => (prev.score > current.score) ? prev : current
          );
          highestScoringCrop.isTopPick = true;
        }
        
        return parsedResponse;
      } catch (parseError) {
        console.error("Error parsing Gemini response:", parseError);
        throw new Error("Failed to parse crop recommendations");
      }
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
