import axios from "axios";

export const sendOTP = async (phone: string, otp: string): Promise<boolean> => {
  const instanceId = process.env.WAWP_INSTANCE_ID;
  const token = process.env.WAWP_ACCESS_TOKEN;

  if (!instanceId || !token) {
    console.error("❌ بيانات WAWP غير متوفرة في متغيرات البيئة");
    console.error(`   WAWP_INSTANCE_ID: ${instanceId ? "✅" : "❌"}`);
    console.error(`   WAWP_ACCESS_TOKEN: ${token ? "✅" : "❌"}`);
    return false;
  }

  console.log("🔄 محاولة إرسال OTP عبر WAWP...");
  console.log(`   Instance ID: ${instanceId.substring(0, 8)}...`);
  console.log(`   Phone: ${phone}`);

  const url = `https://app.wawp.net/api/send`;

  try {
    const res = await axios.post(url, {
      number: phone,
      type: "text",
      message: `رمز التحقق الخاص بك: ${otp}`,
      instance_id: instanceId,
      access_token: token
    }, {
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    console.log("✅ تم إرسال OTP بنجاح:", res.data);
    return true;
  } catch (err: any) {
    console.error("❌ خطأ في إرسال OTP:", err.message);
    console.error("   الكود: ", err.code);
    if (err.response) {
      console.error("📋 تفاصيل استجابة الخادم:");
      console.error("   Status:", err.response.status);
      console.error("   Data:", err.response.data);
    } else if (err.request) {
      console.error("📋 لم يتم استقبال رد من الخادم");
      console.error("   URL:", url);
    }
    return false;
  }
};

export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};
