
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useFarmData, NewFarmProfile, FarmProfile } from "@/contexts/FarmDataContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LocationSearch from "@/components/LocationSearch";
import SoilTypeSelector from "@/components/SoilTypeSelector";
import LoadingSpinner from "@/components/LoadingSpinner";
import { MapPin, Leaf, Droplets, Calculator, DollarSign, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

// Form schema with required fields matching NewFarmProfile
const formSchema = z.object({
  name: z.string().min(2, { message: "Farm name must be at least 2 characters" }),
  location: z.object({
    name: z.string().min(3, { message: "Location is required" }),
    lat: z.number(),
    lng: z.number(),
  }),
  landSize: z.coerce.number().min(0.1, { message: "Land size must be greater than 0.1 acres" }),
  soilType: z.string().min(1, { message: "Please select a soil type" }),
  waterAvailability: z.number().min(0, { message: "Water availability must be 0 or greater" }),
  budget: z.coerce.number().min(10, { message: "Budget must be at least $10" }),
  farmingPriority: z.enum(["profit", "balanced", "sustainability"]),
  experience: z.number().optional(),
  previousCrop: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const InputData = () => {
  const { isAuthenticated } = useAuth();
  const { saveFarmProfile, getFarmProfile, updateFarmProfile } = useFarmData();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editProfileId, setEditProfileId] = useState<string | null>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      location: {
        name: "",
        lat: 0,
        lng: 0,
      },
      landSize: 10,
      soilType: "",
      waterAvailability: 15,
      budget: 1000,
      farmingPriority: "balanced",
      experience: 1,
      previousCrop: "",
      notes: "",
    },
  });

  // Check if we're editing an existing profile
  useEffect(() => {
    const editId = searchParams.get('edit');
    if (editId) {
      const profile = getFarmProfile(editId);
      
      if (profile) {
        setIsEditing(true);
        setEditProfileId(editId);
        
        // Pre-fill the form with existing data
        form.reset({
          name: profile.name,
          location: profile.location,
          landSize: profile.landSize,
          soilType: profile.soilType,
          waterAvailability: profile.waterAvailability,
          budget: profile.budget,
          farmingPriority: profile.farmingPriority,
          experience: profile.experience,
          previousCrop: profile.previousCrop || "",
          notes: profile.notes || "",
        });
        
        toast.info("Editing farm profile", {
          description: "Update the information and submit to save changes"
        });
      } else {
        toast.error("Profile not found", {
          description: "The profile you're trying to edit doesn't exist"
        });
        navigate('/dashboard');
      }
    }
  }, [searchParams, getFarmProfile, form, navigate]);

  const onLocationSelect = (location: { lat: number; lng: number; address: string }) => {
    form.setValue("location", {
      name: location.address,
      lat: location.lat,
      lng: location.lng,
    });
  };

  const nextStep = async () => {
    const fieldsToValidate = currentStep === 1 
      ? ["name", "location", "landSize"]
      : currentStep === 2
      ? ["soilType", "waterAvailability", "experience"]
      : ["budget", "farmingPriority"];
    
    const isValid = await form.trigger(fieldsToValidate as any);
    
    if (isValid) {
      setCurrentStep(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => prev - 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      // Make sure we're submitting a fully validated form to match the NewFarmProfile type
      const profileData: NewFarmProfile = {
        name: data.name,
        location: {
          name: data.location.name,
          lat: data.location.lat,
          lng: data.location.lng,
        },
        landSize: data.landSize,
        soilType: data.soilType,
        waterAvailability: data.waterAvailability,
        budget: data.budget,
        farmingPriority: data.farmingPriority,
        experience: data.experience,
        previousCrop: data.previousCrop,
        notes: data.notes,
      };
      
      let profileId: string;
      
      if (isEditing && editProfileId) {
        // Update existing profile
        await updateFarmProfile(editProfileId, profileData as Partial<FarmProfile>);
        profileId = editProfileId;
        toast.success("Farm profile updated", {
          description: "Your farm profile has been successfully updated"
        });
      } else {
        // Create new profile
        profileId = await saveFarmProfile(profileData);
        toast.success("Farm profile saved", {
          description: "Your farm profile has been saved"
        });
      }
      
      navigate(`/results?profile=${profileId}`);
    } catch (error) {
      console.error("Error saving farm profile:", error);
      toast.error("Error saving farm profile", {
        description: "Please try again"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper for step indicators
  const StepIndicator = ({ number, active, completed }: { number: number; active: boolean; completed: boolean }) => (
    <div
      className={`w-10 h-10 rounded-full flex items-center justify-center ${
        active
          ? "bg-crop-primary text-white"
          : completed
          ? "bg-crop-primary/20 text-crop-primary"
          : "bg-muted text-muted-foreground"
      }`}
    >
      {completed ? (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
      ) : (
        number
      )}
    </div>
  );

  return (
    <>
      <Navbar authenticated={isAuthenticated} />
      
      <main className="min-h-screen pt-24 pb-16 px-4 bg-crop-light/50">
        <div className="container mx-auto max-w-3xl">
          <div className="mb-6">
            <Button
              onClick={() => navigate("/dashboard")}
              variant="ghost"
              size="sm"
              className="flex items-center gap-1.5 mb-4 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
            
            <div className="text-center">
              <h1 className="text-3xl font-bold mb-2 animate-fade-in">
                {isEditing ? "Update Your Farm Details" : "Input Your Farm Details"}
              </h1>
              <p className="text-muted-foreground animate-fade-in">
                Tell us about your farm so we can provide you with tailored crop recommendations
              </p>
            </div>
          </div>
          
          <Card className="border shadow-sm overflow-hidden animate-fade-in">
            <CardContent className="pt-6">
              {/* Step indicators */}
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center">
                  <StepIndicator number={1} active={currentStep === 1} completed={currentStep > 1} />
                  <div className="text-xs ml-2">
                    <div className={currentStep === 1 ? "font-medium" : ""}>Step 1</div>
                    <div className="text-muted-foreground">Location</div>
                  </div>
                </div>
                
                <div className="h-0.5 flex-1 bg-muted mx-2" />
                
                <div className="flex items-center">
                  <StepIndicator number={2} active={currentStep === 2} completed={currentStep > 2} />
                  <div className="text-xs ml-2">
                    <div className={currentStep === 2 ? "font-medium" : ""}>Step 2</div>
                    <div className="text-muted-foreground">Resources</div>
                  </div>
                </div>
                
                <div className="h-0.5 flex-1 bg-muted mx-2" />
                
                <div className="flex items-center">
                  <StepIndicator number={3} active={currentStep === 3} completed={currentStep > 3} />
                  <div className="text-xs ml-2">
                    <div className={currentStep === 3 ? "font-medium" : ""}>Step 3</div>
                    <div className="text-muted-foreground">Preferences</div>
                  </div>
                </div>
              </div>
              
              <Form {...form}>
                <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
                  {/* Step 1: Location & Land Details */}
                  {currentStep === 1 && (
                    <div className="space-y-6 animate-fade-in">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-5 w-5 text-crop-primary" />
                          <h2 className="text-lg font-medium">Location & Land Details</h2>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Tell us where your farm is located and its size
                        </p>
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Farm Location (Name/Description)</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. North Farm, Springfield" {...field} />
                            </FormControl>
                            <FormDescription>
                              Give your farm profile a name or describe its location
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="location.name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Farm Location</FormLabel>
                            <FormControl>
                              <LocationSearch 
                                value={field.value} 
                                onChange={field.onChange}
                                onLocationSelect={onLocationSelect}
                              />
                            </FormControl>
                            <FormDescription>
                              Type to search for your location or use the "Use My Location" button
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="landSize"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Land Size (acres)</FormLabel>
                            <FormControl>
                              <div className="flex items-center">
                                <Input
                                  type="number"
                                  step="0.1"
                                  min="0.1"
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                />
                              </div>
                            </FormControl>
                            <FormDescription>
                              Enter the total size of your farmland in acres
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="previousCrop"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Previous Crop (optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. Corn, Soybeans, None" {...field} />
                            </FormControl>
                            <FormDescription>
                              What crop was previously grown on this land?
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                  
                  {/* Step 2: Soil & Water Resources */}
                  {currentStep === 2 && (
                    <div className="space-y-6 animate-fade-in">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Leaf className="h-5 w-5 text-crop-primary" />
                          <h2 className="text-lg font-medium">Soil & Water Resources</h2>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Information about your soil type and water availability
                        </p>
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="soilType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Soil Type</FormLabel>
                            <FormControl>
                              <SoilTypeSelector
                                value={field.value}
                                onChange={field.onChange}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="waterAvailability"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Water Availability (inches per season)</FormLabel>
                            <div className="space-y-4">
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Low</span>
                                <span>Moderate</span>
                                <span>High</span>
                              </div>
                              <FormControl>
                                <div className="flex items-center gap-4">
                                  <Slider
                                    min={0}
                                    max={40}
                                    step={1}
                                    defaultValue={[field.value]}
                                    onValueChange={(value) => field.onChange(value[0])}
                                    className="flex-1"
                                  />
                                  <span className="font-medium text-sm min-w-16 text-right">
                                    {field.value} inches
                                  </span>
                                </div>
                              </FormControl>
                            </div>
                            <FormDescription>
                              This includes rainfall and irrigation capabilities
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="experience"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Farming Experience (years)</FormLabel>
                            <div className="space-y-4">
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Beginner</span>
                                <span>Intermediate</span>
                                <span>Expert</span>
                              </div>
                              <FormControl>
                                <div className="flex items-center gap-4">
                                  <Slider
                                    min={0}
                                    max={30}
                                    step={1}
                                    defaultValue={[field.value || 1]}
                                    onValueChange={(value) => field.onChange(value[0])}
                                    className="flex-1"
                                  />
                                  <span className="font-medium text-sm min-w-16 text-right">
                                    {field.value || 1} {field.value === 1 ? "year" : "years"}
                                  </span>
                                </div>
                              </FormControl>
                            </div>
                            <FormDescription>
                              Your level of experience in farming
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                  
                  {/* Step 3: Budget & Preferences */}
                  {currentStep === 3 && (
                    <div className="space-y-6 animate-fade-in">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-5 w-5 text-crop-primary" />
                          <h2 className="text-lg font-medium">Budget & Preferences</h2>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Information about your budget and farming preferences
                        </p>
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="budget"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Available Budget ($ per acre)</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                  type="number"
                                  className="pl-8"
                                  min="10"
                                  step="10"
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
                                />
                              </div>
                            </FormControl>
                            <FormDescription>
                              How much you can invest per acre (includes seeds, fertilizer, labor, etc.)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="farmingPriority"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Farming Priorities</FormLabel>
                            <div className="grid grid-cols-3 gap-2">
                              <Button
                                type="button"
                                variant={field.value === "profit" ? "default" : "outline"}
                                className={`h-auto py-3 flex flex-col items-center gap-1 ${
                                  field.value === "profit"
                                    ? "bg-crop-primary hover:bg-crop-primary/90"
                                    : "hover:bg-crop-accent hover:text-crop-primary"
                                }`}
                                onClick={() => field.onChange("profit")}
                              >
                                <DollarSign className="h-5 w-5" />
                                <span className="text-sm">Profit</span>
                              </Button>
                              
                              <Button
                                type="button"
                                variant={field.value === "balanced" ? "default" : "outline"}
                                className={`h-auto py-3 flex flex-col items-center gap-1 ${
                                  field.value === "balanced"
                                    ? "bg-crop-primary hover:bg-crop-primary/90"
                                    : "hover:bg-crop-accent hover:text-crop-primary"
                                }`}
                                onClick={() => field.onChange("balanced")}
                              >
                                <Calculator className="h-5 w-5" />
                                <span className="text-sm">Balanced</span>
                              </Button>
                              
                              <Button
                                type="button"
                                variant={field.value === "sustainability" ? "default" : "outline"}
                                className={`h-auto py-3 flex flex-col items-center gap-1 ${
                                  field.value === "sustainability"
                                    ? "bg-crop-primary hover:bg-crop-primary/90"
                                    : "hover:bg-crop-accent hover:text-crop-primary"
                                }`}
                                onClick={() => field.onChange("sustainability")}
                              >
                                <Leaf className="h-5 w-5" />
                                <span className="text-sm">Sustainability</span>
                              </Button>
                            </div>
                            <FormDescription>
                              Select what matters most for your farming operation
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Additional Notes (optional)</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Any additional information you'd like to share about your farm or preferences..."
                                className="resize-none"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                  
                  {/* Navigation buttons */}
                  <div className="flex justify-between pt-4">
                    {currentStep > 1 ? (
                      <Button type="button" variant="outline" onClick={prevStep}>
                        Previous
                      </Button>
                    ) : (
                      <div />
                    )}
                    
                    {currentStep < 3 ? (
                      <Button type="button" onClick={nextStep} className="bg-crop-primary hover:bg-crop-primary/90">
                        Next
                      </Button>
                    ) : (
                      <Button 
                        type="submit" 
                        className="bg-crop-primary hover:bg-crop-primary/90"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <LoadingSpinner size="sm" text={isEditing ? "Updating..." : "Submitting..."} />
                        ) : (
                          isEditing ? "Update & Get Recommendations" : "Get Recommendations"
                        )}
                      </Button>
                    )}
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Footer />
    </>
  );
};

export default InputData;
