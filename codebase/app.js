const mockSlideData = [
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

let slideData = mockSlideData;
let currentMindmap = null;
let exampleIndex = 0;
let documentPageCount = 0;
let documentFilename = "slide_4.pdf";

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
const slideFrame = document.querySelector("#slideFrame");
const slidePosition = document.querySelector("#slidePosition");
const documentName = document.querySelector("#documentName");
const previousSlideBtn = document.querySelector("#previousSlideBtn");
const nextSlideBtn = document.querySelector("#nextSlideBtn");

function buildFallbackBranches(text) {
  const ideas = text
    .split(/\n|(?<=[.!?])\s+/)
    .map((idea) => idea.trim())
    .filter((idea) => idea.length >= 12)
    .slice(0, 9);

  if (!ideas.length) {
    return [
      {
        title: "Không đủ text",
        leaves: ["Trang này cần OCR hoặc chọn trang khác"],
        keyword: "mock fallback"
      }
    ];
  }

  const branchCount = Math.min(3, ideas.length);
  return Array.from({ length: branchCount }, (_, index) => ({
    title: `Ý chính ${index + 1}`,
    leaves: ideas.filter((_, ideaIndex) => ideaIndex % branchCount === index),
    keyword: "mock fallback"
  }));
}

function prepareSlide(slide) {
  return {
    ...slide,
    center: slide.title,
    branches: buildFallbackBranches(slide.text)
  };
}

function tokenize(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2);
}

function sourceMatchMetrics(input, slide) {
  const inputWords = new Set(tokenize(input));
  const sourceWords = new Set(tokenize(slide.text));
  const matchedWords = [...inputWords].filter((word) => sourceWords.has(word));
  return {
    score: matchedWords.length / Math.max(inputWords.size, 1),
    matched: matchedWords.length,
    total: inputWords.size
  };
}

function detectSlide() {
  const chosen = slideSelect.value;
  if (chosen !== "auto") {
    const slide = slideData.find((item) => item.id === chosen);
    const metrics = sourceMatchMetrics(studentInput.value, slide);
    return {
      slide,
      confidence: metrics.score,
      matchedTokens: metrics.matched,
      totalTokens: metrics.total,
      reason: "Đã so khớp nội dung đang chọn với text của đúng trang nguồn."
    };
  }

  const scored = slideData
    .map((slide) => {
      const metrics = sourceMatchMetrics(studentInput.value, slide);
      return {
        slide,
        confidence: metrics.score,
        matchedTokens: metrics.matched,
        totalTokens: metrics.total
      };
    })
    .sort((a, b) => b.confidence - a.confidence);

  const best = scored[0];
  const reason =
    best.confidence >= 0.7
      ? "Đã chọn trang có độ phủ token cao nhất với nội dung copy."
      : "Nội dung chỉ khớp một phần; cần kiểm tra lại trang nguồn.";

  return { ...best, reason };
}

function displaySlide(slide) {
  const page = slide.page || 1;
  slideFrame.src = `/api/slide-image/${page}`;
  slideFrame.alt = `${documentFilename} · Trang ${page} · ${slide.title}`;
  slidePosition.textContent =
    `VLearn · Trang ${page}${documentPageCount ? ` / ${documentPageCount}` : ""}`;
  documentName.textContent = documentFilename;
  const currentIndex = slideData.findIndex((item) => item.id === slide.id);
  previousSlideBtn.disabled = currentIndex <= 0;
  nextSlideBtn.disabled = currentIndex < 0 || currentIndex >= slideData.length - 1;
}

async function loadRealSlides() {
  try {
    const response = await fetch("/api/slides");
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload.ok) {
      throw new Error(payload.error || "Không đọc được dữ liệu slide.");
    }

    documentPageCount = payload.document.pages;
    documentFilename = payload.document.filename;
    slideData = payload.slides.map(prepareSlide);
    slideSelect.innerHTML = `
      <option value="auto">Tự nhận diện từ nội dung copy</option>
      ${slideData
        .map(
          (slide) => `
            <option value="${slide.id}">
              Trang ${slide.page} · ${escapeHtml(slide.title)}
              ${slide.has_text ? "" : " · không đủ text"}
            </option>
          `
        )
        .join("")}
    `;

    const firstUsableSlide = slideData.find((slide) => slide.has_text) || slideData[0];
    slideSelect.value = firstUsableSlide.id;
    studentInput.value = firstUsableSlide.text;
    displaySlide(firstUsableSlide);
    flowStatus.textContent = "Đã tải dữ liệu slide thật";
    sourceHint.textContent =
      `${documentFilename} · ${documentPageCount} trang. Chọn trang rồi tạo mindmap.`;
  } catch (error) {
    slideData = mockSlideData;
    slideSelect.innerHTML = `
      <option value="auto">Dữ liệu thật lỗi · dùng mock fallback</option>
      ${mockSlideData
        .map((slide) => `<option value="${slide.id}">${slide.source} · ${slide.title}</option>`)
        .join("")}
    `;
    studentInput.value = mockSlideData[0].text;
    displaySlide(mockSlideData[0]);
    flowStatus.textContent = "Không tải được PDF thật";
    sourceHint.textContent = error.message;
  }
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
  const label =
    percent >= 90 ? "Rất cao" : percent >= 70 ? "Cao" : percent >= 50 ? "Trung bình" : "Cần kiểm tra";
  confidenceBox.innerHTML = `
    <span class="confidence-label">Độ khớp với nguồn</span>
    <strong>${percent}% · ${label}</strong>
    <small>
      ${result.reason}
      ${result.matchedTokens}/${result.totalTokens} token có trong ${result.slide.source}.
      Đây là so khớp văn bản, không phải confidence tự khai của AI.
    </small>
  `;
  sourceHint.textContent = `${result.slide.source} · ${result.slide.title}. ${result.reason}`;
  flowStatus.textContent = percent >= 70 ? "Mindmap đã tạo" : "Mindmap cần kiểm tra";
}

function updateBranches(slide) {
  if (!slide.branches.length) {
    branchSelect.innerHTML = "<option>Không đọc được nhánh từ output AI</option>";
    return;
  }
  branchSelect.innerHTML = slide.branches
    .map((branch, index) => `<option value="${index}">${escapeHtml(branch.title)}</option>`)
    .join("");
}

function cleanMermaidLabel(rawLabel) {
  let label = rawLabel.trim().replace(/^root\s*/i, "");
  const wrappers = [
    /^[\w-]*\(\((.*)\)\)$/,
    /^[\w-]*\{\{(.*)\}\}$/,
    /^[\w-]*\[\[(.*)\]\]$/,
    /^[\w-]*\[(.*)\]$/,
    /^[\w-]*\((.*)\)$/,
    /^[\w-]*\{(.*)\}$/
  ];

  for (const wrapper of wrappers) {
    const match = label.match(wrapper);
    if (match) {
      label = match[1];
      break;
    }
  }

  return label.replace(/^["']|["']$/g, "").trim();
}

function parseMermaidMindmap(mermaidCode) {
  const entries = mermaidCode
    .split(/\r?\n/)
    .filter((line) => line.trim() && line.trim() !== "mindmap" && !line.trim().startsWith("%%"))
    .map((line) => ({
      indent: line.match(/^[\t ]*/)[0].replaceAll("\t", "  ").length,
      label: cleanMermaidLabel(line)
    }))
    .filter((entry) => entry.label);

  if (entries.length < 2) {
    return { center: entries[0]?.label || "Mindmap", branches: [] };
  }

  const root = entries[0];
  const childIndents = entries
    .slice(1)
    .filter((entry) => entry.indent > root.indent)
    .map((entry) => entry.indent);
  if (!childIndents.length) {
    return { center: root.label, branches: [] };
  }
  const branchIndent = Math.min(...childIndents);
  const indentLevels = [
    ...new Set(
      entries
        .slice(1)
        .filter((entry) => entry.indent >= branchIndent)
        .map((entry) => entry.indent)
    )
  ].sort((a, b) => a - b);
  const branches = [];
  let currentBranch = null;

  for (const entry of entries.slice(1)) {
    if (entry.indent === branchIndent) {
      currentBranch = {
        title: entry.label,
        leaves: [],
        nodes: [],
        keyword: "AI output"
      };
      branches.push(currentBranch);
    } else if (entry.indent > branchIndent && currentBranch) {
      currentBranch.leaves.push(entry.label);
      currentBranch.nodes.push({
        label: entry.label,
        depth: indentLevels.indexOf(entry.indent)
      });
    }
  }

  return { center: root.label, branches };
}

function generateMockMindmap() {
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

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function renderMermaid(mermaidCode) {
  if (!window.mermaid) {
    throw new Error("Không tải được Mermaid.js.");
  }

  window.mermaid.initialize({
    startOnLoad: false,
    securityLevel: "strict",
    theme: "neutral"
  });

  const renderId = `vlearn-mindmap-${Date.now()}`;
  const { svg } = await window.mermaid.render(renderId, mermaidCode);
  mindmapCanvas.innerHTML = `
    <div class="mermaid-diagram" id="${renderId}-svg">${svg}</div>
    <details class="mermaid-source" open>
      <summary>Chỉnh sửa mã sơ đồ (Sửa lỗi AI nếu có)</summary>
      <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 8px;">
        <textarea id="mermaidCodeEditor" style="width: 100%; height: 150px; font-family: monospace; padding: 8px;">${escapeHtml(mermaidCode)}</textarea>
        <button id="updateMermaidBtn" class="primary-button" style="align-self: flex-start;">Lưu & Cập nhật sơ đồ</button>
      </div>
    </details>
  `;

  // Gắn sự kiện cho nút cập nhật
  setTimeout(() => {
    const btn = document.getElementById("updateMermaidBtn");
    const editor = document.getElementById("mermaidCodeEditor");
    const svgContainer = document.getElementById(`${renderId}-svg`);
    
    if (btn && editor && svgContainer) {
      btn.addEventListener("click", async () => {
        try {
          const newCode = editor.value;
          btn.textContent = "Đang cập nhật...";
          const newRenderId = \`vlearn-mindmap-update-\${Date.now()}\`;
          const { svg: newSvg } = await window.mermaid.render(newRenderId, newCode);
          svgContainer.innerHTML = newSvg;
          btn.textContent = "Lưu & Cập nhật sơ đồ";
        } catch (err) {
          alert("Lỗi cú pháp Mermaid: " + err.message);
          btn.textContent = "Lưu & Cập nhật sơ đồ";
        }
      });
    }
  }, 100);
}

function setGenerating(isGenerating) {
  generateBtn.disabled = isGenerating;
  generateBtn.textContent = isGenerating ? "AI đang tạo..." : "Tạo mindmap";
}

async function generateMindmap() {
  const content = studentInput.value.trim();
  if (!content) {
    flowStatus.textContent = "Thiếu nội dung";
    studentInput.focus();
    return;
  }

  const result = detectSlide();
  displaySlide(result.slide);
  setGenerating(true);
  flowStatus.textContent = "Đang gọi AI thật...";
  mindmapCanvas.innerHTML = `
    <div class="empty-state loading-state">
      <strong>AI đang phân tích nội dung</strong>
      <span>Đang tạo chủ đề trung tâm, nhánh chính và ý con.</span>
    </div>
  `;
  mindmapSection.scrollIntoView({ behavior: "smooth", block: "start" });

  try {
    const response = await fetch("/api/mindmap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content,
        source: result.slide.source
      })
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok || !payload.ok) {
      throw new Error(payload.error || `API trả lỗi HTTP ${response.status}.`);
    }

    await renderMermaid(payload.mermaid);
    const parsedMindmap = payload.structure || parseMermaidMindmap(payload.mermaid);
    const aiSlide = {
      ...result.slide,
      center: parsedMindmap.center,
      branches: parsedMindmap.branches
    };
    currentMindmap = {
      ...result,
      slide: aiSlide,
      mermaid: payload.mermaid,
      branchSource: "ai-output"
    };
    updateConfidence(result);
    updateBranches(aiSlide);
    flowStatus.textContent = "AI đã tạo mindmap";
    sourceHint.textContent =
      `${result.slide.source} · AI thật qua ${payload.provider}. Trace đã lưu trong eval/api_trace.jsonl.`;
    sideOutput.innerHTML = `
      <strong>Kết quả CP3</strong>
      <p>Mindmap sinh từ AI thật. Phần Học tiếp đã đọc ${parsedMindmap.branches.length} nhánh trực tiếp từ output Mermaid.</p>
    `;
  } catch (error) {
    generateMockMindmap();
    flowStatus.textContent = "AI lỗi · đang xem bản mock";
    sourceHint.textContent =
      `Không gọi được AI: ${error.message} Kết quả hiện tại là mock để flow demo không bị dừng.`;
    sideOutput.innerHTML = `
      <strong>AI chưa chạy</strong>
      <p>${escapeHtml(error.message)} Hãy chạy trang qua server.py và kiểm tra API key.</p>
    `;
  } finally {
    setGenerating(false);
  }
}

function loadNextExample() {
  const usableSlides = slideData.filter((slide) => slide.has_text !== false);
  exampleIndex = (exampleIndex + 1) % usableSlides.length;
  selectSlide(usableSlides[exampleIndex]);
}

function selectSlide(slide) {
  if (!slide) return;
  slideSelect.value = slide.id;
  studentInput.value = slide.text;
  displaySlide(slide);
  sourceHint.textContent = `${slide.source} · dữ liệu thật từ PDF.`;
  flowStatus.textContent = slide.has_text
    ? "Sẵn sàng tạo mindmap"
    : "Trang này không đủ text";
}

function moveSlide(offset) {
  const currentId = slideSelect.value === "auto"
    ? detectSlide().slide.id
    : slideSelect.value;
  const currentIndex = slideData.findIndex((slide) => slide.id === currentId);
  const targetIndex = Math.min(
    Math.max(currentIndex + offset, 0),
    slideData.length - 1
  );
  selectSlide(slideData[targetIndex]);
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

  const explanationNodes = branch.nodes?.length
    ? branch.nodes
    : branch.leaves.map((label) => ({ label, depth: 1 }));
  const branchItems = explanationNodes.length
    ? explanationNodes
        .map(
          (node) => `
            <li style="margin-left: ${Math.max(0, node.depth - 1) * 16}px">
              ${escapeHtml(node.label)}
            </li>
          `
        )
        .join("")
    : "<li>Nhánh này không có node con trong output AI.</li>";
  const sourceLabel = currentMindmap.branchSource === "ai-output"
    ? "Output Mermaid của AI"
    : "Mock fallback";
  sideOutput.innerHTML = `
    <strong>${escapeHtml(branch.title)}</strong>
    <p>Nguồn nhánh: ${sourceLabel}. Gồm ${explanationNodes.length} node con:</p>
    <ul>${branchItems}</ul>
  `;
});

quizBtn.addEventListener("click", () => {
  const branch = selectedBranch();
  if (!branch) {
    sideOutput.innerHTML = "<strong>Chưa có mindmap</strong><p>Hãy bấm Tạo mindmap trước.</p>";
    return;
  }

  const leafQuestions = branch.leaves.length
    ? branch.leaves
        .map(
          (leaf) => `<li>Giải thích bằng lời của bạn: “${escapeHtml(leaf)}”.</li>`
        )
        .join("")
    : "<li>Hãy giải thích ý nghĩa của nhánh này bằng một ví dụ.</li>";
  sideOutput.innerHTML = `
    <strong>Quiz nhanh</strong>
    <ul>
      <li>Tóm tắt nhánh “${escapeHtml(branch.title)}” trong một câu.</li>
      ${leafQuestions}
    </ul>
  `;
});

generateBtn.addEventListener("click", generateMindmap);
useExampleBtn.addEventListener("click", loadNextExample);
previousSlideBtn.addEventListener("click", () => moveSlide(-1));
nextSlideBtn.addEventListener("click", () => moveSlide(1));
slideSelect.addEventListener("change", () => {
  const selected = slideData.find((slide) => slide.id === slideSelect.value);
  if (selected) {
    selectSlide(selected);
  }
});

loadRealSlides();
