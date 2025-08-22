import { useEffect, useState } from "react";
import { useRoute } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  ExternalLink, 
  TrendingUp, 
  User,
  MapPin,
  Clock,
  Loader2
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  description: string;
  price: string;
  imageUrl: string | null;
  category: string;
  location: string;
  commissionRate: string;
  owner: {
    id: string;
    name: string;
    avatar: string | null;
  };
}

export default function AffiliateRedirect() {
  const { toast } = useToast();
  const [, params] = useRoute("/affiliate/:uniqueCode");
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (!params?.uniqueCode) return;

    // Track click and get product info
    const trackClick = async () => {
      try {
        const response = await fetch(`/api/affiliate/${params.uniqueCode}/click`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("الرابط غير صالح أو منتهي الصلاحية");
        }

        const data = await response.json();
        setProduct(data.product);
      } catch (err) {
        setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
      } finally {
        setLoading(false);
      }
    };

    trackClick();
  }, [params?.uniqueCode]);

  const handleRedirectToProduct = () => {
    if (!product) return;
    
    setRedirecting(true);
    // Simulate redirect to product page or external store
    setTimeout(() => {
      toast({
        title: "تم تسجيل اهتمامك!",
        description: "شكراً لزيارة المنتج عبر الرابط التسويقي",
      });
      setRedirecting(false);
    }, 1000);
  };

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat("ar-DZ", {
      style: "currency",
      currency: "DZD",
      minimumFractionDigits: 0,
    }).format(parseFloat(amount));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-whatsapp-green mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              جارِ التحميل...
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              يتم تحميل معلومات المنتج
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <ExternalLink className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              رابط غير صالح
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {error || "هذا الرابط غير صالح أو منتهي الصلاحية"}
            </p>
            <Button 
              onClick={() => window.location.href = "/"}
              variant="outline"
            >
              العودة للرئيسية
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardContent className="p-6">
          {/* Affiliate Notice */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-6">
            <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-medium">رابط تسويقي</span>
            </div>
            <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
              هذا المنتج تم مشاركته عبر نظام التسويق بالعمولة في BizChat
            </p>
          </div>

          {/* Product Info */}
          <div className="flex gap-6 mb-6">
            {product.imageUrl && (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-32 h-32 rounded-lg object-cover flex-shrink-0"
              />
            )}
            
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {product.name}
              </h1>
              
              <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                {product.description}
              </p>

              <div className="flex items-center gap-4 mb-4">
                <div className="text-2xl font-bold text-whatsapp-green">
                  {formatCurrency(product.price)}
                </div>
                <Badge variant="secondary">
                  {product.category}
                </Badge>
              </div>

              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span>البائع: {product.owner.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>الموقع: {product.location}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleRedirectToProduct}
              disabled={redirecting}
              className="flex-1 bg-whatsapp-green hover:bg-whatsapp-green/90"
            >
              {redirecting ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  جارِ التوجيه...
                </>
              ) : (
                <>
                  <ExternalLink className="w-4 h-4 ml-2" />
                  عرض المنتج
                </>
              )}
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => window.location.href = "/"}
            >
              تصفح المزيد
            </Button>
          </div>

          {/* Commission Info */}
          <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-center gap-2 text-green-800 dark:text-green-200 mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-medium">معلومات العمولة</span>
            </div>
            <p className="text-xs text-green-600 dark:text-green-300">
              المسوق يحصل على عمولة {(parseFloat(product.commissionRate) * 100).toFixed(0)}% 
              عند شراء هذا المنتج عبر هذا الرابط
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}