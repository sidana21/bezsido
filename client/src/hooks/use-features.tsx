import { useQuery } from "@tanstack/react-query";
import { createContext, useContext, ReactNode } from "react";

interface AppFeature {
  id: string;
  name: string;
  description: string;
  isEnabled: boolean;
  category: string;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
}

interface FeaturesContextType {
  features: AppFeature[];
  isLoading: boolean;
  isFeatureEnabled: (featureId: string) => boolean;
  getFeature: (featureId: string) => AppFeature | undefined;
  getFeaturesByCategory: (category: string) => AppFeature[];
}

const FeaturesContext = createContext<FeaturesContextType | undefined>(undefined);

export function FeaturesProvider({ children }: { children: ReactNode }) {
  const { data: features = [], isLoading } = useQuery<AppFeature[]>({
    queryKey: ["/api/features"],
    staleTime: 1 * 1000, // Cache for 1 second only for real-time updates
    refetchOnWindowFocus: true, // Refetch when window gains focus
    refetchInterval: 3 * 1000, // Refetch every 3 seconds for immediate updates
  });

  const isFeatureEnabled = (featureId: string): boolean => {
    const feature = features.find(f => f.id === featureId);
    return feature?.isEnabled ?? false;
  };

  const getFeature = (featureId: string): AppFeature | undefined => {
    return features.find(f => f.id === featureId);
  };

  const getFeaturesByCategory = (category: string): AppFeature[] => {
    return features.filter(f => f.category === category);
  };

  return (
    <FeaturesContext.Provider value={{
      features,
      isLoading,
      isFeatureEnabled,
      getFeature,
      getFeaturesByCategory
    }}>
      {children}
    </FeaturesContext.Provider>
  );
}

export function useFeatures(): FeaturesContextType {
  const context = useContext(FeaturesContext);
  if (context === undefined) {
    throw new Error('useFeatures must be used within a FeaturesProvider');
  }
  return context;
}

// Convenience hook for checking a single feature
export function useFeatureEnabled(featureId: string): boolean {
  const { isFeatureEnabled } = useFeatures();
  return isFeatureEnabled(featureId);
}

// Convenience component for conditional rendering based on features
export function FeatureGuard({ 
  feature, 
  children, 
  fallback = null 
}: { 
  feature: string; 
  children: ReactNode; 
  fallback?: ReactNode;
}) {
  const isEnabled = useFeatureEnabled(feature);
  
  if (!isEnabled) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}