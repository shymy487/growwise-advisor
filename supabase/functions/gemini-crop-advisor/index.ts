
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import "https://deno.land/x/xhr@0.3.0/mod.ts";

// API key from environment variables
const API_KEY = Deno.env.get("GEMINI_API_KEY") || "";

// CORS headers to allow requests from any origin
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FarmData {
  location: {
    name: string;
    lat: number;
    lng: number;
  };
  landSize: number;
  soilType: string;
  waterAvailability: string;
  waterAvailabilityInches?: number;
  budget: number;
  farmingPriority: "profit" | "balanced" | "sustainability";
  experience?: number;
  previousCrop?: string;
  notes?: string;
}

interface ResponseCache {
  [key: string]: {
    data: any;
    timestamp: number;
  }
}

// Simple in-memory cache with 24 hour expiry
const cache: ResponseCache = {};
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: corsHeaders,
      status: 204 
    });
  }

  // Error if API key is missing
  if (!API_KEY) {
    console.error("GEMINI_API_KEY environment variable is not set");
    return new Response(
      JSON.stringify({ 
        error: "API configuration error. Please contact support." 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }

  try {
    // Parse farm data from request
    let farmData: FarmData;
    
    try {
      farmData = await req.json();
      console.log("Received farm data:", JSON.stringify(farmData));
    } catch (err) {
      console.error("Failed to parse request body:", err);
      return new Response(
        JSON.stringify({ 
          error: "Invalid request body. Please provide valid farm data." 
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400 
        }
      );
    }
    
    // Generate cache key from farm data
    const cacheKey = JSON.stringify(farmData);
    
    // Check cache for existing result
    const now = Date.now();
    if (cache[cacheKey] && (now - cache[cacheKey].timestamp < CACHE_TTL)) {
      console.log("Cache hit! Returning cached result");
      return new Response(
        JSON.stringify(cache[cacheKey].data),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Validate required fields
    if (!farmData.location || !farmData.soilType || !farmData.waterAvailability) {
      console.error("Invalid farm data: Missing required fields", farmData);
      return new Response(
        JSON.stringify({ 
          error: "Missing required farm data fields" 
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400 
        }
      );
    }
    
    // Convert water availability descriptions to approximate inches if needed
    let waterInInches = "";
    if (typeof farmData.waterAvailabilityInches === 'number') {
      waterInInches = `${farmData.waterAvailabilityInches} inches per season`;
    } else {
      // Convert descriptive terms to approximate inches
      switch(farmData.waterAvailability) {
        case "rainfed":
          waterInInches = "approximately 10-15 inches from rainfall per season";
          break;
        case "basic-irrigation":
          waterInInches = "approximately 15-25 inches (rainfall + basic irrigation) per season";
          break;
        case "full-irrigation":
          waterInInches = "approximately 25-40 inches (full irrigation system) per season";
          break;
        case "limited":
          waterInInches = "limited to approximately 5-10 inches per season";
          break;
        default:
          waterInInches = `${farmData.waterAvailability} (as provided by user)`;
      }
    }
    
    // Construct the Gemini prompt with categorization request and region-specific details
    const prompt = `You are CropAdvisor AI, an expert agricultural scientist specializing in crop recommendations and farm planning. Analyze the following farm data in detail and recommend crops categorized by type.
    
    === FARM DATA ===
    Location: ${farmData.location.name}
    Coordinates: ${farmData.location.lat}, ${farmData.location.lng}
    Land size: ${farmData.landSize} acres
    Soil type: ${farmData.soilType}
    Water availability: ${waterInInches}
    Budget: $${farmData.budget} per acre
    Farming priority: ${farmData.farmingPriority}
    ${farmData.experience ? `Farming experience: ${farmData.experience} years` : ''}
    ${farmData.previousCrop ? `Previous crop: ${farmData.previousCrop}` : ''}
    ${farmData.notes ? `Additional notes: ${farmData.notes}` : ''}
    
    === INSTRUCTIONS ===
    1. Consider the specific climate at the given coordinates, focusing on temperature ranges, growing season length, and rainfall patterns.
    2. Analyze local market conditions for the region based on the coordinates.
    3. Recommend crops that are specifically suited for the ${farmData.soilType} soil type.
    4. Consider the water availability of ${waterInInches} when selecting crops.
    5. Prioritize crops that align with the farmer's "${farmData.farmingPriority}" priority.
    6. Include both traditional and specialty crops with market potential.
    7. For beginner farmers, emphasize easier-to-grow crops.
    8. Provide at least 2-3 crop options in EACH category that are suitable for this specific farm.
    
    YOUR RESPONSE MUST be a valid JSON object with the following structure:
    {
      "categories": [
        {
          "type": "Grains & Cereals",
          "crops": [
            {
              "name": "Crop name",
              "description": "Detailed explanation of why this crop is suitable for THIS SPECIFIC FARM",
              "estimatedProfit": Number (profit per acre in USD),
              "marketPrice": Number (price per unit in USD),
              "score": Number (0-100 suitability score),
              "growthPeriod": "Duration in weeks/months",
              "waterRequirements": "Detailed water needs for this crop",
              "soilCompatibility": ["Compatible soil type 1", "Compatible soil type 2"],
              "maturityPeriod": "Time from planting to harvest (e.g., 90-120 days)",
              "bestPlantingTime": "Optimal planting season or months for this SPECIFIC LOCATION",
              "isTopPick": Boolean (true only for the top crop in this category)
            }
          ]
        },
        {
          "type": "Legumes & Pulses",
          "crops": [...]
        },
        {
          "type": "Vegetables",
          "crops": [...]
        },
        {
          "type": "Root Crops & Tubers",
          "crops": [...]
        },
        {
          "type": "Fruits & Berries",
          "crops": [...]
        },
        {
          "type": "Oil & Fiber Crops",
          "crops": [...]
        },
        {
          "type": "Specialty & High-Value Crops",
          "crops": [...]
        }
      ],
      "reasoning": "Detailed explanation of the overall recommendation logic based on THIS SPECIFIC FARM's data"
    }
    
    Ensure you include at least one crop in each category that's suitable for the farm conditions.
    Make the descriptions and reasoning SPECIFIC to this farm, not generic.
    If a category has no suitable crops, still include the category with an empty crops array.
    Make sure there is exactly ONE crop with isTopPick:true in EACH non-empty category.
    Do NOT include any text, explanations, or markdown outside of this JSON structure.`;
    
    console.log("Sending request to Gemini API...");
    
    // Call the Gemini API with timeout and retry
    let attemptCount = 0;
    const maxAttempts = 3;
    let lastError = null;
    
    while (attemptCount < maxAttempts) {
      try {
        // Create an AbortController with a timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 second timeout
        
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
                      text: prompt
                    }
                  ]
                }
              ],
              generationConfig: {
                temperature: 0.2,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 4096,
              },
            }),
            signal: controller.signal
          }
        );
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const errorData = await response.text();
          console.error(`Gemini API error (${response.status}):`, errorData);
          throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log("Received response from Gemini API");
        
        // Get text content from the response
        const textContent = result.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!textContent) {
          throw new Error("Empty response from AI service");
        }
        
        // Extract JSON from response (in case there's other text)
        const jsonMatch = textContent.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error("Failed to parse AI response as JSON");
        }
        
        try {
          const parsedResponse = JSON.parse(jsonMatch[0]);
          
          // Validate the response structure
          if (!parsedResponse.categories || !Array.isArray(parsedResponse.categories)) {
            throw new Error("Invalid response format - missing categories array");
          }
          
          // Process each category to ensure it has the right structure
          parsedResponse.categories = parsedResponse.categories.map(category => {
            if (!category.crops) category.crops = [];
            
            // Ensure only one top pick per category
            let hasTopPick = false;
            category.crops = category.crops.map(crop => {
              if (crop.isTopPick) {
                if (hasTopPick) {
                  crop.isTopPick = false;
                } else {
                  hasTopPick = true;
                }
              }
              return crop;
            });
            
            // If no top pick and there are crops, set the highest scoring one
            if (!hasTopPick && category.crops.length > 0) {
              const highestScoringCrop = category.crops.reduce(
                (prev, current) => (prev.score > current.score) ? prev : current
              );
              highestScoringCrop.isTopPick = true;
            }
            
            return category;
          });
          
          // Cache the processed response
          cache[cacheKey] = {
            data: parsedResponse,
            timestamp: Date.now()
          };
          
          // Return the processed response
          console.log("Successfully processed crop recommendations");
          return new Response(
            JSON.stringify(parsedResponse),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        } catch (parseError) {
          console.error("Error parsing Gemini response:", parseError);
          // This could be a JSON parsing error, so let's retry
          throw parseError;
        }
      } catch (attempt_error) {
        lastError = attempt_error;
        attemptCount++;
        console.error(`Attempt ${attemptCount} failed:`, attempt_error);
        
        if (attemptCount < maxAttempts) {
          // Wait with exponential backoff before retrying
          const delay = Math.pow(2, attemptCount) * 1000;
          console.log(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    // If we get here, all attempts failed
    console.error("All attempts failed, returning fallback response");
    
    // Return fallback data as a last resort
    return new Response(
      JSON.stringify({
        categories: [
          {
            type: "Grains & Cereals",
            crops: [
              {
                name: "Wheat (Fallback)",
                description: "This is fallback data due to API issues. We recommend trying again later for accurate recommendations.",
                estimatedProfit: 800,
                marketPrice: 7.5,
                score: 75,
                growthPeriod: "3-4 months",
                waterRequirements: "Medium",
                soilCompatibility: ["Loamy", "Clay-loam"],
                isTopPick: true,
                maturityPeriod: "110-130 days",
                bestPlantingTime: "Early Spring"
              }
            ]
          },
          {
            type: "Vegetables",
            crops: [
              {
                name: "Tomatoes (Fallback)",
                description: "This is fallback data due to API issues. We recommend trying again later for accurate recommendations.",
                estimatedProfit: 1200,
                marketPrice: 3.5,
                score: 80,
                growthPeriod: "2-3 months",
                waterRequirements: "High",
                soilCompatibility: ["Sandy loam", "Loamy"],
                isTopPick: true,
                maturityPeriod: "70-85 days",
                bestPlantingTime: "After last frost"
              }
            ]
          },
          {
            type: "Legumes & Pulses",
            crops: [
              {
                name: "Soybeans (Fallback)",
                description: "This is fallback data due to API issues. We recommend trying again later for accurate recommendations.",
                estimatedProfit: 950,
                marketPrice: 14.25,
                score: 85,
                growthPeriod: "3-5 months",
                waterRequirements: "Medium",
                soilCompatibility: ["Sandy", "Loamy"],
                isTopPick: true,
                maturityPeriod: "100-120 days",
                bestPlantingTime: "Late Spring"
              }
            ]
          }
        ],
        reasoning: "This is fallback data due to API connection issues. Please try again later for personalized recommendations based on your farm data."
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(
      JSON.stringify({ 
        error: err.message || "Internal server error",
        suggestion: "Please try again or contact support if the issue persists."
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500
      }
    );
  }
});
