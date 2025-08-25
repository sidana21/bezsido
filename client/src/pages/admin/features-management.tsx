import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Search, Settings2, Shield, MessageCircle, Store, Users, ShoppingCart, Package, TrendingUp } from "lucide-react";

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

const getCategoryIcon = (category: string) => {
  switch (category) {
    case "communication": return <MessageCircle className="h-4 w-4" />;
    case "social": return <Users className="h-4 w-4" />;
    case "commerce": return <Store className="h-4 w-4" />;
    case "monetization": return <TrendingUp className="h-4 w-4" />;
    case "account": return <Shield className="h-4 w-4" />;
    default: return <Settings2 className="h-4 w-4" />;
  }
};

const getCategoryColor = (category: string) => {
  switch (category) {
    case "communication": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
    case "social": return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
    case "commerce": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    case "monetization": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
    case "account": return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
  }
};

const getCategoryLabel = (category: string) => {
  switch (category) {
    case "communication": return "التواصل";
    case "social": return "اجتماعي";
    case "commerce": return "التجارة";
    case "monetization": return "الربح";
    case "account": return "الحساب";
    default: return "عام";
  }
};

export function FeaturesManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const { toast } = useToast();

  const { data: features = [], isLoading } = useQuery<AppFeature[]>({
    queryKey: ["/api/admin/features"],
  });

  const updateFeatureMutation = useMutation({
    mutationFn: async ({ featureId, isEnabled }: { featureId: string; isEnabled: boolean }) => {
      return apiRequest(`/api/admin/features/${featureId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isEnabled }),
      });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/features"] });
      queryClient.invalidateQueries({ queryKey: ["/api/features"] });
      toast({
        title: "تم تحديث الميزة",
        description: data.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في تحديث الميزة",
        description: error.message || "حدث خطأ أثناء تحديث الميزة",
        variant: "destructive",
      });
    },
  });

  const filteredFeatures = features.filter((feature) => {
    const matchesSearch = feature.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         feature.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || feature.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(features.map(f => f.category)));

  const handleFeatureToggle = (featureId: string, isEnabled: boolean) => {
    updateFeatureMutation.mutate({ featureId, isEnabled });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="text-center">
          <div className="text-lg">جاري تحميل الميزات...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            إدارة ميزات التطبيق
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            تحكم في جميع ميزات التطبيق وقم بتفعيل أو إيقاف أي ميزة
          </p>
        </div>

        {/* Search and Filter Controls */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="البحث في الميزات..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
              data-testid="search-features"
            />
          </div>
          
          <div className="flex gap-2">
            <Button
              variant={selectedCategory === "all" ? "default" : "outline"}
              onClick={() => setSelectedCategory("all")}
              size="sm"
              data-testid="filter-all"
            >
              الكل ({features.length})
            </Button>
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                onClick={() => setSelectedCategory(category)}
                size="sm"
                className="flex items-center gap-2"
                data-testid={`filter-${category}`}
              >
                {getCategoryIcon(category)}
                {getCategoryLabel(category)} ({features.filter(f => f.category === category).length})
              </Button>
            ))}
          </div>
        </div>

        {/* Features Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">إجمالي الميزات</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{features.length}</p>
                </div>
                <Settings2 className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">الميزات المفعلة</p>
                  <p className="text-2xl font-bold text-green-600">
                    {features.filter(f => f.isEnabled).length}
                  </p>
                </div>
                <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                  <div className="h-4 w-4 bg-green-600 rounded-full"></div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">الميزات المتوقفة</p>
                  <p className="text-2xl font-bold text-red-600">
                    {features.filter(f => !f.isEnabled).length}
                  </p>
                </div>
                <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
                  <div className="h-4 w-4 bg-red-600 rounded-full"></div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">الفئات</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{categories.length}</p>
                </div>
                <Package className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Features List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredFeatures.map((feature) => (
            <Card 
              key={feature.id} 
              className={`transition-all duration-200 ${
                feature.isEnabled 
                  ? "bg-white dark:bg-gray-800 border-green-200 dark:border-green-800" 
                  : "bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700"
              }`}
              data-testid={`feature-card-${feature.id}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${getCategoryColor(feature.category)}`}>
                      {getCategoryIcon(feature.category)}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{feature.name}</CardTitle>
                      <Badge 
                        variant="secondary" 
                        className={`mt-1 text-xs ${getCategoryColor(feature.category)}`}
                      >
                        {getCategoryLabel(feature.category)}
                      </Badge>
                    </div>
                  </div>
                  <Badge 
                    variant={feature.isEnabled ? "default" : "secondary"}
                    className={feature.isEnabled ? "bg-green-600" : "bg-gray-400"}
                  >
                    {feature.isEnabled ? "مفعل" : "متوقف"}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent>
                <CardDescription className="mb-4 text-sm leading-relaxed">
                  {feature.description}
                </CardDescription>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <Switch
                      id={`feature-${feature.id}`}
                      checked={feature.isEnabled}
                      onCheckedChange={(checked) => handleFeatureToggle(feature.id, checked)}
                      disabled={updateFeatureMutation.isPending}
                      data-testid={`toggle-${feature.id}`}
                    />
                    <Label htmlFor={`feature-${feature.id}`} className="text-sm">
                      {updateFeatureMutation.isPending ? "جاري التحديث..." : (feature.isEnabled ? "تعطيل" : "تفعيل")}
                    </Label>
                  </div>
                  
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    الأولوية: {feature.priority}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredFeatures.length === 0 && (
          <div className="text-center py-12">
            <Settings2 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              لا توجد ميزات
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              لم يتم العثور على ميزات تطابق البحث أو الفلتر المحدد
            </p>
          </div>
        )}
      </div>
    </div>
  );
}