import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

interface ContactMessage {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  message: string;
  timestamp: string;
  ip: string;
}

const contactMessages: ContactMessage[] = [];
// In-memory rate limiting map: ip -> last submission timestamp in ms
const rateLimitMap = new Map<string, number>();
const COOLDOWN_MS = 3 * 60 * 1000; // 3 minutes cooldown

function sanitizeInput(str: string): string {
  if (!str) return "";
  return String(str)
    .trim()
    .replace(/[<>]/g, ""); // Basic XSS mitigation
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON & URL-encoded parsing middlewares
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));

  // API: Health check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", uptime: process.uptime() });
  });

  // API: Contact Form Submission
  app.post("/api/contact", async (req, res) => {
    try {
      const clientIp =
        (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
        req.socket.remoteAddress ||
        "unknown";

      const honeypot = req.body._hp;
      if (honeypot && String(honeypot).trim().length > 0) {
        // Honeypot caught bot spam -> silently succeed
        return res.json({
          success: true,
          message: "Cảm ơn bạn đã gửi tin nhắn! Tôi sẽ phản hồi sớm nhất.",
        });
      }

      // Check rate limit per IP
      const now = Date.now();
      const lastSent = rateLimitMap.get(clientIp);
      if (lastSent && now - lastSent < COOLDOWN_MS) {
        const remainingSeconds = Math.ceil((COOLDOWN_MS - (now - lastSent)) / 1000);
        return res.status(429).json({
          success: false,
          message: `Vui lòng đợi ${remainingSeconds} giây trước khi gửi tiếp tin nhắn mới.`,
          remainingSeconds,
        });
      }

      const rawName = req.body.name || "";
      const rawEmail = req.body.email || "";
      const rawPhone = req.body.phone || "";
      const rawMessage = req.body.message || "";

      const name = sanitizeInput(rawName);
      const email = sanitizeInput(rawEmail);
      const phone = sanitizeInput(rawPhone);
      const message = sanitizeInput(rawMessage);

      // Validation
      if (!name) {
        return res.status(400).json({
          success: false,
          message: "Vui lòng nhập họ tên của bạn.",
        });
      }

      if (!email && !phone) {
        return res.status(400).json({
          success: false,
          message: "Vui lòng cung cấp ít nhất 1 phương thức liên hệ (Email hoặc Số điện thoại 10 số).",
        });
      }

      // Email validation: must have @ and domain name
      const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (email && !EMAIL_REGEX.test(email)) {
        return res.status(400).json({
          success: false,
          message: "Định dạng email không hợp lệ (cần có ký tự @ và tên miền, ví dụ: name@gmail.com).",
        });
      }

      // Phone validation
      if (phone) {
        const cleanPhone = phone.replace(/[\s.\-()]/g, '');
        if (cleanPhone.startsWith('+84')) {
          const afterCode = cleanPhone.slice(3);
          if (!/^[1-9][0-9]{8}$/.test(afterCode)) {
            return res.status(400).json({
              success: false,
              message: "Số điện thoại (+84) cần có 9 chữ số theo sau (ví dụ: +84 912 345 678).",
            });
          }
        } else if (cleanPhone.startsWith('0')) {
          if (!/^0[1-9][0-9]{8}$/.test(cleanPhone)) {
            return res.status(400).json({
              success: false,
              message: "Số điện thoại Việt Nam cần đủ 10 chữ số bắt đầu bằng số 0 (ví dụ: 0912 345 678).",
            });
          }
        } else if (cleanPhone.startsWith('+')) {
          // International phone number
          if (!/^\+[1-9][0-9]{6,14}$/.test(cleanPhone)) {
            return res.status(400).json({
              success: false,
              message: "Định dạng số điện thoại quốc tế không hợp lệ.",
            });
          }
          if (!email) {
            return res.status(400).json({
              success: false,
              message: "Số điện thoại quốc tế cần kèm theo địa chỉ Email để chúng tôi phản hồi lại bạn.",
            });
          }
        } else {
          return res.status(400).json({
            success: false,
            message: "Số điện thoại không hợp lệ (cần đủ 10 chữ số bắt đầu bằng 0 hoặc +84).",
          });
        }
      }

      if (!message || message.length < 5) {
        return res.status(400).json({
          success: false,
          message: "Nội dung tin nhắn cần tối thiểu 5 ký tự.",
        });
      }

      // Record valid message locally
      const newMessage: ContactMessage = {
        id: "msg_" + Math.random().toString(36).substring(2, 9),
        name,
        email: email || undefined,
        phone: phone || undefined,
        message,
        timestamp: new Date().toISOString(),
        ip: clientIp,
      };

      contactMessages.unshift(newMessage);
      // Keep only recent 50 messages
      if (contactMessages.length > 50) {
        contactMessages.pop();
      }

      // Update rate limiter
      rateLimitMap.set(clientIp, now);

      // Secure Backend Forwarding to Google Apps Script (Google Sheets + Email)
      let forwardedVia = "local_memory";
      const googleScriptUrl =
        process.env.GOOGLE_SCRIPT_URL ||
        "https://script.google.com/macros/s/AKfycbxu19mylIo6MhW5XnxhSTXZ-FNQvbPwA1F7e8RA_w2TcxKXy_EVddWzflxsZV_TPrkAbQ/exec";

      if (googleScriptUrl && googleScriptUrl.trim() !== "") {
        try {
          console.log("Forwarding message to Google Apps Script URL:", googleScriptUrl.trim());
          const payload = JSON.stringify({
            name,
            email: email || "Không cung cấp",
            phone: phone || "Không cung cấp",
            message,
          });

          const resp = await fetch(googleScriptUrl.trim(), {
            method: "POST",
            redirect: "follow",
            headers: {
              "Content-Type": "text/plain;charset=utf-8",
            },
            body: payload,
          });

          const responseText = await resp.text();
          console.log("Google Apps Script response status:", resp.status, "body:", responseText);

          if (resp.ok) {
            forwardedVia = "google_apps_script";
          } else {
            console.warn("Google Apps Script responded with non-200 status:", resp.status);
          }
        } catch (err) {
          console.error("Failed to forward to Google Apps Script:", err);
        }
      } else {
        console.warn("GOOGLE_SCRIPT_URL is not set or empty. Storing message in local memory only.");
      }

      return res.status(200).json({
        success: true,
        message: "Tin nhắn đã được gửi thành công! Hoàng Long sẽ sớm liên hệ lại với bạn.",
        data: {
          id: newMessage.id,
          sentAt: newMessage.timestamp,
          delivery: forwardedVia,
        },
      });
    } catch (error) {
      console.error("Error processing contact form:", error);
      return res.status(500).json({
        success: false,
        message: "Đã xảy ra lỗi trên máy chủ. Vui lòng thử lại sau.",
      });
    }
  });

  // API: Get messages (for debugging and testing)
  app.get("/api/contact/messages", (_req, res) => {
    res.json({
      success: true,
      count: contactMessages.length,
      messages: contactMessages,
    });
  });

  // API: Clear messages
  app.delete("/api/contact/messages", (_req, res) => {
    contactMessages.length = 0;
    res.json({ success: true, message: "Inbox cleared" });
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Portfolio Server is running on http://localhost:${PORT}`);
  });
}

startServer();
