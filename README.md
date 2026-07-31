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

## 🚀 Hướng dẫn chạy thử nghiệm (CP3)

Chạy trong CMD tại thư mục gốc của repo:

```bat
python -m pip install -r codebase\requirements.txt
run.bat
```

API key được đọc tự động từ `.env` (file này đã được Git ignore). Mở `http://127.0.0.1:5001`.

---

## 🛠 Trạng thái Prototype (CP3)

- **AI thật ở quyết định trung tâm:** `codebase/app.js` gọi `POST /api/mindmap`; `codebase/server.py` gọi LLM qua `codebase/llm_client.py`.
- **Dữ liệu thật:** `data/real-slides/slide_4.pdf` được trích xuất theo 26 trang bằng `pypdf`.
- **Render:** Mermaid.js chuyển output AI thành mindmap trong giao diện HTML hiện tại.
- **Học tiếp:** Backend parse toàn bộ Mermaid thành nhánh/node; giải thích và quiz dùng trực tiếp cấu trúc này, không gọi AI lần hai.
- **Độ khớp nguồn:** Tỷ lệ token input xuất hiện trong text trang nguồn; không phải confidence do AI tự khai.
- **Trace:** Mỗi lần gọi lưu input/output vào `eval/api_trace.jsonl`, không lưu API key.
- **Fallback:** Chỉ dùng mock khi API lỗi và luôn có nhãn cảnh báo.
- **Eval:** `eval/golden_set.json` và bảng kết quả lượt đầu do AI Prompt & Eval Lead phụ trách.
