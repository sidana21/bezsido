import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { MessageCircle, Shield } from "lucide-react";

const countries = [
  { code: "+213", name: "Algeria", flag: "🇩🇿" },
  { code: "+966", name: "Saudi Arabia", flag: "🇸🇦" },
  { code: "+971", name: "UAE", flag: "🇦🇪" },
  { code: "+20", name: "Egypt", flag: "🇪🇬" },
  { code: "+212", name: "Morocco", flag: "🇲🇦" },
  { code: "+1", name: "USA", flag: "🇺🇸" },
  { code: "+44", name: "UK", flag: "🇬🇧" },
];

export default function LoginPage() {
  const [countryCode, setCountryCode] = useState("+213");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [name, setName] = useState("");
  const [location, setLocation] = useState("الجزائر");
  const [isLoading, setIsLoading] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const { toast } = useToast();
  const { login } = useAuth();

  const locations = [
    "تندوف", "الجزائر", "وهران", "قسنطينة", "عنابة", "سطيف", "باتنة", "تيزي وزو", "بجاية", "مستغانم"
  ];

  const handleLogin = async () => {
    if (!phoneNumber.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال رقم الهاتف",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    const fullPhone = countryCode + phoneNumber.trim();

    try {
      // محاولة تسجيل الدخول المباشر أولاً
      const response = await apiRequest("/api/auth/direct-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: fullPhone }),
      });

      if (response.success && response.user && response.token) {
        // مستخدم موجود - تسجيل دخول مباشر
        login(response.user, response.token);
        toast({
          title: "مرحباً " + response.user.name + "!",
          description: "تم تسجيل الدخول بنجاح",
        });
      } else if (response.needsProfile) {
        // مستخدم جديد - عرض نموذج الملف الشخصي
        console.log("New user needs profile, showing form");
        setShowProfile(true);
        toast({
          title: "مستخدم جديد",
          description: "يرجى إكمال بياناتك الشخصية",
        });
      }
    } catch (error: any) {
      console.log("Login error:", error);
      
      // التحقق من كون المستخدم جديد بناءً على رسالة الخطأ
      try {
        const errorData = JSON.parse(error.message.split(': ')[1] || '{}');
        if (errorData.needsProfile || errorData.message?.includes("مستخدم جديد")) {
          console.log("New user detected from error response");
          setShowProfile(true);
          toast({
            title: "مستخدم جديد",
            description: "يرجى إكمال بياناتك الشخصية",
          });
          return;
        }
      } catch {
        // إذا فشل parsing، تحقق من النص المباشر
      }
      
      // التحقق من كون المستخدم جديد
      if (error.message.includes("404") || 
          error.message.includes("needsProfile") || 
          error.message.includes("مستخدم جديد") ||
          (error.status && error.status === 404)) {
        // مستخدم جديد - عرض نموذج الملف الشخصي
        console.log("New user detected, showing profile form");
        setShowProfile(true);
        toast({
          title: "مستخدم جديد",
          description: "يرجى إكمال بياناتك الشخصية",
        });
      } else {
        toast({
          title: "خطأ",
          description: error.message || "فشل في تسجيل الدخول",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAccount = async () => {
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

    setIsLoading(true);
    const fullPhone = countryCode + phoneNumber.trim();

    try {
      console.log("Creating account with data:", { phoneNumber: fullPhone, name: name.trim(), location });
      
      // إضافة مهلة زمنية أطول لإنشاء الحساب
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 ثانية
      
      const response = await fetch("/api/auth/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          phoneNumber: fullPhone,
          name: name.trim(),
          location
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      console.log("Account creation HTTP status:", response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Account creation HTTP error:", response.status, errorText);
        
        let errorMessage = `خطأ في الشبكة: ${response.status}`;
        
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          // If parsing fails, use the raw text or default message
          if (errorText && errorText.trim()) {
            errorMessage = errorText;
          }
        }
        
        throw new Error(errorMessage);
      }
      
      const responseData = await response.json();
      console.log("Account creation response:", responseData);

      if (responseData.success && responseData.user && responseData.token) {
        console.log("Account created successfully, logging in user");
        login(responseData.user, responseData.token);
        setShowProfile(false); // إخفاء نموذج الملف الشخصي
        toast({
          title: "مرحباً " + responseData.user.name + "! 🎉",
          description: "تم إنشاء حسابك وتسجيل دخولك بنجاح",
        });
      } else {
        console.error("Account creation failed:", responseData);
        throw new Error(responseData?.message || "فشل في إنشاء الحساب");
      }
    } catch (error: any) {
      console.error("Account creation error:", error);
      
      let errorMessage = "حدث خطأ أثناء إنشاء الحساب";
      
      if (error.name === 'AbortError') {
        errorMessage = "انتهت المهلة الزمنية، يرجى المحاولة مرة أخرى";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "خطأ في إنشاء الحساب",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (showProfile) {
    return (
      <div className="min-h-screen bg-[#075e54] flex items-center justify-center p-4" dir="rtl">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full mb-4">
              <MessageCircle className="w-10 h-10 text-[#075e54]" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">إنشاء حساب جديد</h1>
            <p className="text-green-100 text-sm">
              أكمل بياناتك لإنشاء حسابك في BizChat
            </p>
          </div>

          <Card className="border-0 shadow-lg" data-testid="card-profile-setup">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-lg font-semibold">البيانات الشخصية</CardTitle>
              <CardDescription>هذه البيانات ستظهر للآخرين</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">الاسم الكامل</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="أدخل اسمك الكامل"
                  data-testid="input-name"
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
                  onClick={handleCreateAccount} 
                  className="w-full bg-[#25d366] hover:bg-[#22c55e] text-white"
                  disabled={isLoading || !name.trim() || !location}
                  data-testid="button-create-account"
                >
                  {isLoading ? "جارِ الإنشاء..." : "إنشاء الحساب والدخول"}
                </Button>

                <Button 
                  variant="ghost" 
                  onClick={() => setShowProfile(false)}
                  className="w-full text-sm text-muted-foreground hover:text-foreground"
                  data-testid="button-back-to-login"
                >
                  العودة لتسجيل الدخول
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#075e54] flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full mb-4">
            <MessageCircle className="w-10 h-10 text-[#075e54]" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">BizChat</h1>
          <p className="text-green-100 text-sm">
            منصة التواصل التجاري الذكية
          </p>
        </div>

        <Card className="border-0 shadow-lg" data-testid="card-phone-login">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl font-semibold">تسجيل الدخول</CardTitle>
            <CardDescription>أدخل رقم هاتفك للدخول مباشرة إلى التطبيق</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="country">البلد</Label>
              <Select value={countryCode} onValueChange={setCountryCode}>
                <SelectTrigger data-testid="select-country">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                      <div className="flex items-center gap-2">
                        <span>{country.flag}</span>
                        <span>{country.name}</span>
                        <span className="text-muted-foreground">{country.code}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">رقم الهاتف</Label>
              <div className="flex gap-2">
                <div className="flex items-center px-3 py-2 border border-input rounded-md bg-background text-sm font-medium">
                  {countryCode}
                </div>
                <Input
                  id="phone"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                  placeholder="555123456"
                  className="flex-1"
                  data-testid="input-phone-number"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && phoneNumber.trim()) {
                      handleLogin();
                    }
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                لا نحتاج رموز تحقق - ادخل رقمك واضغط دخول فقط
              </p>
            </div>

            <Button 
              onClick={handleLogin} 
              className="w-full bg-[#25d366] hover:bg-[#22c55e] text-white text-lg py-3"
              disabled={isLoading || !phoneNumber.trim()}
              data-testid="button-login"
            >
              {isLoading ? "جارِ الدخول..." : "دخول إلى التطبيق"}
            </Button>

            <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center mt-6">
              <Shield className="w-4 h-4" />
              <span>محمي بتشفير تام - دخول بدون رموز تحقق</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}