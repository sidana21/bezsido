import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Megaphone, TrendingUp, Star, MapPin, DollarSign, Calendar, Eye, MousePointerClick, CheckCircle2, Clock, XCircle } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

const promotionSchema = z.object({
  promotionType: z.enum(['featured_store', 'sponsored_product', 'boosted_post', 'premium_subscription', 'location_ad', 'story_ad']),
  subscriptionTier: z.enum(['bronze', 'silver', 'gold']),
  durationDays: z.coerce.number().min(1).max(90),
  targetId: z.string().optional(),
  location: z.string().optional(),
  description: z.string().min(10).max(500)
});

type PromotionFormData = z.infer<typeof promotionSchema>;

const PROMOTION_TYPES = [
  {
    value: 'featured_store',
    label: 'متجر مميز',
    description: 'اعرض متجرك في المقدمة',
    icon: Star,
    prices: { bronze: 50, silver: 100, gold: 200 }
  },
  {
    value: 'sponsored_product',
    label: 'منتج مروّج',
    description: 'روّج لمنتج معين',
    icon: TrendingUp,
    prices: { bronze: 30, silver: 60, gold: 120 }
  },
  {
    value: 'boosted_post',
    label: 'منشور معزز',
    description: 'زد من وصول منشوراتك',
    icon: Megaphone,
    prices: { bronze: 20, silver: 40, gold: 80 }
  },
  {
    value: 'premium_subscription',
    label: 'اشتراك مميز',
    description: 'احصل على مزايا حصرية',
    icon: Star,
    prices: { bronze: 100, silver: 200, gold: 400 }
  },
  {
    value: 'location_ad',
    label: 'إعلان موقعي',
    description: 'استهدف منطقة محددة',
    icon: MapPin,
    prices: { bronze: 40, silver: 80, gold: 160 }
  },
  {
    value: 'story_ad',
    label: 'قصة مروجة',
    description: 'روّج عبر القصص',
    icon: TrendingUp,
    prices: { bronze: 25, silver: 50, gold: 100 }
  }
];

const SUBSCRIPTION_TIERS = [
  {
    value: 'bronze',
    label: 'برونزي',
    color: 'bg-amber-700',
    textColor: 'text-amber-700',
    multiplier: 1
  },
  {
    value: 'silver',
    label: 'فضي',
    color: 'bg-gray-400',
    textColor: 'text-gray-600',
    multiplier: 2
  },
  {
    value: 'gold',
    label: 'ذهبي',
    color: 'bg-yellow-500',
    textColor: 'text-yellow-600',
    multiplier: 4
  }
];

export default function PromotionsPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: vendor } = useQuery<any>({
    queryKey: ["/api/user/vendor"],
  });

  const { data: products = [] } = useQuery<any[]>({
    queryKey: ["/api/user/products"],
    enabled: !!vendor?.id
  });

  const { data: promotions, isLoading: isLoadingPromotions } = useQuery<any[]>({
    queryKey: ["/api/promotions/vendor", vendor?.id],
    enabled: !!vendor?.id
  });

  const { data: settings } = useQuery<any>({
    queryKey: ["/api/promotions/settings"]
  });

  const form = useForm<PromotionFormData>({
    resolver: zodResolver(promotionSchema),
    defaultValues: {
      promotionType: 'featured_store',
      subscriptionTier: 'bronze',
      durationDays: 7,
      description: ''
    }
  });

  const selectedType = PROMOTION_TYPES.find(t => t.value === form.watch('promotionType'));
  const selectedTier = SUBSCRIPTION_TIERS.find(t => t.value === form.watch('subscriptionTier'));
  const durationDays = form.watch('durationDays') || 7;
  
  const totalPrice = selectedType && selectedTier 
    ? selectedType.prices[selectedTier.value as keyof typeof selectedType.prices] * durationDays
    : 0;

  const createPromotionMutation = useMutation({
    mutationFn: async (data: PromotionFormData) => {
      return apiRequest('/api/promotions', {
        method: 'POST',
        body: JSON.stringify({
          ...data,
          vendorId: vendor?.id,
          totalPrice
        })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/promotions/vendor", vendor?.id] });
      toast({
        title: "تم إنشاء الطلب",
        description: "تم إرسال طلب الترويج وسيتم مراجعته قريباً",
      });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء إنشاء الطلب",
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: PromotionFormData) => {
    createPromotionMutation.mutate(data);
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

  if (!vendor) {
    return (
      <div className="container mx-auto p-6 text-center">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground mb-4">يجب أن يكون لديك متجر لاستخدام خدمات الترويج</p>
            <Button onClick={() => window.location.href = '/my-store'}>إنشاء متجر</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">خدمات الترويج</h1>
          <p className="text-muted-foreground">روّج لمتجرك ومنتجاتك للوصول لعملاء أكثر</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="gap-2" data-testid="button-create-promotion">
              <Megaphone className="w-5 h-5" />
              طلب ترويج جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
            <DialogHeader>
              <DialogTitle>طلب ترويج جديد</DialogTitle>
              <DialogDescription>
                اختر نوع الترويج والباقة المناسبة لك
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="promotionType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>نوع الترويج</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-promotion-type">
                            <SelectValue placeholder="اختر نوع الترويج" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {PROMOTION_TYPES.map(type => (
                            <SelectItem key={type.value} value={type.value}>
                              <div className="flex items-center gap-2">
                                <type.icon className="w-4 h-4" />
                                <div>
                                  <div className="font-medium">{type.label}</div>
                                  <div className="text-xs text-muted-foreground">{type.description}</div>
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="subscriptionTier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الباقة</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-subscription-tier">
                            <SelectValue placeholder="اختر الباقة" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {SUBSCRIPTION_TIERS.map(tier => (
                            <SelectItem key={tier.value} value={tier.value}>
                              <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${tier.color}`} />
                                <span className="font-medium">{tier.label}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.watch('promotionType') === 'sponsored_product' && (
                  <FormField
                    control={form.control}
                    name="targetId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>اختر المنتج</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-product">
                              <SelectValue placeholder="اختر المنتج للترويج له" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {products.map((product: any) => (
                              <SelectItem key={product.id} value={product.id}>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{product.name}</span>
                                  <span className="text-xs text-muted-foreground">({product.price} د)</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="durationDays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>المدة (بالأيام)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="1" 
                          max="90" 
                          {...field} 
                          data-testid="input-duration"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الوصف</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="اكتب وصفاً مختصراً عن الإعلان..."
                          className="min-h-[100px]"
                          {...field}
                          data-testid="textarea-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Card className="bg-muted">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-center text-lg font-bold">
                      <span>التكلفة الإجمالية:</span>
                      <div className="flex items-center gap-2 text-2xl text-primary">
                        <DollarSign className="w-6 h-6" />
                        <span data-testid="text-total-price">{totalPrice}</span>
                        <span className="text-sm">دينار</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                      الدفع نقداً فقط - سيتواصل معك الإدارة لتأكيد الدفع
                    </p>
                  </CardContent>
                </Card>

                <DialogFooter className="gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                    data-testid="button-cancel"
                  >
                    إلغاء
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createPromotionMutation.isPending}
                    data-testid="button-submit-promotion"
                  >
                    {createPromotionMutation.isPending ? "جاري الإرسال..." : "إرسال الطلب"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {PROMOTION_TYPES.map(type => (
          <Card key={type.value} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-primary/10">
                  <type.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">{type.label}</CardTitle>
                  <CardDescription>{type.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {SUBSCRIPTION_TIERS.map(tier => (
                  <div key={tier.value} className="flex justify-between items-center p-2 rounded bg-muted/50">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${tier.color}`} />
                      <span className="text-sm font-medium">{tier.label}</span>
                    </div>
                    <span className="text-sm font-bold">
                      {type.prices[tier.value as keyof typeof type.prices]} د/يوم
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">طلبات الترويج الحالية</h2>
        {isLoadingPromotions ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">جاري التحميل...</p>
          </div>
        ) : !promotions || promotions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">لا توجد طلبات ترويج حالياً</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {promotions.map((promotion: any) => {
              const type = PROMOTION_TYPES.find(t => t.value === promotion.promotionType);
              const tier = SUBSCRIPTION_TIERS.find(t => t.value === promotion.subscriptionTier);

              return (
                <Card key={promotion.id} data-testid={`card-promotion-${promotion.id}`}>
                  <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {type && <type.icon className="w-5 h-5 text-primary" />}
                          <h3 className="text-lg font-semibold">{type?.label}</h3>
                          {getStatusBadge(promotion.status)}
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-3">{promotion.description}</p>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div className="flex items-center gap-2">
                            <Star className={`w-4 h-4 ${tier?.textColor}`} />
                            <span>{tier?.label}</span>
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
                      
                      <div className="text-left md:text-right">
                        <div className="text-2xl font-bold text-primary mb-1">
                          {promotion.price} د
                        </div>
                        <Badge variant={promotion.paymentStatus === 'paid' ? 'default' : 'secondary'}>
                          {promotion.paymentStatus === 'paid' ? 'مدفوع' : 'غير مدفوع'}
                        </Badge>
                      </div>
                    </div>
                    
                    {promotion.rejectionReason && (
                      <div className="mt-3 p-3 bg-destructive/10 rounded-lg">
                        <p className="text-sm text-destructive font-medium">
                          سبب الرفض: {promotion.rejectionReason}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
