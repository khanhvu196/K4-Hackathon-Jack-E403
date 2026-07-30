# VLearn Smart Visualizer — Mini Hackathon AI (Batch 03)

> **Mô-đun AI tự động chuyển đổi Slide PDF dài thành Sơ đồ tư duy/Tiến trình đa dạng có Deep-link.**

---

## 👥 Danh sách thành viên & Phân công

| Thành viên | Vai trò chính | Nhiệm vụ chi tiết & File artifacts phụ trách |
| :--- | :--- | :--- |
| **Vũ Bảo Khánh** | **Product Lead & Spec** | • Chịu trách nhiệm chính: File `spec.md` (§1-§4) & `demo-slides.pdf`<br>• Mining Data: Đào thư mục `data/` lấy con số bằng chứng cho Spec §1 & Canvas.<br>• Validation: Dẫn dắt vòng user test, thu thập feedback ghi vào `validation/user-feedback.md`.<br>• Demo & Presentation: Chuẩn bị Slide 6 trang và trực tiếp thuyết trình ở mốc CP6. |
| **Phạm Đức Hải Triều** | **AI Prompt & Eval Lead** | • Chịu trách nhiệm chính: Thư mục `eval/` & `spec.md` (§5-§6)<br>• Prompt Engineering: Thiết kế System Prompts trong `codebase/prompts/` để ép AI xuất cú pháp Mermaid.js chuẩn.<br>• AI Integration: Cấu hình API Call gọi LLM chạy thật (Rule 1 cho CP3).<br>• Eval & Benchmark: Xây dựng `eval/golden_set.json` từ dữ liệu mẫu và chạy đo đạc tỷ lệ chính xác (Grounding Accuracy). |
| **Nguyễn Xuân Hải** | **Frontend UI & Repo Maintainer** | • Chịu trách nhiệm chính: Thư mục `codebase/` & `README.md`<br>• Build Prototype: Lập trình file `codebase/index.html` hiển thị giao diện đọc slide VLearn + Sidebar.<br>• Render & Tương tác: Tích hợp Mermaid.js chuyển đổi 3 dạng sơ đồ và xử lý JavaScript sự kiện click Node $\rightarrow$ cuộn Slide (Deep-link).<br>• Quản trị Repo: Dựng cấu trúc cây thư mục repo chuẩn R7, tổng hợp file `reflection/`. |

---

## 🚀 Hướng dẫn chạy thử nghiệm (CP2)

1. Mở trực tiếp file [codebase/index.html](file:///d:/K4-Hackathon-Jack-E403/codebase/index.html) bằng trình duyệt web.
2. Không cần cấu hình dev server hay cài đặt môi trường phức tạp ở mốc CP2.

---

## 🛠 Trạng thái Mockup (CP2)

Để phục vụ cho mốc **CP2 (Show được thứ bấm được)**, dự án đang triển khai ở mức **Mockup**:
- **Dữ liệu slide/transcript:** Đang sử dụng tập dữ liệu mẫu tĩnh (gồm slide 15, 21, 28) định nghĩa trong [codebase/app.js](file:///d:/K4-Hackathon-Jack-E403/codebase/app.js).
- **Mô hình AI:** Chưa gọi API LLM thực tế. Logic phân tích và tách ý chính đang được mô phỏng dựa trên thuật toán so khớp từ khóa đơn giản để tìm slide phù hợp nhất.
- **Hướng nâng cấp lên CP3:** Kết nối API thực tế (Gemini/OpenAI) qua [codebase/llm_client.py](file:///d:/K4-Hackathon-Jack-E403/codebase/llm_client.py) để sinh mã Mermaid thực và tích hợp bộ đánh giá 20 test cases.
