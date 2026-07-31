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

def generate_chat(branch_title: str, leaves: list, action: str) -> str:
    """
    Sinh câu hỏi quiz hoặc giải thích cho nhánh sơ đồ.
    action = 'explain' | 'quiz'
    """
    if action == "explain":
        system_prompt = "Bạn là một trợ lý AI giáo dục. Hãy giải thích ngắn gọn, dễ hiểu (dưới 150 chữ) về khái niệm này. Trình bày dưới dạng HTML (dùng thẻ <ul>, <li>, <strong>) để dễ hiển thị. Không dùng Markdown code block."
    else:
        system_prompt = "Bạn là một giáo viên. Dựa vào nội dung khái niệm, hãy tạo 2 câu hỏi trắc nghiệm ngắn (mỗi câu có 3 đáp án A, B, C và chỉ ra đáp án đúng). Trình bày dưới dạng HTML (dùng thẻ <ul>, <li>, <strong>). Không dùng Markdown code block."
    
    content = f"Chủ đề nhánh: {branch_title}\nCác ý phụ: {', '.join(leaves)}"
    
    openai_key = os.getenv("OPENAI_API_KEY")
    gemini_key = os.getenv("GEMINI_API_KEY")
    openrouter_key = os.getenv("OPENROUTER_API_KEY")

    if gemini_key and genai:
        try:
            model_name = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
            model = genai.GenerativeModel(model_name=model_name, system_instruction=system_prompt)
            response = model.generate_content(content)
            return response.text
        except Exception:
            pass

    if openrouter_key and openai:
        try:
            client = openai.OpenAI(api_key=openrouter_key, base_url="https://openrouter.ai/api/v1")
            response = client.chat.completions.create(
                model=os.getenv("OPENROUTER_MODEL", "google/gemini-2.0-flash-exp:free"),
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": content}
                ],
                temperature=0.3,
            )
            return response.choices[0].message.content
        except Exception:
            pass

    if openai_key and openai:
        try:
            client = openai.OpenAI(api_key=openai_key)
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": content}
                ],
                temperature=0.3,
            )
            return response.choices[0].message.content
        except Exception:
            pass
            
    return "<strong>⚠️ Lỗi: Không thể kết nối tới AI để xử lý yêu cầu này. Vui lòng kiểm tra API Key.</strong>"

def generate_node_action(action_type: str, payload: dict) -> str:
    """
    Xử lý 4 hành động: explain, quiz, compare, real_example
    """
    valid_actions = ["explain", "quiz", "compare", "real_example"]
    if action_type not in valid_actions:
        return f"<strong>⚠️ Lỗi: Hành động '{action_type}' không hợp lệ.</strong>"

    prompt_path = Path(__file__).parent / "prompts" / "node_actions" / f"{action_type}_prompt.md"
    if not prompt_path.exists():
        return f"<strong>⚠️ Lỗi: Không tìm thấy template '{action_type}_prompt.md'.</strong>"

    with open(prompt_path, "r", encoding="utf-8") as f:
        system_prompt = f.read()

    # Thay thế các biến trong template
    system_prompt = system_prompt.replace("{{NODE_LABEL}}", payload.get("node_label", ""))
    system_prompt = system_prompt.replace("{{NODE_CONTEXT}}", payload.get("node_context", ""))
    system_prompt = system_prompt.replace("{{SOURCE_TEXT}}", payload.get("source_text", ""))
    
    if action_type == "compare":
        system_prompt = system_prompt.replace("{{COMPARE_TEXT}}", payload.get("compare_text", ""))

    content = "Hãy thực hiện yêu cầu của bạn dựa trên dữ liệu đầu vào."
    
    openai_key = os.getenv("OPENAI_API_KEY")
    gemini_key = os.getenv("GEMINI_API_KEY")
    openrouter_key = os.getenv("OPENROUTER_API_KEY")

    if gemini_key and genai:
        try:
            model_name = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
            model = genai.GenerativeModel(model_name=model_name, system_instruction=system_prompt)
            response = model.generate_content(content)
            return response.text
        except Exception:
            pass

    if openrouter_key and openai:
        try:
            client = openai.OpenAI(api_key=openrouter_key, base_url="https://openrouter.ai/api/v1")
            response = client.chat.completions.create(
                model=os.getenv("OPENROUTER_MODEL", "google/gemini-2.0-flash-exp:free"),
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": content}
                ],
                temperature=0.3,
            )
            return response.choices[0].message.content
        except Exception:
            pass

    if openai_key and openai:
        try:
            client = openai.OpenAI(api_key=openai_key)
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": content}
                ],
                temperature=0.3,
            )
            return response.choices[0].message.content
        except Exception:
            pass
            
    return "<strong>⚠️ Lỗi: Không thể kết nối tới AI để xử lý yêu cầu này. Vui lòng kiểm tra API Key.</strong>"

def generate_chat_agent(context_text: str, question: str) -> str:
    prompt_path = Path(__file__).parent / "prompts" / "chat_prompt.md"
    if not prompt_path.exists():
        return f"<strong>⚠️ Lỗi: Không tìm thấy template 'chat_prompt.md'.</strong>"

    with open(prompt_path, "r", encoding="utf-8") as f:
        system_prompt = f.read()

    system_prompt = system_prompt.replace("{{CONTEXT}}", context_text)
    system_prompt = system_prompt.replace("{{QUESTION}}", question)
    
    content = question
    
    openai_key = os.getenv("OPENAI_API_KEY")
    gemini_key = os.getenv("GEMINI_API_KEY")
    openrouter_key = os.getenv("OPENROUTER_API_KEY")

    if gemini_key and genai:
        try:
            model_name = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
            model = genai.GenerativeModel(model_name=model_name, system_instruction=system_prompt)
            response = model.generate_content(content)
            return response.text
        except Exception:
            pass

    if openrouter_key and openai:
        try:
            client = openai.OpenAI(api_key=openrouter_key, base_url="https://openrouter.ai/api/v1")
            response = client.chat.completions.create(
                model=os.getenv("OPENROUTER_MODEL", "google/gemini-2.0-flash-exp:free"),
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": content}
                ],
                temperature=0.3,
            )
            return response.choices[0].message.content
        except Exception:
            pass

    if openai_key and openai:
        try:
            client = openai.OpenAI(api_key=openai_key)
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": content}
                ],
                temperature=0.3,
            )
            return response.choices[0].message.content
        except Exception:
            pass
            
    return "<strong>⚠️ Lỗi: Không thể kết nối tới AI. Vui lòng kiểm tra API Key.</strong>"

if __name__ == "__main__":
    test_slide = "Machine Learning có 3 loại chính: Supervised, Unsupervised và Reinforcement."
    print("Testing generate_mindmap...")
    print(generate_mindmap(test_slide))
