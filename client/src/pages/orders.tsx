import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  ArrowLeft, Package, User, MapPin, Phone, Calendar, 
  CheckCircle, Clock, Truck, XCircle, AlertCircle 
} from "lucide-react";
import { Link } from "wouter";
import type { User as UserType } from "@shared/schema";

interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productPrice: string;
  quantity: string;
  subtotal: string;
  product: {
    id: string;
    name: string;
    imageUrl: string | null;
    category: string;
  };
}

interface Order {
  id: string;
  buyerId: string;
  sellerId: string;
  storeId: string | null;
  totalAmount: string;
  status: string;
  paymentMethod: string;
  deliveryAddress: string;
  customerPhone: string;
  customerName: string;
  notes: string | null;
  orderDate: Date;
  confirmedAt: Date | null;
  deliveredAt: Date | null;
  cancelledAt: Date | null;
  cancellationReason: string | null;
  items: OrderItem[];
  seller: UserType;
  buyer?: UserType;
}

export default function Orders() {
  const [activeTab, setActiveTab] = useState("user");
  const { toast } = useToast();

  const { data: currentUser } = useQuery<UserType>({
    queryKey: ["/api/user/current"],
  });

  const { data: userOrders = [], isLoading: isLoadingUserOrders } = useQuery<Order[]>({
    queryKey: ["/api/orders/user"],
    enabled: activeTab === "user",
  });

  const { data: sellerOrders = [], isLoading: isLoadingSellerOrders } = useQuery<Order[]>({
    queryKey: ["/api/orders/seller"],
    enabled: activeTab === "seller",
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      return apiRequest(`/api/orders/${orderId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders/seller"] });
      toast({
        title: "تم التحديث",
        description: "تم تحديث حالة الطلب بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في تحديث حالة الطلب",
        variant: "destructive",
      });
    },
  });

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "pending":
        return { 
          label: "في الانتظار", 
          color: "bg-yellow-500", 
          icon: Clock,
          description: "الطلب في انتظار موافقة البائع"
        };
      case "confirmed":
        return { 
          label: "مؤكد", 
          color: "bg-blue-500", 
          icon: CheckCircle,
          description: "تم تأكيد الطلب من البائع"
        };
      case "prepared":
        return { 
          label: "جاهز", 
          color: "bg-purple-500", 
          icon: Package,
          description: "الطلب جاهز للتسليم"
        };
      case "delivered":
        return { 
          label: "تم التسليم", 
          color: "bg-green-500", 
          icon: CheckCircle,
          description: "تم تسليم الطلب بنجاح"
        };
      case "cancelled":
        return { 
          label: "ملغى", 
          color: "bg-red-500", 
          icon: XCircle,
          description: "تم إلغاء الطلب"
        };
      default:
        return { 
          label: status, 
          color: "bg-gray-500", 
          icon: AlertCircle,
          description: ""
        };
    }
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "غير محدد";
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('ar', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const updateOrderStatus = (orderId: string, status: string) => {
    updateStatusMutation.mutate({ orderId, status });
  };

  const renderOrderCard = (order: Order, isSellerView: boolean = false) => {
    const statusInfo = getStatusInfo(order.status);
    const StatusIcon = statusInfo.icon;

    return (
      <Card key={order.id} className="overflow-hidden" data-testid={`order-card-${order.id}`}>
        <CardHeader className="pb-4">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg mb-2">
                طلب #{order.id.slice(0, 8)}
              </CardTitle>
              <div className="flex items-center gap-2 mb-2">
                {isSellerView ? (
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <User className="w-4 h-4" />
                    <span>{order.customerName}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <User className="w-4 h-4" />
                    <span>البائع: {order.seller.name}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(order.orderDate)}</span>
              </div>
            </div>
            <div className="text-left">
              <Badge className={`${statusInfo.color} text-white mb-2`}>
                <StatusIcon className="w-3 h-3 ml-1" />
                {statusInfo.label}
              </Badge>
              <div className="text-lg font-bold text-whatsapp-green">
                {parseInt(order.totalAmount).toLocaleString()} دج
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Order Items */}
          <div className="space-y-3">
            <h4 className="font-semibold">المنتجات:</h4>
            {order.items.map((item) => (
              <div key={item.id} className="flex gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                {item.product.imageUrl && (
                  <img
                    src={item.product.imageUrl}
                    alt={item.productName}
                    className="w-12 h-12 object-cover rounded"
                  />
                )}
                {!item.product.imageUrl && (
                  <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                    <Package className="w-4 h-4 text-gray-400" />
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h5 className="font-medium">{item.productName}</h5>
                      <Badge variant="outline" className="text-xs">
                        {item.product.category}
                      </Badge>
                    </div>
                    <div className="text-left">
                      <div className="text-sm text-gray-600">
                        {item.quantity} × {parseInt(item.productPrice).toLocaleString()} دج
                      </div>
                      <div className="font-semibold">
                        {parseInt(item.subtotal).toLocaleString()} دج
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Delivery Info */}
          <div className="space-y-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <h4 className="font-semibold text-blue-800 dark:text-blue-200">معلومات التسليم:</h4>
            <div className="space-y-1 text-sm">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 text-blue-600" />
                <span>{order.deliveryAddress}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-blue-600" />
                <span>{order.customerPhone}</span>
              </div>
              <div className="text-blue-600 dark:text-blue-300 font-medium">
                الدفع: نقداً عند الاستلام
              </div>
            </div>
            {order.notes && (
              <div className="mt-2 p-2 bg-blue-100 dark:bg-blue-900 rounded text-sm">
                <strong>ملاحظات:</strong> {order.notes}
              </div>
            )}
          </div>

          {/* Status Description */}
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {statusInfo.description}
            </p>
            {order.status === "cancelled" && order.cancellationReason && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                <strong>سبب الإلغاء:</strong> {order.cancellationReason}
              </p>
            )}
          </div>

          {/* Seller Actions */}
          {isSellerView && order.status !== "cancelled" && order.status !== "delivered" && (
            <div className="flex gap-2 pt-3 border-t">
              {order.status === "pending" && (
                <>
                  <Button 
                    size="sm"
                    onClick={() => updateOrderStatus(order.id, "confirmed")}
                    disabled={updateStatusMutation.isPending}
                    className="bg-blue-500 hover:bg-blue-600"
                    data-testid={`button-confirm-${order.id}`}
                  >
                    <CheckCircle className="w-3 h-3 ml-1" />
                    تأكيد الطلب
                  </Button>
                  <Button 
                    size="sm"
                    variant="destructive"
                    onClick={() => updateOrderStatus(order.id, "cancelled")}
                    disabled={updateStatusMutation.isPending}
                    data-testid={`button-cancel-${order.id}`}
                  >
                    <XCircle className="w-3 h-3 ml-1" />
                    رفض الطلب
                  </Button>
                </>
              )}
              {order.status === "confirmed" && (
                <Button 
                  size="sm"
                  onClick={() => updateOrderStatus(order.id, "prepared")}
                  disabled={updateStatusMutation.isPending}
                  className="bg-purple-500 hover:bg-purple-600"
                  data-testid={`button-prepare-${order.id}`}
                >
                  <Package className="w-3 h-3 ml-1" />
                  جاهز للتسليم
                </Button>
              )}
              {order.status === "prepared" && (
                <Button 
                  size="sm"
                  onClick={() => updateOrderStatus(order.id, "delivered")}
                  disabled={updateStatusMutation.isPending}
                  className="bg-green-500 hover:bg-green-600"
                  data-testid={`button-deliver-${order.id}`}
                >
                  <Truck className="w-3 h-3 ml-1" />
                  تم التسليم
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

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
            <h1 className="text-2xl font-bold">الطلبات</h1>
          </div>
        </div>
      </div>

      <div className="p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="user" data-testid="tab-user-orders">طلباتي</TabsTrigger>
            <TabsTrigger value="seller" data-testid="tab-seller-orders">طلبات المتجر</TabsTrigger>
          </TabsList>

          <TabsContent value="user" className="space-y-4">
            {isLoadingUserOrders ? (
              <div className="text-center py-8">جاري التحميل...</div>
            ) : userOrders.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h2 className="text-xl font-semibold mb-2">لا توجد طلبات</h2>
                <p className="text-gray-500 mb-6">لم تقم بإنشاء أي طلبات حتى الآن</p>
                <Link href="/stores">
                  <Button className="bg-whatsapp-green hover:bg-green-600">
                    ابدأ التسوق
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {userOrders.map((order) => renderOrderCard(order, false))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="seller" className="space-y-4">
            {isLoadingSellerOrders ? (
              <div className="text-center py-8">جاري التحميل...</div>
            ) : sellerOrders.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h2 className="text-xl font-semibold mb-2">لا توجد طلبات</h2>
                <p className="text-gray-500 mb-6">لا توجد طلبات في متجرك حتى الآن</p>
                <Link href="/my-store">
                  <Button className="bg-whatsapp-green hover:bg-green-600">
                    إدارة المتجر
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {sellerOrders.map((order) => renderOrderCard(order, true))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}