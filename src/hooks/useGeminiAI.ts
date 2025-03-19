
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// Types
export interface FarmData {
  location: {
    name: string;
    lat: number;
    lng: number;
  };
  landSize: number;
  soilType: string;
  waterAvailability: string; // Now just using descriptive strings
  waterAvailabilityInches?: number; // Optional numerical value for internal use
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

export interface CropCategory {
  type: string;
  crops: CropRecommendation[];
}

interface GeminiResponse {
  categories: CropCategory[];
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
      console.log("Calling Supabase Edge Function with farm data:", farmData);
      
      // No need to convert water availability if it's already a string
      // If somehow a number is passed, convert it to a string
      if (typeof farmData.waterAvailability === 'number') {
        // Store the numeric value
        farmData.waterAvailabilityInches = farmData.waterAvailability as unknown as number;
        
        // Convert to descriptive term
        const inches = Number(farmData.waterAvailability);
        if (inches < 10) {
          farmData.waterAvailability = "limited";
        } else if (inches < 15) {
          farmData.waterAvailability = "rainfed";
        } else if (inches < 25) {
          farmData.waterAvailability = "basic-irrigation";
        } else {
          farmData.waterAvailability = "full-irrigation";
        }
      }
      
      // Call our Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('gemini-crop-advisor', {
        body: farmData,
      });
      
      if (error) {
        console.error("Supabase Edge Function error:", error);
        
        if (retryCount < MAX_RETRIES) {
          setRetryCount(prev => prev + 1);
          const delay = Math.pow(2, retryCount) * 1000;
          toast.warning("Retrying analysis...", {
            description: `The server is busy. Retrying in ${delay/1000} seconds.`,
          });
          await new Promise(resolve => setTimeout(resolve, delay));
          return getCropRecommendations(farmData);
        }
        
        throw new Error(`Failed to analyze farm data: ${error.message}`);
      }
      
      // Reset retry count on success
      setRetryCount(0);
      console.log("Edge function response:", data);
      
      // Validate the response
      if (!data.categories || !Array.isArray(data.categories)) {
        throw new Error("Invalid response format from server");
      }
      
      return data as GeminiResponse;
    } catch (err: any) {
      const errorMessage = err.message || "Failed to get crop recommendations";
      setError(errorMessage);
      toast.error("Error analyzing farm data", {
        description: errorMessage,
      });
      console.error("AI recommendation error:", err);
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
