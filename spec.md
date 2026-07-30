# AI SPEC — Tính năng: AI Mindmap Generator từ Slide/Transcript
Hướng: [ ] A — VLearn  [ ] B — Trợ lý Học viên  [x] C — Làn mở
Loại: [ ] Tối ưu tính năng có sẵn  [x] Tính năng mới

*(Các section 1, 2, 3, 4, 7, 8 do các thành viên khác phụ trách điền)*

## §1. User & Job
- **Người dùng:** Học viên trên nền tảng VLearn (sinh viên, người đi làm học AI).
- **Job-to-be-done:** Khi phải đọc tài liệu/slide dài, người dùng muốn có một cái nhìn tổng quan, tóm tắt nhanh cấu trúc kiến thức (mindmap) để dễ hệ thống hóa và ôn tập.
- **Pain point:** Đọc text liên tục gây mệt mỏi, khó nắm bắt mối liên hệ giữa các khái niệm.

## §2. Impact & quyết định chọn
- **Impact (Tác động):** Giúp người học ghi nhớ bài giảng nhanh hơn, trực quan hơn. Nâng cao trải nghiệm UX trên VLearn.
- **Quyết định chọn:** Mindmap trực quan hơn bullet points. Sử dụng thư viện Mermaid.js giúp render sơ đồ nhanh chóng bằng mã text từ LLM mà không tốn chi phí xây dựng công cụ đồ họa.

## §3. Giải pháp tương tự đã nghiên cứu
- **ChatGPT thuần:** Trả về dạng text hoặc bullet points, không trực quan.
- **Các công cụ ngoài (XMind AI, Whimsical):** Yêu cầu người dùng phải copy/paste qua lại giữa nhiều tab, làm đứt gãy luồng học tập.
- **Giải pháp của chúng ta:** Tích hợp trực tiếp Sơ đồ tư duy vào ngay lúc đọc bài giảng/slide, mang lại trải nghiệm học tập liền mạch (seamless).

## §4. Thiết kế
- **Luồng dữ liệu (Data flow):**
  1. Frontend (Giao diện Demo Gradio) nhận input text từ người dùng.
  2. Text được gửi cho Backend (hàm `generate_mindmap`).
  3. API LLM (Gemini/OpenAI) xử lý và trả về text định dạng Mermaid.
  4. Frontend nhận mã Mermaid, nhúng vào HTML và dùng thư viện Mermaid.js để vẽ đồ thị trực tiếp trên trình duyệt.
- **Ràng buộc an toàn:** Prompt kiểm soát chặt, chống bịa đặt nội dung (hallucination).

---

## §5. Kiểu lỗi — 4 lớp chỗ khó + kịch bản (≥8)

| Lớp lỗi | Tình huống cụ thể | Hành vi mong muốn (Graceful failure) | Nguyên tắc áp dụng (HAX/PAIR) |
|---|---|---|---|
| **① Nguồn sự thật** | Slide quá ngắn (chỉ có tiêu đề, < 30 ký tự). AI không có đủ input để tạo nhánh. | UI hiển thị 1 node root duy nhất với cảnh báo: "⚠️ Nội dung slide quá ngắn để phân tích". Fallback: thử gọi OCR hoặc lấy speaker notes. | **G10 (Thu hẹp phạm vi):** Không tự bịa nhánh con nếu không có bằng chứng text. |
| **① Nguồn sự thật** | AI tự động vẽ thêm nhánh con từ kiến thức nền của nó (hallucinate). | Chặn bằng System Prompt: Cấm suy diễn. Nếu phát hiện bịa, user có thể report (Feedback loop). | **PAIR (Errors):** Giới hạn hành vi dựa trên ngữ cảnh được cung cấp. |
| **② Mơ hồ** | Slide chứa toàn gạch đầu dòng ngang hàng, không rõ cấu trúc phân cấp. | Sử dụng metadata hình thức (indent, font size). Nếu vẫn không có, xuất ra một cấu trúc phẳng (Flat list - 1 root, nhiều con ngang hàng) thay vì đoán mò. | **G1 (Làm rõ khả năng):** Chấp nhận output phẳng, sai ít còn hơn sai nhiều cấp bậc. |
| **② Mơ hồ** | AI phân cấp sai ý chính thành ý phụ do đoán mò ngữ nghĩa. | **UI cho phép sửa tay:** Kéo-thả (Drag & Drop) để tự đổi cấp bậc node. Hiển thị node viền đứt/mờ nếu AI tự chấm điểm confidence score thấp. | **G9 (Sửa dễ dàng) & G11 (Giải thích):** User luôn có quyền kiểm soát cuối cùng (Control). |
| **③ Ngoài phạm vi** | User yêu cầu gom 50 slide thành 1 Mindmap khổng lồ (vượt context window / quá tải render). | Cảnh báo UI: "Với hơn 20 slide, mindmap sẽ được chia theo từng Day/Phần để dễ đọc". Chạy cơ chế Map-Reduce ngầm. | **G8 (Gạt bỏ dễ dàng):** Cung cấp giới hạn kỹ thuật thành lựa chọn UX chủ động. |
| **③ Ngoài phạm vi** | User đưa vào file không phải bài giảng (ví dụ file Excel báo cáo tài chính). | Nhận diện intent sai → Từ chối khéo léo: "Đây có vẻ không phải bài giảng. Vui lòng cung cấp nội dung slide học tập." | **G10 (Thu hẹp):** Từ chối khi ngoài domain. |
| **④ Đặc thù domain** | AI dịch sai thuật ngữ chuyên ngành AI (VD: Overfitting thành "Mặc quá chật"). | Nhúng **Glossary** chuẩn vào System Prompt. Quét hậu kiểm string match bằng blacklist, nếu dính → gắn cờ review. | **G11 & PAIR (Trust):** Đảm bảo kiến thức lõi được giữ nguyên gốc tiếng Anh, không gây hiểu lầm. |
| **④ Đặc thù domain** | Thuật ngữ mới xuất hiện chưa có trong Glossary bị dịch sai. | Eval set định kỳ chạy benchmark quét thuật ngữ. Có nút [Báo lỗi thuật ngữ] ngay trên node để cập nhật Glossary. | **G15 (Mời feedback):** Cho phép người dùng feedback lỗi dịch thuật. |

---

## §6. Bốn đường đi của trải nghiệm

- **Happy path:** User chọn 1 bài giảng dài ~10 slides. AI (với System Prompt chặt chẽ) map chuẩn xác cấu trúc, xuất ra code Mermaid.js. Giao diện render thành Mindmap đẹp mắt, các nhánh phân cấp đúng như nội dung slide, các thuật ngữ tiếng Anh (như Fine-tuning) được giữ nguyên.
- **Low-confidence (②):** Slide không có thụt đầu dòng (indentation). AI xuất ra một cấu trúc phẳng (1 cấp độ). Các node hiển thị với **viền đứt mờ**, báo hiệu AI không chắc chắn về phân cấp.
- **Failure/không căn cứ (① & ③):** 
  - (Trường hợp ①) User chọn slide chỉ có duy nhất chữ "Thank you". AI trả về 1 root node và 1 nhánh "⚠️ Nội dung slide quá ngắn để phân tích".
  - (Trường hợp ③) User chọn nguyên 1 khóa học 100 slides. UI chặn lại trước khi gọi AI: "Giới hạn tối đa 20 slides/lần để mindmap không bị quá tải. Vui lòng chọn lại."
- **Correction (user sửa):** Mặc dù AI phân cấp sai một ý phụ, user dễ dàng dùng chuột kéo (drag) ý phụ đó thả vào đúng vị trí node cha mà họ muốn. Hoặc user bấm "Chỉnh sửa text" và sửa lại nội dung của một node.

---

## §7. Kiểm thử
- Xây dựng bộ test chuẩn: `eval/golden_set.json` (4 trường hợp độ khó từ cơ bản đến phức tạp).
- Đã triển khai script tự động `eval/eval_run.py` giúp duyệt qua tất cả kịch bản, gọi AI lấy kết quả và in ra đối chiếu (Human Eval) với hành vi dự kiến.

## §8. Phân công & kế hoạch
- **Thành viên 1:** Viết Prompt, cấu hình thư viện `llm_client.py` (Gemini/OpenAI).
- **Thành viên 2:** Code giao diện tương tác Demo (`app.py` với Gradio).
- **Thành viên 3:** Chuẩn bị test cases, viết script chạy đánh giá tự động.
- **Thành viên 4:** Viết tài liệu đặc tả (AI Spec), thu thập feedback từ người dùng ngoài nhóm (User Testing).

## §9. Changelog
| Thời điểm | Đổi gì | Vì sao (trỏ về feedback/case nào) |
|---|---|---|
| Lúc tạo spec | Thêm 4 lớp lỗi & Map-Reduce logic | Dựa trên phân tích chuyên sâu về Rủi ro sinh text & giới hạn Context Window. |
