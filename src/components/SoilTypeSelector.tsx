
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { HelpCircle, Check } from "lucide-react";

interface SoilGroup {
  name: string;
  types: SoilType[];
}

interface SoilType {
  name: string;
  description: string;
  color: string;
  characteristics: string[];
  crops: string[];
}

interface SoilTypeSelectorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

const soilGroups: SoilGroup[] = [
  {
    name: "Common Soils",
    types: [
      {
        name: "Loamy",
        description: "A balanced mix of sand, silt and clay - ideal for most crops",
        color: "bg-amber-700",
        characteristics: ["Good drainage", "High nutrient retention", "Easy to work with"],
        crops: ["Most vegetables", "Corn", "Wheat", "Soybeans"]
      },
      {
        name: "Sandy",
        description: "Light soil with good drainage but poor nutrient retention",
        color: "bg-yellow-200",
        characteristics: ["Drains quickly", "Warms up fast in spring", "Low fertility"],
        crops: ["Root vegetables", "Carrots", "Potatoes", "Radishes"]
      },
      {
        name: "Clay",
        description: "Heavy soil that holds water and nutrients well",
        color: "bg-orange-600",
        characteristics: ["Retains water", "High nutrient content", "Slow to warm up"],
        crops: ["Rice", "Wheat", "Lettuce", "Cabbage"]
      },
      {
        name: "Silt",
        description: "Medium-textured soil that holds moisture well",
        color: "bg-stone-300",
        characteristics: ["Good fertility", "Retains moisture", "Easy to cultivate"],
        crops: ["Most vegetables", "Fruit trees", "Wheat"]
      }
    ]
  },
  {
    name: "Mixed Soils",
    types: [
      {
        name: "Sandy Loam",
        description: "Balanced loam with higher sand content - good for root crops",
        color: "bg-amber-300",
        characteristics: ["Well-draining", "Easier to work", "Moderate fertility"],
        crops: ["Root vegetables", "Strawberries", "Peppers", "Corn"]
      },
      {
        name: "Clay Loam",
        description: "Rich loam with higher clay content - retains moisture well",
        color: "bg-orange-700",
        characteristics: ["High fertility", "Holds water well", "Harder to work with"],
        crops: ["Wheat", "Corn", "Soybeans", "Rice"]
      },
      {
        name: "Silty Clay",
        description: "Fine-textured soil that drains slowly",
        color: "bg-red-900",
        characteristics: ["High fertility", "Holds water", "Can become waterlogged"],
        crops: ["Rice", "Wetland crops", "Some vegetables"]
      }
    ]
  },
  {
    name: "Other Soils",
    types: [
      {
        name: "Peaty",
        description: "Dark soil rich in organic matter - good for water retention",
        color: "bg-gray-800",
        characteristics: ["High organic content", "Acidic", "Holds water well"],
        crops: ["Certain berries", "Root crops", "Leafy vegetables"]
      },
      {
        name: "Chalky",
        description: "Light, alkaline soil with free draining properties",
        color: "bg-gray-100",
        characteristics: ["Free draining", "Shallow", "Contains lime"],
        crops: ["Cereals", "Bean crops", "Brassicas"]
      },
      {
        name: "Rocky",
        description: "Soil with many rocks and stones - challenging for farming",
        color: "bg-gray-400",
        characteristics: ["Poor water retention", "Difficult to cultivate", "Limits root growth"],
        crops: ["Certain herbs", "Some fruit trees", "Grapes"]
      },
      {
        name: "Red Soil",
        description: "Iron-rich soil common in warm areas",
        color: "bg-red-600",
        characteristics: ["Iron-rich", "Usually well-draining", "Medium fertility"],
        crops: ["Peanuts", "Cotton", "Tobacco", "Various vegetables"]
      },
      {
        name: "Black Soil",
        description: "Very fertile soil rich in organic matter",
        color: "bg-gray-950",
        characteristics: ["High fertility", "Self-tilling", "Moisture retentive"],
        crops: ["Cotton", "Wheat", "Sugarcane", "Various vegetables"]
      }
    ]
  }
];

// Helper function to find soil type by name
const findSoilTypeByName = (name: string): SoilType | undefined => {
  for (const group of soilGroups) {
    const found = group.types.find(soil => soil.name === name);
    if (found) return found;
  }
  return undefined;
};

const SoilTypeSelector = ({ value, onChange, className }: SoilTypeSelectorProps) => {
  const [showHelp, setShowHelp] = useState(false);
  const [selectedForHelp, setSelectedForHelp] = useState<SoilType | null>(null);
  
  const handleSelect = (soilName: string) => {
    onChange(soilName);
  };
  
  const openSoilHelp = (soil: SoilType, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedForHelp(soil);
    setShowHelp(true);
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          Select the soil type that best matches your farm's soil
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-muted-foreground hover:text-foreground flex items-center gap-1.5"
          onClick={() => {
            setSelectedForHelp(null);
            setShowHelp(true);
          }}
        >
          <HelpCircle className="h-4 w-4" />
          <span>Help me choose</span>
        </Button>
      </div>
      
      {soilGroups.map((group) => (
        <div key={group.name} className="space-y-2">
          <h4 className="text-sm font-medium">{group.name}</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {group.types.map((soil) => (
              <Card
                key={soil.name}
                className={cn(
                  "cursor-pointer border-2 transition-all overflow-hidden",
                  value === soil.name 
                    ? "border-crop-primary ring-2 ring-crop-primary/20" 
                    : "hover:border-muted-foreground/30"
                )}
                onClick={() => handleSelect(soil.name)}
              >
                <div className={cn("h-3", soil.color)} />
                <div className="p-3">
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium text-sm">{soil.name}</h3>
                    {value === soil.name && (
                      <Check className="h-4 w-4 text-crop-primary" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {soil.description}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 h-7 text-xs w-full justify-start px-2 hover:bg-muted"
                    onClick={(e) => openSoilHelp(soil, e)}
                  >
                    <HelpCircle className="h-3 w-3 mr-1" />
                    More info
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ))}
      
      {/* Help Dialog */}
      <Dialog open={showHelp} onOpenChange={setShowHelp}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedForHelp 
                ? `About ${selectedForHelp.name} Soil` 
                : "How to Identify Your Soil Type"}
            </DialogTitle>
          </DialogHeader>
          
          {selectedForHelp ? (
            <div className="space-y-4">
              <div className={cn("h-4 rounded", selectedForHelp.color)} />
              
              <p className="text-sm">{selectedForHelp.description}</p>
              
              <div>
                <h4 className="text-sm font-medium mb-1">Characteristics:</h4>
                <ul className="list-disc text-sm pl-5 text-muted-foreground">
                  {selectedForHelp.characteristics.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-1">Suitable Crops:</h4>
                <ul className="list-disc text-sm pl-5 text-muted-foreground">
                  {selectedForHelp.crops.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
              
              <DialogFooter>
                <Button 
                  className="w-full bg-crop-primary hover:bg-crop-primary/90"
                  onClick={() => {
                    onChange(selectedForHelp.name);
                    setShowHelp(false);
                  }}
                >
                  Select This Soil Type
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <>
              <DialogDescription>
                Here are some simple tests to identify your soil type:
              </DialogDescription>
              
              <div className="space-y-4 mt-2">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">The Squeeze Test:</h4>
                  <p className="text-sm text-muted-foreground">
                    Take a handful of moist soil and squeeze it:
                  </p>
                  <ul className="list-disc text-sm pl-5 text-muted-foreground">
                    <li>Forms a firm ball that holds together well = <strong>Clay soil</strong></li>
                    <li>Forms a ball but crumbles easily = <strong>Loamy soil</strong></li>
                    <li>Doesn't form a ball and feels gritty = <strong>Sandy soil</strong></li>
                    <li>Feels silky and forms ribbons when pressed = <strong>Silty soil</strong></li>
                  </ul>
                </div>
                
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">The Jar Test:</h4>
                  <p className="text-sm text-muted-foreground">
                    Fill a jar 1/3 with soil, add water, shake well, and let it settle for 24 hours:
                  </p>
                  <ul className="list-disc text-sm pl-5 text-muted-foreground">
                    <li>Sand settles at bottom, clay at top</li>
                    <li>Equal layers of sand, silt, clay = <strong>Loamy soil</strong></li>
                    <li>Mostly sand layer = <strong>Sandy soil</strong></li>
                    <li>Mostly clay layer = <strong>Clay soil</strong></li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium">When in doubt:</h4>
                  <p className="text-sm text-muted-foreground">
                    If you're not sure, select <strong>Loamy</strong> as it's the most common fertile soil type suitable for most crops.
                  </p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SoilTypeSelector;
