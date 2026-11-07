# OCodeJS CLI Hub

Danh mục tuyển chọn các công cụ terminal/TUI cho developer và AI agents. Website tĩnh được host bằng GitHub Pages; dữ liệu danh mục nằm trong `tools.json`.

## Danh mục hiện tại

Mỗi mục có mô tả, ngôn ngữ, nhóm, lệnh cài đặt và liên kết tới repository upstream đã xác minh. Lệnh dùng Homebrew cần cài Homebrew trước; các công cụ AI có thể có yêu cầu runtime riêng theo tài liệu upstream.

## Cấu trúc

- `index.html`: giao diện responsive, tìm kiếm, lọc, xem chi tiết và gửi đề xuất.
- `tools.json`: registry JSON.
- `scripts/validate.mjs`: kiểm tra schema, ID, URL HTTPS và lệnh cài đặt.
- `tests/catalog.test.mjs`: unit tests dùng Node.js built-in test runner.
- `.github/workflows/validate.yml`: CI trên Pull Request và push vào `main`.
- `.github/workflows/static.yml`: GitHub Pages deployment workflow.

## Yêu cầu

- Node.js 20+
- npm đi kèm Node.js
- Homebrew chỉ cần thiết nếu dùng các lệnh `brew install` trong danh mục.

## Chạy local

```bash
npm run validate
npm test
npx serve .
```

Mở URL local do `serve` cung cấp. Không mở HTML bằng `file://`, vì trình duyệt sẽ chặn fetch `tools.json`.

## Thêm công cụ

1. Mở **+ Gửi công cụ** trên website hoặc tạo Issue theo mẫu **Tool submission**.
2. Maintainer xác minh tên, mô tả, lệnh cài đặt và repository upstream.
3. Thêm entry vào `tools.json` bằng Pull Request.
4. CI phải xanh trước khi merge.
5. Việc thêm công cụ không tự chạy lệnh cài đặt và không thực thi mã từ repository upstream.

## Schema

```json
{
  "id": "my-tool",
  "name": "my-tool",
  "description": "Mô tả ngắn.",
  "language": "Rust",
  "category": "Git",
  "install": "cargo install my-tool",
  "repo": "https://github.com/owner/my-tool"
}
```

Các trường `id`, `name`, `description`, `language`, `category` và `install` bắt buộc. `repo` bắt buộc và phải là URL HTTPS hợp lệ. Mọi entry đều cần upstream source để người dùng tự kiểm tra.

## GitHub Pages

Repository đã bật Pages. Kiểm tra **Settings → Pages → Build and deployment** để xác nhận nguồn là **GitHub Actions**. Pull Request chỉ chạy CI; deploy workflow chỉ chạy trên push vào `main` hoặc thao tác thủ công.
