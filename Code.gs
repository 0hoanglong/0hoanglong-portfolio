/**
 * ============================================================================
 * GOOGLE APPS SCRIPT (Code.gs) - FORM LIÊN HỆ PORTFOLIO HOÀNG LONG
 * ============================================================================
 * 
 * CHỨC NĂNG:
 * 1. Tự động lưu toàn bộ dữ liệu tin nhắn vào Google Sheets (Thời gian, Tên, Email, SĐT, Nội dung).
 * 2. Tự động gửi email thông báo từ Mail 1 (longred101@gmail.com) sang Mail đích chính (hoanglong.tech07@gmail.com).
 * 
 * HƯỚNG DẪN CÀI ĐẶT TRÊN GOOGLE SHEETS:
 * 1. Tạo Google Sheet mới tại: https://sheets.new
 * 2. Đặt tên Sheet là: "Portfolio Contact Logs"
 * 3. Tạo các tiêu đề cột ở dòng 1:
 *    - Cột A: Thời gian
 *    - Cột B: Họ và tên
 *    - Cột C: Email
 *    - Cột D: Số điện thoại
 *    - Cột E: Nội dung tin nhắn
 * 4. Vào menu: Tiện ích mở rộng (Extensions) -> Apps Script
 * 5. Xóa hết code cũ trong tệp Code.gs và dán toàn bộ đoạn code dưới đây vào.
 * 6. Bấm "Triển khai" (Deploy) -> "Tùy chọn triển khai mới" (New deployment)
 *    - Chọn loại: "Ứng dụng web" (Web app)
 *    - Thực thi dưới dạng (Execute as): "Tôi" (Địa chỉ email của bạn)
 *    - Ai có quyền truy cập (Who has access): "Bất kỳ ai" (Anyone)  <-- BẮT BUỘC CHỌN MỤC NÀY
 * 7. Bấm "Triển khai" (Deploy) -> Cấp quyền truy cập Google Drive / Gmail.
 * 8. Copy đường dẫn "URL ứng dụng web" (có dạng: https://script.google.com/macros/s/.../exec)
 * 9. Dán URL này vào biến môi trường `GOOGLE_SCRIPT_URL` trên Vercel hoặc file .env.
 * ============================================================================
 */

function doPost(e) {
  try {
    var data = {};
    if (e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    } else if (e.parameter) {
      data = e.parameter;
    }

    var name = data.name || "Không rõ";
    var email = data.email || "Không cung cấp";
    var phone = data.phone || "Không cung cấp";
    var message = data.message || "Không có nội dung";
    var timestamp = new Date();

    // 1. Ghi dữ liệu vào Google Sheet
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    sheet.appendRow([
      Utilities.formatDate(timestamp, "GMT+7", "yyyy-MM-dd HH:mm:ss"),
      name,
      email,
      phone,
      message
    ]);

    // 2. Gửi email từ Mail 1 sang Mail đích chính (GmailApp hỗ trợ xóa ngay sau khi gửi)
    var targetEmail = "hoanglong.tech07@gmail.com"; 
    var emailSubject = "🔥 [Portfolio] Tin nhắn liên hệ mới từ: " + name;
    
    var emailBody = 
      "Xin chào Hoàng Long,\n\n" +
      "Bạn nhận được một tin nhắn liên hệ mới từ Portfolio cá nhân:\n\n" +
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
      "👤 Người gửi: " + name + "\n" +
      "📧 Email: " + email + "\n" +
      "📞 Số điện thoại: " + phone + "\n" +
      "⏰ Thời gian: " + Utilities.formatDate(timestamp, "GMT+7", "yyyy-MM-dd HH:mm:ss") + "\n" +
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
      "💬 NỘI DUNG TIN NHẮN:\n" + message + "\n\n" +
      "─────────────────────────────────────────\n" +
      "📊 Dữ liệu này đã được tự động ghi lại vào Google Sheets của bạn.";

    // Gửi email qua GmailApp
    GmailApp.sendEmail(targetEmail, emailSubject, emailBody, {
      replyTo: (email && email.indexOf("@") > 0) ? email : targetEmail
    });

    // 3. Tự động chuyển email vừa gửi vào Thùng rác (Trash) để giải phóng dung lượng Mail 1
    Utilities.sleep(1200); // Chờ 1.2s để Gmail lập chỉ mục thư đã gửi
    var sentThreads = GmailApp.search('to:' + targetEmail + ' subject:"' + emailSubject + '" in:sent', 0, 1);
    if (sentThreads && sentThreads.length > 0) {
      sentThreads[0].moveToTrash(); // Chuyển vào thùng rác (tự dọn sạch mà không tốn dung lượng)
    }

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: "Đã lưu log vào Google Sheet và gửi email thành công!"
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Xử lý phương thức GET để test nhanh link script trên trình duyệt
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "online",
    message: "Google Apps Script Contact API đang hoạt động tốt!"
  })).setMimeType(ContentService.MimeType.JSON);
}
