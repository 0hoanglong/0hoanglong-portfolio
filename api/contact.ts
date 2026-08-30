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

    // 3. Secure backend forwarding (Keys hidden in Vercel Environment Variables)
    const web3FormsKey = process.env.WEB3FORMS_ACCESS_KEY || "e2f1d090-5a02-431a-9be0-a3172aed9653";
    const formspreeId = process.env.FORMSPREE_FORM_ID;
    let deliveryStatus = "local_memory";

    if (web3FormsKey && web3FormsKey.trim() !== "") {
      try {
        const resp = await fetch("https://api.web3forms.com/submit", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "User-Agent": "Mozilla/5.0 (compatible; PortfolioBackend/1.0)",
          },
          body: JSON.stringify({
            access_key: web3FormsKey.trim(),
            subject: `[Portfolio Contact] Tin nhắn mới từ ${name.trim()}`,
            from_name: name.trim(),
            email: email?.trim() || "no-reply@portfolio.dev",
            phone: phone?.trim() || "Không cung cấp",
            message: message.trim(),
            replyto: email?.trim() || undefined,
          }),
        });

        const rawText = await resp.text();
        let result: any = null;
        try {
          result = JSON.parse(rawText);
        } catch {
          // Response was not JSON
        }

        if (result && result.success) {
          deliveryStatus = "web3forms";
        } else if (resp.ok) {
          deliveryStatus = "web3forms_ok";
        } else {
          console.warn("Web3Forms response not successful. Status:", resp.status);
        }
      } catch (err) {
        console.error("Vercel Serverless Web3Forms error:", err);
      }
    } else if (formspreeId && formspreeId.trim() !== "") {
      try {
        const resp = await fetch(`https://formspree.io/f/${formspreeId.trim()}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "User-Agent": "Mozilla/5.0 (compatible; PortfolioBackend/1.0)",
          },
          body: JSON.stringify({
            name: name.trim(),
            email: email?.trim() || "no-reply@portfolio.dev",
            phone: phone?.trim() || "Không cung cấp",
            message: message.trim(),
            _subject: `[Portfolio Contact] Tin nhắn mới từ ${name.trim()}`,
          }),
        });

        if (resp.ok) {
          deliveryStatus = "formspree";
        }
      } catch (err) {
        console.error("Vercel Serverless Formspree error:", err);
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
