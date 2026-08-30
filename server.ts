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
          message: "Vui lòng cung cấp ít nhất 1 phương thức liên hệ (Email hoặc Số điện thoại).",
        });
      }

      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({
          success: false,
          message: "Định dạng email không hợp lệ. Vui lòng kiểm tra lại.",
        });
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

      // Secure Backend Forwarding to Email Service (keys hidden on server)
      let forwardedVia = "local_memory";
      const web3FormsKey = process.env.WEB3FORMS_ACCESS_KEY || "e2f1d090-5a02-431a-9be0-a3172aed9653";
      const formspreeId = process.env.FORMSPREE_FORM_ID;

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
              subject: `[Portfolio Contact] Tin nhắn từ ${name}`,
              from_name: name,
              email: email || "no-reply@portfolio.dev",
              phone: phone || "Không cung cấp",
              message: message,
              replyto: email || undefined,
            }),
          });

          const rawText = await resp.text();
          let result: any = null;
          try {
            result = JSON.parse(rawText);
          } catch {
            // Non-JSON response (e.g. HTML error/challenge page)
          }

          if (result && result.success) {
            forwardedVia = "web3forms";
          } else if (resp.ok) {
            forwardedVia = "web3forms_ok";
          } else {
            console.warn("Web3Forms response not successful. Status:", resp.status);
          }
        } catch (err) {
          console.error("Failed to forward email to Web3Forms:", err);
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
              name,
              email: email || "no-reply@portfolio.dev",
              phone: phone || "Không cung cấp",
              message,
              _subject: `[Portfolio Contact] Tin nhắn từ ${name}`,
            }),
          });

          if (resp.ok) {
            forwardedVia = "formspree";
          } else {
            console.warn("Formspree response not ok:", resp.status);
          }
        } catch (err) {
          console.error("Failed to forward email to Formspree:", err);
        }
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
