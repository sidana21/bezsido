import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { MessageCircle, Shield, Users, ChevronDown } from "lucide-react";

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
  const [step, setStep] = useState<"phone" | "otp" | "profile">("phone");
  const [countryCode, setCountryCode] = useState("+213");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [fullPhoneNumber, setFullPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [lastGeneratedOtp, setLastGeneratedOtp] = useState("");
  const [currentOtp, setCurrentOtp] = useState("");
  const [needsProfile, setNeedsProfile] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const { toast } = useToast();
  const { login } = useAuth();

  const locations = [
    "تندوف", "الجزائر", "وهران", "قسنطينة", "عنابة", "سطيف", "باتنة", "تيزي وزو", "بجاية", "مستغانم"
  ];

  useEffect(() => {
    if (needsProfile) {
      setStep("profile");
      setNeedsProfile(false);
    }
  }, [needsProfile]);

  const handleDirectLogin = async () => {
    if (!phoneNumber.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال رقم الهاتف",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    const fullPhone = countryCode + phoneNumber;
    setFullPhoneNumber(fullPhone);

    try {
      // Use create-user endpoint directly since it handles both new and existing users
      const response = await apiRequest("/api/auth/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          phoneNumber: fullPhone,
          name: "مستخدم جديد", // Default name for new users
          location: "الجزائر" // Default location for new users
        }),
      });

      if (response.success && response.user && response.token) {
        // Either existing user login or new user creation successful
        login(response.user, response.token);
        toast({
          title: "مرحباً " + response.user.name + "!",
          description: response.message || "تم تسجيل الدخول بنجاح",
        });
      } else {
        // New user needs profile setup
        toast({
          title: "مستخدم جديد",
          description: "يرجى إكمال بياناتك الشخصية",
        });
        setStep("profile");
      }
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "فشل في تسجيل الدخول",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال رمز التحقق المكون من 6 أرقام",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiRequest("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          phoneNumber: fullPhoneNumber, 
          code: otp
        }),
      });

      if (response.needsProfile) {
        // OTP verified but new user needs profile setup
        setOtpVerified(true);
        toast({
          title: "مستخدم جديد",
          description: "يرجى إكمال بياناتك الشخصية",
        });
        setNeedsProfile(true);
      } else if (response.user && response.token) {
        // Existing user login successful
        login(response.user, response.token);
        toast({
          title: "مرحباً!",
          description: "تم تسجيل الدخول بنجاح",
        });
      }
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "رمز التحقق غير صحيح",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fillOtpAuto = () => {
    if (lastGeneratedOtp) {
      setOtp(lastGeneratedOtp);
      toast({
        title: "تم ملء الرمز",
        description: "تم ملء رمز التحقق تلقائياً",
      });
    }
  };

  const handleCompleteProfile = async () => {
    if (!name.trim() || !location) {
      toast({
        title: "خطأ",
        description: "يرجى إكمال جميع البيانات المطلوبة",
        variant: "destructive",
      });
      return;
    }

    if (!fullPhoneNumber) {
      toast({
        title: "خطأ",
        description: "رقم الهاتف مطلوب - يرجى البدء من جديد",
        variant: "destructive",
      });
      setStep("phone");
      return;
    }

    setIsLoading(true);
    try {
      console.log("Creating user with data:", { 
        phoneNumber: fullPhoneNumber, 
        name: name.trim(),
        location,
        otpVerified
      });

      const response = await apiRequest("/api/auth/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          phoneNumber: fullPhoneNumber, 
          name: name.trim(),
          location
        }),
      });

      console.log("User creation response:", response);

      if (response && response.success && response.user && response.token) {
        login(response.user, response.token);
        toast({
          title: "مرحباً " + response.user.name + "! 🎉",
          description: response.message || "تم إنشاء حسابك وتسجيل دخولك بنجاح",
        });
      } else {
        console.error("Invalid server response:", response);
        throw new Error(response?.message || "استجابة غير صالحة من الخادم");
      }
    } catch (error: any) {
      console.error("User creation error details:", {
        error,
        message: error.message,
        status: error.status,
        phoneNumber: fullPhoneNumber,
        name: name.trim(),
        location
      });
      
      let errorMessage = "فشل في إنشاء الحساب";
      
      if (error.message && typeof error.message === 'string') {
        errorMessage = error.message;
      } else if (error.status === 400) {
        errorMessage = "بيانات غير صحيحة - يرجى المحاولة مرة أخرى";
      } else if (error.status === 500) {
        errorMessage = "خطأ في الخادم - يرجى المحاولة لاحقاً";
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

  if (step === "phone") {
    return (
      <div className="min-h-screen bg-[#075e54] flex items-center justify-center p-4" dir="rtl">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white mb-2">BizChat</h1>
            <p className="text-green-100 text-sm">
منصة التواصل التجاري الذكية - أدخل رقم هاتفك للدخول مباشرة
            </p>
          </div>

          <Card className="border-0 shadow-lg" data-testid="card-phone-verification">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-lg font-semibold">تسجيل الدخول</CardTitle>
              <CardDescription>أدخل رقم هاتفك للمتابعة</CardDescription>
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
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  ادخل رقم هاتفك للدخول مباشرة إلى التطبيق
                </p>
              </div>

              <Button 
                onClick={handleDirectLogin} 
                className="w-full bg-[#25d366] hover:bg-[#22c55e] text-white"
                disabled={isLoading}
                data-testid="button-direct-login"
              >
                {isLoading ? "جارِ الدخول..." : "دخول إلى التطبيق"}
              </Button>

              <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center mt-6">
                <Shield className="w-4 h-4" />
                <span>محمي بتشفير تام</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (step === "otp") {
    return (
      <div className="min-h-screen bg-[#075e54] flex items-center justify-center p-4" dir="rtl">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full mb-4">
              <MessageCircle className="w-10 h-10 text-[#075e54]" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">تحقق من رقم هاتفك</h1>
            <p className="text-green-100 text-sm">
              أدخل الرمز المرسل إلى {fullPhoneNumber}
            </p>
          </div>

          <Card className="border-0 shadow-lg" data-testid="card-otp-verification">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-lg font-semibold">رمز التحقق</CardTitle>
              <CardDescription>أدخل الرمز المكون من 6 أرقام</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-center">
                <InputOTP
                  value={otp}
                  onChange={setOtp}
                  maxLength={6}
                  data-testid="input-otp"
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              {lastGeneratedOtp && (
                <div className="text-center p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <p className="text-lg font-bold text-green-800">
                      رمز التحقق: <span className="text-2xl font-mono">{lastGeneratedOtp}</span>
                    </p>
                  </div>
                  <p className="text-sm text-green-600 mb-2">
                    استخدم هذا الرمز للتحقق من هاتفك
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => setOtp(lastGeneratedOtp)}
                    className="text-sm bg-green-100 hover:bg-green-200 border-green-300"
                    data-testid="button-auto-fill"
                  >
                    📝 ملء تلقائي
                  </Button>
                </div>
              )}

              <Button 
                onClick={handleVerifyOtp} 
                className="w-full bg-[#25d366] hover:bg-[#22c55e] text-white"
                disabled={isLoading || otp.length !== 6}
                data-testid="button-verify-otp"
              >
                {isLoading ? "جارِ التحقق..." : "تحقق من الرمز"}
              </Button>

              <div className="text-center">
                <Button 
                  variant="ghost" 
                  onClick={() => setStep("phone")}
                  className="text-sm text-muted-foreground hover:text-foreground"
                  data-testid="button-back-to-phone"
                >
                  تغيير رقم الهاتف
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (step === "profile") {
    return (
      <div className="min-h-screen bg-[#075e54] flex items-center justify-center p-4" dir="rtl">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full mb-4">
              <Users className="w-10 h-10 text-[#075e54]" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">إعداد الملف الشخصي</h1>
            <p className="text-green-100 text-sm">
              أكمل بياناتك لإنشاء حسابك
            </p>
          </div>

          <Card className="border-0 shadow-lg" data-testid="card-profile-setup">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-lg font-semibold">بياناتك الشخصية</CardTitle>
              <CardDescription>هذه البيانات ستظهر للآخرين</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">الاسم</Label>
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

              <Button 
                onClick={handleCompleteProfile} 
                className="w-full bg-[#25d366] hover:bg-[#22c55e] text-white"
                disabled={isLoading || !name.trim() || !location}
                data-testid="button-complete-profile"
              >
                {isLoading ? "جارِ الإنشاء..." : "إنشاء الحساب"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return null;
}