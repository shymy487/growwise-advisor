
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
  waterAvailability: string; // Now this will be a descriptive term not just a number
  waterAvailabilityInches?: number; // Calculated or provided inches
  budget: number;
  farmingPriority: "profit" | "balanced" | "sustainability";
  experience?: number;
  previousCrop?: string;
  notes?: string;
}

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
    return new Response(
      JSON.stringify({ 
        error: "GEMINI_API_KEY environment variable is not set" 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }

  try {
    // Parse farm data from request
    const farmData: FarmData = await req.json();
    
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
    
    // Construct the Gemini prompt with categorization request
    const prompt = `As an agricultural AI expert, analyze the following farm data and recommend crops categorized by type.
    
    Farm location: ${farmData.location.name}
    Coordinates: ${farmData.location.lat}, ${farmData.location.lng}
    Land size: ${farmData.landSize} acres
    Soil type: ${farmData.soilType}
    Water availability: ${waterInInches}
    Budget: $${farmData.budget} per acre
    Farming priority: ${farmData.farmingPriority}
    ${farmData.experience ? `Farming experience: ${farmData.experience} years` : ''}
    ${farmData.previousCrop ? `Previous crop: ${farmData.previousCrop}` : ''}
    ${farmData.notes ? `Additional notes: ${farmData.notes}` : ''}
    
    IMPORTANT: Your response MUST be a valid JSON object with the following structure:
    {
      "categories": [
        {
          "type": "Grains & Cereals",
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
          "type": "Fruits",
          "crops": [...]
        },
        {
          "type": "Cash Crops",
          "crops": [...]
        }
      ],
      "reasoning": "Brief explanation of the overall recommendation logic based on the farm data"
    }
    
    Ensure you include at least one crop in each category that's suitable for the farm conditions.
    If a category has no suitable crops, still include the category with an empty crops array.
    Make sure there is exactly ONE crop with isTopPick:true in EACH non-empty category.
    Ensure the sum of scores across all crops is reasonable (not too high).
    Consider climate at the given coordinates, soil compatibility, and water needs carefully.
    Do NOT include any text, explanations, or markdown outside of this JSON structure.`;
    
    console.log("Sending request to Gemini API...");
    
    // Call the Gemini API
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
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Gemini API error:", errorData);
      return new Response(
        JSON.stringify({ 
          error: `API request failed: ${response.status} ${response.statusText}`,
          details: errorData
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: response.status
        }
      );
    }
    
    const result = await response.json();
    console.log("Received response from Gemini API");
    
    try {
      const textContent = result.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!textContent) {
        throw new Error("Empty response from AI service");
      }
      
      // Extract JSON from response (in case there's other text)
      const jsonMatch = textContent.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("Failed to parse AI response as JSON");
      }
      
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
      
      // Return the processed response
      return new Response(
        JSON.stringify(parsedResponse),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (parseError) {
      console.error("Error parsing Gemini response:", parseError, result);
      return new Response(
        JSON.stringify({ 
          error: "Failed to parse crop recommendations",
          details: parseError.message,
          rawResponse: result.candidates?.[0]?.content?.parts?.[0]?.text || "No text content"
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500
        }
      );
    }
  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(
      JSON.stringify({ 
        error: err.message || "Internal server error"
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500
      }
    );
  }
});
