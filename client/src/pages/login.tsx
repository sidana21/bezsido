import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { MessageCircle, Shield, KeyRound } from "lucide-react";
import appIconUrl from '@/assets/app-icon.png';

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
  const [otpCode, setOtpCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState("");
  const { toast } = useToast();
  const { login } = useAuth();

  const locations = [
    "تندوف", "الجزائر", "وهران", "قسنطينة", "عنابة", "سطيف", "باتنة", "تيزي وزو", "بجاية", "مستغانم"
  ];

  const handleSendOTP = async () => {
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
      const response = await apiRequest("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: fullPhone }),
      });

      if (response.success) {
        setShowOtpInput(true);
        if (response.code) {
          setGeneratedOtp(response.code);
        }
        toast({
          title: "تم إرسال رمز التحقق",
          description: response.message || "يرجى إدخال رمز التحقق المرسل",
        });
      } else {
        throw new Error(response.message || "فشل في إرسال رمز التحقق");
      }
    } catch (error: any) {
      console.error("OTP sending error:", error);
      toast({
        title: "خطأ",
        description: error.message || "فشل في إرسال رمز التحقق",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

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
    const fullPhone = countryCode + phoneNumber.trim();

    try {
      const response = await apiRequest("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: fullPhone, code: otpCode }),
      });

      if (response.success) {
        if (response.needsProfile) {
          // مستخدم جديد - عرض نموذج الملف الشخصي
          setShowProfile(true);
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
      
      const response = await apiRequest("/api/auth/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          phoneNumber: fullPhone,
          name: name.trim(),
          location
        })
      });

      if (response.success && response.user && response.token) {
        console.log("Account created successfully, logging in user");
        login(response.user, response.token);
        setShowProfile(false);
        setShowOtpInput(false);
        toast({
          title: "مرحباً " + response.user.name + "! 🎉",
          description: "تم إنشاء حسابك وتسجيل دخولك بنجاح",
        });
      } else {
        console.error("Account creation failed:", response);
        throw new Error(response?.message || "فشل في إنشاء الحساب");
      }
    } catch (error: any) {
      console.error("Account creation error:", error);
      toast({
        title: "خطأ في إنشاء الحساب",
        description: error.message || "حدث خطأ أثناء إنشاء الحساب",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

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
              أدخل رمز التحقق المرسل إليك
            </p>
          </div>

          <Card className="border-0 shadow-lg">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-lg font-semibold">التحقق من الهاتف</CardTitle>
              <CardDescription>
                رمز التحقق مكون من 6 أرقام
                {generatedOtp && (
                  <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-green-800 font-mono text-lg">
                      {generatedOtp}
                    </p>
                    <p className="text-green-600 text-xs mt-1">
                      (اكتب هذا الرمز في الحقل أدناه)
                    </p>
                  </div>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">رمز التحقق</Label>
                <Input
                  id="otp"
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
                  className="w-full bg-[#25d366] hover:bg-[#22c55e] text-white"
                  disabled={isLoading || otpCode.length !== 6}
                >
                  {isLoading ? "جارِ التحقق..." : "تحقق من الرمز"}
                </Button>

                <Button 
                  variant="ghost" 
                  onClick={() => {
                    setShowOtpInput(false);
                    setOtpCode("");
                    setGeneratedOtp("");
                  }}
                  className="w-full text-sm text-muted-foreground hover:text-foreground"
                >
                  العودة لإدخال رقم الهاتف
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (showProfile) {
    return (
      <div className="min-h-screen bg-[#075e54] flex items-center justify-center p-4" dir="rtl">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center mb-4">
              <img src={appIconUrl} alt="BizChat" className="w-24 h-24 object-contain" />
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
          <div className="inline-flex items-center justify-center mb-4">
            <img src={appIconUrl} alt="BizChat" className="w-24 h-24 object-contain" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">BizChat</h1>
          <p className="text-green-100 text-sm">
            منصة التواصل التجاري الذكية
          </p>
        </div>

        <Card className="border-0 shadow-lg" data-testid="card-phone-login">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl font-semibold">تسجيل الدخول</CardTitle>
            <CardDescription>أدخل رقم هاتفك وسنرسل لك رمز التحقق</CardDescription>
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
                      handleSendOTP();
                    }
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                سيتم إرسال رمز التحقق وعرضه على الشاشة للأمان
              </p>
            </div>

            <Button 
              onClick={handleSendOTP} 
              className="w-full bg-[#25d366] hover:bg-[#22c55e] text-white text-lg py-3"
              disabled={isLoading || !phoneNumber.trim()}
              data-testid="button-login"
            >
              {isLoading ? "جارِ الإرسال..." : "إرسال رمز التحقق"}
            </Button>

            <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center mt-6">
              <Shield className="w-4 h-4" />
              <span>محمي بتشفير تام - التحقق برمز آمن</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}