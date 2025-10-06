import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight } from "lucide-react";
import { Link } from "wouter";

export default function TermsOfService() {
  const { data: terms, isLoading } = useQuery<{
    id: number;
    content: string;
    version: string;
    effectiveDate: Date;
  }>({
    queryKey: ['/api/terms'],
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

        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2" data-testid="text-terms-title">
          شروط الاستخدام
        </h1>
        
        {terms && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-8" data-testid="text-terms-version">
            الإصدار {terms.version} - ساري المفعول من {new Date(terms.effectiveDate).toLocaleDateString('ar-SA')}
          </p>
        )}

        <Card className="p-8 bg-white dark:bg-gray-800 shadow-xl">
          <div 
            className="prose dark:prose-invert max-w-none" 
            data-testid="text-terms-content"
            dangerouslySetInnerHTML={{ 
              __html: terms?.content || `
                <h2>مقدمة</h2>
                <p>مرحباً بك في بيفو شات. باستخدامك لهذا التطبيق، فإنك توافق على الالتزام بهذه الشروط والأحكام.</p>

                <h2>متطلبات الأهلية</h2>
                <ul>
                  <li>يجب أن يكون عمرك 18 عاماً أو أكثر للتسجيل</li>
                  <li>يجب تقديم معلومات دقيقة وصحيحة</li>
                  <li>مسؤول عن الحفاظ على سرية حسابك</li>
                </ul>

                <h2>قواعد السلوك</h2>
                <p>يُمنع منعاً باتاً:</p>
                <ul>
                  <li>نشر محتوى غير قانوني أو مسيء أو ضار</li>
                  <li>التحرش أو الإساءة للآخرين</li>
                  <li>انتحال الشخصية أو التضليل</li>
                  <li>نشر محتوى ترويجي أو إعلاني غير مصرح به</li>
                  <li>استخدام برمجيات آلية أو روبوتات</li>
                </ul>

                <h2>المحتوى والملكية الفكرية</h2>
                <ul>
                  <li>أنت مسؤول عن المحتوى الذي تنشره</li>
                  <li>نحتفظ بحق حذف أي محتوى ينتهك الشروط</li>
                  <li>لا تنتهك حقوق الملكية الفكرية للآخرين</li>
                </ul>

                <h2>حماية الأطفال</h2>
                <p>التطبيق مخصص للبالغين فقط (+18). نلتزم بحماية القصّر ونمنع أي محتوى يستهدفهم أو يضرهم.</p>

                <h2>الإبلاغ والحظر</h2>
                <ul>
                  <li>يمكنك الإبلاغ عن أي محتوى أو مستخدم مخالف</li>
                  <li>يمكنك حظر أي مستخدم لا ترغب في التواصل معه</li>
                  <li>نراجع جميع البلاغات ونتخذ الإجراءات المناسبة</li>
                </ul>

                <h2>إنهاء الحساب</h2>
                <p>نحتفظ بالحق في تعليق أو إنهاء حسابك في حالة:</p>
                <ul>
                  <li>انتهاك هذه الشروط</li>
                  <li>السلوك الضار أو غير القانوني</li>
                  <li>استخدام الخدمة بشكل احتيالي</li>
                </ul>

                <h2>إخلاء المسؤولية</h2>
                <p>الخدمة مقدمة "كما هي" دون ضمانات. لسنا مسؤولين عن:</p>
                <ul>
                  <li>محتوى المستخدمين</li>
                  <li>الأضرار الناتجة عن استخدام الخدمة</li>
                  <li>انقطاع أو أخطاء في الخدمة</li>
                </ul>

                <h2>التعديلات</h2>
                <p>نحتفظ بالحق في تعديل هذه الشروط في أي وقت. سيتم إخطارك بأي تغييرات جوهرية.</p>

                <h2>الاتصال بنا</h2>
                <p>للأسئلة حول هذه الشروط، تواصل معنا: support@bivochat.com</p>
              ` 
            }}
          />
        </Card>
      </div>
    </div>
  );
}
