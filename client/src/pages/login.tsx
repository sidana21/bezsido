import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { MessageCircle, KeyRound, Phone } from "lucide-react";
import appIconUrl from '@/assets/app-icon.png';

export default function LoginPage() {
  const [phone, setPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [name, setName] = useState("");
  const [location, setLocation] = useState("الجزائر");
  const [isLoading, setIsLoading] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [showProfileForm, setShowProfileForm] = useState(false);
  const { toast } = useToast();
  const { login } = useAuth();

  const locations = [
    "تندوف", "الجزائر", "وهران", "قسنطينة", "عنابة", "سطيف", "باتنة", "تيزي وزو", "بجاية", "مستغانم"
  ];

  // إرسال OTP
  const handleSendOTP = async () => {
    if (!phone.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال رقم الهاتف",
        variant: "destructive",
      });
      return;
    }

    const cleanPhone = phone.trim();

    setIsLoading(true);

    try {
      const response = await apiRequest("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: cleanPhone }),
      });

      if (response.success) {
        setShowOtpInput(true);
        toast({
          title: "تم إرسال رمز التحقق",
          description: "تحقق من واتساب وأدخل رمز التحقق",
        });
      } else {
        throw new Error(response.message || "فشل في إرسال رمز التحقق");
      }
    } catch (error: any) {
      console.error("Send OTP error:", error);
      toast({
        title: "خطأ",
        description: error.message || "تعذر إرسال رمز التحقق",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // التحقق من OTP
  const handleVerifyOTP = async () => {
    if (!otpCode.trim() || otpCode.length !== 6) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال رمز التحقق (6 أرقام)",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    const cleanPhone = phone.trim();

    try {
      const response = await apiRequest("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          phone: cleanPhone, 
          code: otpCode,
          name: name.trim(),
          location
        }),
      });

      if (response.success) {
        if (response.requiresProfile) {
          // مستخدم جديد - يحتاج لاستكمال البيانات
          setShowProfileForm(true);
          setShowOtpInput(false);
          toast({
            title: "تم التحقق بنجاح",
            description: "يرجى إكمال بياناتك الشخصية",
          });
        } else if (response.user && response.token) {
          // مستخدم موجود - تسجيل دخول
          login(response.user, response.token);
          toast({
            title: "مرحباً " + response.user.name + "!",
            description: "تم تسجيل الدخول بنجاح",
          });
        }
      } else {
        throw new Error(response.message || "فشل في التحقق من الرمز");
      }
    } catch (error: any) {
      console.error("OTP verification error:", error);
      toast({
        title: "خطأ",
        description: error.message || "رمز التحقق غير صحيح أو منتهي الصلاحية",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // إكمال الملف الشخصي
  const handleCompleteProfile = async () => {
    if (!name.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال الاسم",
        variant: "destructive",
      });
      return;
    }

    if (!location) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار المنطقة",
        variant: "destructive",
      });
      return;
    }

    // إرسال طلب التحقق مع البيانات الكاملة
    handleVerifyOTP();
  };

  // شاشة إكمال الملف الشخصي
  if (showProfileForm) {
    return (
      <div className="min-h-screen bg-[#075e54] flex items-center justify-center p-4" dir="rtl">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full mb-4">
              <MessageCircle className="w-10 h-10 text-[#075e54]" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">إكمال الملف الشخصي</h1>
            <p className="text-green-100 text-sm">
              يرجى إدخال بياناتك الشخصية لإنشاء حسابك
            </p>
          </div>

          <Card className="border-0 shadow-lg">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-lg font-semibold">بياناتك الشخصية</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">الاسم الكامل</Label>
                <Input
                  id="name"
                  data-testid="input-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="أدخل اسمك الكامل"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">المنطقة</Label>
                <Select value={location} onValueChange={setLocation}>
                  <SelectTrigger data-testid="select-location">
                    <SelectValue placeholder="اختر منطقتك" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((loc) => (
                      <SelectItem key={loc} value={loc}>
                        {loc}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3 pt-2">
                <Button 
                  onClick={handleCompleteProfile} 
                  data-testid="button-complete-profile"
                  className="w-full bg-[#25d366] hover:bg-[#22c55e] text-white"
                  disabled={isLoading || !name.trim()}
                >
                  {isLoading ? "جارِ الإنشاء..." : "إنشاء الحساب"}
                </Button>

                <Button 
                  variant="ghost" 
                  onClick={() => {
                    setShowProfileForm(false);
                    setShowOtpInput(true);
                  }}
                  className="w-full text-sm text-muted-foreground hover:text-foreground"
                >
                  العودة
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // شاشة إدخال رمز التحقق
  if (showOtpInput) {
    return (
      <div className="min-h-screen bg-[#075e54] flex items-center justify-center p-4" dir="rtl">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full mb-4">
              <KeyRound className="w-10 h-10 text-[#075e54]" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">رمز التحقق</h1>
            <p className="text-green-100 text-sm">
              أدخل رمز التحقق المرسل إلى واتساب
            </p>
          </div>

          <Card className="border-0 shadow-lg">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-lg font-semibold">التحقق من الهاتف</CardTitle>
              <CardDescription>
                <div className="text-sm text-muted-foreground">{phone}</div>
                <div className="text-xs mt-1">رمز التحقق مكون من 6 أرقام</div>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">رمز التحقق</Label>
                <Input
                  id="otp"
                  data-testid="input-otp"
                  type="text"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').substring(0, 6))}
                  placeholder="123456"
                  className="text-center text-xl font-mono tracking-widest"
                  maxLength={6}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && otpCode.length === 6) {
                      handleVerifyOTP();
                    }
                  }}
                />
              </div>

              <div className="space-y-3 pt-2">
                <Button 
                  onClick={handleVerifyOTP} 
                  data-testid="button-verify-otp"
                  className="w-full bg-[#25d366] hover:bg-[#22c55e] text-white"
                  disabled={isLoading || otpCode.length !== 6}
                >
                  {isLoading ? "جارِ التحقق..." : "تحقق من الرمز"}
                </Button>

                <Button 
                  variant="outline"
                  onClick={handleSendOTP}
                  data-testid="button-resend-otp"
                  className="w-full"
                  disabled={isLoading}
                >
                  إعادة إرسال الرمز
                </Button>

                <Button 
                  variant="ghost" 
                  onClick={() => {
                    setShowOtpInput(false);
                    setOtpCode("");
                  }}
                  className="w-full text-sm text-muted-foreground hover:text-foreground"
                >
                  العودة لإدخال رقم آخر
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // شاشة إدخال رقم الهاتف
  return (
    <div className="min-h-screen bg-[#075e54] flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center mb-0">
            <img src={appIconUrl} alt="Bivochat" className="w-48 h-48 object-contain" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Bivochat</h1>
          <p className="text-green-100 flex items-center justify-center gap-2">
            <MessageCircle className="w-4 h-4" />
            اكتشف عالماً جديداً من الفرص التجارية واربط بمتاجرك بالأسواق العربية
            <MessageCircle className="w-4 h-4" />
          </p>
        </div>

        <Card className="border-0 shadow-lg">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl font-bold">تسجيل الدخول</CardTitle>
            <CardDescription>
              أدخل رقم هاتفك للمتابعة
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                رقم الهاتف
              </Label>
              <Input
                id="phone"
                data-testid="input-phone"
                type="tel"
                dir="ltr"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+213xxxxxxxxx"
                className="text-right"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && phone.trim()) {
                    handleSendOTP();
                  }
                }}
              />
            </div>

            <Button 
              onClick={handleSendOTP} 
              data-testid="button-continue"
              className="w-full bg-[#25d366] hover:bg-[#22c55e] text-white"
              disabled={isLoading || !phone.trim()}
            >
              {isLoading ? "جارِ الإرسال..." : "المتابعة"}
            </Button>

            <div className="text-center pt-4">
              <p className="text-sm text-muted-foreground">
                نظام مضادة ذكي - سيتم اكتشاف حسابك تلقائياً
              </p>
            </div>

            <div className="text-center pt-2 border-t">
              <p className="text-xs text-muted-foreground mt-4">
                استخدم رمز التحقق القديم
              </p>
            </div>

            <Button 
              variant="ghost" 
              onClick={() => {}}
              className="w-full text-sm text-muted-foreground hover:text-foreground"
            >
              سياسة الخصوصية
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
