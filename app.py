import gradio as gr
import urllib.parse
import os
from dotenv import load_dotenv

# Tải biến môi trường từ file .env
load_dotenv()

from codebase.llm_client import generate_mindmap

def generate_html(mermaid_code):
    """
    Tạo nội dung HTML nhúng thư viện Mermaid.js để vẽ sơ đồ từ mã text.
    """
    html_template = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <script type="module">
            import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs';
            mermaid.initialize({{ startOnLoad: true, theme: 'default' }});
        </script>
        <style>
            body {{ font-family: -apple-system, sans-serif; background: #F2F4F7; margin: 0; padding: 20px; }}
            .mermaid-box {{ background: white; border-radius: 12px; padding: 20px; box-shadow: 0 4px 16px rgba(20,30,60,.08); display: flex; justify-content: center; }}
        </style>
    </head>
    <body>
        <div class="mermaid-box">
            <div class="mermaid">
{mermaid_code}
            </div>
        </div>
    </body>
    </html>
    """
    # Trả về iframe chứa code HTML
    return f'<iframe srcdoc="{urllib.parse.escape(html_template)}" width="100%" height="600px" style="border: none; border-radius: 12px;"></iframe>'

def process_text(text):
    if not text.strip():
        return "Vui lòng nhập nội dung bài giảng để phân tích...", ""
    
    # 1. Gọi hàm sinh mã Mermaid
    mermaid_code = generate_mindmap(text)
    
    # 2. Sinh HTML preview từ mã Mermaid
    preview_html = generate_html(mermaid_code)
    
    return mermaid_code, preview_html

with gr.Blocks(title="VLearn AI - Mindmap Generator", theme=gr.themes.Soft()) as demo:
    gr.Markdown("# 🧠 VLearn - AI Mindmap Generator")
    gr.Markdown("Nhập nội dung bài giảng (Slide/Transcript) để AI tự động vẽ sơ đồ tư duy tóm tắt.")
    
    with gr.Row():
        with gr.Column(scale=1):
            input_text = gr.Textbox(
                label="Nội dung bài giảng", 
                lines=12, 
                placeholder="Ví dụ: Machine Learning có 3 loại chính: Supervised, Unsupervised và Reinforcement Learning..."
            )
            btn = gr.Button("Tạo Mindmap 🚀", variant="primary")
            
            gr.Markdown("### Ghi chú:")
            gr.Markdown("- Tính năng gọi trực tiếp API LLM (Cần cấu hình `GEMINI_API_KEY` hoặc `OPENAI_API_KEY`).\n- Hỗ trợ xử lý văn bản, tóm tắt và phân cấp tự động.")
            
        with gr.Column(scale=2):
            html_output = gr.HTML(label="Bản xem trước Sơ đồ (Preview)")
            with gr.Accordion("Xem mã Mermaid (Dành cho Debug)", open=False):
                output_code = gr.Textbox(label="Mã Mermaid gốc", lines=10, interactive=False)
            
    btn.click(
        fn=process_text, 
        inputs=[input_text], 
        outputs=[output_code, html_output]
    )

if __name__ == "__main__":
    demo.launch(server_name="0.0.0.0", server_port=7860, share=False)
