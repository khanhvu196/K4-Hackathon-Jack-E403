import hashlib
import json
import os
from io import BytesIO
from datetime import datetime, timezone
from functools import lru_cache
from pathlib import Path

import fitz
from dotenv import load_dotenv
from flask import Flask, jsonify, request, send_file, send_from_directory
from pypdf import PdfReader

try:
    from .llm_client import generate_mindmap, generate_chat
except ImportError:
    from llm_client import generate_mindmap, generate_chat


BASE_DIR = Path(__file__).resolve().parent
PROJECT_DIR = BASE_DIR.parent
TRACE_FILE = PROJECT_DIR / "eval" / "api_trace.jsonl"
MAX_INPUT_LENGTH = 20_000
MIN_SLIDE_TEXT_LENGTH = 100

load_dotenv(PROJECT_DIR / ".env")


def resolve_slide_pdf_path() -> Path:
    configured_path = Path(
        os.getenv("SLIDE_PDF_PATH", "data/real-slides/slide_4.pdf")
    )
    if not configured_path.is_absolute():
        configured_path = PROJECT_DIR / configured_path
    return configured_path.resolve()


SLIDE_PDF_PATH = resolve_slide_pdf_path()

app = Flask(__name__, static_folder=str(BASE_DIR), static_url_path="")
app.json.ensure_ascii = False


def clean_page_text(raw_text: str) -> str:
    lines = [
        " ".join(line.split())
        for line in (raw_text or "").splitlines()
        if line.strip()
    ]
    return "\n".join(lines)


def slide_title(text: str, page_number: int) -> str:
    first_line = next((line for line in text.splitlines() if len(line) > 2), "")
    return first_line[:100] if first_line else f"Trang {page_number}"


@lru_cache(maxsize=1)
def load_pdf_slides() -> list[dict]:
    if not SLIDE_PDF_PATH.exists():
        raise FileNotFoundError(f"Không tìm thấy PDF: {SLIDE_PDF_PATH}")

    reader = PdfReader(str(SLIDE_PDF_PATH))
    slides = []
    for page_number, page in enumerate(reader.pages, start=1):
        text = clean_page_text(page.extract_text() or "")
        slides.append(
            {
                "id": f"pdf-page-{page_number}",
                "page": page_number,
                "title": slide_title(text, page_number),
                "source": f"{SLIDE_PDF_PATH.name} · Trang {page_number}",
                "text": text,
                "has_text": len(text) >= MIN_SLIDE_TEXT_LENGTH,
            }
        )
    return slides


@lru_cache(maxsize=32)
def render_pdf_page(page_number: int) -> bytes:
    document = fitz.open(SLIDE_PDF_PATH)
    try:
        if page_number < 1 or page_number > document.page_count:
            raise IndexError("Trang PDF không hợp lệ.")
        page = document.load_page(page_number - 1)
        pixmap = page.get_pixmap(matrix=fitz.Matrix(1.5, 1.5), alpha=False)
        return pixmap.tobytes("png")
    finally:
        document.close()


def normalize_mermaid(raw_output: str) -> str:
    code = (raw_output or "").strip()

    if code.startswith("```"):
        lines = code.splitlines()
        lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines.pop()
        code = "\n".join(lines).strip()

    mindmap_start = code.find("mindmap")
    if mindmap_start > 0:
        code = code[mindmap_start:]

    if not code.startswith("mindmap"):
        raise ValueError("AI không trả về cú pháp Mermaid mindmap hợp lệ.")

    return code


def clean_mermaid_label(raw_label: str) -> str:
    label = raw_label.strip()
    if label.lower().startswith("root"):
        label = label[4:].strip()

    wrappers = (
        ("((", "))"),
        ("{{", "}}"),
        ("[[", "]]"),
        ("[", "]"),
        ("(", ")"),
        ("{", "}"),
    )
    for opening, closing in wrappers:
        opening_index = label.find(opening)
        if opening_index >= 0 and label.endswith(closing):
            label = label[opening_index + len(opening) : -len(closing)]
            break

    return label.strip("\"' ")


def parse_mermaid_mindmap(mermaid_code: str) -> dict:
    entries = []
    for raw_line in mermaid_code.splitlines():
        stripped = raw_line.strip()
        if not stripped or stripped == "mindmap" or stripped.startswith("%%"):
            continue
        indentation = len(raw_line) - len(raw_line.lstrip(" \t"))
        label = clean_mermaid_label(stripped)
        if label:
            entries.append({"indent": indentation, "label": label})

    if not entries:
        return {"center": "Mindmap", "branches": []}

    root = entries[0]
    child_indents = [
        entry["indent"] for entry in entries[1:] if entry["indent"] > root["indent"]
    ]
    if not child_indents:
        return {"center": root["label"], "branches": []}

    branch_indent = min(child_indents)
    indent_levels = sorted(
        {entry["indent"] for entry in entries[1:] if entry["indent"] >= branch_indent}
    )
    branches = []
    current_branch = None
    for entry in entries[1:]:
        if entry["indent"] == branch_indent:
            current_branch = {"title": entry["label"], "leaves": [], "nodes": []}
            branches.append(current_branch)
        elif entry["indent"] > branch_indent and current_branch:
            current_branch["leaves"].append(entry["label"])
            current_branch["nodes"].append(
                {
                    "label": entry["label"],
                    "depth": indent_levels.index(entry["indent"]),
                }
            )

    return {"center": root["label"], "branches": branches}


def write_trace(content: str, mermaid_code: str, status: str, provider: str) -> None:
    TRACE_FILE.parent.mkdir(parents=True, exist_ok=True)
    record = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "status": status,
        "provider": provider,
        "input_sha256": hashlib.sha256(content.encode("utf-8")).hexdigest(),
        "input_length": len(content),
        "input": content,
        "output": mermaid_code,
    }
    with TRACE_FILE.open("a", encoding="utf-8") as trace_file:
        trace_file.write(json.dumps(record, ensure_ascii=False) + "\n")


def configured_provider() -> str:
    if os.getenv("OPENROUTER_API_KEY"):
        return "openrouter"
    if os.getenv("OPENAI_API_KEY"):
        return "openai"
    if os.getenv("GEMINI_API_KEY"):
        return "gemini"
    return "none"


@app.get("/")
def index():
    return send_from_directory(BASE_DIR, "index.html")


@app.get("/api/slides")
def list_slides():
    try:
        slides = load_pdf_slides()
        return jsonify(
            ok=True,
            document={
                "filename": SLIDE_PDF_PATH.name,
                "pages": len(slides),
            },
            slides=slides,
        )
    except Exception as exc:
        return jsonify(ok=False, error=str(exc)), 500


@app.get("/api/document")
def get_document():
    if not SLIDE_PDF_PATH.exists():
        return jsonify(ok=False, error="Không tìm thấy tài liệu PDF."), 404
    return send_file(
        SLIDE_PDF_PATH,
        mimetype="application/pdf",
        conditional=True,
    )


@app.get("/api/slide-image/<int:page_number>")
def get_slide_image(page_number: int):
    try:
        image_bytes = render_pdf_page(page_number)
        return send_file(
            BytesIO(image_bytes),
            mimetype="image/png",
            max_age=3600,
        )
    except (FileNotFoundError, IndexError):
        return jsonify(ok=False, error="Trang PDF không hợp lệ."), 404


@app.post("/api/mindmap")
def create_mindmap():
    payload = request.get_json(silent=True) or {}
    content = str(payload.get("content", "")).strip()

    if not content:
        return jsonify(ok=False, error="Vui lòng chọn hoặc dán nội dung trước."), 400

    if len(content) > MAX_INPUT_LENGTH:
        return jsonify(
            ok=False,
            error=f"Nội dung vượt quá {MAX_INPUT_LENGTH:,} ký tự.",
        ), 413

    provider = configured_provider()
    if provider == "none":
        return jsonify(
            ok=False,
            error="Chưa cấu hình OPENROUTER_API_KEY, GEMINI_API_KEY hoặc OPENAI_API_KEY.",
        ), 503

    try:
        mermaid_code = normalize_mermaid(generate_mindmap(content))
        error_markers = ("GEMINI_API_KEY", "OPENAI_API_KEY", "OPENROUTER_API_KEY", "GEMINI_MODEL")
        if any(marker in mermaid_code for marker in error_markers):
            raise RuntimeError("LLM chưa được cấu hình đúng hoặc model không khả dụng.")

        write_trace(content, mermaid_code, "success", provider)
        return jsonify(
            ok=True,
            mermaid=mermaid_code,
            structure=parse_mermaid_mindmap(mermaid_code),
            provider=provider,
            source=payload.get("source", "user-selection"),
        )
    except Exception as exc:
        write_trace(content, str(exc), "error", provider)
        return jsonify(ok=False, error=str(exc)), 502


@app.post("/api/chat")
def chat_branch():
    payload = request.get_json(silent=True) or {}
    branch_title = payload.get("title", "")
    leaves = payload.get("leaves", [])
    action = payload.get("action", "explain")

    if not branch_title:
        return jsonify(ok=False, error="Thiếu tiêu đề nhánh."), 400

    provider = configured_provider()
    if provider == "none":
        return jsonify(ok=False, error="Chưa cấu hình API Key."), 503

    try:
        response_html = generate_chat(branch_title, leaves, action)
        if response_html.startswith("```html"):
            response_html = response_html[7:]
        if response_html.startswith("```"):
            response_html = response_html[3:]
        if response_html.endswith("```"):
            response_html = response_html[:-3]
        response_html = response_html.strip()
        
        return jsonify(ok=True, html=response_html, provider=provider)
    except Exception as exc:
        return jsonify(ok=False, error=str(exc)), 502


if __name__ == "__main__":
    port = int(os.getenv("PORT", "5000"))
    app.run(host="127.0.0.1", port=port, debug=False)
