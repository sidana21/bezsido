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

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [location, setLocation] = useState("الجزائر");
  const [otpCode, setOtpCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showPasswordAuth, setShowPasswordAuth] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register" | "set_password" | null>(null);
  const [userExists, setUserExists] = useState(false);
  const [hasPassword, setHasPassword] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [showQuickLogin, setShowQuickLogin] = useState(false);
  const [signupToken, setSignupToken] = useState("");
  const { toast } = useToast();
  const { login } = useAuth();

  // Advanced user detection system
  useState(() => {
    const userBackup = localStorage.getItem("user_backup");
    const profileCache = localStorage.getItem("profile_cache");
    
    if (userBackup) {
      try {
        const backup = JSON.parse(userBackup);
        if (backup.email) {
          // Auto-fill email for quick access
          setEmail(backup.email);
          setName(backup.name || "");
          setLocation(backup.location || "الجزائر");
          setShowQuickLogin(true);
          console.log("🔍 Detected returning user:", backup.name);
        }
      } catch (error) {
        console.warn("Error reading user backup:", error);
      }
    }
  });

  const locations = [
    "تندوف", "الجزائر", "وهران", "قسنطينة", "عنابة", "سطيف", "باتنة", "تيزي وزو", "بجاية", "مستغانم"
  ];

  // فحص حالة المستخدم - Smart User Detection
  const handleCheckUser = async () => {
    if (!email.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال البريد الإلكتروني",
        variant: "destructive",
      });
      return;
    }

    if (!emailRegex.test(email.trim())) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال بريد إلكتروني صحيح",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    const cleanEmail = email.trim().toLowerCase();

    try {
      const response = await apiRequest("/api/auth/check-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail }),
      });

      if (response.success) {
        setUserExists(response.userExists);
        setHasPassword(response.hasPassword);
        setAuthMode(response.action);
        setShowPasswordAuth(true);

        toast({
          title: "تم التحقق من البريد الإلكتروني",
          description: response.message,
        });
      } else {
        throw new Error(response.message || "فشل في فحص بيانات المستخدم");
      }
    } catch (error: any) {
      console.error("Check user error:", error);
      toast({
        title: "خطأ",
        description: error.message || "تعذر فحص بيانات المستخدم",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // تسجيل الدخول بكلمة المرور
  const handlePasswordLogin = async () => {
    if (!password.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال كلمة المرور",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    const cleanEmail = email.trim().toLowerCase();

    try {
      const response = await apiRequest("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, password }),
      });

      if (response.success) {
        login(response.user, response.token);
        toast({
          title: response.message,
          description: "تم تسجيل الدخول بنجاح",
        });
      } else {
        throw new Error(response.message || "فشل في تسجيل الدخول");
      }
    } catch (error: any) {
      console.error("Password login error:", error);
      toast({
        title: "خطأ في تسجيل الدخول",
        description: error.message || "كلمة المرور غير صحيحة",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // تسجيل حساب جديد بكلمة المرور
  const handlePasswordRegister = async () => {
    if (!password.trim() || password.length < 6) {
      toast({
        title: "خطأ",
        description: "كلمة المرور يجب أن تكون 6 أحرف على الأقل",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "خطأ",
        description: "كلمة المرور وتأكيدها غير متطابقتان",
        variant: "destructive",
      });
      return;
    }

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
    const cleanEmail = email.trim().toLowerCase();

    try {
      const response = await apiRequest("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: cleanEmail, 
          password, 
          name: name.trim(), 
          location 
        }),
      });

      if (response.success) {
        login(response.user, response.token);
        toast({
          title: response.message,
          description: "تم إنشاء حسابك بنجاح",
        });
      } else {
        throw new Error(response.message || "فشل في إنشاء الحساب");
      }
    } catch (error: any) {
      console.error("Password register error:", error);
      toast({
        title: "خطأ في إنشاء الحساب",
        description: error.message || "حدث خطأ أثناء إنشاء الحساب",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // إرسال رمز التحقق إلى البريد الإلكتروني (النظام القديم كـ fallback)
  const handleSendOTP = async () => {
    if (!email.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال البريد الإلكتروني",
        variant: "destructive",
      });
      return;
    }

    // Validate email format
    if (!emailRegex.test(email.trim())) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال بريد إلكتروني صحيح",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    const cleanEmail = email.trim().toLowerCase();

    try {
      console.log("🚀 Attempting direct login for:", cleanEmail);
      
      // طلب إرسال رمز التحقق
      const response = await apiRequest("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail }),
      });

      if (response.success) {
        // تم إرسال رمز التحقق
        setShowOtpInput(true);
        setGeneratedOtp(response.otpCode || "");
        toast({
          title: "تم إرسال رمز التحقق",
          description: "تحقق من بريدك الإلكتروني وأدخل رمز التحقق",
        });
      } else {
        throw new Error(response.message || "فشل في إرسال رمز التحقق");
      }
    } catch (error: any) {
      console.error("Direct login error:", error);
      toast({
        title: "خطأ في تسجيل الدخول",
        description: error.message || "تعذر تسجيل الدخول، تأكد من رقم الهاتف",
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
    const cleanEmail = email.trim().toLowerCase();

    try {
      const response = await apiRequest("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, code: otpCode }),
      });

      if (response.success) {
        if (response.needsProfile) {
          // مستخدم جديد - عرض نموذج الملف الشخصي
          setSignupToken(response.signupToken || "");
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

    if (!signupToken) {
      toast({
        title: "خطأ",
        description: "رمز التسجيل مفقود. يرجى المحاولة مرة أخرى",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    const cleanEmail = email.trim().toLowerCase();

    try {
      console.log("Creating account with data:", { email: cleanEmail, name: name.trim(), location });
      
      const response = await apiRequest("/api/auth/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: cleanEmail,
          name: name.trim(),
          location,
          signupToken
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

  // شاشة المصادقة بكلمة المرور - الجديدة
  if (showPasswordAuth) {
    return (
      <div className="min-h-screen bg-[#075e54] flex items-center justify-center p-4" dir="rtl">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full mb-4">
              <KeyRound className="w-10 h-10 text-[#075e54]" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              {authMode === "login" ? "تسجيل الدخول" : 
               authMode === "register" ? "إنشاء حساب جديد" : "تعيين كلمة مرور"}
            </h1>
            <p className="text-green-100 text-sm">
              {authMode === "login" ? "مرحباً بعودتك! يرجى إدخال كلمة المرور" : 
               authMode === "register" ? "مرحباً! يرجى إنشاء كلمة مرور قوية" : 
               "يرجى تعيين كلمة مرور لحسابك"}
            </p>
          </div>

          <Card className="border-0 shadow-lg">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-lg font-semibold">
                {authMode === "login" ? "كلمة المرور" : "بيانات الحساب"}
              </CardTitle>
              <CardDescription>
                <div className="text-sm text-muted-foreground">{email}</div>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {authMode === "register" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name">الاسم الكامل</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="أدخل اسمك الكامل"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">المنطقة</Label>
                    <Select value={location} onValueChange={setLocation}>
                      <SelectTrigger>
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
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="password">
                  {authMode === "register" ? "كلمة المرور الجديدة" : "كلمة المرور"}
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={authMode === "register" ? "اختر كلمة مرور قوية (6 أحرف على الأقل)" : "أدخل كلمة المرور"}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && authMode === "login" && password.length >= 6) {
                      handlePasswordLogin();
                    } else if (e.key === 'Enter' && authMode === "register" && 
                              password.length >= 6 && confirmPassword.length >= 6) {
                      handlePasswordRegister();
                    }
                  }}
                />
              </div>

              {authMode === "register" && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="أعد إدخال كلمة المرور"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && password.length >= 6 && confirmPassword.length >= 6) {
                        handlePasswordRegister();
                      }
                    }}
                  />
                  {password && confirmPassword && password !== confirmPassword && (
                    <p className="text-sm text-red-500">كلمة المرور وتأكيدها غير متطابقتان</p>
                  )}
                </div>
              )}

              <div className="space-y-3 pt-2">
                <Button 
                  onClick={authMode === "login" ? handlePasswordLogin : handlePasswordRegister} 
                  className="w-full bg-[#25d366] hover:bg-[#22c55e] text-white"
                  disabled={isLoading || 
                    (authMode === "login" && password.length < 6) ||
                    (authMode === "register" && (password.length < 6 || password !== confirmPassword || !name.trim()))
                  }
                >
                  {isLoading ? 
                    (authMode === "login" ? "جارِ تسجيل الدخول..." : "جارِ إنشاء الحساب...") : 
                    (authMode === "login" ? "تسجيل الدخول" : "إنشاء الحساب")
                  }
                </Button>

                <Button 
                  variant="outline" 
                  onClick={() => {
                    // استخدام نظام OTP كبديل
                    setShowPasswordAuth(false);
                    handleSendOTP();
                  }}
                  className="w-full text-sm"
                  disabled={isLoading}
                >
                  استخدام رمز التحقق بدلاً من ذلك
                </Button>

                <Button 
                  variant="ghost" 
                  onClick={() => {
                    setShowPasswordAuth(false);
                    setPassword("");
                    setConfirmPassword("");
                    setName("");
                    setAuthMode(null);
                  }}
                  className="w-full text-sm text-muted-foreground hover:text-foreground"
                >
                  العودة لإدخال بريد إلكتروني آخر
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
                    setSignupToken("");
                  }}
                  className="w-full text-sm text-muted-foreground hover:text-foreground"
                >
                  العودة لإدخال البريد الإلكتروني
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
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center mb-2">
              <img src={appIconUrl} alt="Bivochat" className="w-48 h-48 object-contain" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">إنشاء حساب جديد</h1>
            <p className="text-green-100 text-sm animate-pulse bg-gradient-to-r from-green-200 to-emerald-200 bg-clip-text text-transparent font-semibold">
              🌟 اكتشف عالماً جديداً من الفرص التجارية واربط منتجاتك بالأسواق العربية 🚀
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

  // Quick login for returning users
  const handleQuickLogin = async () => {
    if (!email.trim()) return;
    
    setIsLoading(true);
    const cleanEmail = email.trim().toLowerCase();

    try {
      console.log("🚀 Attempting quick login for returning user:", cleanEmail);
      const response = await apiRequest("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: cleanEmail,
          code: "QUICK_LOGIN", // Special code for quick login
          name: name.trim(),
          location: location.trim()
        }),
      });

      if (response.success) {
        console.log("✅ Quick login successful!");
        await login(response.user, response.token);
        toast({
          title: "مرحباً بعودتك! 🎉",
          description: `أهلاً وسهلاً ${response.user.name}`,
        });
      } else {
        // Fall back to OTP flow
        handleSendOTP();
      }
    } catch (error) {
      console.warn("Quick login failed, using OTP flow:", error);
      handleSendOTP();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#075e54] flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center mb-0">
            <img src={appIconUrl} alt="Bivochat" className="w-48 h-48 object-contain" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 -mt-2">Bivochat</h1>
          <p className="text-green-100 text-sm animate-pulse bg-gradient-to-r from-green-200 to-emerald-200 bg-clip-text text-transparent font-semibold">
            🌟 اكتشف عالماً جديداً من الفرص التجارية واربط منتجاتك بالأسواق العربية 🚀
          </p>
          
          {showQuickLogin && (
            <div className="mt-4 p-3 bg-green-600/20 rounded-lg border border-green-400/30">
              <p className="text-green-200 text-sm mb-2">
                🎯 مرحباً بعودتك! تم اكتشاف حسابك
              </p>
              <Button 
                onClick={handleQuickLogin}
                className="w-full bg-green-600 hover:bg-green-700 text-white text-sm py-2"
                disabled={isLoading}
              >
                {isLoading ? "جاري الدخول..." : `دخول سريع كـ ${name}`}
              </Button>
            </div>
          )}
        </div>

        <Card className="border-0 shadow-lg" data-testid="card-email-login">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl font-semibold">تسجيل الدخول</CardTitle>
            <CardDescription>أدخل بريدك الإلكتروني للمتابعة</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="أدخل بريدك الإلكتروني"
                className="text-left"
                dir="ltr"
                data-testid="input-email"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && email.trim()) {
                    handleCheckUser();
                  }
                }}
              />
            </div>

            <Button 
              onClick={handleCheckUser} 
              className="w-full bg-[#25d366] hover:bg-[#22c55e] text-white text-lg py-3"
              disabled={isLoading || !email.trim()}
              data-testid="button-login"
            >
              {isLoading ? "جارِ الفحص..." : "المتابعة"}
            </Button>

            <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center mt-6">
              <Shield className="w-4 h-4" />
              <span>نظام مصادقة ذكي - سيتم اكتشاف حسابك تلقائياً</span>
            </div>
            
            <div className="text-center">
              <Button 
                variant="ghost" 
                onClick={handleSendOTP}
                className="text-sm text-muted-foreground hover:text-foreground"
                disabled={isLoading || !email.trim()}
              >
                استخدام رمز التحقق القديم
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}