
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
  const MAX_RETRIES = 2; // Reduced retries since we also have retries in the Edge Function

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
      
      // Set up timeout for the entire operation
      const timeoutPromise = new Promise<null>((_, reject) => {
        setTimeout(() => reject(new Error("Request timed out. Please try again.")), 30000);
      });
      
      try {
        // Use Promise.race to implement timeout without using AbortController
        const resultPromise = supabase.functions.invoke('gemini-crop-advisor', {
          body: farmData,
        });
        
        const result = await Promise.race([resultPromise, timeoutPromise]);
        const { data, error } = result || { data: null, error: new Error("Failed to get response") };
        
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
      } catch (fetchError: any) {
        // Handle timeout or other fetch errors
        if (fetchError.name === 'AbortError' || fetchError.message.includes('timed out')) {
          throw new Error("Request timed out. Please try again.");
        }
        throw fetchError;
      }
    } catch (err: any) {
      const errorMessage = err.message || "Failed to get crop recommendations";
      setError(errorMessage);
      
      // Customize error message based on error type
      let description = "Please try again or check your network connection.";
      if (errorMessage.includes("timed out")) {
        description = "The server took too long to respond. Please try again.";
      } else if (errorMessage.includes("network") || errorMessage.includes("connection")) {
        description = "Please check your internet connection and try again.";
      } else if (errorMessage.includes("API")) {
        description = "There was an issue with our AI service. We're working to fix it.";
      }
      
      toast.error("Error analyzing farm data", {
        description: description,
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
