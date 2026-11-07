# OCodeJS CLI Hub

Danh mục khám phá các công cụ TUI/CLI dành cho lập trình viên. Giao diện tĩnh chạy trên GitHub Pages; dữ liệu công cụ được quản lý tập trung trong `tools.json`.

## Cấu trúc

- `index.html`: giao diện tìm kiếm, lọc và gửi đề xuất công cụ.
- `tools.json`: nguồn dữ liệu duy nhất cho danh mục.
- `scripts/validate.mjs`: kiểm tra schema, trường bắt buộc, ID trùng và URL repository.
- `.github/workflows/validate.yml`: kiểm tra tự động trên Pull Request và push vào `main`.
- `.github/workflows/static.yml`: triển khai GitHub Pages sau khi thay đổi được đưa vào `main`.

## Phát triển cục bộ

Yêu cầu Node.js 20 trở lên.

```bash
npx serve .
```

Mở URL local do `serve` cung cấp. Không mở `index.html` trực tiếp bằng `file://`, vì trình duyệt sẽ chặn việc tải `tools.json`.

Chạy kiểm tra dữ liệu:

```bash
node scripts/validate.mjs
```

## Đề xuất công cụ mới

1. Dùng nút **+ Gửi công cụ** trên giao diện hoặc tạo GitHub Issue theo mẫu **Tool submission**.
2. Maintainer xác minh repository, tên, mô tả và lệnh cài đặt.
3. Thêm mục mới vào `tools.json` bằng Pull Request.
4. Workflow validation phải thành công trước khi merge.
5. Sau khi merge vào `main`, workflow GitHub Pages triển khai trang tĩnh.

## Schema của một công cụ

```json
{
  "id": "my-tool",
  "name": "my-tool",
  "description": "Mô tả ngắn về công cụ.",
  "language": "Rust",
  "category": "Git",
  "install": "cargo install my-tool",
  "repo": "https://github.com/owner/my-tool"
}
```

Các trường `id`, `name`, `description`, `language`, `category` và `install` là bắt buộc. `repo` là tùy chọn nhưng nếu có phải là URL HTTPS hợp lệ.

## GitHub Pages

Trong repository, mở **Settings → Pages** và chọn **GitHub Actions** làm Build and deployment source. Workflow deploy chỉ chạy khi có push vào `main` hoặc được kích hoạt thủ công; Pull Request chỉ chạy validation, không triển khai production.

