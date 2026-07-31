import os
import json
from pathlib import Path

# Thêm import thư viện API
try:
    import google.generativeai as genai
except ImportError:
    genai = None

try:
    import openai
except ImportError:
    openai = None

PROMPT_FILE = Path(__file__).parent / "prompts" / "mindmap_prompt.md"

def load_system_prompt() -> str:
    """Tải nội dung System Prompt từ file"""
    if PROMPT_FILE.exists():
        with open(PROMPT_FILE, "r", encoding="utf-8") as f:
            return f.read()
    return "Bạn là một chuyên gia tạo Mermaid Mindmap."

def generate_mindmap(content: str) -> str:
    """
    Hàm gọi LLM để biến đổi nội dung slide/transcript thành mã Mermaid.js
    
    Args:
        content (str): Văn bản thô từ Slide hoặc Transcript.
        
    Returns:
        str: Mã Mermaid.js hợp lệ (bắt đầu bằng từ khóa 'mindmap')
    """
    
    # Kiểm tra rule độ dài tối thiểu (Nguồn sự thật)
    if len(content.strip()) < 30:
        return """mindmap
  root((⚠️ Nội dung slide quá ngắn để phân tích))
"""

    system_prompt = load_system_prompt()
    
    # Lấy API Key từ biến môi trường
    openai_key = os.getenv("OPENAI_API_KEY")
    gemini_key = os.getenv("GEMINI_API_KEY")

    # Ưu tiên OpenAI nếu cấu hình
    if openai_key and openai:
        client = openai.OpenAI(api_key=openai_key)
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": content}
            ],
            temperature=0.1, # Temperature thấp để tránh suy diễn (hallucinate)
        )
        return response.choices[0].message.content
    
    # Fallback sang Gemini
    elif gemini_key and genai:
        genai.configure(api_key=gemini_key)
        model_names = [
            os.getenv("GEMINI_MODEL", "gemini-2.0-flash"),
            "gemini-3.6-flash",
            "gemini-3.6-flash-lite",
        ]

        last_error = None
        for model_name in dict.fromkeys(model_names):
            try:
                model = genai.GenerativeModel(
                    model_name=model_name,
                    system_instruction=system_prompt
                )
                response = model.generate_content(
                    content,
                    generation_config=genai.types.GenerationConfig(temperature=0.1)
                )
                return response.text
            except Exception as exc:
                last_error = exc

        return f"""mindmap
  root((⚠️ Lỗi: Không gọi được Gemini))
    [Kiểm tra model]
      (GEMINI_MODEL)
      (mặc định gemini-2.0-flash)
    [Chi tiết]
      ({type(last_error).__name__})
"""
        
    else:
        # Fallback hiển thị báo lỗi nếu chưa cài đặt API key hoặc thiếu thư viện
        return """mindmap
  root((⚠️ Lỗi: Cần cấu hình API Key))
    [Bạn chưa set biến môi trường]
      (GEMINI_API_KEY)
      (hoặc OPENAI_API_KEY)
    [Hoặc chưa cài thư viện]
      (pip install google-generativeai openai)
"""

if __name__ == "__main__":
    # Test thử script
    test_slide = "Machine Learning có 3 loại chính: Supervised, Unsupervised và Reinforcement."
    print("Testing generate_mindmap...")
    print(generate_mindmap(test_slide))
