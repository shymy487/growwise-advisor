
import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LocationMapProps {
  className?: string;
  onLocationSelect?: (location: { lat: number; lng: number; address: string }) => void;
}

const LocationMap = ({ className, onLocationSelect }: LocationMapProps) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [map, setMap] = useState<any>(null);
  const [marker, setMarker] = useState<any>(null);

  useEffect(() => {
    // Load Leaflet dynamically
    const loadLeaflet = async () => {
      try {
        setLoading(true);
        
        // Import leaflet dynamically to avoid SSR issues
        const L = await import('leaflet');
        await import('leaflet/dist/leaflet.css');
        
        // Create map instance if container exists
        if (!mapContainerRef.current) return;
        
        // Initialize map with a default view (Kenya)
        const mapInstance = L.map(mapContainerRef.current).setView([0.0236, 37.9062], 6);
        
        // Add tile layer (OpenStreetMap)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(mapInstance);
        
        // Add a marker that can be moved
        const markerInstance = L.marker([0.0236, 37.9062], {
          draggable: true
        }).addTo(mapInstance);
        
        // Set up event listeners
        mapInstance.on('click', (e: any) => {
          const { lat, lng } = e.latlng;
          markerInstance.setLatLng([lat, lng]);
          
          // Reverse geocode to get address
          reverseGeocode(lat, lng).then(address => {
            if (onLocationSelect) {
              onLocationSelect({ lat, lng, address });
            }
          });
        });
        
        markerInstance.on('dragend', () => {
          const position = markerInstance.getLatLng();
          
          // Reverse geocode to get address
          reverseGeocode(position.lat, position.lng).then(address => {
            if (onLocationSelect) {
              onLocationSelect({ 
                lat: position.lat, 
                lng: position.lng, 
                address 
              });
            }
          });
        });
        
        // Store references
        setMap(mapInstance);
        setMarker(markerInstance);
        setLoading(false);
        
      } catch (error) {
        console.error("Error loading map:", error);
        setLoadError("Failed to load map. Please try again later.");
        setLoading(false);
      }
    };
    
    loadLeaflet();
    
    // Cleanup
    return () => {
      if (map) {
        map.remove();
      }
    };
  }, [onLocationSelect]);
  
  // Function to reverse geocode coordinates to address
  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const data = await response.json();
      return data.display_name || "Unknown location";
    } catch (error) {
      console.error("Geocoding error:", error);
      return "Unknown location";
    }
  };

  return (
    <div className={cn("relative h-[300px] rounded-lg overflow-hidden border", className)}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/20 backdrop-blur-sm z-10">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      )}
      
      {loadError && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/20 backdrop-blur-sm z-10">
          <div className="text-center p-4">
            <p className="text-destructive font-medium">{loadError}</p>
            <button 
              className="mt-2 text-sm text-primary hover:underline"
              onClick={() => window.location.reload()}
            >
              Reload page
            </button>
          </div>
        </div>
      )}
      
      <div 
        ref={mapContainerRef} 
        className="h-full w-full"
      />
      
      <div className="absolute bottom-2 left-2 right-2 z-10 text-xs text-muted-foreground bg-white/80 backdrop-blur-sm rounded p-2">
        Click on the map or drag the marker to set your farm location
      </div>
    </div>
  );
};

export default LocationMap;
