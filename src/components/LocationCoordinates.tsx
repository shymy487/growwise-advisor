
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface LocationCoordinatesProps {
  latitude: number;
  longitude: number;
  onCoordinatesChange: (lat: number, lng: number) => void;
  className?: string;
}

const LocationCoordinates = ({ 
  latitude, 
  longitude, 
  onCoordinatesChange,
  className 
}: LocationCoordinatesProps) => {
  const [lat, setLat] = useState(latitude);
  const [lng, setLng] = useState(longitude);
  const [detecting, setDetecting] = useState(false);

  const handleLatChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value >= -90 && value <= 90) {
      setLat(value);
      onCoordinatesChange(value, lng);
    }
  };

  const handleLngChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value >= -180 && value <= 180) {
      setLng(value);
      onCoordinatesChange(lat, value);
    }
  };

  const detectLocation = () => {
    if ('geolocation' in navigator) {
      setDetecting(true);
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLat(latitude);
          setLng(longitude);
          onCoordinatesChange(latitude, longitude);
          toast.success("Location detected", {
            description: "Your current coordinates have been detected",
          });
          setDetecting(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          toast.error("Could not detect location", {
            description: error.message || "Please enter coordinates manually",
          });
          setDetecting(false);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      toast.error("Geolocation not supported", {
        description: "Your browser doesn't support location services",
      });
    }
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Precise Coordinates</p>
            <Button
              size="sm"
              variant="ghost"
              className="text-xs flex items-center gap-1.5 h-8 px-2"
              onClick={detectLocation}
              disabled={detecting}
            >
              {detecting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Detecting...</span>
                </>
              ) : (
                <>
                  <MapPin className="h-3.5 w-3.5" />
                  <span>Detect My Location</span>
                </>
              )}
            </Button>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label htmlFor="latitude" className="text-xs text-muted-foreground">
                Latitude
              </label>
              <Input
                id="latitude"
                type="number"
                value={lat}
                onChange={handleLatChange}
                min="-90"
                max="90"
                step="0.000001"
                className="text-sm"
              />
            </div>
            
            <div className="space-y-1">
              <label htmlFor="longitude" className="text-xs text-muted-foreground">
                Longitude
              </label>
              <Input
                id="longitude"
                type="number"
                value={lng}
                onChange={handleLngChange}
                min="-180"
                max="180"
                step="0.000001"
                className="text-sm"
              />
            </div>
          </div>
          
          <p className="text-xs text-muted-foreground">
            These coordinates will be used to analyze local climate conditions for crop recommendations.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default LocationCoordinates;
