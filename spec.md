# AI SPEC — AI Mindmap Generator từ Slide/Transcript · Nhóm 03 · Zone 2
Hướng: [x] A — VLearn  [ ] B — Trợ lý Học viên  [ ] C — Làn mở
Loại: [ ] Tối ưu tính năng có sẵn  [x] Tính năng mới

## §1. User & Job
- **Người dùng (Job executor):** Học viên trên nền tảng VLearn (sinh viên, người đi làm tự học AI/ML).
- **Core JTBD:** Hệ thống hóa cấu trúc kiến thức trong slide/bài giảng dài để nhanh chóng nắm vững bài học và ôn tập trước các kỳ thi/quiz.
- **Pain point cụ thể:** Học viên đang đọc slide bài giảng có quá nhiều chữ, không rõ phân cấp thông tin, dẫn đến việc mất nhiều thời gian đọc hiểu và khó ghi nhớ liên kết giữa các khái niệm.
- **Evidence (chuẩn B - Mining chatlog):**
  * Số liệu: Qua phân tích dữ liệu chatlog thực tế (`chat_history_anonymized_for_hackathon.csv`), phát hiện **22.60% (285 trên tổng số 1261)** tin nhắn của học viên gửi cho trợ lý AI trên VLearn yêu cầu tóm tắt, hệ thống hóa hoặc giải thích tổng quan slide.
  * 5 quote nguyên văn tiêu biểu:
    1. User U0067 | Conv C0001: *"tóm tắt nội dung chính trong slide này"*
    2. User U0329 | Conv C0015: *"Giúp tôi viết summary chi tiết và đầy đủ nhất về toàn bộ slide bài giảng ngày hôm nay"*
    3. User U0221 | Conv C0018: *"tóm tắt toàn bộ slide sau đó đưa ra các ý chính"*
    4. User U0365 | Conv C0057: *"tóm tắt nội dung, đưa ra keyword cần nhớ"*
    5. User U0191 | Conv C0095: *"tóm tắt slide này gồm những phần chính gì"*

## §2. Impact & quyết định chọn
- **Bảng impact 3 ứng viên:**
  | Ứng viên tính năng | Bao nhiêu người gặp | Tần suất | Tốn gì mỗi lần | Khả thi |
  |---|---|---|---|---|
  | **1. Chatbot giải thích text dài thông thường** | ~500 học viên | Hàng ngày (3 lần/ngày) | 3 phút đọc/tổng hợp thủ công | Cao (đã có sẵn) |
  | **2. Tóm tắt slide dạng Bullet Points phẳng** | ~500 học viên | Hàng ngày (2 lần/ngày) | 2 phút đọc văn bản | Cao |
  | **3. AI tự sinh Sơ đồ tư duy (Mindmap Mermaid.js)** | ~500 học viên | Hàng ngày (3 lần/ngày) | 30 giây nhìn trực quan hóa | Rất cao |
- **Ứng viên ĐÃ LOẠI + vì sao:** Ứng viên 1 & Ứng viên 2 bị loại vì không hỗ trợ trực quan hóa mối liên kết phi tuyến tính giữa các khái niệm học thuật, học viên vẫn phải tự vẽ tay/sắp xếp cấu trúc sơ đồ trên giấy.
- **Ứng viên CHỌN + vì sao:** Chọn ứng viên 3 vì Mermaid.js là thư viện mã nguồn mở giúp render sơ đồ nhanh chóng từ mã text do LLM tạo ra, giúp giảm **75%** thời gian tổng hợp kiến thức từ slide và không tốn chi phí xây dựng công cụ đồ họa kéo thả phức tạp.

## §3. Giải pháp tương tự đã nghiên cứu
- **ChatGPT thuần:** Trả về dạng văn bản thô hoặc bullet points phẳng, không trực quan và dễ trôi tin nhắn.
- **Các công cụ ngoài (XMind AI, Whimsical):** Bắt người dùng copy-paste liên tục giữa các tab làm gián đoạn luồng học tập (context-switching).
- **Giải pháp của chúng ta:** Nhúng trực tiếp sơ đồ tư duy tương tác vào màn hình bài giảng VLearn, cho phép hiển thị sơ đồ đồng hành cùng slide.

## §4. Thiết kế
- **Lát cắt MỘT CÂU:** Một học viên đang đọc slide bài giảng có nhiều thuật ngữ bối rối, AI chuyển hóa đoạn văn bản slide đó thành một sơ đồ tư duy Mermaid phân cấp trực quan hiển thị ngay bên cạnh slide.
- **Non-goals (3 thứ không build):**
  1. Không tự xây dựng trình chỉnh sửa kéo thả/vẽ đồ họa mindmap từ đầu (chỉ sử dụng Mermaid.js render tĩnh).
  2. Không hỗ trợ xuất sơ đồ tư duy ra file ảnh chất lượng cao hoặc PDF.
  3. Không tạo mindmap tổng hợp cho nhiều buổi học cùng lúc (vượt context window).
- **Mức prototype nhắm tới:** [ ] Sketch [x] Mock [ ] Working — frontend HTML/CSS/JS giả lập giao diện VLearn nhúng iframe kết nối với backend Gradio app.py gọi API Gemini thực tế để vẽ sơ đồ.
- **Automation:** [ ] augment [x] conditional [ ] automate — lý do: Chọn mức conditional. Nếu nội dung đầu vào quá ngắn (< 30 ký tự), hệ thống tự động nhận diện và hiển thị cảnh báo lỗi thay vì cố sinh sơ đồ sai để giảm thiểu cost-of-error (học viên học sai kiến thức).
- **§4b. Nguyên tắc đã áp dụng (≥4 — HAX/PAIR):**
  | Nguyên tắc | Áp cụ thể vào đâu trong prototype |
  |---|---|
  | **G2 — Làm rõ nó làm tốt đến đâu** | Hiển thị độ chắc chắn nguồn (Confidence Score) và nguồn citation slide tương ứng ngay trên sơ đồ. |
  | **G9 — Sửa dễ dàng** | Cho phép người dùng chỉnh sửa mã nguồn Mermaid gốc hoặc nhấp đúp vào node sơ đồ để sửa text trực tiếp. |
  | **G10 — Thu hẹp phạm vi khi nghi ngờ** | Khi text đầu vào < 30 ký tự, hiển thị node lỗi duy nhất: `⚠️ Nội dung slide quá ngắn để phân tích`. |
  | **PAIR (Explainability + Trust)** | Không dịch các thuật ngữ chuyên ngành AI cốt lõi (overfitting, fine-tuning) sang tiếng Việt để bảo toàn độ chính xác học thuật. |

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
- **Chiều chất lượng + định nghĩa kiểm chứng được:**
  1. *Tính hợp lệ Mermaid Syntax (Pass/Fail):* Mã Mermaid do LLM sinh ra phải render được bình thường mà không gây lỗi cú pháp (đo bằng script tự động thông qua việc kiểm tra từ khóa mở đầu `mindmap` và cấu trúc thụt lề).
  2. *Độ trung thực kiến thức (Groundedness - Thang 1-5):* Không tự bịa nhánh ngoài dữ liệu slide. Người chấm độc lập so sánh mindmap với slide gốc: 5 = hoàn toàn khớp, 3 = có 1-2 ý tự suy diễn nhẹ, 1 = bịa đặt ý lớn.
  3. *Bảo toàn thuật ngữ (Glossary Preservation):* Đảm bảo giữ nguyên tiếng Anh gốc các thuật ngữ kỹ thuật. Số lỗi dịch thuật thuật ngữ cốt lõi phải bằng 0.
- **Golden set:** Gồm 20 case lưu tại [golden_set.json](file:///d:/K4-Hackathon-Jack-E403/eval/golden_set.json) (đang mở rộng từ 4 case ban đầu để phủ đủ 4 lớp lỗi khó, case thường và case hiếm).
- **Quality bar:** Đạt khi **>= 85%** test cases vượt qua bài test cú pháp Mermaid và không có case nào bị lỗi dịch thuật thuật ngữ chuyên ngành.
- **Kết quả các lượt chạy:**
  | Lượt chạy | Ngày giờ chạy | Số case đạt | Tỷ lệ % | Trạng thái đối chiếu Quality Bar |
  |---|---|---|---|---|
  | Lượt 1 (Baseline) | Chưa đo (CP2) | -- | -- | Sẽ chạy và ghi nhận ở CP3 |

## §8. Phân công & kế hoạch
- **Phân công thành viên:**
  * **Vũ Bảo Khánh (Product Lead & Spec):** Chịu trách nhiệm chính file `spec.md` (§1-§4), thiết kế slide, thu thập feedback validation và thuyết trình demo.
  * **Phạm Đức Hải Triều (AI Prompt & Eval Lead):** Chịu trách nhiệm chính codebase/prompts/ và thư mục eval/, thiết kế prompt Mermaid, cấu hình client gọi API LLM thật và chạy eval.
  * **Nguyễn Xuân Hải (Frontend UI & Repo Maintainer):** Chịu trách nhiệm chính code giao diện tương tác, HTML/CSS/JS, render Mermaid và cấu trúc thư mục repo nộp bài.
- **Willing users (3 học viên):** Học viên Hoàng Nam, Học viên Khánh Vân, Học viên Minh Đức.
- **Kế hoạch validation (CP5):** Phỏng vấn nhanh 3 willing users theo 3 câu hỏi (độ chính xác sơ đồ, độ dễ đọc thuật ngữ, tính hữu ích của citation). Vũ Bảo Khánh ghi nhận feedback log.

## §9. Changelog
| Thời điểm | Đổi gì | Vì sao (trỏ về feedback/case nào) |
|---|---|---|
| Lúc tạo spec | Thêm 4 lớp lỗi & Map-Reduce logic | Dựa trên phân tích chuyên sâu về Rủi ro sinh text & giới hạn Context Window. |
| CP2 (17:00 N1) | Hoàn thiện spec §1-§4 & phân công thành viên | Cập nhật số liệu thực tế từ dữ liệu mining chatlog và phân công nhóm trước hạn CP4. |
