import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { AdminLayout } from "@/components/admin/admin-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  Settings, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Eye, 
  MousePointerClick,
  DollarSign,
  Calendar,
  Star,
  TrendingUp
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

const PROMOTION_TYPE_LABELS: Record<string, string> = {
  featured_store: 'متجر مميز',
  sponsored_product: 'منتج مروّج',
  boosted_post: 'منشور معزز',
  premium_subscription: 'اشتراك مميز',
  location_ad: 'إعلان موقعي',
  story_ad: 'قصة مروجة'
};

const TIER_LABELS: Record<string, string> = {
  bronze: 'برونزي',
  silver: 'فضي',
  gold: 'ذهبي'
};

interface PromotionSettings {
  featuredStoreEnabled?: boolean;
  sponsoredProductEnabled?: boolean;
  boostedPostEnabled?: boolean;
  premiumSubscriptionEnabled?: boolean;
  locationAdsEnabled?: boolean;
  storyAdsEnabled?: boolean;
}

interface Promotion {
  id: string;
  promotionType: string;
  status: string;
  description: string;
  subscriptionTier: string;
  startDate: string;
  totalPrice: number;
  paymentStatus: string;
  viewCount?: number;
  clickCount?: number;
  rejectionReason?: string;
}

export default function AdminPromotionsPage() {
  const { toast } = useToast();
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const { data: settings, isLoading: isLoadingSettings } = useQuery<PromotionSettings>({
    queryKey: ["/api/promotions/settings"]
  });

  const { data: pendingPromotions, isLoading: isLoadingPending } = useQuery<Promotion[]>({
    queryKey: ["/api/promotions/pending"]
  });

  const { data: allPromotions, isLoading: isLoadingAll } = useQuery<Promotion[]>({
    queryKey: ["/api/promotions/all"]
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: Partial<PromotionSettings>) => {
      return apiRequest('/api/promotions/settings', {
        method: 'PATCH',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/promotions/settings"] });
      toast({
        title: "تم التحديث",
        description: "تم تحديث الإعدادات بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحديث الإعدادات",
        variant: "destructive"
      });
    }
  });

  const approvePromotionMutation = useMutation({
    mutationFn: async (promotionId: string) => {
      return apiRequest(`/api/promotions/${promotionId}/approve`, {
        method: 'PATCH'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/promotions/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/promotions/all"] });
      toast({
        title: "تمت الموافقة",
        description: "تم تفعيل الإعلان بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء الموافقة",
        variant: "destructive"
      });
    }
  });

  const rejectPromotionMutation = useMutation({
    mutationFn: async ({ promotionId, reason }: { promotionId: string; reason: string }) => {
      return apiRequest(`/api/promotions/${promotionId}/reject`, {
        method: 'PATCH',
        body: JSON.stringify({ reason })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/promotions/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/promotions/all"] });
      setIsRejectDialogOpen(false);
      setRejectionReason("");
      setSelectedPromotion(null);
      toast({
        title: "تم الرفض",
        description: "تم رفض الإعلان",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء رفض الإعلان",
        variant: "destructive"
      });
    }
  });

  const updatePaymentMutation = useMutation({
    mutationFn: async ({ promotionId, paymentStatus, paidAmount }: { promotionId: string; paymentStatus: string; paidAmount: number }) => {
      return apiRequest(`/api/promotions/${promotionId}/payment`, {
        method: 'PATCH',
        body: JSON.stringify({ paymentStatus, paidAmount })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/promotions/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/promotions/all"] });
      toast({
        title: "تم التحديث",
        description: "تم تحديث حالة الدفع",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحديث حالة الدفع",
        variant: "destructive"
      });
    }
  });

  const handleApprove = (promotionId: string) => {
    approvePromotionMutation.mutate(promotionId);
  };

  const handleReject = (promotion: any) => {
    setSelectedPromotion(promotion);
    setIsRejectDialogOpen(true);
  };

  const handleConfirmReject = () => {
    if (selectedPromotion && rejectionReason.trim()) {
      rejectPromotionMutation.mutate({
        promotionId: selectedPromotion.id,
        reason: rejectionReason
      });
    }
  };

  const handleMarkPaid = (promotion: any) => {
    updatePaymentMutation.mutate({
      promotionId: promotion.id,
      paymentStatus: 'paid',
      paidAmount: promotion.totalPrice
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: any }> = {
      pending: { label: "قيد المراجعة", variant: "secondary", icon: Clock },
      active: { label: "نشط", variant: "default", icon: CheckCircle2 },
      rejected: { label: "مرفوض", variant: "destructive", icon: XCircle },
      expired: { label: "منتهي", variant: "outline", icon: Clock }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const renderPromotionCard = (promotion: Promotion, showActions = false) => {
    return (
      <Card key={promotion.id} data-testid={`card-promotion-${promotion.id}`}>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold">
                    {PROMOTION_TYPE_LABELS[promotion.promotionType] || promotion.promotionType}
                  </h3>
                  {getStatusBadge(promotion.status)}
                </div>
                
                <p className="text-sm text-muted-foreground mb-3">{promotion.description}</p>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span>{TIER_LABELS[promotion.subscriptionTier]}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>{format(new Date(promotion.startDate), 'dd MMM', { locale: ar })}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-muted-foreground" />
                    <span>{promotion.viewCount || 0} مشاهدة</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MousePointerClick className="w-4 h-4 text-muted-foreground" />
                    <span>{promotion.clickCount || 0} نقرة</span>
                  </div>
                </div>
              </div>
              
              <div className="text-left">
                <div className="text-2xl font-bold text-primary mb-1">
                  {promotion.totalPrice} د
                </div>
                <Badge 
                  variant={promotion.paymentStatus === 'paid' ? 'default' : 'secondary'}
                  data-testid={`badge-payment-${promotion.id}`}
                >
                  {promotion.paymentStatus === 'paid' ? 'مدفوع' : 'غير مدفوع'}
                </Badge>
              </div>
            </div>
            
            {showActions && promotion.status === 'pending' && (
              <div className="flex gap-2 pt-3 border-t">
                {promotion.paymentStatus !== 'paid' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleMarkPaid(promotion)}
                    disabled={updatePaymentMutation.isPending}
                    data-testid={`button-mark-paid-${promotion.id}`}
                  >
                    <DollarSign className="w-4 h-4 ml-2" />
                    تأكيد الدفع
                  </Button>
                )}
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => handleApprove(promotion.id)}
                  disabled={approvePromotionMutation.isPending}
                  data-testid={`button-approve-${promotion.id}`}
                >
                  <CheckCircle2 className="w-4 h-4 ml-2" />
                  موافقة
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleReject(promotion)}
                  disabled={rejectPromotionMutation.isPending}
                  data-testid={`button-reject-${promotion.id}`}
                >
                  <XCircle className="w-4 h-4 ml-2" />
                  رفض
                </Button>
              </div>
            )}
            
            {promotion.rejectionReason && (
              <div className="p-3 bg-destructive/10 rounded-lg">
                <p className="text-sm text-destructive font-medium">
                  سبب الرفض: {promotion.rejectionReason}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <AdminLayout>
      <div className="container mx-auto p-6 space-y-6" dir="rtl">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">إدارة الإعلانات</h1>
            <p className="text-muted-foreground">إدارة طلبات الترويج والإعدادات</p>
          </div>
          <Settings className="w-8 h-8 text-muted-foreground" />
        </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending" data-testid="tab-pending">
            قيد المراجعة ({pendingPromotions?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="all" data-testid="tab-all">
            جميع الإعلانات ({allPromotions?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="settings" data-testid="tab-settings">
            الإعدادات
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          {isLoadingPending ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">جاري التحميل...</p>
            </div>
          ) : !pendingPromotions || pendingPromotions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Clock className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">لا توجد طلبات بانتظار المراجعة</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {pendingPromotions.map((promotion: any) => renderPromotionCard(promotion, true))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="all">
          {isLoadingAll ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">جاري التحميل...</p>
            </div>
          ) : !allPromotions || allPromotions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">لا توجد إعلانات</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {allPromotions.map((promotion: any) => renderPromotionCard(promotion, false))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="settings">
          {isLoadingSettings ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">جاري التحميل...</p>
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>إعدادات نظام الإعلانات</CardTitle>
                <CardDescription>تفعيل وتعطيل أنواع الإعلانات المختلفة</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="featured-stores" className="text-base font-medium">
                      المتاجر المميزة
                    </Label>
                    <p className="text-sm text-muted-foreground">السماح للبائعين بترويج متاجرهم</p>
                  </div>
                  <Switch
                    id="featured-stores"
                    checked={settings?.featuredStoreEnabled}
                    onCheckedChange={(checked) => 
                      updateSettingsMutation.mutate({ featuredStoreEnabled: checked })
                    }
                    data-testid="switch-featured-stores"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="sponsored-products" className="text-base font-medium">
                      المنتجات المروجة
                    </Label>
                    <p className="text-sm text-muted-foreground">السماح بترويج المنتجات</p>
                  </div>
                  <Switch
                    id="sponsored-products"
                    checked={settings?.sponsoredProductEnabled}
                    onCheckedChange={(checked) => 
                      updateSettingsMutation.mutate({ sponsoredProductEnabled: checked })
                    }
                    data-testid="switch-sponsored-products"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="boosted-posts" className="text-base font-medium">
                      المنشورات المعززة
                    </Label>
                    <p className="text-sm text-muted-foreground">السماح بتعزيز المنشورات</p>
                  </div>
                  <Switch
                    id="boosted-posts"
                    checked={settings?.boostedPostEnabled}
                    onCheckedChange={(checked) => 
                      updateSettingsMutation.mutate({ boostedPostEnabled: checked })
                    }
                    data-testid="switch-boosted-posts"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="premium-subscriptions" className="text-base font-medium">
                      الاشتراكات المميزة
                    </Label>
                    <p className="text-sm text-muted-foreground">السماح بالاشتراكات المميزة</p>
                  </div>
                  <Switch
                    id="premium-subscriptions"
                    checked={settings?.premiumSubscriptionEnabled}
                    onCheckedChange={(checked) => 
                      updateSettingsMutation.mutate({ premiumSubscriptionEnabled: checked })
                    }
                    data-testid="switch-premium-subscriptions"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="location-ads" className="text-base font-medium">
                      الإعلانات الموقعية
                    </Label>
                    <p className="text-sm text-muted-foreground">السماح بالإعلانات حسب الموقع</p>
                  </div>
                  <Switch
                    id="location-ads"
                    checked={settings?.locationAdsEnabled}
                    onCheckedChange={(checked) => 
                      updateSettingsMutation.mutate({ locationAdsEnabled: checked })
                    }
                    data-testid="switch-location-ads"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="story-ads" className="text-base font-medium">
                      القصص المروجة
                    </Label>
                    <p className="text-sm text-muted-foreground">السماح بترويج القصص</p>
                  </div>
                  <Switch
                    id="story-ads"
                    checked={settings?.storyAdsEnabled}
                    onCheckedChange={(checked) => 
                      updateSettingsMutation.mutate({ storyAdsEnabled: checked })
                    }
                    data-testid="switch-story-ads"
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>رفض طلب الترويج</DialogTitle>
            <DialogDescription>
              يرجى كتابة سبب رفض هذا الطلب
            </DialogDescription>
          </DialogHeader>
          
          <Textarea
            placeholder="اكتب سبب الرفض..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            className="min-h-[100px]"
            data-testid="textarea-rejection-reason"
          />

          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsRejectDialogOpen(false);
                setRejectionReason("");
                setSelectedPromotion(null);
              }}
              data-testid="button-cancel-reject"
            >
              إلغاء
            </Button>
            <Button 
              variant="destructive"
              onClick={handleConfirmReject}
              disabled={!rejectionReason.trim() || rejectPromotionMutation.isPending}
              data-testid="button-confirm-reject"
            >
              تأكيد الرفض
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </AdminLayout>
  );
}
