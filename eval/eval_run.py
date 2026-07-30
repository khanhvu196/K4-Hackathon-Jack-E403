import json
import sys
from pathlib import Path

# Thêm codebase vào sys.path để import module
sys.path.append(str(Path(__file__).parent.parent))
from codebase.llm_client import generate_mindmap

def main():
    golden_set_path = Path(__file__).parent / "golden_set.json"
    if not golden_set_path.exists():
        print(f"Lỗi: Không tìm thấy file {golden_set_path}")
        return

    with open(golden_set_path, "r", encoding="utf-8") as f:
        test_cases = json.load(f)

    print("="*80)
    print("🚀 BẮT ĐẦU CHẠY EVALUATION SCRIPT")
    print("="*80)
    
    for case in test_cases:
        print(f"\n[Test Case]: {case.get('id', 'Unknown')} | Độ khó: {case.get('difficulty_layer', 'N/A')}")
        print(f"- Nguồn: {case.get('input_source', 'N/A')}")
        print(f"- Hành vi mong đợi: {case.get('expected_behavior', 'N/A')}")
        print("-" * 50)
        
        # Gọi hàm AI
        input_text = case.get('input_text', '')
        result = generate_mindmap(input_text)
        
        print("💡 [Kết quả từ AI - Mã Mermaid]:\n")
        print(result)
        print("="*80)
        
    print("\n✅ Hoàn thành chạy Eval script. Vui lòng đối chiếu bằng mắt (Human Eval) kết quả AI với hành vi mong đợi.")

if __name__ == "__main__":
    main()
