export default async function handler(req: any, res: any) {
  // Only allow POST
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({
      success: false,
      error: `Phương thức ${req.method} không được hỗ trợ. Vui lòng gửi yêu cầu POST.`,
    });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    const { name, email, phone, message, _hp } = body;

    // 1. Honeypot check for bots
    if (_hp && _hp.trim() !== "") {
      return res.status(200).json({
        success: true,
        message: "Tin nhắn đã được gửi thành công!",
      });
    }

    // 2. Form field validation
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: "Vui lòng nhập họ và tên của bạn.",
      });
    }

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: "Vui lòng nhập nội dung tin nhắn.",
      });
    }

    if (name.trim().length > 100) {
      return res.status(400).json({
        success: false,
        error: "Họ và tên không được vượt quá 100 ký tự.",
      });
    }

    if (message.trim().length > 3000) {
      return res.status(400).json({
        success: false,
        error: "Tin nhắn quá dài (tối đa 3000 ký tự).",
      });
    }

    // 3. Secure backend forwarding to Google Apps Script (Google Sheets + Email)
    const googleScriptUrl =
      process.env.GOOGLE_SCRIPT_URL ||
      "https://script.google.com/macros/s/AKfycbxu19mylIo6MhW5XnxhSTXZ-FNQvbPwA1F7e8RA_w2TcxKXy_EVddWzflxsZV_TPrkAbQ/exec";
    let deliveryStatus = "local_memory";

    if (googleScriptUrl && googleScriptUrl.trim() !== "") {
      try {
        const payload = JSON.stringify({
          name: name.trim(),
          email: email?.trim() || "Không cung cấp",
          phone: phone?.trim() || "Không cung cấp",
          message: message.trim(),
        });

        const resp = await fetch(googleScriptUrl.trim(), {
          method: "POST",
          redirect: "follow",
          headers: {
            "Content-Type": "text/plain;charset=utf-8",
          },
          body: payload,
        });

        if (resp.ok) {
          deliveryStatus = "google_apps_script";
        } else {
          console.warn("Vercel Serverless Google Apps Script non-200:", resp.status);
        }
      } catch (err) {
        console.error("Vercel Serverless Google Apps Script error:", err);
      }
    }

    return res.status(200).json({
      success: true,
      message: "Tin nhắn đã được gửi thành công! Hoàng Long sẽ sớm liên hệ lại với bạn.",
      data: {
        sentAt: new Date().toISOString(),
        delivery: deliveryStatus,
      },
    });
  } catch (error) {
    console.error("Serverless API contact error:", error);
    return res.status(500).json({
      success: false,
      error: "Đã xảy ra lỗi máy chủ trong quá trình gửi tin nhắn.",
    });
  }
}
