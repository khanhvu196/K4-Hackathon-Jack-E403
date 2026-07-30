const slideData = [
  {
    id: "slide-15",
    title: "Prompt rõ ràng",
    source: "Slide 15",
    text:
      "Prompt tốt cần nói rõ vai trò, nhiệm vụ, ngữ cảnh, format output và tiêu chí chất lượng. Nếu thiếu ngữ cảnh, mô hình dễ đoán sai hoặc trả lời quá chung.",
    center: "Cấu trúc prompt tốt",
    branches: [
      {
        title: "Vai trò & nhiệm vụ",
        leaves: ["Nói AI đang đóng vai gì", "Chỉ rõ việc cần làm", "Tránh yêu cầu mơ hồ"],
        keyword: "role, task"
      },
      {
        title: "Ngữ cảnh",
        leaves: ["Cung cấp dữ liệu nền", "Nêu giới hạn phạm vi", "Bổ sung ví dụ nếu có"],
        keyword: "context"
      },
      {
        title: "Output",
        leaves: ["Quy định format", "Nêu độ dài mong muốn", "Chốt tiêu chí chất lượng"],
        keyword: "format, quality bar"
      }
    ]
  },
  {
    id: "slide-21",
    title: "RAG và nguồn sự thật",
    source: "Slide 21",
    text:
      "RAG giúp mô hình trả lời dựa trên tài liệu được truy xuất. Điểm quan trọng là chọn đúng nguồn sự thật, trích dẫn rõ và không trả lời khi không có căn cứ.",
    center: "RAG có căn cứ",
    branches: [
      {
        title: "Truy xuất",
        leaves: ["Tìm đoạn liên quan", "Ưu tiên nguồn chính thức", "Giữ citation để kiểm tra"],
        keyword: "retrieval"
      },
      {
        title: "Grounding",
        leaves: ["Bám vào tài liệu", "Không thêm ý ngoài nguồn", "Nêu giới hạn khi thiếu dữ liệu"],
        keyword: "grounded answer"
      },
      {
        title: "Rủi ro",
        leaves: ["Cite sai trang", "Lấy nhầm đoạn gần giống", "Bịa khi không có căn cứ"],
        keyword: "hallucination"
      }
    ]
  },
  {
    id: "slide-28",
    title: "Agent và tool use",
    source: "Slide 28",
    text:
      "Agent có thể lập kế hoạch, gọi công cụ, đọc kết quả và quyết định bước tiếp theo. Thiết kế agent cần kiểm soát quyền, trạng thái, lỗi tool và điểm dừng.",
    center: "Thiết kế agent",
    branches: [
      {
        title: "Vòng lặp agent",
        leaves: ["Lập kế hoạch", "Gọi tool", "Đọc kết quả rồi quyết định tiếp"],
        keyword: "plan-act-observe"
      },
      {
        title: "Kiểm soát",
        leaves: ["Giới hạn quyền", "Theo dõi trạng thái", "Có điểm dừng rõ"],
        keyword: "control"
      },
      {
        title: "Xử lý lỗi",
        leaves: ["Tool lỗi thì báo rõ", "Không lặp vô hạn", "Cho người dùng sửa hướng"],
        keyword: "failure path"
      }
    ]
  }
];

let currentMindmap = null;
let exampleIndex = 0;

const slideSelect = document.querySelector("#slideSelect");
const studentInput = document.querySelector("#studentInput");
const generateBtn = document.querySelector("#generateBtn");
const useExampleBtn = document.querySelector("#useExampleBtn");
const mindmapCanvas = document.querySelector("#mindmapCanvas");
const sourceHint = document.querySelector("#sourceHint");
const confidenceBox = document.querySelector("#confidenceBox");
const branchSelect = document.querySelector("#branchSelect");
const sideOutput = document.querySelector("#sideOutput");
const explainBtn = document.querySelector("#explainBtn");
const quizBtn = document.querySelector("#quizBtn");
const flowStatus = document.querySelector("#flowStatus");
const mindmapSection = document.querySelector("#mindmapSection");
const slideTitle = document.querySelector("#slideTitle");
const slideContent = document.querySelector("#slideContent");
const slideFooter = document.querySelector("#slideFooter");

function tokenize(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2);
}

function scoreSlide(input, slide) {
  const inputWords = new Set(tokenize(input));
  const slideWords = tokenize(`${slide.title} ${slide.text}`);
  const hits = slideWords.filter((word) => inputWords.has(word)).length;
  return hits / Math.max(slideWords.length, 1);
}

function detectSlide() {
  const chosen = slideSelect.value;
  if (chosen !== "auto") {
    return {
      slide: slideData.find((slide) => slide.id === chosen),
      confidence: 0.96,
      reason: "Học sinh đã chọn slide nguồn."
    };
  }

  const scored = slideData
    .map((slide) => ({ slide, confidence: scoreSlide(studentInput.value, slide) }))
    .sort((a, b) => b.confidence - a.confidence);

  const best = scored[0];
  const confidence = Math.min(0.92, Math.max(0.38, best.confidence * 2.8));
  const reason =
    confidence > 0.62
      ? "Đã nhận diện slide gần nhất từ nội dung copy."
      : "Nội dung hơi thiếu hoặc lệch. Prototype vẫn tạo nháp và báo cần kiểm tra.";

  return { slide: best.slide, confidence, reason };
}

function displaySlide(slide) {
  slideTitle.textContent = `${slide.title} giúp học nhanh hơn`;
  slideContent.innerHTML = slide.text
    .split(". ")
    .filter(Boolean)
    .map((sentence) => `<p>${sentence.replace(/\.$/, "")}.</p>`)
    .join("");
  slideFooter.textContent = `${slide.source} · ${slide.title}`;
}

function renderMindmap(result) {
  const branches = result.slide.branches
    .map(
      (branch) => `
        <div class="branch-row">
          <div class="branch-node">${branch.title}</div>
          <div class="leaf-list">
            ${branch.leaves
              .map(
                (leaf) => `
                  <div class="leaf-node">
                    ${leaf}
                    <span class="keyword">${branch.keyword}</span>
                  </div>
                `
              )
              .join("")}
          </div>
        </div>
      `
    )
    .join("");

  mindmapCanvas.innerHTML = `
    <div class="mindmap">
      <div class="center-node">
        <small>${result.slide.source}</small>
        <strong>${result.slide.center}</strong>
      </div>
      <div class="branches">${branches}</div>
    </div>
  `;
}

function updateConfidence(result) {
  const percent = Math.round(result.confidence * 100);
  const label = percent >= 70 ? "Cao" : percent >= 50 ? "Trung bình" : "Cần kiểm tra";
  confidenceBox.innerHTML = `
    <span class="confidence-label">Độ chắc nguồn</span>
    <strong>${percent}% · ${label}</strong>
    <small>${result.reason} Citation: ${result.slide.source}</small>
  `;
  sourceHint.textContent = `${result.slide.source} · ${result.slide.title}. ${result.reason}`;
  flowStatus.textContent = percent >= 70 ? "Mindmap đã tạo" : "Mindmap cần kiểm tra";
}

function updateBranches(slide) {
  branchSelect.innerHTML = slide.branches
    .map((branch, index) => `<option value="${index}">${branch.title}</option>`)
    .join("");
}

function generateMindmap() {
  const result = detectSlide();
  currentMindmap = result;
  displaySlide(result.slide);
  renderMindmap(result);
  updateConfidence(result);
  updateBranches(result.slide);
  sideOutput.innerHTML = `
    <strong>Gợi ý demo</strong>
    <p>Case chuẩn: tạo mindmap có citation. Case khó: copy thiếu nội dung, hệ thống vẫn báo độ chắc để học sinh kiểm tra.</p>
  `;
  mindmapSection.scrollIntoView({ behavior: "smooth", block: "start" });
}

function loadNextExample() {
  exampleIndex = (exampleIndex + 1) % slideData.length;
  const example = slideData[exampleIndex];
  slideSelect.value = "auto";
  studentInput.value = example.text.slice(0, Math.round(example.text.length * 0.72));
  displaySlide(example);
  sourceHint.textContent = "Ví dụ đã đổi: nội dung bị copy thiếu một phần.";
  flowStatus.textContent = "Sẵn sàng chạy lại";
}

function selectedBranch() {
  if (!currentMindmap) return null;
  return currentMindmap.slide.branches[Number(branchSelect.value)];
}

explainBtn.addEventListener("click", () => {
  const branch = selectedBranch();
  if (!branch) {
    sideOutput.innerHTML = "<strong>Chưa có mindmap</strong><p>Hãy bấm Tạo mindmap trước.</p>";
    return;
  }

  sideOutput.innerHTML = `
    <strong>${branch.title}</strong>
    <p>Nhánh này gom các ý liên quan đến <b>${branch.keyword}</b>. Khi ôn, học sinh chỉ cần nhớ nhánh chính trước, sau đó tự mở rộng thành các ý con.</p>
  `;
});

quizBtn.addEventListener("click", () => {
  const branch = selectedBranch();
  if (!branch) {
    sideOutput.innerHTML = "<strong>Chưa có mindmap</strong><p>Hãy bấm Tạo mindmap trước.</p>";
    return;
  }

  sideOutput.innerHTML = `
    <strong>Quiz nhanh</strong>
    <ul>
      <li>Nhánh "${branch.title}" có keyword quan trọng nào?</li>
      <li>Hãy kể lại 2 ý con mà không nhìn mindmap.</li>
      <li>Khi nào nội dung này dễ bị hiểu sai?</li>
    </ul>
  `;
});

generateBtn.addEventListener("click", generateMindmap);
useExampleBtn.addEventListener("click", loadNextExample);
slideSelect.addEventListener("change", () => {
  const selected = slideData.find((slide) => slide.id === slideSelect.value);
  if (selected) {
    displaySlide(selected);
    studentInput.value = selected.text;
    flowStatus.textContent = "Sẵn sàng tạo mindmap";
  }
});
