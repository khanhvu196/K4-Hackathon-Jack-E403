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
    openrouter_key = os.getenv("OPENROUTER_API_KEY")

    errors = []

    # 1. Thử Gemini đầu tiên (ưu tiên vì xử lý context dài tốt và có gói free)
    if gemini_key and genai:
        try:
            genai.configure(api_key=gemini_key)
            model_name = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
            model = genai.GenerativeModel(model_name=model_name, system_instruction=system_prompt)
            response = model.generate_content(
                content,
                generation_config=genai.types.GenerationConfig(temperature=0.1)
            )
            return response.text
        except Exception as e:
            errors.append(f"Gemini: {type(e).__name__}")

    # 2. Nếu Gemini lỗi (vd: hết quota, sập), Fallback sang OpenRouter (nếu có key)
    if openrouter_key and openai:
        try:
            client = openai.OpenAI(
                api_key=openrouter_key,
                base_url="https://openrouter.ai/api/v1"
            )
            response = client.chat.completions.create(
                model=os.getenv("OPENROUTER_MODEL", "google/gemini-2.0-flash-exp:free"),
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": content}
                ],
                temperature=0.1,
            )
            return response.choices[0].message.content
        except Exception as e:
            errors.append(f"OpenRouter: {type(e).__name__}")

    # 3. Cuối cùng, Fallback sang OpenAI (chính chủ)
    if openai_key and openai:
        try:
            client = openai.OpenAI(api_key=openai_key)
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": content}
                ],
                temperature=0.1,
            )
            return response.choices[0].message.content
        except Exception as e:
            errors.append(f"OpenAI: {type(e).__name__}")
            
    # Xử lý khi không có key nào hoặc tất cả đều thất bại
    if not (gemini_key or openrouter_key or openai_key):
        return """mindmap
  root((⚠️ Lỗi: Cần cấu hình API Key))
    [Hãy thêm vào file .env]
      (GEMINI_API_KEY)
      (OPENROUTER_API_KEY)
      (OPENAI_API_KEY)
"""
    else:
        err_str = " | ".join(errors)
        return f"""mindmap
  root((⚠️ Lỗi: Tất cả API đều thất bại))
    [Các lỗi ghi nhận được]
      ({err_str})
"""

if __name__ == "__main__":
    # Test thử script
    test_slide = "Machine Learning có 3 loại chính: Supervised, Unsupervised và Reinforcement."
    print("Testing generate_mindmap...")
    print(generate_mindmap(test_slide))
