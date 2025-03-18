
import { useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Leaf, ChevronDown, ChevronUp, Clock, DollarSign, BarChart2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CropDetails {
  id: string;
  name: string;
  description: string;
  estimatedProfit: number;
  marketPrice: number;
  score: number;
  growthPeriod: string;
  waterRequirements: string;
  soilCompatibility: string[];
  isTopPick?: boolean;
}

interface CropCardProps {
  crop: CropDetails;
  className?: string;
}

const CropCard = ({ crop, className }: CropCardProps) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className={cn("h-full overflow-hidden transition-all duration-300 border hover:border-crop-primary/50 hover:shadow-md", className)}>
      <CardContent className="p-4 md:p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Leaf className="h-5 w-5 text-crop-primary shrink-0" />
            <h3 className="font-medium text-lg">{crop.name}</h3>
          </div>
          {crop.isTopPick && (
            <div className="bg-crop-primary text-white text-xs px-2 py-1 rounded-full">
              Top Pick
            </div>
          )}
        </div>

        <div className="mt-2 space-y-1">
          <div className="flex items-center gap-1 text-sm">
            <BarChart2 className="h-4 w-4 text-crop-primary/70" />
            <span className="text-muted-foreground">Score:</span>
            <span className="font-medium">{crop.score}</span>
          </div>
          
          <div className="flex items-center gap-1 text-sm">
            <DollarSign className="h-4 w-4 text-crop-primary/70" />
            <span className="text-muted-foreground">Est. Profit:</span>
            <span className="font-medium">${crop.estimatedProfit.toLocaleString()}/acre</span>
          </div>
          
          <div className="flex items-center gap-1 text-sm">
            <Clock className="h-4 w-4 text-crop-primary/70" />
            <span className="text-muted-foreground">Growth Period:</span>
            <span className="font-medium">{crop.growthPeriod}</span>
          </div>
        </div>

        <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
          {crop.description}
        </p>

        {expanded && (
          <div className="mt-4 animate-fade-in border-t pt-4">
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-medium">Water Requirements</h4>
                <p className="text-sm text-muted-foreground">{crop.waterRequirements}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium">Soil Compatibility</h4>
                <div className="flex flex-wrap gap-1 mt-1">
                  {crop.soilCompatibility.map((soil, idx) => (
                    <span 
                      key={idx}
                      className="text-xs bg-crop-accent text-crop-primary rounded-full px-2 py-1"
                    >
                      {soil}
                    </span>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium">Market Price</h4>
                <p className="text-sm text-muted-foreground">${crop.marketPrice.toFixed(2)}/unit</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="p-4 pt-0 md:p-6 md:pt-0">
        <Button 
          variant="ghost" 
          className="w-full text-crop-primary hover:bg-crop-accent hover:text-crop-primary"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <>
              <ChevronUp className="h-4 w-4 mr-2" />
              Hide Details
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4 mr-2" />
              Show Details
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default CropCard;
