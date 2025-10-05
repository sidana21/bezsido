import axios from "axios";

export const sendOTP = async (phone: string, otp: string): Promise<boolean> => {
  const instanceId = process.env.WAWP_INSTANCE_ID;
  const token = process.env.WAWP_ACCESS_TOKEN;

  if (!instanceId || !token) {
    console.error("❌ بيانات WAWP غير متوفرة في متغيرات البيئة");
    return false;
  }

  const url = `https://app.wawp.net/api/send`;

  try {
    const res = await axios.post(url, {
      number: phone,
      type: "text",
      message: `رمز التحقق الخاص بك: ${otp}`,
      instance_id: instanceId,
      access_token: token
    });
    console.log("✅ تم إرسال OTP بنجاح:", res.data);
    return true;
  } catch (err: any) {
    console.error("❌ خطأ في إرسال OTP:", err.message);
    if (err.response) {
      console.error("📋 تفاصيل الخطأ:", err.response.data);
    }
    return false;
  }
};

export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};
