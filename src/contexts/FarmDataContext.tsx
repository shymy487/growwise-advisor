import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { toast } from "sonner";
import { CropCategory } from "@/hooks/useGeminiAI";

export interface FarmProfile {
  id: string;
  name: string;
  location: {
    name: string;
    lat: number;
    lng: number;
  };
  landSize: number;
  soilType: string;
  waterAvailability: string;
  budget: number;
  farmingPriority: "profit" | "balanced" | "sustainability";
  experience?: number;
  previousCrop?: string;
  notes?: string;
  createdAt: Date;
  categories?: CropCategory[];
  reasoning?: string;
}

export type NewFarmProfile = Omit<FarmProfile, "id" | "createdAt" | "categories" | "reasoning">;

interface FarmDataContextType {
  farmProfiles: FarmProfile[];
  currentProfile: FarmProfile | null;
  loading: boolean;
  saveFarmProfile: (profile: NewFarmProfile) => Promise<string>;
  getFarmProfile: (id: string) => FarmProfile | null;
  updateFarmProfile: (id: string, data: Partial<FarmProfile>) => Promise<void>;
  deleteFarmProfile: (id: string) => Promise<void>;
  setCurrentProfile: (profile: FarmProfile | null) => void;
}

const FarmDataContext = createContext<FarmDataContextType | undefined>(undefined);

export const FarmDataProvider = ({ children }: { children: ReactNode }) => {
  const [farmProfiles, setFarmProfiles] = useState<FarmProfile[]>([]);
  const [currentProfile, setCurrentProfile] = useState<FarmProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedProfiles = localStorage.getItem("farmProfiles");
    if (storedProfiles) {
      try {
        const parsed = JSON.parse(storedProfiles);
        setFarmProfiles(parsed);
        
        if (parsed.length > 0) {
          const sorted = [...parsed].sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          setCurrentProfile(sorted[0]);
        }
      } catch (error) {
        console.error("Failed to parse stored farm profiles", error);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (farmProfiles.length > 0) {
      localStorage.setItem("farmProfiles", JSON.stringify(farmProfiles));
    }
  }, [farmProfiles]);

  const saveFarmProfile = async (profile: NewFarmProfile) => {
    setLoading(true);
    try {
      const newProfile: FarmProfile = {
        ...profile,
        id: "farm-" + Math.random().toString(36).substr(2, 9),
        createdAt: new Date(),
      };
      
      setFarmProfiles(prev => [...prev, newProfile]);
      setCurrentProfile(newProfile);
      
      toast.success("Farm profile saved", {
        description: `Profile for ${profile.name} has been saved successfully`,
      });
      
      return newProfile.id;
    } catch (error) {
      toast.error("Failed to save farm profile");
      console.error("Save farm profile error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getFarmProfile = (id: string) => {
    return farmProfiles.find(profile => profile.id === id) || null;
  };

  const updateFarmProfile = async (id: string, data: Partial<FarmProfile>) => {
    setLoading(true);
    try {
      const updatedProfiles = farmProfiles.map(profile => 
        profile.id === id ? { ...profile, ...data } : profile
      );
      
      setFarmProfiles(updatedProfiles);
      
      if (currentProfile?.id === id) {
        setCurrentProfile({ ...currentProfile, ...data });
      }
      
      toast.success("Farm profile updated", {
        description: "Your changes have been saved successfully",
      });
    } catch (error) {
      toast.error("Failed to update farm profile");
      console.error("Update farm profile error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteFarmProfile = async (id: string) => {
    setLoading(true);
    try {
      const updatedProfiles = farmProfiles.filter(profile => profile.id !== id);
      setFarmProfiles(updatedProfiles);
      
      if (currentProfile?.id === id) {
        setCurrentProfile(updatedProfiles.length > 0 ? updatedProfiles[0] : null);
      }
      
      toast.success("Farm profile deleted");
    } catch (error) {
      toast.error("Failed to delete farm profile");
      console.error("Delete farm profile error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <FarmDataContext.Provider
      value={{
        farmProfiles,
        currentProfile,
        loading,
        saveFarmProfile,
        getFarmProfile,
        updateFarmProfile,
        deleteFarmProfile,
        setCurrentProfile,
      }}
    >
      {children}
    </FarmDataContext.Provider>
  );
};

export const useFarmData = () => {
  const context = useContext(FarmDataContext);
  if (context === undefined) {
    throw new Error("useFarmData must be used within a FarmDataProvider");
  }
  return context;
};
