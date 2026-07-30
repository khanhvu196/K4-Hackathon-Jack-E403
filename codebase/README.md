# VLearn Mindmap Prototype

Prototype HTML tinh gon cho CP2.

## Cach chay

Mo truc tiep file:

`codebase/index.html`

Khong can dev server.

## Flow demo CP2

1. Man dau tien mo nhu hoc sinh dang xem slide tren VLearn.
2. Ben canh slide, chon slide nguon hoac dan noi dung hoc sinh copy.
3. Bam `Tao mindmap`.
4. Trang tu cuon xuong phan mindmap.
5. Xem mindmap gom chu de trung tam, 3 nhanh chinh, y con, keyword va citation slide.
6. Cuon tiep xuong phan hoc tiep de thu `Giai thich nhanh` hoac `Tao quiz nhanh`.

## Phan dang mock

- Du lieu slide la mau gia lap.
- AI call chua ket noi API that; logic hien tai mo phong buoc nhan dien slide va tach mindmap.
- Muc tieu hien tai la CP2: flow bam duoc tu dau den cuoi.

## Huong nang len CP3

- Thay `slideData` trong `app.js` bang context tu data pack/transcript.
- Goi API AI that de sinh JSON mindmap.
- Luu log input/output cho golden set trong `eval/`.
