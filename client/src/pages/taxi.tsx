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
  Luggage,
  Zap,
  Check,
  AlertCircle,
  Loader2,
  Route,
  Calendar,
  Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Booking form schema
const taxiBookingSchema = z.object({
  pickupLocation: z.string().min(3, "موقع الانطلاق مطلوب"),
  destination: z.string().min(3, "الوجهة مطلوبة"),
  serviceType: z.string().min(1, "نوع الخدمة مطلوب"),
  passengerCount: z.string().default("1"),
  scheduledTime: z.string().optional(),
  notes: z.string().optional(),
});

type TaxiBookingForm = z.infer<typeof taxiBookingSchema>;

interface TaxiService {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  pricePerKm: number;
  maxCapacity: number;
  features: string[];
  estimatedDuration: number;
  availability: string;
  vendor: {
    id: string;
    displayName: string;
    logoUrl?: string;
    averageRating: number;
    totalReviews: number;
    phoneNumber?: string;
  };
  vehicle: {
    type: string;
    model: string;
    color: string;
    plateNumber: string;
  };
}

interface BookingStatus {
  id: string;
  status: 'pending' | 'confirmed' | 'driver_assigned' | 'picked_up' | 'completed' | 'cancelled';
  driver?: {
    name: string;
    phone: string;
    rating: number;
    avatar?: string;
    vehicle: {
      model: string;
      color: string;
      plateNumber: string;
    };
  };
  estimatedArrival?: string;
  totalPrice?: number;
}

const TAXI_TYPES = [
  {
    id: "economy",
    name: "اقتصادي",
    icon: "🚗",
    description: "أسعار منخفضة، سيارات عادية",
    basePriceMultiplier: 1,
  },
  {
    id: "comfort",
    name: "مريح",
    icon: "🚙",
    description: "سيارات أكبر وأكثر راحة",
    basePriceMultiplier: 1.3,
  },
  {
    id: "premium",
    name: "فاخر",
    icon: "🚘",
    description: "سيارات فاخرة مع خدمة مميزة",
    basePriceMultiplier: 2,
  },
  {
    id: "xl",
    name: "عائلي",
    icon: "🚐",
    description: "سيارات كبيرة تتسع لـ 6-8 أشخاص",
    basePriceMultiplier: 1.8,
  },
];

export default function TaxiPage() {
  const [currentBooking, setCurrentBooking] = useState<BookingStatus | null>(null);
  const [selectedService, setSelectedService] = useState<TaxiService | null>(null);
  const [estimatedPrice, setEstimatedPrice] = useState<number>(0);
  const [estimatedDistance, setEstimatedDistance] = useState<number>(0);
  const [showBookingForm, setShowBookingForm] = useState(false);
  
  const { toast } = useToast();

  const form = useForm<TaxiBookingForm>({
    resolver: zodResolver(taxiBookingSchema),
    defaultValues: {
      pickupLocation: "",
      destination: "",
      serviceType: "",
      passengerCount: "1",
      scheduledTime: "",
      notes: "",
    },
  });

  // Get available taxi services
  const { data: taxiServices = [], isLoading: servicesLoading } = useQuery<TaxiService[]>({
    queryKey: ['/api/services', 'taxi'],
    queryFn: () => apiRequest('/api/services?serviceType=taxi'),
  });

  // Simulate distance calculation
  const calculateDistance = (pickup: string, destination: string) => {
    // In real app, use Google Maps API or similar
    const randomDistance = Math.random() * 20 + 2; // 2-22 km
    setEstimatedDistance(randomDistance);
    return randomDistance;
  };

  // Calculate estimated price
  const calculatePrice = (distance: number, serviceType: string) => {
    const basePrice = 100; // Base price in DZD
    const pricePerKm = 50; // Price per km in DZD
    const typeMultiplier = TAXI_TYPES.find(t => t.id === serviceType)?.basePriceMultiplier || 1;
    
    const totalPrice = (basePrice + (distance * pricePerKm)) * typeMultiplier;
    setEstimatedPrice(totalPrice);
    return totalPrice;
  };

  // Watch form changes for price estimation
  useEffect(() => {
    const subscription = form.watch((values) => {
      if (values.pickupLocation && values.destination && values.serviceType) {
        const distance = calculateDistance(values.pickupLocation, values.destination);
        calculatePrice(distance, values.serviceType);
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form.watch]);

  // Book taxi mutation
  const bookTaxiMutation = useMutation({
    mutationFn: async (data: TaxiBookingForm) => {
      const bookingData = {
        ...data,
        passengerCount: parseInt(data.passengerCount),
        estimatedPrice,
        estimatedDistance,
        status: 'pending',
      };

      return apiRequest('/api/taxi/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData),
      });
    },
    onSuccess: (booking) => {
      setCurrentBooking(booking);
      setShowBookingForm(false);
      toast({
        title: "تم حجز التاكسي",
        description: "سيتم تأكيد الحجز وتعيين سائق قريباً",
      });
      // Start polling for booking updates
      startBookingPolling(booking.id);
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في الحجز",
        description: error.message || "فشل في حجز التاكسي",
        variant: "destructive",
      });
    },
  });

  // Cancel booking mutation
  const cancelBookingMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      return apiRequest(`/api/taxi/bookings/${bookingId}/cancel`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      setCurrentBooking(null);
      toast({
        title: "تم إلغاء الحجز",
        description: "تم إلغاء حجز التاكسي بنجاح",
      });
    },
  });

  // Simulate booking status updates
  const startBookingPolling = (bookingId: string) => {
    // In real app, this would be WebSocket or actual polling
    setTimeout(() => {
      setCurrentBooking(prev => prev ? {
        ...prev,
        status: 'confirmed',
        estimatedArrival: '5 دقائق',
      } : null);
    }, 3000);

    setTimeout(() => {
      setCurrentBooking(prev => prev ? {
        ...prev,
        status: 'driver_assigned',
        driver: {
          name: 'أحمد محمد',
          phone: '+213555123456',
          rating: 4.8,
          avatar: '',
          vehicle: {
            model: 'تويوتا كورولا',
            color: 'أبيض',
            plateNumber: '123-456-16',
          },
        },
        estimatedArrival: '3 دقائق',
      } : null);
    }, 8000);
  };

  const onSubmit = (data: TaxiBookingForm) => {
    bookTaxiMutation.mutate(data);
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'في انتظار التأكيد';
      case 'confirmed': return 'تم التأكيد';
      case 'driver_assigned': return 'تم تعيين السائق';
      case 'picked_up': return 'في الطريق';
      case 'completed': return 'مكتمل';
      case 'cancelled': return 'ملغى';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'driver_assigned': return 'bg-green-100 text-green-800';
      case 'picked_up': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Show current booking status if exists
  if (currentBooking) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900" dir="rtl">
        <div className="container mx-auto px-4 py-6 max-w-md">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              حالة الحجز
            </h1>
            <Badge className={cn('px-3 py-1', getStatusColor(currentBooking.status))}>
              {getStatusText(currentBooking.status)}
            </Badge>
          </div>

          {/* Trip Details */}
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-lg">تفاصيل الرحلة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium">نقطة الانطلاق</p>
                  <p className="text-gray-600">{form.getValues('pickupLocation')}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-3 h-3 bg-red-500 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium">الوجهة</p>
                  <p className="text-gray-600">{form.getValues('destination')}</p>
                </div>
              </div>

              {estimatedDistance > 0 && (
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-gray-600">المسافة المقدرة</span>
                  <span className="font-medium">{estimatedDistance.toFixed(1)} كم</span>
                </div>
              )}

              {currentBooking.totalPrice && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">التكلفة</span>
                  <span className="text-lg font-bold text-green-600">
                    {currentBooking.totalPrice.toLocaleString()} دج
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Driver Info */}
          {currentBooking.driver && (
            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="text-lg">معلومات السائق</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={currentBooking.driver.avatar} />
                    <AvatarFallback>
                      {currentBooking.driver.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-medium">{currentBooking.driver.name}</h3>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm text-gray-600">
                        {currentBooking.driver.rating} تقييم
                      </span>
                    </div>
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

                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="font-medium mb-1">{currentBooking.driver.vehicle.model}</p>
                  <p className="text-sm text-gray-600">
                    {currentBooking.driver.vehicle.color} • {currentBooking.driver.vehicle.plateNumber}
                  </p>
                </div>

                {currentBooking.estimatedArrival && (
                  <div className="flex items-center gap-2 mt-3 text-blue-600">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">الوصول خلال {currentBooking.estimatedArrival}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="space-y-3">
            {currentBooking.status === 'pending' && (
              <Button
                variant="destructive"
                className="w-full"
                onClick={() => cancelBookingMutation.mutate(currentBooking.id)}
                disabled={cancelBookingMutation.isPending}
              >
                {cancelBookingMutation.isPending ? 'جارٍ الإلغاء...' : 'إلغاء الحجز'}
              </Button>
            )}
            
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setCurrentBooking(null)}
            >
              حجز جديد
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900" dir="rtl">
      <div className="container mx-auto px-4 py-6 max-w-md">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            خدمة التاكسي
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            احجز تاكسي واصل بأمان إلى وجهتك
          </p>
        </div>

        {!showBookingForm ? (
          // Service Types Selection
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">اختر نوع الخدمة</h2>
            
            {TAXI_TYPES.map((type) => (
              <Card
                key={type.id}
                className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-blue-300"
                onClick={() => {
                  form.setValue('serviceType', type.id);
                  setShowBookingForm(true);
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="text-3xl">{type.icon}</div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{type.name}</h3>
                      <p className="text-gray-600 text-sm">{type.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline">
                          مضاعف السعر: {type.basePriceMultiplier}x
                        </Badge>
                      </div>
                    </div>
                    <div className="text-gray-400">
                      ←
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Features */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">مزايا خدمتنا</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-green-600" />
                    <span>أمان مضمون مع سائقين مرخصين</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Zap className="h-5 w-5 text-blue-600" />
                    <span>وصول سريع في أقل من 5 دقائق</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    <span>أسعار شفافة وثابتة</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-purple-600" />
                    <span>تتبع مباشر للرحلة</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          // Booking Form
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowBookingForm(false)}
              >
                ← الرجوع
              </Button>
              <h2 className="text-xl font-semibold">حجز {TAXI_TYPES.find(t => t.id === form.getValues('serviceType'))?.name}</h2>
            </div>

            {/* Location Inputs */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">تفاصيل الرحلة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="pickupLocation">نقطة الانطلاق *</Label>
                  <div className="relative">
                    <MapPin className="absolute right-3 top-3 h-4 w-4 text-green-600" />
                    <Input
                      id="pickupLocation"
                      {...form.register('pickupLocation')}
                      placeholder="أدخل موقع الانطلاق"
                      className="pr-10"
                    />
                  </div>
                  {form.formState.errors.pickupLocation && (
                    <p className="text-sm text-red-600 mt-1">
                      {form.formState.errors.pickupLocation.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="destination">الوجهة *</Label>
                  <div className="relative">
                    <Navigation className="absolute right-3 top-3 h-4 w-4 text-red-600" />
                    <Input
                      id="destination"
                      {...form.register('destination')}
                      placeholder="أدخل الوجهة"
                      className="pr-10"
                    />
                  </div>
                  {form.formState.errors.destination && (
                    <p className="text-sm text-red-600 mt-1">
                      {form.formState.errors.destination.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="passengerCount">عدد الركاب</Label>
                    <Select
                      value={form.watch('passengerCount')}
                      onValueChange={(value) => form.setValue('passengerCount', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6].map(count => (
                          <SelectItem key={count} value={count.toString()}>
                            {count} {count === 1 ? 'راكب' : 'ركاب'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="scheduledTime">وقت الحجز</Label>
                    <Input
                      id="scheduledTime"
                      type="datetime-local"
                      {...form.register('scheduledTime')}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">ملاحظات إضافية</Label>
                  <Textarea
                    id="notes"
                    {...form.register('notes')}
                    placeholder="أي تعليمات خاصة للسائق..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Price Estimation */}
            {estimatedPrice > 0 && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">التكلفة المقدرة</span>
                    <span className="text-2xl font-bold text-blue-600">
                      {estimatedPrice.toLocaleString()} دج
                    </span>
                  </div>
                  {estimatedDistance > 0 && (
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>المسافة المقدرة</span>
                      <span>{estimatedDistance.toFixed(1)} كم</span>
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    * السعر تقديري وقد يختلف حسب الطريق المختار
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700"
              size="lg"
              disabled={bookTaxiMutation.isPending}
            >
              {bookTaxiMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                  جارٍ الحجز...
                </>
              ) : (
                <>
                  <Car className="h-4 w-4 ml-2" />
                  تأكيد الحجز
                </>
              )}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}