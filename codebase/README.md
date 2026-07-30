# VLearn Mindmap Prototype

Prototype HTML tinh gon cho CP2.

## Cach chay

Mo truc tiep file:

`codebase/index.html`

Khong can dev server.

## Flow demo CP2

1. Chon slide nguon hoac de che do tu nhan dien.
2. Dan noi dung hoc sinh copy vao o nhap.
3. Bam `Tao mindmap`.
4. Xem mindmap gom chu de trung tam, 3 nhanh chinh, y con, keyword va citation slide.
5. Thu nut `Giai thich nhanh nay` hoac `Tao quiz nhanh`.

## Phan dang mock

- Du lieu slide la mau gia lap.
- AI call chua ket noi API that; logic hien tai mo phong buoc nhan dien slide va tach mindmap.
- Muc tieu hien tai la CP2: flow bam duoc tu dau den cuoi.

## Huong nang len CP3

- Thay `slideData` trong `app.js` bang context tu data pack/transcript.
- Goi API AI that de sinh JSON mindmap.
- Luu log input/output cho golden set trong `eval/`.
