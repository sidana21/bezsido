import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  ArrowLeft, ShoppingCart, Plus, Minus, Trash2, CreditCard, 
  MapPin, Phone, User, Package, CheckCircle 
} from "lucide-react";
import { Link, useLocation } from "wouter";
import type { User as UserType } from "@shared/schema";

interface CartItem {
  id: string;
  userId: string;
  productId: string;
  quantity: string;
  addedAt: Date;
  product: {
    id: string;
    name: string;
    description: string;
    price: string;
    imageUrl: string | null;
    category: string;
    owner: UserType;
  };
}

const checkoutFormSchema = z.object({
  customerName: z.string().min(1, "الاسم مطلوب"),
  customerPhone: z.string().min(1, "رقم الهاتف مطلوب"),
  deliveryAddress: z.string().min(1, "عنوان التسليم مطلوب"),
  notes: z.string().optional(),
});

type CheckoutFormData = z.infer<typeof checkoutFormSchema>;

export default function Cart() {
  const [isCheckoutDialogOpen, setIsCheckoutDialogOpen] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState<string | null>(null);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: currentUser } = useQuery<UserType>({
    queryKey: ["/api/user/current"],
  });

  const { data: cartItems = [], isLoading } = useQuery<CartItem[]>({
    queryKey: ["/api/cart"],
  });

  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      customerName: currentUser?.name || "",
      customerPhone: currentUser?.phoneNumber || "",
      deliveryAddress: "",
      notes: "",
    },
  });

  const updateQuantityMutation = useMutation({
    mutationFn: async ({ productId, quantity }: { productId: string; quantity: string }) => {
      return apiRequest(`/api/cart/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في تحديث الكمية",
        variant: "destructive",
      });
    },
  });

  const removeItemMutation = useMutation({
    mutationFn: async (productId: string) => {
      return apiRequest(`/api/cart/${productId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "تم الحذف",
        description: "تم حذف المنتج من السلة",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في حذف المنتج",
        variant: "destructive",
      });
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: async ({ sellerItems, formData }: { sellerItems: CartItem[]; formData: CheckoutFormData }) => {
      const totalAmount = sellerItems.reduce(
        (sum, item) => sum + parseFloat(item.product.price) * parseInt(item.quantity),
        0
      );

      return apiRequest("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order: {
            sellerId: sellerItems[0].product.owner.id,
            storeId: null,
            totalAmount: totalAmount.toString(),
            paymentMethod: "cash_on_delivery",
            deliveryAddress: formData.deliveryAddress,
            customerPhone: formData.customerPhone,
            customerName: formData.customerName,
            notes: formData.notes || null,
          },
          items: sellerItems.map(item => ({
            productId: item.productId,
            productName: item.product.name,
            productPrice: item.product.price,
            quantity: item.quantity,
            subtotal: (parseFloat(item.product.price) * parseInt(item.quantity)).toString(),
          })),
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders/user"] });
      toast({
        title: "تم إنشاء الطلب",
        description: "تم إنشاء طلبك بنجاح! سيتواصل معك البائع قريباً",
      });
      setIsCheckoutDialogOpen(false);
      form.reset();
      setLocation("/orders");
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في إنشاء الطلب",
        variant: "destructive",
      });
    },
  });

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    updateQuantityMutation.mutate({ productId, quantity: newQuantity.toString() });
  };

  const removeItem = (productId: string) => {
    removeItemMutation.mutate(productId);
  };

  // Group cart items by seller
  const itemsBySeller = cartItems.reduce((acc, item) => {
    const sellerId = item.product.owner.id;
    if (!acc[sellerId]) {
      acc[sellerId] = [];
    }
    acc[sellerId].push(item);
    return acc;
  }, {} as Record<string, CartItem[]>);

  const handleCheckout = (sellerId: string) => {
    setSelectedSeller(sellerId);
    setIsCheckoutDialogOpen(true);
  };

  const onSubmitCheckout = (data: CheckoutFormData) => {
    if (!selectedSeller) return;
    const sellerItems = itemsBySeller[selectedSeller];
    createOrderMutation.mutate({ sellerItems, formData: data });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="text-center">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      {/* Header */}
      <div className="bg-whatsapp-green text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/stores">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-green-600 w-12 h-12 rounded-full"
                data-testid="button-back"
              >
                <ArrowLeft className="w-6 h-6" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">السلة</h1>
          </div>
          <Badge variant="secondary" className="bg-white text-whatsapp-green">
            {cartItems.length} عنصر
          </Badge>
        </div>
      </div>

      <div className="p-4">
        {cartItems.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCart className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h2 className="text-xl font-semibold mb-2">السلة فارغة</h2>
            <p className="text-gray-500 mb-6">ابدأ بإضافة المنتجات إلى سلتك</p>
            <Link href="/stores">
              <Button className="bg-whatsapp-green hover:bg-green-600">
                تصفح المتاجر
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(itemsBySeller).map(([sellerId, sellerItems]) => {
              const seller = sellerItems[0].product.owner;
              const totalAmount = sellerItems.reduce(
                (sum, item) => sum + parseFloat(item.product.price) * parseInt(item.quantity),
                0
              );

              return (
                <Card key={sellerId} className="overflow-hidden" data-testid={`seller-cart-${sellerId}`}>
                  <CardHeader className="bg-gray-50 dark:bg-gray-800">
                    <CardTitle className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <User className="w-5 h-5" />
                        <span>{seller.name}</span>
                      </div>
                      <Badge variant="outline">{sellerItems.length} منتج</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {sellerItems.map((item) => (
                      <div key={item.id} className="border-b last:border-b-0 p-4" data-testid={`cart-item-${item.id}`}>
                        <div className="flex gap-4">
                          {item.product.imageUrl && (
                            <img
                              src={item.product.imageUrl}
                              alt={item.product.name}
                              className="w-20 h-20 object-cover rounded-lg"
                            />
                          )}
                          {!item.product.imageUrl && (
                            <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                              <Package className="w-8 h-8 text-gray-400" />
                            </div>
                          )}
                          
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg mb-1">{item.product.name}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                              {item.product.description}
                            </p>
                            <Badge variant="outline" className="text-xs mb-2">
                              {item.product.category}
                            </Badge>
                            
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateQuantity(item.productId, parseInt(item.quantity) - 1)}
                                  disabled={parseInt(item.quantity) <= 1 || updateQuantityMutation.isPending}
                                  data-testid={`button-decrease-${item.id}`}
                                >
                                  <Minus className="w-3 h-3" />
                                </Button>
                                <span className="w-8 text-center font-medium">{item.quantity}</span>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateQuantity(item.productId, parseInt(item.quantity) + 1)}
                                  disabled={updateQuantityMutation.isPending}
                                  data-testid={`button-increase-${item.id}`}
                                >
                                  <Plus className="w-3 h-3" />
                                </Button>
                              </div>
                              
                              <div className="flex items-center gap-3">
                                <span className="text-lg font-bold text-whatsapp-green">
                                  {(parseFloat(item.product.price) * parseInt(item.quantity)).toLocaleString()} دج
                                </span>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => removeItem(item.productId)}
                                  disabled={removeItemMutation.isPending}
                                  data-testid={`button-remove-${item.id}`}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    <div className="p-4 bg-gray-50 dark:bg-gray-800">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-lg font-semibold">المجموع الفرعي:</span>
                        <span className="text-xl font-bold text-whatsapp-green">
                          {totalAmount.toLocaleString()} دج
                        </span>
                      </div>
                      <Button 
                        className="w-full bg-whatsapp-green hover:bg-green-600"
                        onClick={() => handleCheckout(sellerId)}
                        disabled={createOrderMutation.isPending}
                        data-testid={`button-checkout-${sellerId}`}
                      >
                        <CreditCard className="w-4 h-4 ml-2" />
                        طلب من {seller.name} - دفع عند الاستلام
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Checkout Dialog */}
      <Dialog open={isCheckoutDialogOpen} onOpenChange={setIsCheckoutDialogOpen}>
        <DialogContent className="max-w-md" data-testid="checkout-modal">
          <DialogHeader>
            <DialogTitle>إتمام الطلب - دفع عند الاستلام</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmitCheckout)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customerName">الاسم الكامل *</Label>
              <Input
                id="customerName"
                {...form.register("customerName")}
                placeholder="أدخل اسمك الكامل"
                data-testid="input-customer-name"
              />
              {form.formState.errors.customerName && (
                <p className="text-sm text-red-500">{form.formState.errors.customerName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerPhone">رقم الهاتف *</Label>
              <Input
                id="customerPhone"
                {...form.register("customerPhone")}
                placeholder="+213555123456"
                data-testid="input-customer-phone"
              />
              {form.formState.errors.customerPhone && (
                <p className="text-sm text-red-500">{form.formState.errors.customerPhone.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="deliveryAddress">عنوان التسليم *</Label>
              <Textarea
                id="deliveryAddress"
                {...form.register("deliveryAddress")}
                placeholder="أدخل العنوان الكامل للتسليم"
                data-testid="input-delivery-address"
              />
              {form.formState.errors.deliveryAddress && (
                <p className="text-sm text-red-500">{form.formState.errors.deliveryAddress.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">ملاحظات إضافية</Label>
              <Textarea
                id="notes"
                {...form.register("notes")}
                placeholder="أي ملاحظات أو تعليمات خاصة..."
                data-testid="input-notes"
              />
            </div>

            {selectedSeller && (
              <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                <div className="flex items-center gap-2 text-green-800 dark:text-green-200 mb-2">
                  <CheckCircle className="w-4 h-4" />
                  <span className="font-semibold">طريقة الدفع: نقداً عند الاستلام</span>
                </div>
                <p className="text-sm text-green-600 dark:text-green-300">
                  ستدفع المبلغ نقداً عند استلام الطلب
                </p>
              </div>
            )}

            <div className="flex justify-end space-x-2 space-x-reverse">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCheckoutDialogOpen(false)}
                data-testid="button-cancel-checkout"
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                disabled={createOrderMutation.isPending}
                className="bg-whatsapp-green hover:bg-green-600"
                data-testid="button-submit-order"
              >
                {createOrderMutation.isPending ? "جاري الإرسال..." : "تأكيد الطلب"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}