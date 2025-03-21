
import { useEffect, useState, useRef, useCallback } from "react";
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
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { useFarmData, FarmProfile } from "@/contexts/FarmDataContext";
import { useGeminiAI, CropRecommendation, CropCategory } from "@/hooks/useGeminiAI";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CropCard from "@/components/CropCard";
import LoadingSpinner from "@/components/LoadingSpinner";
import { 
  ArrowLeft, 
  FileDown, 
  Share2, 
  RefreshCw, 
  PenLine,
  BookmarkPlus,
  Bookmark,
  Download,
  AlertTriangle
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

const Results = () => {
  const { isAuthenticated } = useAuth();
  const { farmProfiles, getFarmProfile, updateFarmProfile } = useFarmData();
  const { getCropRecommendations, loading: aiLoading, error } = useGeminiAI();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [farmProfile, setFarmProfile] = useState<FarmProfile | null>(null);
  const [cropCategories, setCropCategories] = useState<CropCategory[]>([]);
  const [reasoning, setReasoning] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [hasError, setHasError] = useState(false);
  
  const isMountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  const profileId = searchParams.get("profile");

  // Setup mount/unmount cleanup
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const fetchProfileAndRecommendations = async () => {
      if (!isMountedRef.current) return;
      
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      abortControllerRef.current = new AbortController();
      
      if (isMountedRef.current) {
        setLoading(true);
        setHasError(false);
      }
      
      if (profileId) {
        const profile = getFarmProfile(profileId);
        if (profile) {
          if (isMountedRef.current) {
            setFarmProfile(profile);
          }
          
          if (profile.categories && profile.categories.length > 0) {
            if (isMountedRef.current) {
              setCropCategories(profile.categories);
              setReasoning(profile.reasoning || "Recommendations loaded from previous analysis.");
              if (profile.categories.length > 0) {
                setActiveCategory(profile.categories[0].type);
              }
              setSaved(true);
              setLoading(false);
            }
            return;
          }
          
          if (isMountedRef.current) {
            setAnalyzing(true);
          }
          
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
            
            if (!isMountedRef.current) return;
            
            if (result && result.categories && result.categories.length > 0) {
              setCropCategories(result.categories);
              setReasoning(result.reasoning);
              setActiveCategory(result.categories[0].type);
              setSaved(false);
            } else {
              setHasError(true);
              if (isMountedRef.current) {
                toast.warning("Failed to get recommendations", {
                  description: "We're having trouble connecting to our AI service. Please try again later.",
                });
              }
            }
          } catch (err) {
            if (!isMountedRef.current) return;
            
            console.error("Failed to get recommendations:", err);
            setHasError(true);
            if (isMountedRef.current) {
              toast.error("Failed to analyze farm data", {
                description: "Please try again later.",
              });
            }
          } finally {
            if (isMountedRef.current) {
              setAnalyzing(false);
              setLoading(false);
            }
          }
        } else {
          if (isMountedRef.current) {
            setLoading(false);
            setHasError(true);
            toast.error("Farm profile not found", {
              description: "The requested farm profile could not be found",
            });
          }
          navigate("/dashboard");
        }
      } else {
        if (isMountedRef.current) {
          setLoading(false);
          setHasError(true);
          toast.error("No farm profile selected", {
            description: "Please select a farm profile to view recommendations",
          });
        }
        navigate("/dashboard");
      }
    };

    fetchProfileAndRecommendations();
  }, [profileId, getFarmProfile, getCropRecommendations, updateFarmProfile, navigate]);

  const handleRefreshAnalysis = async () => {
    if (!farmProfile || analyzing || !isMountedRef.current) return;
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    
    if (isMountedRef.current) {
      setAnalyzing(true);
      setHasError(false);
    }
    
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
      
      if (!isMountedRef.current) return;
      
      if (result && result.categories && result.categories.length > 0) {
        setCropCategories(result.categories);
        setReasoning(result.reasoning);
        setActiveCategory(result.categories[0].type);
        setSaved(false);
        
        toast.success("Analysis refreshed", {
          description: "Your crop recommendations have been updated",
        });
      } else {
        setHasError(true);
        if (isMountedRef.current) {
          toast.warning("Could not refresh recommendations", {
            description: "There was an issue connecting to our AI service. Your current recommendations remain unchanged.",
          });
        }
      }
    } catch (err) {
      if (!isMountedRef.current) return;
      
      console.error("Failed to refresh recommendations:", err);
      setHasError(true);
      toast.error("Failed to refresh analysis", {
        description: "Please try again later",
      });
    } finally {
      if (isMountedRef.current) {
        setAnalyzing(false);
      }
    }
  };

  const handleSaveToProfile = async () => {
    if (!farmProfile || cropCategories.length === 0 || !isMountedRef.current) return;
    
    try {
      await updateFarmProfile(farmProfile.id, {
        categories: cropCategories,
        reasoning: reasoning,
      } as Partial<FarmProfile>);
      
      if (isMountedRef.current) {
        setSaved(true);
        
        toast.success("Recommendations saved", {
          description: "Your crop recommendations have been saved to your farm profile",
        });
      }
    } catch (err) {
      console.error("Failed to save recommendations:", err);
      if (isMountedRef.current) {
        toast.error("Failed to save recommendations", {
          description: "Please try again later",
        });
      }
    }
  };

  const handleDownloadReport = useCallback(() => {
    if (!farmProfile || cropCategories.length === 0 || !isMountedRef.current) return;
    
    try {
      const reportContent = `
Crop Recommendation Report
Farm: ${farmProfile.name}
Date: ${new Date().toLocaleDateString()}

FARM DETAILS
Location: ${farmProfile.location.name}
Land Size: ${farmProfile.landSize} acres
Soil Type: ${farmProfile.soilType}
Water Availability: ${farmProfile.waterAvailability}
Budget: $${farmProfile.budget}/acre

RECOMMENDED CROPS BY CATEGORY
${cropCategories.map((category) => `
CATEGORY: ${category.type}
${category.crops.map((crop, index) => `
${index + 1}. ${crop.name} ${crop.isTopPick ? '(Top Pick)' : ''}
   Score: ${crop.score}
   Estimated Profit: $${crop.estimatedProfit}/acre
   Market Price: $${crop.marketPrice}/unit
   Growth Period: ${crop.growthPeriod}
   Maturity Period: ${crop.maturityPeriod}
   Best Planting Time: ${crop.bestPlantingTime || 'Not specified'}
   Description: ${crop.description}
   Water Requirements: ${crop.waterRequirements}
   Soil Compatibility: ${crop.soilCompatibility.join(', ')}
`).join('')}
`).join('')}

ANALYSIS SUMMARY
${reasoning}
      `;
      
      const blob = new Blob([reportContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `CropAdvisor_Report_${farmProfile.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      if (isMountedRef.current) {
        toast.success("Report downloaded", {
          description: "Your crop recommendation report has been downloaded",
        });
      }
    } catch (err) {
      console.error("Failed to download report:", err);
      if (isMountedRef.current) {
        toast.error("Failed to download report", {
          description: "Please try again later",
        });
      }
    }
  }, [farmProfile, cropCategories, reasoning, isMountedRef]);

  const handleShareResults = useCallback(() => {
    if (!farmProfile || !isMountedRef.current) return;
    
    try {
      navigator.clipboard.writeText(window.location.href)
        .then(() => {
          if (isMountedRef.current) {
            toast.success("Link copied to clipboard", {
              description: "Share this link to show your crop recommendations",
            });
          }
        })
        .catch((err) => {
          console.error("Failed to copy link:", err);
          if (isMountedRef.current) {
            toast.error("Failed to copy link");
          }
        });
    } catch (err) {
      console.error("Error sharing:", err);
      if (isMountedRef.current) {
        toast.error("Failed to share results");
      }
    }
  }, [farmProfile, isMountedRef]);

  const activeCategoryData = cropCategories.find(cat => cat.type === activeCategory);
  const activeCrops = activeCategoryData?.crops || [];

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
                
                {!saved && cropCategories.length > 0 && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="bg-crop-accent/30 hover:bg-crop-accent"
                    onClick={handleSaveToProfile}
                  >
                    <BookmarkPlus className="h-4 w-4 mr-2" />
                    Save Analysis
                  </Button>
                )}
                
                <Button 
                  variant="default" 
                  size="sm"
                  className="bg-crop-primary hover:bg-crop-primary/90"
                  onClick={handleDownloadReport}
                  disabled={analyzing || cropCategories.length === 0}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </div>
          
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
                    <div className="font-medium">{
                      farmProfile.waterAvailability === "rainfed" ? "Rain-fed Farming" :
                      farmProfile.waterAvailability === "basic-irrigation" ? "Basic Irrigation" :
                      farmProfile.waterAvailability === "full-irrigation" ? "Full Irrigation" :
                      farmProfile.waterAvailability === "limited" ? "Limited Water" :
                      `${farmProfile.waterAvailability}`
                    }</div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-muted-foreground">Budget</div>
                    <div className="font-medium">${farmProfile.budget}/acre</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {hasError && (
            <Alert variant="destructive" className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error loading recommendations</AlertTitle>
              <AlertDescription>
                We encountered an issue while loading your crop recommendations. Please try refreshing the analysis or try again later.
              </AlertDescription>
            </Alert>
          )}
          
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
          ) : cropCategories.length > 0 ? (
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
              
              <div className="mb-6 animate-fade-in overflow-x-auto">
                <div className="flex space-x-2 min-w-max pb-2">
                  {cropCategories.map((category, index) => (
                    <Button
                      key={index}
                      variant={activeCategory === category.type ? "default" : "outline"}
                      className={activeCategory === category.type ? "bg-crop-primary hover:bg-crop-primary/90" : ""}
                      size="sm"
                      onClick={() => setActiveCategory(category.type)}
                    >
                      {category.type}
                      {category.crops.length > 0 && (
                        <span className="ml-1.5 rounded-full bg-white/20 px-1.5 text-xs">
                          {category.crops.length}
                        </span>
                      )}
                    </Button>
                  ))}
                </div>
              </div>
              
              {activeCrops.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {activeCrops.map((crop, index) => (
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
                          maturityPeriod: crop.maturityPeriod,
                          bestPlantingTime: crop.bestPlantingTime,
                          imageUrl: crop.imageUrl,
                        }}
                      />
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-muted/30 rounded-lg mb-8">
                  <p className="text-muted-foreground">No crops found in this category for your farm conditions.</p>
                </div>
              )}
              
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
