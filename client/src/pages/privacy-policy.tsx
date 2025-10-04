import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowRight, Shield, Lock, Eye, Trash2, Bell, Image, CreditCard, Sparkles } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#075e54] to-[#128c7e] p-4" dir="rtl">
      <div className="max-w-4xl mx-auto py-8">
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" className="text-white hover:bg-white/10" data-testid="button-back-home">
              <ArrowRight className="ml-2 h-4 w-4" />
              العودة للرئيسية
            </Button>
          </Link>
        </div>

        <Card className="shadow-2xl">
          <CardHeader className="bg-gradient-to-r from-[#075e54] to-[#128c7e] text-white rounded-t-lg">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8" />
              <CardTitle className="text-3xl">سياسة الخصوصية - Bivochat</CardTitle>
            </div>
            <p className="text-green-100 mt-2">آخر تحديث: {new Date().toLocaleDateString('ar-SA')}</p>
          </CardHeader>

          <CardContent className="p-8 space-y-8">
            {/* مقدمة */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-[#075e54]" />
                مرحباً بك في Bivochat
              </h2>
              <p className="text-gray-700 leading-relaxed">
                نحن في <strong>Bivochat</strong> نلتزم بحماية خصوصيتك وأمان بياناتك الشخصية. تطبيقنا مصمم لتوفير منصة آمنة وموثوقة للتواصل الاجتماعي والتجارة الإلكترونية. هذه السياسة توضح كيفية جمع واستخدام وحماية معلوماتك.
              </p>
            </section>

            {/* التزامنا الأساسي */}
            <section className="bg-green-50 p-6 rounded-lg border-r-4 border-[#075e54]">
              <h2 className="text-2xl font-bold text-[#075e54] mb-4 flex items-center gap-2">
                <Lock className="h-6 w-6" />
                التزامنا الأساسي تجاهك
              </h2>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-[#075e54] font-bold text-xl">✓</span>
                  <span><strong>نحن لا نبيع بياناتك أبداً:</strong> بياناتك الشخصية ومعلوماتك محمية ولن يتم بيعها أو مشاركتها مع أطراف ثالثة لأغراض تجارية.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#075e54] font-bold text-xl">✓</span>
                  <span><strong>حقك في الحذف:</strong> يمكنك حذف حسابك بالكامل في أي وقت تشاء، وسيتم حذف جميع بياناتك الشخصية بشكل دائم.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#075e54] font-bold text-xl">✓</span>
                  <span><strong>شفافية كاملة:</strong> نلتزم بإبلاغك بأي تغييرات على سياسة الخصوصية.</span>
                </li>
              </ul>
            </section>

            {/* البيانات التي نجمعها */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Eye className="h-6 w-6 text-[#075e54]" />
                البيانات التي نجمعها
              </h2>
              <div className="space-y-4 text-gray-700">
                <div>
                  <h3 className="font-semibold text-lg text-[#075e54] mb-2">1. معلومات الحساب:</h3>
                  <ul className="list-disc list-inside space-y-1 mr-4">
                    <li>الاسم ورقم الهاتف أو البريد الإلكتروني</li>
                    <li>صورة الملف الشخصي (اختيارية)</li>
                    <li>معلومات الموقع (اختيارية للبائعين)</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-[#075e54] mb-2">2. بيانات الاستخدام:</h3>
                  <ul className="list-disc list-inside space-y-1 mr-4">
                    <li>المحادثات والرسائل (مشفرة)</li>
                    <li>المنشورات والتعليقات</li>
                    <li>المنتجات والمتاجر التي تنشئها</li>
                    <li>نشاطك داخل التطبيق</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-[#075e54] mb-2">3. بيانات تقنية:</h3>
                  <ul className="list-disc list-inside space-y-1 mr-4">
                    <li>نوع الجهاز ونظام التشغيل</li>
                    <li>عنوان IP (للأمان فقط)</li>
                    <li>معلومات الدخول والجلسات</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* الصلاحيات المطلوبة */}
            <section className="bg-blue-50 p-6 rounded-lg">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Bell className="h-6 w-6 text-[#075e54]" />
                الصلاحيات المطلوبة وأسباب استخدامها
              </h2>
              <div className="space-y-4 text-gray-700">
                <div className="flex items-start gap-3">
                  <Bell className="h-5 w-5 text-[#075e54] mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-[#075e54]">صلاحية الإشعارات (Notifications):</h3>
                    <p className="mt-1">نحتاج هذه الصلاحية لإرسال إشعارات فورية عند استلامك رسائل جديدة، تعليقات على منشوراتك، طلبات شراء منتجاتك، أو تحديثات مهمة. يمكنك تعطيل الإشعارات في أي وقت من إعدادات التطبيق.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Image className="h-5 w-5 text-[#075e54] mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-[#075e54]">صلاحية الوصول للصور (Photos/Media):</h3>
                    <p className="mt-1">نطلب هذه الصلاحية فقط لتمكينك من رفع صور منتجاتك، صورة ملفك الشخصي، والصور في المحادثات والمنشورات. لن يتم الوصول لأي صور أخرى على جهازك، ويمكنك اختيار الصور التي تريد رفعها فقط.</p>
                  </div>
                </div>
              </div>
              <p className="mt-4 text-sm text-gray-600 italic">
                💡 ملاحظة: جميع الصلاحيات اختيارية ويمكنك استخدام التطبيق بدونها، لكنها تحسن تجربتك وتمكنك من الاستفادة الكاملة من مميزات التطبيق.
              </p>
            </section>

            {/* كيف نستخدم بياناتك */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">كيف نستخدم بياناتك</h2>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-[#075e54]">•</span>
                  <span>تمكين التواصل بينك وبين المستخدمين الآخرين</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#075e54]">•</span>
                  <span>عرض منتجاتك ومتجرك للمشترين المحتملين</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#075e54]">•</span>
                  <span>تحسين خدماتنا وتجربة المستخدم</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#075e54]">•</span>
                  <span>حماية الأمان ومنع الاحتيال</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#075e54]">•</span>
                  <span>إرسال الإشعارات والتحديثات المهمة</span>
                </li>
              </ul>
            </section>

            {/* طرق الدفع */}
            <section className="bg-yellow-50 p-6 rounded-lg border-r-4 border-yellow-500">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <CreditCard className="h-6 w-6 text-yellow-600" />
                طرق الدفع والمعاملات المالية
              </h2>
              <p className="text-gray-700 leading-relaxed">
                <strong>Bivochat</strong> لا يتعامل مع أي معاملات مالية إلكترونية. <strong>جميع المعاملات داخل التطبيق تتم عن طريق الدفع عند الاستلام فقط.</strong> هذا يعني:
              </p>
              <ul className="mt-3 space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-yellow-600">✓</span>
                  <span>لا نجمع أو نخزن أي معلومات بطاقات ائتمانية</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-600">✓</span>
                  <span>لا نتعامل مع معلومات بنكية أو حسابات مالية</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-600">✓</span>
                  <span>الدفع يتم مباشرة بين المشتري والبائع عند التسليم</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-600">✓</span>
                  <span>نحن نوفر منصة للتواصل فقط، ولسنا وسيط مالي</span>
                </li>
              </ul>
            </section>

            {/* مشاركة البيانات */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">مشاركة البيانات</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                نحن <strong>لا نبيع</strong> بياناتك الشخصية لأي جهة خارجية. قد نشارك بيانات محدودة فقط في الحالات التالية:
              </p>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-[#075e54]">•</span>
                  <span>مزودي الخدمات التقنية (مثل استضافة الخوادم وتخزين الملفات) - بموجب اتفاقيات حماية بيانات صارمة</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#075e54]">•</span>
                  <span>الامتثال للقوانين أو الأوامر القضائية</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#075e54]">•</span>
                  <span>حماية حقوقنا وأمان مستخدمينا</span>
                </li>
              </ul>
            </section>

            {/* أمان البيانات */}
            <section className="bg-gray-50 p-6 rounded-lg">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Lock className="h-6 w-6 text-[#075e54]" />
                أمان وحماية بياناتك
              </h2>
              <p className="text-gray-700 leading-relaxed">
                نستخدم أحدث تقنيات الأمان لحماية بياناتك، بما في ذلك:
              </p>
              <ul className="mt-3 space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-[#075e54]">🔒</span>
                  <span>تشفير البيانات أثناء النقل والتخزين</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#075e54]">🔒</span>
                  <span>مصادقة آمنة عبر OTP</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#075e54]">🔒</span>
                  <span>خوادم آمنة ومراقبة مستمرة</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#075e54]">🔒</span>
                  <span>نسخ احتياطي دوري للبيانات</span>
                </li>
              </ul>
            </section>

            {/* حقوقك */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Trash2 className="h-6 w-6 text-[#075e54]" />
                حقوقك في التحكم ببياناتك
              </h2>
              <div className="space-y-3 text-gray-700">
                <div className="p-4 bg-green-50 rounded-lg">
                  <h3 className="font-semibold text-[#075e54] mb-2">✓ حذف الحساب:</h3>
                  <p>يمكنك حذف حسابك بالكامل في أي وقت من إعدادات التطبيق. سيتم حذف جميع بياناتك الشخصية، المحادثات، المنشورات، والمنتجات بشكل دائم.</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <h3 className="font-semibold text-[#075e54] mb-2">✓ تعديل البيانات:</h3>
                  <p>يمكنك تعديل معلومات ملفك الشخصي، الإعدادات، والبيانات الأخرى في أي وقت.</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <h3 className="font-semibold text-[#075e54] mb-2">✓ تصدير البيانات:</h3>
                  <p>يمكنك طلب نسخة من بياناتك الشخصية عبر التواصل معنا.</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <h3 className="font-semibold text-[#075e54] mb-2">✓ إلغاء الاشتراك:</h3>
                  <p>يمكنك إلغاء الاشتراك من الإشعارات والرسائل التسويقية في أي وقت.</p>
                </div>
              </div>
            </section>

            {/* خصوصية الأطفال */}
            <section className="bg-red-50 p-6 rounded-lg border-r-4 border-red-500">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">خصوصية الأطفال</h2>
              <p className="text-gray-700 leading-relaxed">
                تطبيق <strong>Bivochat</strong> مخصص للمستخدمين من عمر 13 سنة فما فوق. نحن لا نجمع عن قصد معلومات من الأطفال دون سن 13 عاماً. إذا اكتشفنا أن طفلاً قدم معلومات شخصية، سنقوم بحذفها فوراً.
              </p>
            </section>

            {/* التطوير المستمر */}
            <section className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg border-r-4 border-purple-500">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-purple-600" />
                التزامنا بالتطوير المستمر
              </h2>
              <p className="text-gray-700 leading-relaxed">
                نحن في فريق <strong>Bivochat</strong> ملتزمون بالتطوير المستمر للتطبيق وتحسين تجربة المستخدم. نعمل باستمرار على:
              </p>
              <ul className="mt-3 space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-purple-600">✨</span>
                  <span>إضافة ميزات جديدة تلبي احتياجات المستخدمين</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600">✨</span>
                  <span>تحسين الأداء والسرعة</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600">✨</span>
                  <span>تعزيز الأمان والخصوصية</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600">✨</span>
                  <span>إصلاح الأخطاء والمشاكل بسرعة</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600">✨</span>
                  <span>الاستماع لملاحظاتكم ومقترحاتكم</span>
                </li>
              </ul>
              <p className="mt-4 text-gray-700 font-semibold">
                هدفنا هو أن نجعل <strong>Bivochat</strong> أفضل منصة للتواصل والتجارة في العالم العربي! 🚀
              </p>
            </section>

            {/* التغييرات على السياسة */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">التغييرات على سياسة الخصوصية</h2>
              <p className="text-gray-700 leading-relaxed">
                قد نقوم بتحديث سياسة الخصوصية من وقت لآخر. سنقوم بإخطارك بأي تغييرات جوهرية عبر إشعار داخل التطبيق أو عبر البريد الإلكتروني. ننصحك بمراجعة هذه الصفحة بشكل دوري للاطلاع على أي تحديثات.
              </p>
            </section>

            {/* التواصل معنا */}
            <section className="bg-[#075e54] text-white p-6 rounded-lg">
              <h2 className="text-2xl font-bold mb-4">تواصل معنا</h2>
              <p className="leading-relaxed mb-4">
                إذا كان لديك أي أسئلة أو استفسارات حول سياسة الخصوصية أو كيفية استخدامنا لبياناتك، لا تتردد في التواصل معنا:
              </p>
              <div className="space-y-2">
                <p>📧 البريد الإلكتروني: privacy@bivochat.com</p>
                <p>📱 دعم المستخدمين: من خلال إعدادات التطبيق</p>
              </div>
            </section>

            {/* الموافقة */}
            <section className="border-t-2 border-gray-200 pt-6 mt-8">
              <p className="text-gray-700 leading-relaxed">
                باستخدامك لتطبيق <strong>Bivochat</strong>، فإنك توافق على سياسة الخصوصية هذه وعلى جمع واستخدام معلوماتك كما هو موضح أعلاه. إذا كنت لا توافق على هذه السياسة، يرجى عدم استخدام التطبيق.
              </p>
              <p className="text-gray-600 text-sm mt-4 italic">
                آخر تحديث: {new Date().toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </section>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <Link href="/">
            <Button className="bg-white text-[#075e54] hover:bg-gray-100" data-testid="button-back-bottom">
              العودة للرئيسية
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
