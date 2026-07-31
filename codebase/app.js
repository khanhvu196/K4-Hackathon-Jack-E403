let slideData = [];
let currentMindmap = null;
let documentPageCount = 0;
let documentFilename = "";
let currentActiveSlideId = null;
let selectedSlideIds = new Set();
let activeTab = "live"; // 'live' or 'multi'
let selectedNodeInfo = null;

// DOM Elements
const pdfStage = document.getElementById("pdfStage");
const progressDots = document.getElementById("progressDots");
const documentName = document.getElementById("documentName");
const slidePosition = document.getElementById("slidePosition");

const tabLive = document.getElementById("tabLive");
const tabMulti = document.getElementById("tabMulti");
const tabContentLive = document.getElementById("tabContentLive");
const tabContentMulti = document.getElementById("tabContentMulti");
const multiCount = document.getElementById("multiCount");
const multiChipList = document.getElementById("multiChipList");
const multiWarning = document.getElementById("multiWarning");
const livePageName = document.getElementById("livePageName");

const chatHistory = document.getElementById("chatHistory");
const chatInput = document.getElementById("chatInput");
const sendChatBtn = document.getElementById("sendChatBtn");
const quickBtns = document.querySelectorAll(".quick-btn");
const resetContentBtn = document.getElementById("resetContentBtn");
const generateBtn = document.getElementById("generateBtn");

const mindmapCanvas = document.getElementById("mindmapCanvas");
const nextSection = document.getElementById("nextSection");
const flowStatus = document.getElementById("flowStatus");
const confidenceBox = document.getElementById("confidenceBox");
const branchSelect = document.getElementById("branchSelect");
const sideOutput = document.getElementById("sideOutput");

const explainBtn = document.getElementById("explainBtn");
const quizBtn = document.getElementById("quizBtn");
const compareBtn = document.getElementById("compareBtn");
const exampleBtn = document.getElementById("exampleBtn");

// Utilities
function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function clearMindmap() {
    currentMindmap = null;
    mindmapCanvas.innerHTML = `<div class="empty-state"><span>Chưa có mindmap.<br>Bấm 'Tạo mindmap' ở trên để bắt đầu.</span></div>`;
    mindmapCanvas.classList.add("is-empty");
    nextSection.style.display = "none";
    confidenceBox.style.display = "none";
    flowStatus.textContent = "Chưa tạo mindmap";
    sideOutput.innerHTML = "<p>Kết quả phụ sẽ hiện ở đây.</p>";
}

function getContextText() {
    let combinedText = "";
    if (activeTab === "live") {
        if (currentActiveSlideId) {
            const slide = slideData.find(s => s.id === currentActiveSlideId);
            if (slide) combinedText = slide.text;
        }
    } else {
        slideData.forEach(slide => {
            if (selectedSlideIds.has(slide.id)) {
                combinedText += `— Trang ${slide.page} (${slide.title}) —\n${slide.text}\n\n`;
            }
        });
    }
    return combinedText.trim();
}

function getContextPages() {
    if (activeTab === "live") {
        return currentActiveSlideId ? [parseInt(currentActiveSlideId.replace("pdf-page-", ""))] : [];
    } else {
        return Array.from(selectedSlideIds).map(id => parseInt(id.replace("pdf-page-", "")));
    }
}

function syncInputContent() {
    // Không còn textarea tĩnh, chỉ dọn dẹp mindmap khi đổi trang
    clearMindmap();
}

function switchTab(tab) {
    activeTab = tab;
    if (tab === "live") {
        tabLive.classList.add("active");
        tabMulti.classList.remove("active");
        tabContentLive.style.display = "block";
        tabContentMulti.style.display = "none";
    } else {
        tabMulti.classList.add("active");
        tabLive.classList.remove("active");
        tabContentLive.style.display = "none";
        tabContentMulti.style.display = "block";
    }
    syncInputContent();
}

function updateMultiSelectUI() {
    multiCount.textContent = `(${selectedSlideIds.size})`;
    multiCount.style.display = selectedSlideIds.size > 0 ? "inline" : "none";
    
    if (selectedSlideIds.size > 0) {
        let chipsHTML = "";
        slideData.forEach(slide => {
            if (selectedSlideIds.has(slide.id)) {
                chipsHTML += `<div class="multi-chip">Trang ${slide.page} · ${escapeHtml(slide.title)} <span class="chip-close" data-id="${slide.id}">×</span></div>`;
            }
        });
        multiChipList.innerHTML = chipsHTML;
        
        document.querySelectorAll(".chip-close").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const id = e.target.getAttribute("data-id");
                toggleSlideSelection(id, false);
            });
        });
        
        multiWarning.style.display = selectedSlideIds.size >= 6 ? "block" : "none";
        if(activeTab === "live") {
            switchTab("multi");
        } else {
            syncInputContent();
        }
    } else {
        multiChipList.innerHTML = `<div class="empty-multi">Chưa chọn trang nào. Hãy tick ☑️ vào các trang bên trái.</div>`;
        multiWarning.style.display = "none";
        if(activeTab === "multi") {
             syncInputContent();
        }
    }
    
    // Update checkboxes in UI
    document.querySelectorAll(".slide-checkbox-container input").forEach(cb => {
        cb.checked = selectedSlideIds.has(cb.getAttribute("data-id"));
    });
}

function toggleSlideSelection(slideId, isSelected) {
    if (isSelected) {
        selectedSlideIds.add(slideId);
    } else {
        selectedSlideIds.delete(slideId);
    }
    
    const frame = document.querySelector(`.pdf-frame[data-id="${slideId}"]`);
    if (frame) {
        if (isSelected) frame.classList.add("is-selected");
        else frame.classList.remove("is-selected");
    }
    
    updateMultiSelectUI();
}

// Render slides
function renderSlides() {
    documentName.textContent = documentFilename;
    pdfStage.innerHTML = "";
    progressDots.innerHTML = "";
    
    slideData.forEach(slide => {
        // Render Card
        const wrapper = document.createElement("div");
        wrapper.className = "slide-card-wrapper";
        wrapper.id = `wrapper-${slide.id}`;
        
        wrapper.innerHTML = `
            <img class="pdf-frame" data-id="${slide.id}" src="/api/slide-image/${slide.page}" alt="Trang ${slide.page}">
            <label class="slide-checkbox-container">
                ☑️ Chọn trang này
                <input type="checkbox" data-id="${slide.id}">
            </label>
        `;
        pdfStage.appendChild(wrapper);
        
        // Checkbox logic
        const cb = wrapper.querySelector("input");
        cb.addEventListener("change", (e) => {
            toggleSlideSelection(slide.id, e.target.checked);
        });
        
        // Render Dot
        const dot = document.createElement("button");
        dot.className = "dot";
        dot.setAttribute("data-target", `wrapper-${slide.id}`);
        dot.title = `Trang ${slide.page}`;
        dot.addEventListener("click", () => {
            wrapper.scrollIntoView({ behavior: "smooth", block: "center" });
        });
        progressDots.appendChild(dot);
    });
    
    setupScrollSpy();
}

function setupScrollSpy() {
    const wrappers = document.querySelectorAll(".slide-card-wrapper");
    // Add scroll event listener with debounce as fallback/enhancement
    let isScrolling;
    pdfStage.addEventListener('scroll', () => {
        window.clearTimeout(isScrolling);
        isScrolling = setTimeout(() => {
            let closestSlide = null;
            let minDistance = Infinity;
            const stageCenter = pdfStage.getBoundingClientRect().top + pdfStage.clientHeight / 2;

            wrappers.forEach(w => {
                const rect = w.getBoundingClientRect();
                const wrapperCenter = rect.top + rect.height / 2;
                const distance = Math.abs(wrapperCenter - stageCenter);
                if (distance < minDistance) {
                    minDistance = distance;
                    closestSlide = w;
                }
            });

            if (closestSlide) {
                const slideId = closestSlide.id.replace("wrapper-", "");
                setActiveSlide(slideId);
            }
        }, 80);
    });
}

function setActiveSlide(slideId) {
    if (currentActiveSlideId === slideId) return;
    currentActiveSlideId = slideId;
    
    const slide = slideData.find(s => s.id === slideId);
    if (!slide) return;
    
    // Update dots
    document.querySelectorAll(".dot").forEach(d => d.classList.remove("active"));
    const activeDot = document.querySelector(`.dot[data-target="wrapper-${slideId}"]`);
    if (activeDot) activeDot.classList.add("active");
    
    // Update frames
    document.querySelectorAll(".pdf-frame").forEach(f => f.classList.remove("is-viewing"));
    const frame = document.querySelector(`.pdf-frame[data-id="${slideId}"]`);
    if (frame) frame.classList.add("is-viewing");
    
    // Update UI
    slidePosition.textContent = `Trang ${slide.page} / ${documentPageCount}`;
    livePageName.textContent = `Trang ${slide.page} · ${slide.title}`;
    
    if (activeTab === "live") {
        syncInputContent();
    }
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
        slideData = payload.slides;
        
        renderSlides();
        
        // Initial active slide
        if (slideData.length > 0) {
            setActiveSlide(slideData[0].id);
            // Trigger first active state explicitly if intersection observer delays
            const firstWrapper = document.getElementById(`wrapper-${slideData[0].id}`);
            if(firstWrapper) firstWrapper.scrollIntoView({ behavior: "instant", block: "center" });
        }
        
    } catch (error) {
        pdfStage.innerHTML = `<div class="empty-state" style="color:var(--red-accent)">Lỗi tải dữ liệu: ${escapeHtml(error.message)}<br>Hãy chắc chắn bạn đang chạy server.py</div>`;
    }
}

// Generate Mindmap Logic
function setGenerating(isGenerating) {
    generateBtn.disabled = isGenerating;
    generateBtn.textContent = isGenerating ? "AI đang tạo..." : "✦ Tạo mindmap";
}

async function generateMindmap() {
    const content = getContextText();
    if (!content) {
        alert("Không có nội dung nào được chọn để tạo mindmap.");
        return;
    }
    
    setGenerating(true);
    flowStatus.textContent = "Đang gọi AI thật...";
    mindmapCanvas.classList.remove("is-empty");
    mindmapCanvas.innerHTML = `
      <div class="empty-state loading-state">
        <strong>AI đang phân tích nội dung</strong>
        <span>Đang tạo chủ đề trung tâm, nhánh chính và ý con.</span>
      </div>
    `;
    
    try {
        const response = await fetch("/api/mindmap", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                content,
                source: activeTab === "live" ? livePageName.textContent : "Nhiều trang"
            })
        });
        const payload = await response.json().catch(() => ({}));
        
        if (!response.ok || !payload.ok) {
            throw new Error(payload.error || `API trả lỗi HTTP ${response.status}.`);
        }
        
        await renderMermaid(payload.mermaid);
        flowStatus.textContent = "AI đã tạo mindmap";
        
        // Show next section
        nextSection.style.display = "block";
        
        const structure = payload.structure || { branches: [] };
        currentMindmap = structure;
        
        if (structure.branches && structure.branches.length > 0) {
            branchSelect.innerHTML = structure.branches
                .map((b, i) => `<option value="${i}">${escapeHtml(b.title)}</option>`)
                .join("");
        } else {
            branchSelect.innerHTML = "<option>Chưa có nhánh cụ thể</option>";
        }
        
        sideOutput.innerHTML = `<p>Hãy chọn một nhánh và nhấn nút bên trên để học sâu hơn.</p>`;
        
    } catch (error) {
        mindmapCanvas.classList.add("is-empty");
        mindmapCanvas.innerHTML = `<div class="empty-state"><span style="color:var(--red-accent)">Lỗi AI: ${escapeHtml(error.message)}</span></div>`;
        flowStatus.textContent = "Lỗi tạo mindmap";
    } finally {
        setGenerating(false);
    }
}

async function renderMermaid(mermaidCode) {
    if (!window.mermaid) {
        throw new Error("Không tải được Mermaid.js.");
    }
    window.mermaid.initialize({
        startOnLoad: false,
        securityLevel: "strict",
        theme: "base",
        themeVariables: {
            fontFamily: "Inter, sans-serif",
            primaryColor: "#e3f2fd",       
            primaryBorderColor: "#1e88e5",
            primaryTextColor: "#0d47a1",
            lineColor: "#90caf9",
            textColor: "#333",
            
            // Mermaid mindmap uses pie variables for branch distinct coloring
            pie1: "#e3f2fd", // Xanh dương pastel
            pie2: "#e8f5e9", // Xanh lá pastel
            pie3: "#fff3e0", // Cam pastel
            pie4: "#f3e5f5", // Tím pastel
            pie5: "#e0f7fa", // Cyan pastel
            pie6: "#fbe9e7", // Đỏ pastel
            
            pieTitleTextSize: "20px",
        },
        mindmap: {
            padding: 16,
            maxNodeWidth: 250
        }
    });
    
    const renderId = `vlearn-mindmap-${Date.now()}`;
    const { svg } = await window.mermaid.render(renderId, mermaidCode);
    mindmapCanvas.innerHTML = `
      <div class="mermaid-diagram">${svg}</div>
      <details class="mermaid-source">
        <summary>Xem mã Mermaid</summary>
        <pre>${escapeHtml(mermaidCode)}</pre>
      </details>
    `;

    // Render inline
    const targetSlideId = activeTab === "live" && currentActiveSlideId 
        ? currentActiveSlideId 
        : Array.from(selectedSlideIds).pop();

    let inlineSvgEl = null;

    if (targetSlideId) {
        const slideWrapper = document.getElementById(`wrapper-${targetSlideId}`);
        if (slideWrapper) {
            // Find existing inline mindmap after this wrapper and remove it
            const existing = slideWrapper.nextElementSibling;
            if (existing && existing.classList.contains("inline-mindmap-block")) {
                existing.remove();
            }
            
            // Create new inline block
            const inlineBlock = document.createElement("div");
            inlineBlock.className = "inline-mindmap-block";
            inlineBlock.setAttribute("data-ignore-spy", "true");
            
            inlineBlock.innerHTML = `
                <div class="inline-mindmap-header">
                    <h3 class="inline-mindmap-title">Mindmap Tổng hợp</h3>
                    <div class="inline-mindmap-actions">
                        <button class="close-inline-btn" title="Đóng">✕</button>
                    </div>
                </div>
                <div class="inline-mindmap-content">
                    <div class="mermaid-diagram">${svg}</div>
                </div>
            `;
            
            slideWrapper.insertAdjacentElement("afterend", inlineBlock);
            inlineBlock.querySelector(".close-inline-btn").addEventListener("click", () => inlineBlock.remove());
            
            inlineSvgEl = inlineBlock.querySelector("svg");
            
            // Cuộn mượt đến block
            inlineBlock.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    // Function to attach click listeners to a mermaid SVG container
    const attachNodeListeners = (svgEl) => {
        if (!svgEl) return;
        const nodes = svgEl.querySelectorAll(".node");
        nodes.forEach(node => {
            node.style.cursor = "pointer";
            node.addEventListener("click", () => {
                // Clear selection in all SVGs (both panel and inline)
                document.querySelectorAll(".mermaid-diagram svg .node").forEach(n => n.style.opacity = "1");
                
                // Highlight current in all matching nodes (we can just highlight the clicked one)
                // For simplicity, highlight just the clicked one, but to be robust we should find both
                document.querySelectorAll(".mermaid-diagram svg .node").forEach(n => {
                    n.style.opacity = "0.6";
                });
                node.style.opacity = "1";
                
                const textElements = node.querySelectorAll("text, foreignObject div");
                let labelText = "";
                textElements.forEach(t => labelText += t.textContent + " ");
                labelText = labelText.trim();
                
                selectedNodeInfo = {
                    label: labelText,
                    context: "Một phần của mindmap"
                };
                
                sideOutput.innerHTML = `<p>Đã chọn nhánh: <strong>${escapeHtml(labelText)}</strong>. Hãy bấm các nút bên trên để thao tác.</p>`;
                document.querySelectorAll(".action-btn").forEach(btn => btn.disabled = false);
            });
        });
    };

    // Attach click listeners to mermaid nodes
    const panelSvgEl = mindmapCanvas.querySelector("svg");
    attachNodeListeners(panelSvgEl);
    attachNodeListeners(inlineSvgEl);
    
    // Disable action buttons initially
    document.querySelectorAll(".action-btn").forEach(btn => btn.disabled = true);
}

// Next actions API Caller
async function callNodeAction(actionType, extraPayload = {}) {
    if (!selectedNodeInfo) {
        alert("Vui lòng click chọn một nhánh trên sơ đồ Mindmap trước.");
        return;
    }
    
    const source_pages = activeTab === "live" && currentActiveSlideId 
        ? [parseInt(currentActiveSlideId.replace("pdf-page-", ""))] 
        : Array.from(selectedSlideIds).map(id => parseInt(id.replace("pdf-page-", "")));

    const payload = {
        action_type: actionType,
        node_label: selectedNodeInfo.label,
        node_context: selectedNodeInfo.context,
        source_pages: source_pages,
        ...extraPayload
    };
    
    sideOutput.innerHTML = `<div class="empty-state loading-state"><strong>AI đang xử lý...</strong></div>`;
    
    try {
        const response = await fetch("/api/node-action", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        const data = await response.json().catch(() => ({}));
        
        if (!response.ok || !data.ok) {
            throw new Error(data.error || `Lỗi HTTP ${response.status}`);
        }
        
        if (actionType === "quiz") {
            try {
                // Parse JSON array
                let jsonStr = data.html.trim();
                // If it accidentally contains markdown blocks, clean it
                if (jsonStr.startsWith("```json")) jsonStr = jsonStr.substring(7);
                if (jsonStr.startsWith("```")) jsonStr = jsonStr.substring(3);
                if (jsonStr.endsWith("```")) jsonStr = jsonStr.substring(0, jsonStr.length - 3);
                jsonStr = jsonStr.trim();
                
                const questions = JSON.parse(jsonStr);
                renderInteractiveQuiz(questions);
            } catch (e) {
                console.error("Quiz Parse Error", e);
                sideOutput.innerHTML = `<span style="color:var(--red-accent)">Lỗi phân tích Quiz từ AI. Xin thử lại.</span>`;
            }
        } else {
            sideOutput.innerHTML = data.html;
        }
    } catch (error) {
        sideOutput.innerHTML = `<span style="color:var(--red-accent)">Lỗi AI: ${escapeHtml(error.message)}</span>`;
    }
}

let currentQuizState = { questions: [], correctCount: 0, answeredCount: 0 };

function renderInteractiveQuiz(questions) {
    if (!Array.isArray(questions) || questions.length === 0) {
        sideOutput.innerHTML = `<p>Không thể tạo quiz lúc này.</p>`;
        return;
    }
    
    currentQuizState = { questions, correctCount: 0, answeredCount: 0 };
    
    let html = `<div class="quiz-container" id="quizContainer">`;
    
    questions.forEach((q, qIndex) => {
        html += `
            <div class="quiz-question" id="quiz-q-${qIndex}">
                <p class="quiz-question-title">Câu ${qIndex + 1}: ${escapeHtml(q.question)}</p>
                <div class="quiz-options">
        `;
        
        q.options.forEach((opt, optIndex) => {
            html += `
                <label class="quiz-option" id="quiz-opt-${qIndex}-${optIndex}">
                    <input type="radio" name="quiz-${qIndex}" value="${optIndex}" onchange="handleQuizAnswer(${qIndex}, ${optIndex})">
                    <span>${escapeHtml(opt)}</span>
                </label>
            `;
        });
        
        html += `
                </div>
                <div class="quiz-explanation" id="quiz-exp-${qIndex}">
                    <strong>Giải thích:</strong> ${escapeHtml(q.explanation)}
                </div>
            </div>
        `;
    });
    
    html += `
        <div id="quizSummary" style="display:none"></div>
    </div>`;
    
    sideOutput.innerHTML = html;
}

window.handleQuizAnswer = function(qIndex, selectedOptIndex) {
    const q = currentQuizState.questions[qIndex];
    const isCorrect = (selectedOptIndex === q.correct_answer);
    
    // Disable all options for this question
    const qContainer = document.getElementById(`quiz-q-${qIndex}`);
    const labels = qContainer.querySelectorAll(".quiz-option");
    
    labels.forEach((label, optIndex) => {
        label.classList.add("disabled");
        const radio = label.querySelector("input");
        radio.disabled = true;
        
        if (optIndex === q.correct_answer) {
            label.classList.add("correct");
        } else if (optIndex === selectedOptIndex && !isCorrect) {
            label.classList.add("incorrect");
        }
    });
    
    // Show explanation
    const expDiv = document.getElementById(`quiz-exp-${qIndex}`);
    expDiv.classList.add("show");
    
    // Update score
    if (isCorrect) currentQuizState.correctCount++;
    currentQuizState.answeredCount++;
    
    // Show summary if all answered
    if (currentQuizState.answeredCount === currentQuizState.questions.length) {
        const summaryDiv = document.getElementById("quizSummary");
        summaryDiv.style.display = "block";
        summaryDiv.innerHTML = `
            <div class="quiz-summary">
                Bạn đúng ${currentQuizState.correctCount} / ${currentQuizState.questions.length} câu!
            </div>
            <button class="quiz-retry-btn" onclick="retryQuiz()">Làm lại bài này</button>
        `;
    }
};

window.retryQuiz = function() {
    renderInteractiveQuiz(currentQuizState.questions);
};

explainBtn.addEventListener("click", () => callNodeAction("explain"));

quizBtn.addEventListener("click", () => callNodeAction("quiz"));

compareBtn.addEventListener("click", () => {
    if (!selectedNodeInfo) {
        alert("Vui lòng click chọn một nhánh trên sơ đồ Mindmap trước.");
        return;
    }
    
    // Simple prompt for compare pages
    const pageInput = prompt("Bạn muốn so sánh với (các) trang nào? Nhập số trang cách nhau bởi dấu phẩy (VD: 5,6):");
    if (!pageInput) return;
    
    const compare_pages = pageInput.split(",").map(p => parseInt(p.trim())).filter(p => !isNaN(p));
    if (compare_pages.length === 0) {
        alert("Số trang không hợp lệ.");
        return;
    }
    
    callNodeAction("compare", { compare_pages });
});

exampleBtn.addEventListener("click", () => callNodeAction("real_example"));

// Chat Logic
function addChatMessage(message, type) {
    const msgDiv = document.createElement("div");
    msgDiv.className = `chat-message ${type}`;
    msgDiv.innerHTML = message;
    chatHistory.appendChild(msgDiv);
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

async function sendChat() {
    const question = chatInput.value.trim();
    if (!question) return;
    
    addChatMessage(escapeHtml(question), "user");
    chatInput.value = "";
    
    const contextPages = getContextPages();
    
    // Add loading
    const loadingId = "loading-" + Date.now();
    const loadingDiv = document.createElement("div");
    loadingDiv.className = "chat-message system";
    loadingDiv.id = loadingId;
    loadingDiv.innerHTML = "<em>Đang suy nghĩ...</em>";
    chatHistory.appendChild(loadingDiv);
    chatHistory.scrollTop = chatHistory.scrollHeight;
    
    try {
        const response = await fetch("/api/chat-agent", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: question, context_pages: contextPages })
        });
        
        const data = await response.json();
        const loadingEl = document.getElementById(loadingId);
        if (loadingEl) loadingEl.remove();
        
        if (!response.ok || !data.ok) {
            throw new Error(data.error || "Lỗi khi gọi AI");
        }
        
        addChatMessage(data.reply, "system");
        
    } catch (error) {
        const loadingEl = document.getElementById(loadingId);
        if (loadingEl) loadingEl.remove();
        addChatMessage(`Lỗi: ${escapeHtml(error.message)}`, "error");
    }
}

sendChatBtn.addEventListener("click", sendChat);
chatInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendChat();
});

quickBtns.forEach(btn => {
    btn.addEventListener("click", () => {
        chatInput.value = btn.textContent;
        chatInput.focus();
    });
});

// Event Listeners
tabLive.addEventListener("click", () => switchTab("live"));
tabMulti.addEventListener("click", () => switchTab("multi"));
resetContentBtn.addEventListener("click", syncInputContent);
generateBtn.addEventListener("click", generateMindmap);

// Panel Toggle Logic
const aiPanel = document.getElementById("aiPanel");
const togglePanelBtn = document.getElementById("togglePanelBtn");

function initPanelState() {
    const isCollapsed = localStorage.getItem("vlearn_ai_panel_collapsed") === "true";
    if (isCollapsed) {
        aiPanel.classList.add("collapsed");
    }
}

togglePanelBtn.addEventListener("click", () => {
    aiPanel.classList.toggle("collapsed");
    const isCollapsed = aiPanel.classList.contains("collapsed");
    localStorage.setItem("vlearn_ai_panel_collapsed", isCollapsed);
});

// Init
initPanelState();
clearMindmap();
loadRealSlides();
