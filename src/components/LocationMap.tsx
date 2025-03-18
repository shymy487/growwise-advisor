
import { useEffect, useRef, useState } from "react";
import { Loader2, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Add these imports to fix the missing marker icons
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix Leaflet's default icon path issues
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

interface LocationMapProps {
  className?: string;
  onLocationSelect?: (location: { lat: number; lng: number; address: string }) => void;
}

const LocationMap = ({ className, onLocationSelect }: LocationMapProps) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [locatingUser, setLocatingUser] = useState(false);

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

  useEffect(() => {
    // Load Leaflet map
    const initializeMap = async () => {
      try {
        setLoading(true);
        
        // Check if container exists
        if (!mapContainerRef.current) return;
        
        // Clean up previous map instance if it exists
        if (mapInstanceRef.current) {
          console.log("Cleaning up previous map instance");
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }
        
        // Create a new map instance with a default view (Kenya)
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
        mapInstanceRef.current = mapInstance;
        markerRef.current = markerInstance;
        setLoading(false);
        
        // Try to get user's location
        getUserLocation(mapInstance, markerInstance);
        
      } catch (error) {
        console.error("Error loading map:", error);
        setLoadError("Failed to load map. Please try again later.");
        setLoading(false);
      }
    };
    
    initializeMap();
    
    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        } catch (error) {
          console.error("Error cleaning up map:", error);
        }
      }
    };
  }, []); // Empty dependency array to run only on mount
  
  // Function to get user's location using browser's geolocation API
  const getUserLocation = async (mapInstance: any, markerInstance: any) => {
    if (!mapInstance || !markerInstance) return;
    
    setLocatingUser(true);
    
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          // Update map view and marker position
          mapInstance.setView([latitude, longitude], 13);
          markerInstance.setLatLng([latitude, longitude]);
          
          // Reverse geocode to get address
          const address = await reverseGeocode(latitude, longitude);
          
          if (onLocationSelect) {
            onLocationSelect({ 
              lat: latitude, 
              lng: longitude, 
              address 
            });
          }
          
          toast.success("Location detected", {
            description: "Your current location has been detected and set on the map.",
          });
          
          setLocatingUser(false);
        },
        (error) => {
          console.error("Error getting user location:", error);
          toast.error("Location detection failed", {
            description: "Please manually set your location on the map.",
          });
          setLocatingUser(false);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      toast.error("Geolocation not supported", {
        description: "Your browser doesn't support location services.",
      });
      setLocatingUser(false);
    }
  };
  
  // Manual trigger for location detection
  const handleDetectLocation = () => {
    if (mapInstanceRef.current && markerRef.current) {
      getUserLocation(mapInstanceRef.current, markerRef.current);
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
      
      <div className="absolute bottom-2 left-2 right-2 z-10 text-xs text-muted-foreground bg-white/80 backdrop-blur-sm rounded p-2 flex justify-between items-center">
        <span>Click on the map or drag the marker to set your farm location</span>
        <button
          onClick={handleDetectLocation}
          disabled={locatingUser}
          className="flex items-center gap-1 text-xs bg-crop-primary text-white px-2 py-1 rounded hover:bg-crop-primary/90 transition-colors"
        >
          {locatingUser ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Detecting...</span>
            </>
          ) : (
            <>
              <MapPin className="h-3 w-3" />
              <span>Detect my location</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default LocationMap;
