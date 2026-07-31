# VLearn Mindmap Prototype

Prototype CP3: giao dien HTML hien tai goi AI that qua backend Python va render Mermaid.js.

## Cai dat

Chay mot lan trong CMD tai thu muc goc cua repo:

```bat
python -m pip install -r codebase\requirements.txt
```

Tao `.env` tu `.env.example`, dien API key. File `.env` da duoc Git ignore.

## Chay CP3

```bat
run.bat
```

Mo `http://127.0.0.1:5001`. Khong mo truc tiep `index.html` khi demo AI that.

## Flow demo

1. Xem slide va chon slide nguon hoac dan noi dung.
2. Backend doc `data/real-slides/slide_4.pdf` va trich text theo tung trang.
3. Bam `Tao mindmap`.
4. Frontend goi `POST /api/mindmap` voi text trang dang chon.
5. Backend goi Gemini/OpenAI qua `llm_client.py`.
6. Mermaid.js render ket qua va trang cuon xuong phan mindmap.
7. Trace input/output duoc luu tai `eval/api_trace.jsonl`.

## Hoc tiep va do khop nguon

- Nut mui ten tren thanh slide chuyen trang truoc/sau, dong bo anh, dropdown va text.
- `Do khop voi nguon` = so token trong input co mat trong text trang nguon / tong token input.
- Day la phep so khop van ban co the kiem tra, khong phai confidence do AI tu khai.
- Backend parse toan bo Mermaid thanh `structure` gom root, nhanh va moi node con.
- `Giai thich nhanh` va `Tao quiz nhanh` dung truc tiep `structure`; khong goi them AI.

## Du lieu that

- PDF mac dinh: `data/real-slides/slide_4.pdf` (26 trang).
- `pypdf` trich text; `PyMuPDF` render anh dung trang dang chon.
- Doi tai lieu bang bien `SLIDE_PDF_PATH` trong `.env`.
- Trang co duoi 100 ky tu trich xuat se duoc danh dau `khong du text`.
- PDF scan khong co lop text can OCR; prototype hien tai chua OCR.

## Pham vi fallback

- Neu API loi, giao dien hien fallback mock kem nhan ro rang; khong duoc dung fallback de chung minh CP3.
