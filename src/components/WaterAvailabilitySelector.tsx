
import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Droplets, Cloud, Sun, HelpCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type WaterSource = "limited" | "rainfed" | "basic-irrigation" | "full-irrigation";

interface WaterAvailabilitySelectorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

interface WaterOption {
  id: WaterSource;
  name: string;
  description: string;
  icon: JSX.Element;
  inches: string;
  color: string;
}

const waterOptions: WaterOption[] = [
  {
    id: "limited",
    name: "Limited Water",
    description: "Areas with very little rainfall and no irrigation",
    icon: <Sun className="h-8 w-8" />,
    inches: "5-10 inches per season",
    color: "bg-amber-500"
  },
  {
    id: "rainfed",
    name: "Rain-fed Farming",
    description: "Relying only on natural rainfall",
    icon: <Cloud className="h-8 w-8" />,
    inches: "10-15 inches per season",
    color: "bg-blue-300"
  },
  {
    id: "basic-irrigation",
    name: "Basic Irrigation",
    description: "Natural rainfall plus some irrigation",
    icon: <Droplets className="h-8 w-8" />,
    inches: "15-25 inches per season",
    color: "bg-blue-500"
  },
  {
    id: "full-irrigation",
    name: "Full Irrigation",
    description: "Complete irrigation system available",
    icon: <Droplets className="h-8 w-8 text-blue-600" />,
    inches: "25-40 inches per season",
    color: "bg-blue-700"
  }
];

const WaterAvailabilitySelector = ({ value, onChange, className }: WaterAvailabilitySelectorProps) => {
  const [showHelp, setShowHelp] = useState(false);
  
  // Convert numeric value to water source type if needed
  const getWaterSourceFromValue = (val: string | number): WaterSource => {
    if (typeof val === 'string' && (val === 'limited' || val === 'rainfed' || val === 'basic-irrigation' || val === 'full-irrigation')) {
      return val;
    }
    
    // Convert numeric value to water source
    const inches = Number(val);
    if (isNaN(inches)) return "rainfed"; // Default
    
    if (inches < 10) return "limited";
    if (inches < 15) return "rainfed";
    if (inches < 25) return "basic-irrigation";
    return "full-irrigation";
  };
  
  const currentWaterSource = getWaterSourceFromValue(value);
  
  const findWaterOptionById = (id: WaterSource): WaterOption => {
    return waterOptions.find(option => option.id === id) || waterOptions[1]; // Default to rainfed
  };
  
  const currentOption = findWaterOptionById(currentWaterSource);
  
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex justify-between items-center">
        <div className="text-sm font-medium">Water Availability</div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-muted-foreground hover:text-foreground flex items-center gap-1.5"
          onClick={() => setShowHelp(true)}
        >
          <HelpCircle className="h-4 w-4" />
          <span>Help me choose</span>
        </Button>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        {waterOptions.map((option) => (
          <Card
            key={option.id}
            className={cn(
              "cursor-pointer border-2 transition-all overflow-hidden",
              currentWaterSource === option.id 
                ? "border-crop-primary ring-2 ring-crop-primary/20" 
                : "hover:border-muted-foreground/30"
            )}
            onClick={() => onChange(option.id)}
          >
            <div className={cn("h-1.5", option.color)} />
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className={cn(
                  "p-1.5 rounded-full",
                  currentWaterSource === option.id ? "bg-crop-accent text-crop-primary" : "bg-muted"
                )}>
                  {option.icon}
                </div>
                <div>
                  <h3 className="font-medium text-sm">{option.name}</h3>
                  <p className="text-xs text-muted-foreground">{option.inches}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {option.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Help Dialog */}
      <Dialog open={showHelp} onOpenChange={setShowHelp}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>How to Determine Water Availability</DialogTitle>
            <DialogDescription>
              Choose the option that best matches your farming situation
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Limited Water (5-10 inches)</h4>
              <p className="text-sm text-muted-foreground">
                For areas with very little rainfall and no irrigation infrastructure. Suitable for drought-resistant crops only. Examples: desert regions, areas suffering from drought.
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Rain-fed Farming (10-15 inches)</h4>
              <p className="text-sm text-muted-foreground">
                Your farm relies primarily on natural rainfall with no significant irrigation systems. Common in many developing regions or small family farms.
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Basic Irrigation (15-25 inches)</h4>
              <p className="text-sm text-muted-foreground">
                You have some irrigation capability (like water pumps, small canals or drip systems) to supplement natural rainfall when needed.
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Full Irrigation (25-40 inches)</h4>
              <p className="text-sm text-muted-foreground">
                Your farm has access to reliable irrigation infrastructure with good water sources. You can provide water to crops as needed regardless of rainfall.
              </p>
            </div>
            
            <div className="pt-2">
              <p className="text-sm font-medium">Tips for Choosing:</p>
              <ul className="list-disc text-sm pl-5 text-muted-foreground">
                <li>Consider both rainfall and irrigation</li>
                <li>Think about water access during dry seasons</li>
                <li>When in doubt, select a lower option to get more drought-resistant crop recommendations</li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WaterAvailabilitySelector;
