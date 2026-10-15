# CINEVERSE

Website khám phá phim xây dựng bằng Next.js 16 App Router, React 19, TypeScript và Supabase. Khi chưa cấu hình Supabase, ứng dụng tự dùng bộ dữ liệu demo và hiển thị nhãn rõ ràng; không có video giả được trình bày như nguồn phát thật.

## Chạy cục bộ

```bash
npm install
copy .env.example .env.local
npm run dev
```

Các biến cần cấu hình:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` được phép dùng ở browser và chỉ có quyền do RLS cấp. Không thêm Supabase secret key/service-role key vào biến `NEXT_PUBLIC_*` hoặc repository.

## Supabase

1. Tạo hoặc chọn một project Supabase miễn phí.
2. Mở SQL Editor và chạy migration [`supabase/migrations/202610150001_create_movies.sql`](supabase/migrations/202610150001_create_movies.sql), hoặc dùng Supabase CLI đã liên kết project: `supabase db push`.
3. Lấy Project URL và Publishable key trong Connect/Settings → API Keys, rồi đặt chúng trong `.env.local` và Vercel.
4. Tạo user quản trị bằng Supabase Auth. Sau đó, trong SQL Editor, gán role bằng email thật của user đó:

```sql
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
where email = 'admin@example.com';
```

Đăng xuất rồi đăng nhập lại để JWT nhận role mới. Trang `/admin` xác minh role phía server; RLS vẫn kiểm tra lại mọi thao tác tạo, sửa, xuất bản và xóa.

Migration tạo:

- `movies`: metadata, loại `movie/series/anime/theatrical`, trạng thái `draft/published` và các trường trình bày đang dùng.
- `movie_sources`: `provider`, `external_file_id`, `playback_mode`, thứ tự hiển thị; chưa tích hợp Google Drive hoặc URL phát.
- Index, khóa ngoại cascade, trigger `updated_at`, grants và RLS theo nguyên tắc quyền tối thiểu.

## Kiểm tra production

```bash
npm run lint
npm run typecheck
npm run build
npm start
```

Repo hiện chưa có test runner/unit test. Không có kiểm tra nào bị vô hiệu hóa.

## Deploy Vercel

Framework Preset: **Next.js**; Root Directory: thư mục repository; Build Command: `npm run build`; Install Command: `npm install`.

Trong Vercel Project Settings → Environment Variables, thêm ba biến trong `.env.example` cho Production và Preview. Đặt `NEXT_PUBLIC_SITE_URL` thành domain tương ứng. Sau khi deploy, kiểm tra `/`, `/movies`, `/search`, một trang `/movie/[slug]`, `/login`, `/admin` và một URL không tồn tại. Xác nhận nội dung mới xuất bản trong Supabase xuất hiện trên website; cache nội dung được làm mới tối đa sau khoảng 5 phút.

