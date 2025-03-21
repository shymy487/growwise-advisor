
import { useState, useEffect, useRef } from "react";
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
  imageUrl?: string;
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
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);
  const MAX_RETRIES = 2; // Reduced retries since we also have retries in the Edge Function

  // Create a cache for responses to avoid repeated API calls
  const responseCache = useRef(new Map<string, GeminiResponse>());

  // Cleanup function for aborting ongoing requests when component unmounts
  useEffect(() => {
    // Set isMounted flag to true when the component mounts
    isMountedRef.current = true;
    
    return () => {
      // Set isMounted flag to false when the component unmounts
      isMountedRef.current = false;
      
      // Abort any ongoing requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);

  const getCropRecommendations = async (farmData: FarmData): Promise<GeminiResponse | null> => {
    // Don't proceed if the component is unmounted
    if (!isMountedRef.current) return null;
    
    // Only set loading state if the component is still mounted
    if (isMountedRef.current) {
      setLoading(true);
      setError(null);
    }

    // Abort any ongoing requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create a new abort controller for this request
    abortControllerRef.current = new AbortController();

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
      
      // Generate a cache key from the farm data
      const cacheKey = JSON.stringify(farmData);
      
      // Check if we have a cached response
      if (responseCache.current.has(cacheKey)) {
        console.log("Using cached response");
        if (isMountedRef.current) {
          setLoading(false);
        }
        return responseCache.current.get(cacheKey)!;
      }
      
      let toastId: string | number = '';
      
      // Only show toast if component is mounted
      if (isMountedRef.current) {
        // Set up a proper user notification that analysis is in progress
        toastId = toast.loading("Analyzing farm data...", {
          description: "Our AI is analyzing your farm conditions. This may take up to 30 seconds.",
        });
      }
      
      try {
        // Use supabase functions invoke without the abort signal
        // The signal property is not part of FunctionInvokeOptions
        const result = await supabase.functions.invoke('gemini-crop-advisor', {
          body: farmData,
        });
        
        // Set up a timeout to handle stuck requests
        const timeoutId = setTimeout(() => {
          if (abortControllerRef.current && isMountedRef.current) {
            abortControllerRef.current.abort();
            toast.dismiss(toastId);
            toast.error("Request timed out", {
              description: "The analysis is taking too long. Please try again.",
            });
            setError("Request timed out");
            setLoading(false);
          }
        }, 30000); // 30 second timeout
        
        // Only update UI if component is still mounted
        if (isMountedRef.current) {
          // Update or dismiss the loading toast
          toast.dismiss(toastId);
        }
        
        // Clear the timeout
        clearTimeout(timeoutId);
        
        const { data, error } = result || { data: null, error: new Error("Failed to get response") };
        
        if (error) {
          console.error("Supabase Edge Function error:", error);
          
          if (retryCount < MAX_RETRIES && isMountedRef.current) {
            setRetryCount(prev => prev + 1);
            const delay = Math.pow(2, retryCount) * 1000;
            toast.warning("Retrying analysis...", {
              description: `The server is busy. Retrying in ${delay/1000} seconds.`,
            });
            await new Promise(resolve => setTimeout(resolve, delay));
            // Only retry if we haven't been aborted and component is still mounted
            if (!abortControllerRef.current?.signal.aborted && isMountedRef.current) {
              return getCropRecommendations(farmData);
            }
          }
          
          throw new Error(`Failed to analyze farm data: ${error.message}`);
        }
        
        // Only update state if component is still mounted
        if (isMountedRef.current) {
          // Reset retry count on success
          setRetryCount(0);
        }
        
        console.log("Edge function response:", data);
        
        // Validate the response
        if (!data.categories || !Array.isArray(data.categories)) {
          throw new Error("Invalid response format from server");
        }
        
        // Cache the response for future use
        responseCache.current.set(cacheKey, data as GeminiResponse);
        
        // Only show toast if component is still mounted
        if (isMountedRef.current) {
          toast.success("Analysis complete", {
            description: "We've generated crop recommendations based on your farm data.",
          });
        }
        
        return data as GeminiResponse;
      } catch (fetchError: any) {
        // Only update UI if component is still mounted
        if (isMountedRef.current) {
          // Dismiss the loading toast if still active
          toast.dismiss(toastId);
        }
        
        // If aborted, it was intentional, so don't show an error
        if (fetchError.name === 'AbortError' || abortControllerRef.current?.signal.aborted) {
          console.log('Request was aborted');
          return null;
        }
        
        // Handle timeout or other fetch errors
        if (fetchError.message.includes('timed out')) {
          throw new Error("Request timed out. Please try again.");
        }
        throw fetchError;
      }
    } catch (err: any) {
      // Skip error messages if it was just aborted or component unmounted
      if (abortControllerRef.current?.signal.aborted || !isMountedRef.current) {
        // Only update state if component is still mounted
        if (isMountedRef.current) {
          setLoading(false);
        }
        return null;
      }
      
      // Only update state if component is still mounted
      if (isMountedRef.current) {
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
      }
      
      console.error("AI recommendation error:", err);
      return null;
    } finally {
      // Only update state if component is still mounted and not aborted
      if (isMountedRef.current && !abortControllerRef.current?.signal.aborted) {
        setLoading(false);
      }
    }
  };

  return {
    getCropRecommendations,
    loading,
    error,
  };
};
