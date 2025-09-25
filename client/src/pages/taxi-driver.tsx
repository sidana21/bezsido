import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Car, 
  MapPin, 
  Navigation, 
  Clock, 
  DollarSign, 
  Star, 
  Phone,
  MessageCircle,
  Users,
  Settings,
  Zap,
  Check,
  AlertCircle,
  Loader2,
  Route,
  Calendar,
  Shield,
  ToggleLeft,
  ToggleRight,
  Smartphone,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Driver service form schema
const driverServiceSchema = z.object({
  vehicleType: z.string().min(1, "نوع المركبة مطلوب"),
  vehicleModel: z.string().min(2, "موديل المركبة مطلوب"),
  vehicleColor: z.string().min(2, "لون المركبة مطلوب"),
  plateNumber: z.string().min(3, "رقم اللوحة مطلوب"),
  maxCapacity: z.string().min(1, "السعة القصوى مطلوبة"),
  basePrice: z.string().min(1, "السعر الأساسي مطلوب"),
  pricePerKm: z.string().min(1, "سعر الكيلومتر مطلوب"),
  serviceAreas: z.string().min(2, "مناطق الخدمة مطلوبة"),
  workingHours: z.object({
    start: z.string(),
    end: z.string(),
  }),
  isAvailable24x7: z.boolean().default(false),
  features: z.string().optional(),
});

type DriverServiceForm = z.infer<typeof driverServiceSchema>;

interface TaxiBooking {
  id: string;
  pickupLocation: string;
  destination: string;
  passengerCount: number;
  estimatedPrice: number;
  status: 'pending' | 'accepted' | 'picked_up' | 'completed' | 'cancelled';
  scheduledTime?: string;
  notes?: string;
  customer: {
    name: string;
    phone: string;
    avatar?: string;
  };
  createdAt: string;
}

interface DriverStats {
  totalRides: number;
  totalEarnings: number;
  averageRating: number;
  totalReviews: number;
  completionRate: number;
  onlineHours: number;
}

interface DriverService {
  id: string;
  isActive: boolean;
  availability: string;
  vehicleType: string;
  vehicleModel: string;
  vehicleColor: string;
  plateNumber: string;
  maxCapacity: number;
  basePrice: number;
  pricePerKm: number;
  serviceAreas: string[];
  workingHours: any;
  isAvailable24x7: boolean;
  features: string[];
}

const VEHICLE_TYPES = [
  { id: "sedan", name: "سيدان", icon: "🚗" },
  { id: "suv", name: "دفع رباعي", icon: "🚙" },
  { id: "luxury", name: "فاخرة", icon: "🚘" },
  { id: "van", name: "فان", icon: "🚐" },
  { id: "pickup", name: "بيك آب", icon: "🛻" },
];

export default function TaxiDriverPage() {
  const [isOnline, setIsOnline] = useState(false);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<TaxiBooking | null>(null);
  
  const { toast } = useToast();

  const form = useForm<DriverServiceForm>({
    resolver: zodResolver(driverServiceSchema),
    defaultValues: {
      vehicleType: "",
      vehicleModel: "",
      vehicleColor: "",
      plateNumber: "",
      maxCapacity: "4",
      basePrice: "100",
      pricePerKm: "50",
      serviceAreas: "",
      workingHours: {
        start: "06:00",
        end: "22:00",
      },
      isAvailable24x7: false,
      features: "",
    },
  });

  // Get driver service
  const { data: driverService, isLoading: serviceLoading } = useQuery<DriverService>({
    queryKey: ['/api/taxi/driver/service'],
  });

  // Get pending bookings
  const { data: pendingBookings = [], isLoading: bookingsLoading } = useQuery<TaxiBooking[]>({
    queryKey: ['/api/taxi/driver/bookings'],
    enabled: isOnline,
    refetchInterval: isOnline ? 5000 : false, // Poll every 5 seconds when online
  });

  // Get driver stats
  const { data: driverStats } = useQuery<DriverStats>({
    queryKey: ['/api/taxi/driver/stats'],
  });

  // Create/Update service mutation
  const saveServiceMutation = useMutation({
    mutationFn: async (data: DriverServiceForm) => {
      const serviceData = {
        ...data,
        maxCapacity: parseInt(data.maxCapacity),
        basePrice: parseFloat(data.basePrice),
        pricePerKm: parseFloat(data.pricePerKm),
        serviceAreas: data.serviceAreas.split(',').map(area => area.trim()),
        features: data.features ? data.features.split(',').map(f => f.trim()) : [],
        serviceType: 'taxi',
        isActive: true,
      };

      const url = driverService 
        ? `/api/taxi/driver/service/${driverService.id}`
        : '/api/taxi/driver/service';
      
      return apiRequest(url, {
        method: driverService ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serviceData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/taxi/driver/service'] });
      setShowServiceForm(false);
      toast({
        title: "تم حفظ الخدمة",
        description: "تم حفظ بيانات خدمة التاكسي بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في حفظ بيانات الخدمة",
        variant: "destructive",
      });
    },
  });

  // Toggle online status
  const toggleOnlineMutation = useMutation({
    mutationFn: async (online: boolean) => {
      return apiRequest('/api/taxi/driver/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ availability: online ? 'available' : 'offline' }),
      });
    },
    onSuccess: (_, online) => {
      setIsOnline(online);
      toast({
        title: online ? "أصبحت متصلاً" : "أصبحت غير متصل",
        description: online ? "يمكنك الآن استقبال طلبات الحجز" : "لن تستقبل طلبات جديدة",
      });
    },
  });

  // Accept booking mutation
  const acceptBookingMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      return apiRequest(`/api/taxi/bookings/${bookingId}/accept`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/taxi/driver/bookings'] });
      toast({
        title: "تم قبول الحجز",
        description: "تم قبول طلب الحجز بنجاح",
      });
    },
  });

  // Update booking status mutation
  const updateBookingStatusMutation = useMutation({
    mutationFn: async ({ bookingId, status }: { bookingId: string; status: string }) => {
      return apiRequest(`/api/taxi/bookings/${bookingId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/taxi/driver/bookings'] });
      setSelectedBooking(null);
    },
  });

  const onSubmit = (data: DriverServiceForm) => {
    saveServiceMutation.mutate(data);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-blue-100 text-blue-800';
      case 'picked_up': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'في انتظار القبول';
      case 'accepted': return 'تم القبول';
      case 'picked_up': return 'تم الاستلام';
      case 'completed': return 'مكتمل';
      case 'cancelled': return 'ملغى';
      default: return status;
    }
  };

  // Load existing service data
  useEffect(() => {
    if (driverService) {
      form.reset({
        vehicleType: driverService.vehicleType,
        vehicleModel: driverService.vehicleModel,
        vehicleColor: driverService.vehicleColor,
        plateNumber: driverService.plateNumber,
        maxCapacity: driverService.maxCapacity.toString(),
        basePrice: driverService.basePrice.toString(),
        pricePerKm: driverService.pricePerKm.toString(),
        serviceAreas: driverService.serviceAreas.join(', '),
        workingHours: driverService.workingHours || { start: '06:00', end: '22:00' },
        isAvailable24x7: driverService.isAvailable24x7,
        features: driverService.features.join(', '),
      });
      setIsOnline(driverService.availability === 'available');
    }
  }, [driverService, form]);

  // If showing specific booking details
  if (selectedBooking) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900" dir="rtl">
        <div className="container mx-auto px-4 py-6 max-w-md">
          <div className="flex items-center gap-2 mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedBooking(null)}
            >
              ← الرجوع
            </Button>
            <h1 className="text-xl font-bold">تفاصيل الحجز</h1>
          </div>

          <Card className="mb-4">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>معلومات العميل</CardTitle>
                <Badge className={getStatusColor(selectedBooking.status)}>
                  {getStatusText(selectedBooking.status)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-4">
                <Avatar>
                  <AvatarImage src={selectedBooking.customer.avatar} />
                  <AvatarFallback>
                    {selectedBooking.customer.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-medium">{selectedBooking.customer.name}</h3>
                  <p className="text-gray-600">{selectedBooking.customer.phone}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline">
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-4">
            <CardHeader>
              <CardTitle>تفاصيل الرحلة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium">نقطة الانطلاق</p>
                  <p className="text-gray-600">{selectedBooking.pickupLocation}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-3 h-3 bg-red-500 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium">الوجهة</p>
                  <p className="text-gray-600">{selectedBooking.destination}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                <div>
                  <p className="text-gray-600">عدد الركاب</p>
                  <p className="font-medium">{selectedBooking.passengerCount}</p>
                </div>
                <div>
                  <p className="text-gray-600">التكلفة</p>
                  <p className="font-medium text-green-600">
                    {selectedBooking.estimatedPrice.toLocaleString()} دج
                  </p>
                </div>
              </div>

              {selectedBooking.notes && (
                <div className="pt-2 border-t">
                  <p className="text-gray-600">ملاحظات</p>
                  <p className="font-medium">{selectedBooking.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-3">
            {selectedBooking.status === 'pending' && (
              <Button
                className="w-full bg-green-600 hover:bg-green-700"
                onClick={() => acceptBookingMutation.mutate(selectedBooking.id)}
                disabled={acceptBookingMutation.isPending}
              >
                {acceptBookingMutation.isPending ? 'جارٍ القبول...' : 'قبول الحجز'}
              </Button>
            )}

            {selectedBooking.status === 'accepted' && (
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700"
                onClick={() => updateBookingStatusMutation.mutate({
                  bookingId: selectedBooking.id,
                  status: 'picked_up'
                })}
              >
                تأكيد الاستلام
              </Button>
            )}

            {selectedBooking.status === 'picked_up' && (
              <Button
                className="w-full bg-purple-600 hover:bg-purple-700"
                onClick={() => updateBookingStatusMutation.mutate({
                  bookingId: selectedBooking.id,
                  status: 'completed'
                })}
              >
                إنهاء الرحلة
              </Button>
            )}

            {['pending', 'accepted'].includes(selectedBooking.status) && (
              <Button
                variant="destructive"
                className="w-full"
                onClick={() => updateBookingStatusMutation.mutate({
                  bookingId: selectedBooking.id,
                  status: 'cancelled'
                })}
              >
                إلغاء الحجز
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900" dir="rtl">
      <div className="container mx-auto px-4 py-6 max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              لوحة السائق
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              إدارة خدمة التاكسي الخاصة بك
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className={cn("text-sm", isOnline ? "text-green-600" : "text-gray-600")}>
                {isOnline ? "متصل" : "غير متصل"}
              </span>
              <Switch
                checked={isOnline}
                onCheckedChange={(checked) => toggleOnlineMutation.mutate(checked)}
                disabled={toggleOnlineMutation.isPending}
              />
            </div>
          </div>
        </div>

        {/* Driver Stats */}
        {driverStats && (
          <div className="grid grid-cols-2 gap-3 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{driverStats.totalRides}</p>
                  <p className="text-sm text-gray-600">إجمالي الرحلات</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {driverStats.totalEarnings.toLocaleString()} دج
                  </p>
                  <p className="text-sm text-gray-600">إجمالي الأرباح</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <p className="text-2xl font-bold text-yellow-600">
                      {driverStats.averageRating.toFixed(1)}
                    </p>
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  </div>
                  <p className="text-sm text-gray-600">التقييم</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">
                    {Math.round(driverStats.completionRate)}%
                  </p>
                  <p className="text-sm text-gray-600">معدل الإنجاز</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Service Status */}
        {!driverService ? (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>إعداد خدمة التاكسي</CardTitle>
              <CardDescription>
                أدخل بيانات مركبتك لبدء تقديم خدمة التاكسي
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => setShowServiceForm(true)}
                className="w-full"
              >
                <Car className="h-4 w-4 ml-2" />
                إعداد الخدمة
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>خدمة التاكسي</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowServiceForm(true)}
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">المركبة</span>
                  <span className="font-medium">
                    {driverService.vehicleModel} • {driverService.vehicleColor}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">رقم اللوحة</span>
                  <span className="font-medium">{driverService.plateNumber}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">السعر الأساسي</span>
                  <span className="font-medium">{driverService.basePrice} دج</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">سعر الكيلومتر</span>
                  <span className="font-medium">{driverService.pricePerKm} دج</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pending Bookings */}
        {isOnline && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                طلبات الحجز
                {pendingBookings.length > 0 && (
                  <Badge className="bg-red-500">{pendingBookings.length}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {bookingsLoading ? (
                <div className="text-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  <p className="text-sm text-gray-600 mt-2">جارٍ تحميل الطلبات...</p>
                </div>
              ) : pendingBookings.length === 0 ? (
                <div className="text-center py-4">
                  <Car className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-600">لا توجد طلبات حجز جديدة</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                      onClick={() => setSelectedBooking(booking)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-sm">
                            {booking.pickupLocation} ← {booking.destination}
                          </p>
                          <div className="flex items-center gap-4 mt-1 text-xs text-gray-600">
                            <span>{booking.passengerCount} ركاب</span>
                            <span>{booking.estimatedPrice.toLocaleString()} دج</span>
                          </div>
                        </div>
                        <Badge className={getStatusColor(booking.status)}>
                          {getStatusText(booking.status)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Service Setup Form */}
        {showServiceForm && (
          <div className="fixed inset-0 z-50 bg-white">
            <div className="container mx-auto px-4 py-6 max-w-md">
              <div className="flex items-center gap-2 mb-6">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowServiceForm(false)}
                >
                  ← الرجوع
                </Button>
                <h1 className="text-xl font-bold">إعداد خدمة التاكسي</h1>
              </div>

              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>معلومات المركبة</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="vehicleType">نوع المركبة *</Label>
                      <Select
                        value={form.watch('vehicleType')}
                        onValueChange={(value) => form.setValue('vehicleType', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="اختر نوع المركبة" />
                        </SelectTrigger>
                        <SelectContent>
                          {VEHICLE_TYPES.map((type) => (
                            <SelectItem key={type.id} value={type.id}>
                              {type.icon} {type.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="vehicleModel">الموديل *</Label>
                        <Input
                          id="vehicleModel"
                          {...form.register('vehicleModel')}
                          placeholder="تويوتا كورولا"
                        />
                      </div>
                      <div>
                        <Label htmlFor="vehicleColor">اللون *</Label>
                        <Input
                          id="vehicleColor"
                          {...form.register('vehicleColor')}
                          placeholder="أبيض"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="plateNumber">رقم اللوحة *</Label>
                        <Input
                          id="plateNumber"
                          {...form.register('plateNumber')}
                          placeholder="123-456-16"
                        />
                      </div>
                      <div>
                        <Label htmlFor="maxCapacity">السعة القصوى *</Label>
                        <Select
                          value={form.watch('maxCapacity')}
                          onValueChange={(value) => form.setValue('maxCapacity', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[2, 3, 4, 5, 6, 7, 8].map(capacity => (
                              <SelectItem key={capacity} value={capacity.toString()}>
                                {capacity} ركاب
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>الأسعار</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="basePrice">السعر الأساسي (دج) *</Label>
                        <Input
                          id="basePrice"
                          type="number"
                          {...form.register('basePrice')}
                          placeholder="100"
                        />
                      </div>
                      <div>
                        <Label htmlFor="pricePerKm">سعر الكيلومتر (دج) *</Label>
                        <Input
                          id="pricePerKm"
                          type="number"
                          {...form.register('pricePerKm')}
                          placeholder="50"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>مناطق وأوقات الخدمة</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="serviceAreas">مناطق الخدمة *</Label>
                      <Textarea
                        id="serviceAreas"
                        {...form.register('serviceAreas')}
                        placeholder="الجزائر العاصمة, وهران, قسنطينة"
                        rows={2}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        اكتب المناطق مفصولة بفاصلة
                      </p>
                    </div>

                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Switch
                        id="isAvailable24x7"
                        checked={form.watch('isAvailable24x7')}
                        onCheckedChange={(checked) => form.setValue('isAvailable24x7', checked)}
                      />
                      <Label htmlFor="isAvailable24x7">متاح 24/7</Label>
                    </div>

                    {!form.watch('isAvailable24x7') && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="workingHours.start">بداية العمل</Label>
                          <Input
                            type="time"
                            {...form.register('workingHours.start')}
                          />
                        </div>
                        <div>
                          <Label htmlFor="workingHours.end">نهاية العمل</Label>
                          <Input
                            type="time"
                            {...form.register('workingHours.end')}
                          />
                        </div>
                      </div>
                    )}

                    <div>
                      <Label htmlFor="features">المميزات الإضافية</Label>
                      <Textarea
                        id="features"
                        {...form.register('features')}
                        placeholder="مكيف, واي فاي, شاحن هاتف"
                        rows={2}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        اكتب المميزات مفصولة بفاصلة
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={saveServiceMutation.isPending}
                >
                  {saveServiceMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin ml-2" />
                      جارٍ الحفظ...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 ml-2" />
                      {driverService ? 'تحديث الخدمة' : 'حفظ الخدمة'}
                    </>
                  )}
                </Button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}