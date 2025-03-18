
import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Search, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface LocationSearchProps {
  value: string;
  onChange: (value: string) => void;
  onLocationSelect: (location: { lat: number; lng: number; address: string }) => void;
  className?: string;
}

const LocationSearch = ({ value, onChange, onLocationSelect, className }: LocationSearchProps) => {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<Array<{ display_name: string; lat: string; lon: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionRef = useRef<HTMLDivElement>(null);

  // Update local query when value prop changes
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Handle outside click to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Search for locations when query changes
  useEffect(() => {
    const searchTimer = setTimeout(() => {
      if (query && query.length > 2) {
        searchLocations(query);
      } else {
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(searchTimer);
  }, [query]);

  const searchLocations = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    setShowSuggestions(true);
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`
      );
      
      if (!response.ok) throw new Error('Search failed');
      
      const data = await response.json();
      setSuggestions(data);
    } catch (error) {
      console.error("Error searching locations:", error);
      setSuggestions([]);
      toast.error("Location search failed", {
        description: "Unable to search for locations. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: { display_name: string; lat: string; lon: string }) => {
    setQuery(suggestion.display_name);
    onChange(suggestion.display_name);
    onLocationSelect({
      lat: parseFloat(suggestion.lat),
      lng: parseFloat(suggestion.lon),
      address: suggestion.display_name
    });
    setShowSuggestions(false);
  };

  const detectUserLocation = () => {
    if ('geolocation' in navigator) {
      setLoading(true);
      
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
            );
            
            if (!response.ok) throw new Error('Reverse geocoding failed');
            
            const data = await response.json();
            const address = data.display_name || "Unknown location";
            
            setQuery(address);
            onChange(address);
            onLocationSelect({ lat: latitude, lng: longitude, address });
            toast.success("Location detected", {
              description: "Your current location has been detected.",
            });
          } catch (error) {
            console.error("Error reverse geocoding:", error);
            toast.error("Location detection failed", {
              description: "Could not determine your location. Please try manual search.",
            });
          } finally {
            setLoading(false);
          }
        },
        (error) => {
          console.error("Error getting user location:", error);
          toast.error("Location detection failed", {
            description: error.message || "Please manually search for your location.",
          });
          setLoading(false);
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
      );
    } else {
      toast.error("Geolocation not supported", {
        description: "Your browser doesn't support location services.",
      });
    }
  };

  return (
    <div className={cn("relative", className)}>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => query.length > 2 && setShowSuggestions(true)}
            placeholder="Search for your farm location"
            className="w-full pr-8"
          />
          {loading ? (
            <Loader2 className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground animate-spin" />
          ) : (
            <Search className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          )}
        </div>
        <Button 
          type="button" 
          size="icon" 
          variant="outline" 
          onClick={detectUserLocation}
          disabled={loading}
          title="Detect my location"
        >
          <MapPin className="h-4 w-4" />
        </Button>
      </div>
      
      {showSuggestions && suggestions.length > 0 && (
        <div 
          ref={suggestionRef}
          className="absolute z-10 mt-1 w-full bg-background border rounded-md shadow-lg max-h-60 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="px-3 py-2 hover:bg-muted cursor-pointer text-sm border-b last:border-0"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              {suggestion.display_name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LocationSearch;
