# Simple Shop - Kiến trúc Tách biệt Frontend & Backend

Dự án được cấu trúc thành 2 phần độc lập:
- **`server/` (Backend)**: Node.js + Express.js + Prisma ORM + SQLite + Swagger UI (`http://localhost:5000`)
- **`frontend/` (Frontend)**: Next.js 14 (React) + Tailwind CSS (`http://localhost:3000`)

---

## 🚀 Hướng dẫn Cài đặt & Khởi chạy

### 1. Khởi chạy Backend Server (Express + Prisma)

```bash
cd server
npm install        # (Nếu chưa cài)
npm run db:push    # Đồng bộ schema database SQLite
npm run db:seed    # Nạp dữ liệu mẫu (sản phẩm, tài khoản admin, mã giảm giá)
npm run dev        # Chạy máy chủ tại http://localhost:5000
```

* **Swagger API Docs:** `http://localhost:5000/api-docs`
* **Health Check:** `http://localhost:5000/health`

### 2. Khởi chạy Frontend (Next.js)

Mở một cửa sổ Terminal mới:

```bash
cd frontend
npm install        # (Nếu chưa cài)
npm run dev        # Chạy giao diện tại http://localhost:3000
```

* Truy cập trình duyệt: `http://localhost:3000`
* Frontend đã cấu hình tự động **Proxy Rewrites** toàn bộ request `/api/*` và `/uploads/*` sang `http://localhost:5000`.

---

## 📁 Cấu trúc thư mục

```text
simple-shop/
├── server/                    # Backend API (Express.js)
│   ├── prisma/
│   │   ├── schema.prisma      # Prisma Schema (User, Product, Category, Cart, Order, Review, Coupon)
│   │   ├── seed.js            # Dữ liệu mẫu ban đầu
│   │   └── dev.db             # Cơ sở dữ liệu SQLite
│   ├── src/
│   │   ├── index.js           # Express App Entrypoint (Port 5000, CORS, CookieParser)
│   │   ├── prisma.js          # Prisma Client singleton
│   │   ├── swagger.js         # OpenAPI 3.0 Documentation
│   │   ├── middleware/
│   │   │   └── auth.js        # Xác thực Token HMAC-SHA256 & phân quyền Admin
│   │   └── routes/            # Các router nghiệp vụ
│   │       ├── auth.routes.js     # Đăng nhập, đăng ký, profile, đổi mật khẩu
│   │       ├── product.routes.js  # CRUD sản phẩm, tìm kiếm, đánh giá review
│   │       ├── category.routes.js # CRUD danh mục
│   │       ├── cart.routes.js     # Quản lý giỏ hàng
│   │       ├── checkout.routes.js # Thanh toán, trừ tồn kho, áp dụng coupon
│   │       ├── order.routes.js    # Quản lý đơn hàng của user, tự hủy đơn
│   │       ├── coupon.routes.js   # Kiểm tra & áp mã giảm giá
│   │       ├── upload.routes.js   # Upload ảnh sản phẩm (Multer)
│   │       └── admin.routes.js    # Quản lý đơn hàng, user, coupon, thống kê dashboard
│   ├── uploads/               # Thư mục lưu ảnh upload
│   └── package.json
│
├── frontend/                  # Frontend Web App (Next.js 14)
│   ├── app/                   # Giao diện người dùng & quản trị
│   │   ├── admin/             # Trang quản trị (Dashboard, Products, Orders, Users, Categories)
│   │   ├── cart/              # Trang giỏ hàng
│   │   ├── checkout/          # Trang thanh toán
│   │   ├── orders/            # Trang theo dõi đơn hàng
│   │   ├── products/[id]/     # Chi tiết sản phẩm & đánh giá
│   │   ├── login/             # Đăng nhập
│   │   ├── register/          # Đăng ký
│   │   ├── page.js            # Trang chủ bán hàng
│   │   └── globals.css        # Stylesheet & Tailwind
│   ├── next.config.mjs        # Cấu hình proxy rewrite sang backend port 5000
│   └── package.json
│
└── README.md
```

---

## 🔑 Tài khoản mẫu để kiểm thử

| Vai trò | Email | Mật khẩu |
| :--- | :--- | :--- |
| **Admin** | `admin@simpleshop.com` | `admin123` |
| **Khách hàng** | `user@simpleshop.com` | `user123456` |

## 🎟️ Mã giảm giá mẫu có sẵn

* `GIAM10`: Giảm 10% (tối đa 50.000₫ cho đơn từ 100.000₫)
* `FREESHIP`: Miễn phí vận chuyển 30.000₫ (cho đơn từ 200.000₫)
* `VIP20`: Giảm 20% (tối đa 100.000₫ cho đơn từ 500.000₫)
