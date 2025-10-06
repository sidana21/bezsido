import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight } from "lucide-react";
import { Link } from "wouter";

export default function PrivacyPolicy() {
  const { data: policy, isLoading } = useQuery<{
    id: number;
    content: string;
    version: string;
    effectiveDate: Date;
  }>({
    queryKey: ['/api/privacy-policy'],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-12 w-3/4 mb-8" />
          <Card className="p-8">
            <Skeleton className="h-6 w-full mb-4" />
            <Skeleton className="h-6 w-full mb-4" />
            <Skeleton className="h-6 w-3/4 mb-4" />
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Link href="/" data-testid="link-home">
          <button 
            className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-6 transition-colors"
            data-testid="button-back-home"
          >
            <ArrowRight className="w-5 h-5 rotate-180" />
            العودة للرئيسية
          </button>
        </Link>

        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2" data-testid="text-privacy-title">
          سياسة الخصوصية
        </h1>
        
        {policy && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-8" data-testid="text-policy-version">
            الإصدار {policy.version} - ساري المفعول من {new Date(policy.effectiveDate).toLocaleDateString('ar-SA')}
          </p>
        )}

        <Card className="p-8 bg-white dark:bg-gray-800 shadow-xl">
          <div 
            className="prose dark:prose-invert max-w-none" 
            data-testid="text-policy-content"
            dangerouslySetInnerHTML={{ 
              __html: policy?.content || `
                <h2>مقدمة</h2>
                <p>نحن في بيفو شات نلتزم بحماية خصوصيتك وبياناتك الشخصية. توضح هذه السياسة كيفية جمع واستخدام وحماية معلوماتك.</p>

                <h2>البيانات التي نجمعها</h2>
                <ul>
                  <li>معلومات الحساب: الاسم، رقم الهاتف، تاريخ الميلاد، الموقع</li>
                  <li>المحتوى: الرسائل، القصص، المنشورات، الصور</li>
                  <li>بيانات الاستخدام: سجل النشاط، التفضيلات</li>
                </ul>

                <h2>كيفية استخدام البيانات</h2>
                <ul>
                  <li>تقديم وتحسين خدماتنا</li>
                  <li>التواصل معك بشأن حسابك والخدمات</li>
                  <li>ضمان السلامة والأمان</li>
                  <li>الامتثال للمتطلبات القانونية</li>
                </ul>

                <h2>حماية البيانات</h2>
                <p>نستخدم تدابير أمنية متقدمة لحماية بياناتك من الوصول غير المصرح به أو الكشف أو التعديل أو الإتلاف.</p>

                <h2>مشاركة البيانات</h2>
                <p>لا نشارك بياناتك الشخصية مع أطراف ثالثة إلا في الحالات التالية:</p>
                <ul>
                  <li>بموافقتك الصريحة</li>
                  <li>للامتثال للقوانين والأنظمة</li>
                  <li>لحماية حقوقنا وسلامة المستخدمين</li>
                </ul>

                <h2>حقوقك</h2>
                <p>لديك الحق في:</p>
                <ul>
                  <li>الوصول إلى بياناتك الشخصية</li>
                  <li>تصحيح البيانات غير الدقيقة</li>
                  <li>حذف حسابك وبياناتك</li>
                  <li>الاعتراض على معالجة بياناتك</li>
                </ul>

                <h2>الاتصال بنا</h2>
                <p>للاستفسارات حول خصوصيتك، يرجى التواصل معنا عبر: support@bivochat.com</p>
              ` 
            }}
          />
        </Card>
      </div>
    </div>
  );
}
