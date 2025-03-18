
import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useFarmData } from "@/contexts/FarmDataContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LocationMap from "@/components/LocationMap";
import LoadingSpinner from "@/components/LoadingSpinner";
import { MapPin, Leaf, Droplets, Calculator, DollarSign, Clock } from "lucide-react";

// Form schema
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
  const { saveFarmProfile } = useFarmData();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

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
      const profileId = await saveFarmProfile(data);
      navigate(`/results?profile=${profileId}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const soilTypes = [
    "Loamy",
    "Sandy",
    "Clay",
    "Silt",
    "Peaty",
    "Chalky",
    "Sandy Loam",
    "Clay Loam",
    "Silty Clay",
    "Rocky",
    "Red Soil",
    "Black Soil",
  ];

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
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2 animate-fade-in">Input Your Farm Details</h1>
            <p className="text-muted-foreground animate-fade-in">
              Tell us about your farm so we can provide you with tailored crop recommendations
            </p>
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
                        name="location"
                        render={() => (
                          <FormItem>
                            <FormLabel>Pin Farm Location on Map</FormLabel>
                            <FormControl>
                              <LocationMap
                                className="mt-1"
                                onLocationSelect={onLocationSelect}
                              />
                            </FormControl>
                            <FormDescription>
                              Click on the map or drag the marker to set your farm location
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
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select soil type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {soilTypes.map((type) => (
                                  <SelectItem key={type} value={type}>
                                    {type}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Not sure? Loamy is a common soil type for agricultural lands
                            </FormDescription>
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
                        {isSubmitting ? <LoadingSpinner size="sm" text="Submitting..." /> : "Get Recommendations"}
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
