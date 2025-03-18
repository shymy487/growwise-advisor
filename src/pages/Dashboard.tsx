
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useFarmData, FarmProfile } from "@/contexts/FarmDataContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AnalysisCard from "@/components/AnalysisCard";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Plus, Leaf, MapPin, CalendarDays, Droplets, DollarSign, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const Dashboard = () => {
  const { isAuthenticated, user } = useAuth();
  const { farmProfiles, loading } = useFarmData();
  const [activeTab, setActiveTab] = useState("farm-profiles");

  const getRandomProfit = () => Math.floor(Math.random() * 4000) + 1000;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
          <p className="text-muted-foreground mb-6">You need to sign in to view this page.</p>
          <Link to="/signin">
            <Button>Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <>
        <Navbar authenticated={isAuthenticated} />
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner size="lg" text="Loading your dashboard..." />
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar authenticated={isAuthenticated} />
      
      <main className="min-h-screen pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold animate-fade-in">Your Farm Dashboard</h1>
              <p className="text-muted-foreground animate-fade-in">
                Track your farm data and access crop recommendations
              </p>
            </div>
            
            <Link to="/input">
              <Button className="bg-crop-primary hover:bg-crop-primary/90 animate-fade-in">
                <Plus className="mr-2 h-4 w-4" />
                New Crop Analysis
              </Button>
            </Link>
          </div>
          
          <Tabs defaultValue="farm-profiles" className="w-full" onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-5 mb-8">
              <TabsTrigger value="farm-profiles">Farm Profiles</TabsTrigger>
              <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
              <TabsTrigger value="resource-calculator">Resource Calculator</TabsTrigger>
              <TabsTrigger value="crop-calendar">Crop Calendar</TabsTrigger>
              <TabsTrigger value="historical-analysis">Historical Analysis</TabsTrigger>
            </TabsList>
            
            {/* Farm Profiles Tab */}
            <TabsContent value="farm-profiles" className="animate-fade-in">
              {farmProfiles.length === 0 ? (
                <Card className="border-dashed border-2 border-muted p-8">
                  <div className="text-center">
                    <Leaf className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Farm Profiles Yet</h3>
                    <p className="text-muted-foreground mb-6">
                      Create your first farm profile to get crop recommendations.
                    </p>
                    <Link to="/input">
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Farm Profile
                      </Button>
                    </Link>
                  </div>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {farmProfiles.map((profile) => (
                    <ProfileCard key={profile.id} profile={profile} />
                  ))}
                </div>
              )}
            </TabsContent>
            
            {/* Recommendations Tab */}
            <TabsContent value="recommendations" className="animate-fade-in">
              {farmProfiles.length === 0 ? (
                <Card className="border-dashed border-2 border-muted p-8">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Recommendations Yet</h3>
                    <p className="text-muted-foreground mb-6">
                      Create a farm profile first to get personalized crop recommendations.
                    </p>
                    <Link to="/input">
                      <Button>Get Started</Button>
                    </Link>
                  </div>
                </Card>
              ) : (
                <RecommendationsContent farmProfiles={farmProfiles} />
              )}
            </TabsContent>
            
            {/* Resource Calculator Tab */}
            <TabsContent value="resource-calculator" className="animate-fade-in">
              <Card className="border-dashed border-2 border-muted p-8">
                <div className="text-center">
                  <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Resource Calculator</h3>
                  <p className="text-muted-foreground mb-6">
                    This feature will be available soon. Stay tuned!
                  </p>
                </div>
              </Card>
            </TabsContent>
            
            {/* Crop Calendar Tab */}
            <TabsContent value="crop-calendar" className="animate-fade-in">
              <Card className="border-dashed border-2 border-muted p-8">
                <div className="text-center">
                  <CalendarDays className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Crop Calendar</h3>
                  <p className="text-muted-foreground mb-6">
                    This feature will be available soon. Stay tuned!
                  </p>
                </div>
              </Card>
            </TabsContent>
            
            {/* Historical Analysis Tab */}
            <TabsContent value="historical-analysis" className="animate-fade-in">
              {farmProfiles.length === 0 ? (
                <Card className="border-dashed border-2 border-muted p-8">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Historical Data Yet</h3>
                    <p className="text-muted-foreground mb-6">
                      Create farm profiles and get recommendations to build historical data.
                    </p>
                    <Link to="/input">
                      <Button>Get Started</Button>
                    </Link>
                  </div>
                </Card>
              ) : (
                <HistoricalAnalysisContent farmProfiles={farmProfiles} />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <Footer />
    </>
  );
};

// Profile Card Component
const ProfileCard = ({ profile }: { profile: FarmProfile }) => {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <Card className="overflow-hidden transition-all duration-300 hover:border-crop-primary/50 hover:shadow-sm h-full">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-crop-primary" />
              <CardTitle className="text-lg">{profile.name}</CardTitle>
            </div>
            <CardDescription>Created {formatDate(profile.createdAt)}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-0">
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          <div className="flex items-center gap-1.5">
            <Leaf className="h-4 w-4 text-crop-primary/70" />
            <span className="text-sm text-muted-foreground">Soil:</span>
            <span className="text-sm font-medium">{profile.soilType}</span>
          </div>
          
          <div className="flex items-center gap-1.5">
            <Droplets className="h-4 w-4 text-crop-primary/70" />
            <span className="text-sm text-muted-foreground">Water:</span>
            <span className="text-sm font-medium">{profile.waterAvailability} in</span>
          </div>
          
          <div className="flex items-center gap-1.5">
            <DollarSign className="h-4 w-4 text-crop-primary/70" />
            <span className="text-sm text-muted-foreground">Budget:</span>
            <span className="text-sm font-medium">${profile.budget}</span>
          </div>
          
          <div className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-crop-primary/70" />
            <span className="text-sm text-muted-foreground">Size:</span>
            <span className="text-sm font-medium">{profile.landSize} ac</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-4">
        <Link to={`/results?profile=${profile.id}`} className="w-full">
          <Button variant="outline" className="w-full">
            View Recommendations
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};

// Recommendations Content
const RecommendationsContent = ({ farmProfiles }: { farmProfiles: FarmProfile[] }) => {
  // Mock data for recommendations
  const mockCrops = [
    { name: "Green Gram (Mung Beans)", score: 90, profit: 2400 },
    { name: "Tomatoes", score: 85, profit: 3000 },
    { name: "Spinach", score: 80, profit: 1800 },
    { name: "Kale", score: 75, profit: 2200 },
    { name: "Carrots", score: 70, profit: 1600 },
  ];

  return (
    <div className="grid grid-cols-1 gap-6">
      {farmProfiles.slice(0, 2).map((profile, index) => (
        <Card key={profile.id} className="overflow-hidden">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl">{profile.name}</CardTitle>
                <CardDescription>Created {new Date(profile.createdAt).toLocaleDateString()}</CardDescription>
              </div>
              <div className="bg-crop-accent text-crop-primary text-xs px-2 py-1 rounded-full">
                {mockCrops.length} crops
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockCrops.slice(0, 2).map((crop, idx) => (
                <div 
                  key={idx} 
                  className={cn(
                    "p-4 border rounded-lg",
                    idx === 0 ? "border-crop-primary/20 bg-crop-accent/20" : ""
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Leaf className="h-5 w-5 text-crop-primary shrink-0" />
                      <h3 className="font-medium text-lg">{crop.name}</h3>
                    </div>
                    {idx === 0 && (
                      <div className="bg-crop-primary text-white text-xs px-2 py-1 rounded-full">
                        Top Pick
                      </div>
                    )}
                  </div>
                  
                  <p className="mt-2 text-sm text-muted-foreground">
                    {crop.name} is {idx === 0 ? "well-suited" : "suitable"} for {profile.name}'s 
                    climate and {profile.soilType.toLowerCase()} soil.
                  </p>
                  
                  <div className="mt-3 flex justify-between items-center">
                    <div className="flex items-center gap-1.5">
                      <DollarSign className="h-4 w-4 text-crop-primary/70" />
                      <span className="text-sm text-muted-foreground">Est. Profit:</span>
                      <span className="text-sm font-medium">${crop.profit}/acre</span>
                    </div>
                    
                    <div className="flex items-center gap-1.5">
                      <BarChart3 className="h-4 w-4 text-crop-primary/70" />
                      <span className="text-sm text-muted-foreground">Score:</span>
                      <span className="text-sm font-medium">{crop.score}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Link to={`/results?profile=${profile.id}`} className="w-full">
              <Button variant="outline" className="w-full">
                View Full Analysis
              </Button>
            </Link>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

// Historical Analysis Content
const HistoricalAnalysisContent = ({ farmProfiles }: { farmProfiles: FarmProfile[] }) => {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold mb-4">Historical Analysis Dashboard</h2>
        <p className="text-muted-foreground mb-6">
          Track performance trends and insights from your crop recommendations
        </p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <AnalysisCard
          title="Total Analyses"
          value={farmProfiles.length}
          subtitle="All time"
          icon={<BarChart3 className="h-4 w-4" />}
        />
        
        <AnalysisCard
          title="Avg. Profit Estimate"
          value="$1,300"
          subtitle="Per acre"
          icon={<DollarSign className="h-4 w-4" />}
        />
        
        <AnalysisCard
          title="Top Crop (Profit)"
          value="Green Gram"
          subtitle="Highest est. profit"
          icon={<Leaf className="h-4 w-4" />}
        />
        
        <AnalysisCard
          title="Most Recommended"
          value="Green Gram"
          subtitle="Frequency in results"
          icon={<Leaf className="h-4 w-4" />}
        />
        
        <AnalysisCard
          title="Crop Diversity"
          value="7"
          subtitle="Unique crop types"
          icon={<Leaf className="h-4 w-4" />}
        />
        
        <AnalysisCard
          title="Analysis Timespan"
          value="All time"
          subtitle="Data range"
          icon={<CalendarDays className="h-4 w-4" />}
        />
      </div>
      
      <div className="mt-8">
        <Tabs defaultValue="profit-analysis">
          <TabsList className="mb-6">
            <TabsTrigger value="profit-analysis">Profit Analysis</TabsTrigger>
            <TabsTrigger value="crop-performance">Crop Performance</TabsTrigger>
            <TabsTrigger value="profit-trends">Profit Trends</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profit-analysis">
            <Card>
              <CardHeader>
                <CardTitle>Estimated Profit by Crop</CardTitle>
                <CardDescription>
                  Compare profit estimates across different crop types
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <p>Chart will be displayed here</p>
                  <p className="text-sm">Create more farm profiles to see detailed analysis</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="crop-performance">
            <Card>
              <CardHeader>
                <CardTitle>Crop Performance Analysis</CardTitle>
                <CardDescription>
                  Compare key metrics across different crops
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <p>Chart will be displayed here</p>
                  <p className="text-sm">Create more farm profiles to see detailed analysis</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="profit-trends">
            <Card>
              <CardHeader>
                <CardTitle>Profit Trends Over Time</CardTitle>
                <CardDescription>
                  Track how estimated crop profits change over time
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <p>Chart will be displayed here</p>
                  <p className="text-sm">Create more farm profiles to see detailed analysis</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
