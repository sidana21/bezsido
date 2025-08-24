import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  TrendingUp, 
  Share2, 
  Copy, 
  Eye, 
  MousePointer,
  DollarSign,
  Clock,
  CheckCircle,
  Plus,
  ExternalLink,
  MessageSquare
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  description: string;
  price: string;
  imageUrl: string | null;
  category: string;
  location: string;
  isActive: boolean;
  commissionRate: string;
  owner: {
    id: string;
    name: string;
    avatar: string | null;
  };
}

interface AffiliateLink {
  id: string;
  uniqueCode: string;
  clicks: string;
  conversions: string;
  totalCommission: string;
  createdAt: string;
  product: Product;
}

interface Commission {
  id: string;
  amount: string;
  status: "pending" | "paid" | "cancelled";
  createdAt: string;
  paidAt: string | null;
  affiliateLink: {
    product: Product;
  };
}

export default function Affiliate() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCreateLinkDialogOpen, setIsCreateLinkDialogOpen] = useState(false);

  // Fetch products
  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  // Fetch user's affiliate links
  const { data: affiliateLinks = [], isLoading: linksLoading } = useQuery<AffiliateLink[]>({
    queryKey: ["/api/user/affiliate-links"],
  });

  // Fetch user's commissions
  const { data: commissions = [], isLoading: commissionsLoading } = useQuery<Commission[]>({
    queryKey: ["/api/user/commissions"],
  });

  // Fetch total commissions
  const { data: totalCommissions } = useQuery<{ total: string }>({
    queryKey: ["/api/user/commissions/total"],
  });

  // Create affiliate link mutation
  const createAffiliateLinkMutation = useMutation({
    mutationFn: async (productId: string) => {
      return apiRequest("/api/affiliate-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/affiliate-links"] });
      setIsCreateLinkDialogOpen(false);
      setSelectedProduct(null);
      toast({
        title: "تم إنشاء رابط التسويق بنجاح!",
        description: "يمكنك الآن مشاركة الرابط وكسب العمولة من كل عملية بيع",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في إنشاء رابط التسويق",
        variant: "destructive",
      });
    },
  });

  // Start chat mutation
  const startChatMutation = useMutation({
    mutationFn: async (otherUserId: string) => {
      return apiRequest("/api/chats/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otherUserId }),
      });
    },
    onSuccess: (data: any) => {
      setLocation(`/chat/${data.chatId}`);
    },
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "تم النسخ!",
      description: "تم نسخ الرابط إلى الحافظة",
    });
  };

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat("ar-DZ", {
      style: "currency",
      currency: "DZD",
      minimumFractionDigits: 0,
    }).format(parseFloat(amount));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ar-DZ");
  };

  const getAffiliateUrl = (uniqueCode: string) => {
    return `${window.location.origin}/affiliate/${uniqueCode}`;
  };

  const pendingCommissions = commissions.filter(c => c.status === "pending");
  const paidCommissions = commissions.filter(c => c.status === "paid");

  if (productsLoading || linksLoading || commissionsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-whatsapp-green mx-auto"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">جارِ التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 sm:pb-0">
      <div className="max-w-4xl mx-auto p-4">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-8 h-8 text-whatsapp-green" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              التسويق بالعمولة
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            اكسب المال من خلال تسويق المنتجات والحصول على عمولة من كل عملية بيع
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <TrendingUp className="w-8 h-8 mx-auto text-green-500 mb-2" />
              <p className="text-sm text-gray-600 dark:text-gray-400">إجمالي العمولات</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {totalCommissions ? formatCurrency(totalCommissions.total) : "0 دج"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <Share2 className="w-8 h-8 mx-auto text-blue-500 mb-2" />
              <p className="text-sm text-gray-600 dark:text-gray-400">روابط التسويق</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {affiliateLinks.length}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <Clock className="w-8 h-8 mx-auto text-orange-500 mb-2" />
              <p className="text-sm text-gray-600 dark:text-gray-400">في الانتظار</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {pendingCommissions.length}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <CheckCircle className="w-8 h-8 mx-auto text-green-500 mb-2" />
              <p className="text-sm text-gray-600 dark:text-gray-400">مدفوعة</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {paidCommissions.length}
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="links" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="links">روابط التسويق</TabsTrigger>
            <TabsTrigger value="products">المنتجات المتاحة</TabsTrigger>
            <TabsTrigger value="commissions">العمولات</TabsTrigger>
          </TabsList>

          {/* Affiliate Links Tab */}
          <TabsContent value="links" className="space-y-4">
            {affiliateLinks.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Share2 className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    لا توجد روابط تسويقية
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    ابدأ بإنشاء أول رابط تسويقي لك
                  </p>
                  <Button 
                    onClick={() => setIsCreateLinkDialogOpen(true)}
                    className="bg-whatsapp-green hover:bg-whatsapp-green/90"
                  >
                    <Plus className="w-4 h-4 ml-2" />
                    إنشاء رابط تسويقي
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    روابط التسويق ({affiliateLinks.length})
                  </h2>
                  <Button 
                    onClick={() => setIsCreateLinkDialogOpen(true)}
                    className="bg-whatsapp-green hover:bg-whatsapp-green/90"
                  >
                    <Plus className="w-4 h-4 ml-2" />
                    إنشاء رابط جديد
                  </Button>
                </div>

                <div className="grid gap-4">
                  {affiliateLinks.map((link) => (
                    <Card key={link.id}>
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          {link.product.imageUrl && (
                            <img
                              src={link.product.imageUrl}
                              alt={link.product.name}
                              className="w-20 h-20 rounded-lg object-cover"
                            />
                          )}
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                              {link.product.name}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                              السعر: {formatCurrency(link.product.price)} • 
                              العمولة: {(parseFloat(link.product.commissionRate) * 100).toFixed(0)}%
                            </p>
                            
                            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                              <div className="flex items-center gap-1">
                                <MousePointer className="w-4 h-4" />
                                <span>{link.clicks} نقرة</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <DollarSign className="w-4 h-4" />
                                <span>{link.conversions} عملية بيع</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <TrendingUp className="w-4 h-4" />
                                <span>عمولة: {formatCurrency(link.totalCommission)}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <Input
                                value={getAffiliateUrl(link.uniqueCode)}
                                readOnly
                                className="text-sm"
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => copyToClipboard(getAffiliateUrl(link.uniqueCode))}
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(getAffiliateUrl(link.uniqueCode), "_blank")}
                              >
                                <ExternalLink className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </TabsContent>

          {/* Available Products Tab */}
          <TabsContent value="products" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                المنتجات المتاحة للتسويق
              </h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => {
                const hasAffiliateLink = affiliateLinks.some(link => link.product.id === product.id);
                
                return (
                  <Card key={product.id} className="overflow-hidden">
                    {product.imageUrl && (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-48 object-cover"
                      />
                    )}
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                        {product.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                        {product.description}
                      </p>
                      
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-lg font-bold text-whatsapp-green">
                          {formatCurrency(product.price)}
                        </span>
                        <Badge variant="secondary">
                          عمولة {(parseFloat(product.commissionRate) * 100).toFixed(0)}%
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between mb-3">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          <p>البائع: {product.owner.name}</p>
                          <p>الموقع: {product.location}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startChatMutation.mutate(product.owner.id)}
                          disabled={startChatMutation.isPending}
                          className="text-whatsapp-green hover:bg-green-50 dark:hover:bg-green-950"
                          data-testid={`button-contact-owner-${product.id}`}
                        >
                          <MessageSquare className="w-4 h-4 ml-1" />
                          تواصل
                        </Button>
                      </div>

                      {hasAffiliateLink ? (
                        <Badge variant="default" className="w-full justify-center py-2">
                          <CheckCircle className="w-4 h-4 ml-2" />
                          لديك رابط تسويقي
                        </Badge>
                      ) : (
                        <Button
                          onClick={() => {
                            setSelectedProduct(product);
                            createAffiliateLinkMutation.mutate(product.id);
                          }}
                          disabled={createAffiliateLinkMutation.isPending}
                          className="w-full bg-whatsapp-green hover:bg-whatsapp-green/90"
                        >
                          {createAffiliateLinkMutation.isPending ? (
                            "جارِ الإنشاء..."
                          ) : (
                            <>
                              <Share2 className="w-4 h-4 ml-2" />
                              إنشاء رابط تسويقي
                            </>
                          )}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Commissions Tab */}
          <TabsContent value="commissions" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                تاريخ العمولات ({commissions.length})
              </h2>
            </div>

            {commissions.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <DollarSign className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    لا توجد عمولات بعد
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    ابدأ بتسويق المنتجات لكسب العمولات
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {commissions.map((commission) => (
                  <Card key={commission.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                            {commission.affiliateLink.product.name}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {formatDate(commission.createdAt)}
                          </p>
                        </div>
                        
                        <div className="text-left">
                          <p className="text-lg font-bold text-whatsapp-green">
                            {formatCurrency(commission.amount)}
                          </p>
                          <Badge 
                            variant={commission.status === "paid" ? "default" : "secondary"}
                            className={commission.status === "paid" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : ""}
                          >
                            {commission.status === "paid" ? "مدفوعة" : 
                             commission.status === "pending" ? "في الانتظار" : "ملغية"}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Create Link Dialog */}
        <Dialog open={isCreateLinkDialogOpen} onOpenChange={setIsCreateLinkDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>اختر منتجاً للتسويق</DialogTitle>
            </DialogHeader>
            
            <div className="max-h-96 overflow-y-auto">
              <div className="grid gap-3">
                {products
                  .filter(product => !affiliateLinks.some(link => link.product.id === product.id))
                  .map((product) => (
                    <Card 
                      key={product.id} 
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      onClick={() => {
                        setSelectedProduct(product);
                        createAffiliateLinkMutation.mutate(product.id);
                      }}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center gap-3">
                          {product.imageUrl && (
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="w-12 h-12 rounded object-cover"
                            />
                          )}
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {product.name}
                            </h4>
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                              <span>{formatCurrency(product.price)}</span>
                              <Badge variant="secondary" className="text-xs">
                                {(parseFloat(product.commissionRate) * 100).toFixed(0)}%
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}