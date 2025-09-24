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
  // Default features as fallback if API fails on Render
  const defaultFeatures: AppFeature[] = [
    { id: 'messaging', name: 'المراسلة', description: 'إرسال واستقبال الرسائل', isEnabled: true, category: 'messaging', priority: 1, createdAt: new Date(), updatedAt: new Date() },
    { id: 'stories', name: 'الحالات', description: 'مشاركة الحالات والقصص', isEnabled: true, category: 'social', priority: 2, createdAt: new Date(), updatedAt: new Date() },
    { id: 'voice_calls', name: 'المكالمات', description: 'إجراء مكالمات صوتية', isEnabled: true, category: 'communication', priority: 3, createdAt: new Date(), updatedAt: new Date() },
    { id: 'marketplace', name: 'السوق', description: 'بيع وشراء المنتجات', isEnabled: true, category: 'marketplace', priority: 4, createdAt: new Date(), updatedAt: new Date() },
    { id: 'cart', name: 'السلة', description: 'إدارة مشتريات وطلبات المتجر', isEnabled: true, category: 'marketplace', priority: 5, createdAt: new Date(), updatedAt: new Date() },
    { id: 'neighborhoods', name: 'مجتمع الحي', description: 'التواصل مع الجيران', isEnabled: true, category: 'social', priority: 6, createdAt: new Date(), updatedAt: new Date() },
    { id: 'affiliate', name: 'التسويق', description: 'كسب المال من التسويق', isEnabled: true, category: 'marketplace', priority: 7, createdAt: new Date(), updatedAt: new Date() }
  ];

  const { data: apiFeatures, isLoading, error } = useQuery<AppFeature[]>({
    queryKey: ["/api/features"],
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
    gcTime: 15 * 60 * 1000, // Keep in cache for 15 minutes
    refetchOnWindowFocus: false, // Don't refetch on window focus to prevent excessive calls
    refetchInterval: false, // Disable automatic refetching - features don't change frequently
    retry: 2, // Reduce retry attempts
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });

  // Use API features if available, otherwise fallback to defaults
  const features = !error && apiFeatures && apiFeatures.length > 0 ? apiFeatures : defaultFeatures;

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