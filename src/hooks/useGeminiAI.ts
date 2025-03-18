
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
  maturityPeriod: string; // Added maturity period field
  bestPlantingTime?: string; // Added best planting time field
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
      // Updated API URL to use the correct Gemini API version (v1 instead of v1beta)
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${API_KEY}`,
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
                          "maturityPeriod": "Time from planting to harvest (e.g., 90-120 days)",
                          "bestPlantingTime": "Optimal planting season or months for this location",
                          "isTopPick": Boolean (true for the most recommended crop)
                        }
                      ],
                      "reasoning": "Brief explanation of the overall recommendation logic"
                    }
                    
                    Ensure the crops are appropriate for the location's climate, the provided soil type, and water availability.
                    Consider profitability based on typical market prices and yields.
                    For maturityPeriod, provide specific time frames in days or months.
                    For bestPlantingTime, consider the geographic location and local climate patterns.
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
        // Improved error handling with more details
        const errorData = await response.json().catch(() => null);
        const errorMessage = errorData ? 
          `AI request failed: ${errorData.error?.message || response.statusText}` : 
          `AI request failed: ${response.statusText}`;
        throw new Error(errorMessage);
      }

      const result = await response.json();
      
      // Log the response structure to help with debugging
      console.log("Gemini API response structure:", JSON.stringify(result, null, 2));
      
      // Parse response - updated to handle the new Gemini API v1 response format
      let parsedResponse: GeminiResponse;
      
      try {
        // First, get the text content from the response
        const textContent = result.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!textContent) {
          throw new Error("Empty response from AI service");
        }
        
        // Extract the JSON part from the response text
        const jsonMatch = textContent.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error("Failed to parse AI response as JSON");
        }
        
        parsedResponse = JSON.parse(jsonMatch[0]) as GeminiResponse;
        
        // Validate the response structure
        if (!parsedResponse.crops || !Array.isArray(parsedResponse.crops) || parsedResponse.crops.length === 0) {
          throw new Error("Invalid crop recommendations format");
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
