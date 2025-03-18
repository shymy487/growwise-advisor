import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { useFarmData, FarmProfile } from "@/contexts/FarmDataContext";
import { useGeminiAI, CropRecommendation } from "@/hooks/useGeminiAI";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CropCard from "@/components/CropCard";
import LoadingSpinner from "@/components/LoadingSpinner";
import { ArrowLeft, FileDown, Share2, RefreshCw, PenLine } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

const MOCK_CROP_RECOMMENDATIONS: CropRecommendation[] = [
  {
    name: "Sample Crop 1",
    description: "This is a sample crop recommendation for demonstration purposes when the API is unavailable.",
    estimatedProfit: 1200,
    marketPrice: 4.5,
    score: 95,
    growthPeriod: "3-4 months",
    waterRequirements: "Medium, about 15-20 inches during growing season",
    soilCompatibility: ["Loamy", "Clay Loam"],
    isTopPick: true,
    maturityPeriod: "90-120 days",
    bestPlantingTime: "Spring to early Summer"
  },
  {
    name: "Sample Crop 2",
    description: "Another sample crop for demonstration. In normal conditions, the AI would analyze your specific farm data.",
    estimatedProfit: 950,
    marketPrice: 3.2,
    score: 85,
    growthPeriod: "2-3 months",
    waterRequirements: "Low to medium, drought resistant",
    soilCompatibility: ["Sandy Loam", "Loamy"],
    isTopPick: false,
    maturityPeriod: "60-80 days",
    bestPlantingTime: "Early to mid Spring"
  },
  {
    name: "Sample Crop 3",
    description: "Third example crop. The actual recommendations would be tailored to your location and conditions.",
    estimatedProfit: 1100,
    marketPrice: 5.0,
    score: 80,
    growthPeriod: "4-5 months",
    waterRequirements: "High, regular irrigation needed",
    soilCompatibility: ["Rich Loam", "Clay Loam"],
    isTopPick: false,
    maturityPeriod: "110-140 days",
    bestPlantingTime: "Late Spring"
  }
];

const Results = () => {
  const { isAuthenticated } = useAuth();
  const { farmProfiles, getFarmProfile, updateFarmProfile } = useFarmData();
  const { getCropRecommendations, loading: aiLoading, error } = useGeminiAI();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [farmProfile, setFarmProfile] = useState<FarmProfile | null>(null);
  const [recommendations, setRecommendations] = useState<CropRecommendation[]>([]);
  const [reasoning, setReasoning] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  const profileId = searchParams.get("profile");

  useEffect(() => {
    const fetchProfileAndRecommendations = async () => {
      setLoading(true);
      
      // Find the requested profile
      if (profileId) {
        const profile = getFarmProfile(profileId);
        if (profile) {
          setFarmProfile(profile);
          
          // Check if profile already has recommendations
          if (profile.recommendations && profile.recommendations.length > 0) {
            setRecommendations(profile.recommendations);
            setReasoning("Recommendations loaded from previous analysis.");
            setLoading(false);
            return;
          }
          
          // Get new recommendations
          setAnalyzing(true);
          try {
            const result = await getCropRecommendations({
              location: profile.location,
              landSize: profile.landSize,
              soilType: profile.soilType,
              waterAvailability: profile.waterAvailability,
              budget: profile.budget,
              farmingPriority: profile.farmingPriority,
              experience: profile.experience,
              previousCrop: profile.previousCrop,
              notes: profile.notes,
            });
            
            if (result && result.crops && result.crops.length > 0) {
              setRecommendations(result.crops);
              setReasoning(result.reasoning);
              
              // Save recommendations to profile
              await updateFarmProfile(profile.id, {
                recommendations: result.crops,
              });
            } else {
              // API returned empty or invalid result, use fallback
              toast.warning("Using sample recommendations", {
                description: "We're having trouble connecting to our AI service. Showing sample data instead.",
              });
              setRecommendations(MOCK_CROP_RECOMMENDATIONS);
              setReasoning("Sample data displayed due to AI service connection issues. Please try again later for personalized recommendations.");
            }
          } catch (err) {
            console.error("Failed to get recommendations:", err);
            toast.error("Failed to analyze farm data", {
              description: "Using sample recommendations instead. Please try again later.",
            });
            
            // Use fallback data
            setRecommendations(MOCK_CROP_RECOMMENDATIONS);
            setReasoning("Sample data displayed due to AI service connection issues. Please try again later for personalized recommendations.");
          } finally {
            setAnalyzing(false);
            setLoading(false);
          }
        } else {
          // Profile not found
          toast.error("Farm profile not found", {
            description: "The requested farm profile could not be found",
          });
          navigate("/dashboard");
        }
      } else {
        // No profile ID provided
        setLoading(false);
        toast.error("No farm profile selected", {
          description: "Please select a farm profile to view recommendations",
        });
        navigate("/dashboard");
      }
    };

    fetchProfileAndRecommendations();
  }, [profileId, getFarmProfile, getCropRecommendations, updateFarmProfile, navigate]);

  const handleRefreshAnalysis = async () => {
    if (!farmProfile) return;
    
    setAnalyzing(true);
    try {
      const result = await getCropRecommendations({
        location: farmProfile.location,
        landSize: farmProfile.landSize,
        soilType: farmProfile.soilType,
        waterAvailability: farmProfile.waterAvailability,
        budget: farmProfile.budget,
        farmingPriority: farmProfile.farmingPriority,
        experience: farmProfile.experience,
        previousCrop: farmProfile.previousCrop,
        notes: farmProfile.notes,
      });
      
      if (result && result.crops && result.crops.length > 0) {
        setRecommendations(result.crops);
        setReasoning(result.reasoning);
        
        // Save recommendations to profile
        await updateFarmProfile(farmProfile.id, {
          recommendations: result.crops,
        });
        
        toast.success("Analysis refreshed", {
          description: "Your crop recommendations have been updated",
        });
      } else {
        // API returned empty result, keep current recommendations if they exist
        toast.warning("Could not refresh recommendations", {
          description: "There was an issue connecting to our AI service. Your current recommendations remain unchanged.",
        });
      }
    } catch (err) {
      console.error("Failed to refresh recommendations:", err);
      toast.error("Failed to refresh analysis", {
        description: "Please try again later",
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDownloadReport = () => {
    if (!farmProfile || recommendations.length === 0) return;
    
    try {
      // Create report content
      const reportContent = `
Crop Recommendation Report
Farm: ${farmProfile.name}
Date: ${new Date().toLocaleDateString()}

FARM DETAILS
Location: ${farmProfile.location.name}
Land Size: ${farmProfile.landSize} acres
Soil Type: ${farmProfile.soilType}
Water Availability: ${farmProfile.waterAvailability} inches/season
Budget: $${farmProfile.budget}/acre

RECOMMENDED CROPS
${recommendations.map((crop, index) => `
${index + 1}. ${crop.name} ${crop.isTopPick ? '(Top Pick)' : ''}
   Score: ${crop.score}
   Estimated Profit: $${crop.estimatedProfit}/acre
   Market Price: $${crop.marketPrice}/unit
   Growth Period: ${crop.growthPeriod}
   Description: ${crop.description}
   Water Requirements: ${crop.waterRequirements}
   Soil Compatibility: ${crop.soilCompatibility.join(', ')}
`).join('')}

ANALYSIS SUMMARY
${reasoning}
      `;
      
      // Create and download file
      const blob = new Blob([reportContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `CropAdvisor_Report_${farmProfile.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success("Report downloaded", {
        description: "Your crop recommendation report has been downloaded",
      });
    } catch (err) {
      console.error("Failed to download report:", err);
      toast.error("Failed to download report", {
        description: "Please try again later",
      });
    }
  };

  const handleShareResults = () => {
    if (navigator.share && farmProfile) {
      navigator.share({
        title: `CropAdvisor Recommendations for ${farmProfile.name}`,
        text: `Check out my crop recommendations for ${farmProfile.name} from CropAdvisor!`,
        url: window.location.href,
      })
        .then(() => toast.success("Shared successfully"))
        .catch((error) => {
          console.error("Error sharing:", error);
          toast.error("Failed to share results");
        });
    } else {
      // Fallback for browsers that don't support navigator.share
      navigator.clipboard.writeText(window.location.href)
        .then(() => {
          toast.success("Link copied to clipboard", {
            description: "Share this link to show your crop recommendations",
          });
        })
        .catch(() => {
          toast.error("Failed to copy link");
        });
    }
  };

  if (loading || !farmProfile) {
    return (
      <>
        <Navbar authenticated={isAuthenticated} />
        <div className="min-h-screen flex items-center justify-center pt-16">
          <LoadingSpinner size="lg" text="Loading recommendations..." />
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar authenticated={isAuthenticated} />
      
      <main className="min-h-screen pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-8">
            <div className="flex items-center gap-2 text-muted-foreground mb-4 animate-fade-in">
              <Link to="/dashboard">
                <Button variant="ghost" size="sm" className="gap-1">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Dashboard
                </Button>
              </Link>
            </div>
            
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 animate-fade-in">
              <div>
                <h1 className="text-3xl font-bold">Your Crop Recommendations</h1>
                <p className="text-muted-foreground">
                  Based on your farm profile and current market conditions
                </p>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate(`/input?edit=${farmProfile.id}`)}
                >
                  <PenLine className="h-4 w-4 mr-2" />
                  Edit Inputs
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleRefreshAnalysis}
                  disabled={analyzing}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${analyzing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                
                <Button 
                  variant="default" 
                  size="sm"
                  className="bg-crop-primary hover:bg-crop-primary/90"
                  onClick={handleDownloadReport}
                  disabled={analyzing || recommendations.length === 0}
                >
                  <FileDown className="h-4 w-4 mr-2" />
                  Save Results
                </Button>
              </div>
            </div>
          </div>
          
          {/* Farm profile summary */}
          <div className="mb-8 animate-fade-in">
            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Location</div>
                    <div className="font-medium">{farmProfile.location.name}</div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-muted-foreground">Land Size</div>
                    <div className="font-medium">{farmProfile.landSize} acres</div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-muted-foreground">Soil Type</div>
                    <div className="font-medium">{farmProfile.soilType}</div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-muted-foreground">Water Availability</div>
                    <div className="font-medium">{farmProfile.waterAvailability} inches/season</div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-muted-foreground">Budget</div>
                    <div className="font-medium">${farmProfile.budget}/acre</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {analyzing ? (
            <div className="flex flex-col items-center justify-center py-16 animate-fade-in">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center"
              >
                <div className="mb-6">
                  <LoadingSpinner size="lg" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Analyzing Your Farm Data</h2>
                <p className="text-muted-foreground max-w-lg mx-auto">
                  Our AI is analyzing your inputs to generate personalized crop recommendations...
                </p>
              </motion.div>
            </div>
          ) : recommendations.length > 0 ? (
            <>
              <div className="mb-2 animate-fade-in">
                <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                  <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
                  </svg>
                  <span>
                    Our AI has analyzed your farm data and current market conditions to recommend the following crops
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {recommendations.map((crop, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <CropCard
                      crop={{
                        id: `crop-${index}`,
                        name: crop.name,
                        description: crop.description,
                        estimatedProfit: crop.estimatedProfit,
                        marketPrice: crop.marketPrice,
                        score: crop.score,
                        growthPeriod: crop.growthPeriod,
                        waterRequirements: crop.waterRequirements,
                        soilCompatibility: crop.soilCompatibility,
                        isTopPick: crop.isTopPick,
                      }}
                    />
                  </motion.div>
                ))}
              </div>
              
              <div className="animate-fade-in">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Analysis Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{reasoning}</p>
                  </CardContent>
                  <CardFooter className="flex justify-end">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleShareResults}
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      Share Results
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </>
          ) : (
            <div className="text-center py-16 animate-fade-in">
              <div className="max-w-md mx-auto">
                <h2 className="text-2xl font-bold mb-2">No Recommendations Available</h2>
                <p className="text-muted-foreground mb-6">
                  We couldn't find any crop recommendations for your farm profile. 
                  Please try refreshing the analysis or updating your farm details.
                </p>
                <Button onClick={handleRefreshAnalysis} disabled={analyzing}>
                  <RefreshCw className={`mr-2 h-4 w-4 ${analyzing ? 'animate-spin' : ''}`} />
                  Try Again
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </>
  );
};

export default Results;
