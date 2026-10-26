export const swaggerSpec = {
  openapi: "3.0.0",
  info: {
    title: "Simple Shop API Documentation",
    version: "1.0.0",
    description: "Tài liệu API chi tiết cho hệ thống thương mại điện tử Simple Shop (Next.js 14, Prisma, SQLite).",
  },
  servers: [
    {
      url: "http://localhost:3000",
      description: "Local Development Server",
    },
  ],
  tags: [
    { name: "Auth", description: "Xác thực và tài khoản người dùng" },
    { name: "Products", description: "Quản lý và tìm kiếm sản phẩm" },
    { name: "Categories", description: "Quản lý danh mục hàng hóa" },
    { name: "Cart", description: "Giỏ hàng của người dùng" },
    { name: "Checkout & Orders", description: "Đặt hàng và quản lý đơn hàng của khách" },
    { name: "Admin", description: "Quản trị hệ thống (Thống kê, Quản lý đơn, Quản lý user)" },
  ],
  paths: {
    "/api/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Đăng ký tài khoản người dùng mới",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "email", "password"],
                properties: {
                  name: { type: "string", example: "Nguyen Van A" },
                  email: { type: "string", format: "email", example: "user@example.com" },
                  password: { type: "string", example: "123456" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Đăng ký thành công" },
          400: { description: "Dữ liệu không hợp lệ hoặc email đã tồn tại" },
        },
      },
    },
    "/api/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Đăng nhập hệ thống",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", example: "admin@simpleshop.com" },
                  password: { type: "string", example: "admin123" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Đăng nhập thành công và lưu Cookie userId" },
          401: { description: "Email hoặc mật khẩu không đúng" },
        },
      },
    },
    "/api/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Đăng xuất tài khoản",
        responses: {
          200: { description: "Đăng xuất thành công, cookie đã được xóa" },
        },
      },
    },
    "/api/auth/me": {
      put: {
        tags: ["Auth"],
        summary: "Cập nhật hồ sơ cá nhân và đổi mật khẩu",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string", example: "Nguyen Van A Mới" },
                  currentPassword: { type: "string", example: "123456" },
                  newPassword: { type: "string", example: "654321" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Cập nhật thành công" },
          400: { description: "Mật khẩu cũ không đúng hoặc thiếu thông tin" },
          401: { description: "Chưa đăng nhập" },
        },
      },
    },
    "/api/products": {
      get: {
        tags: ["Products"],
        summary: "Lấy danh sách sản phẩm (có lọc, phân trang, tìm kiếm)",
        parameters: [
          { name: "category", in: "query", schema: { type: "string" }, description: "Slug hoặc ID của danh mục" },
          { name: "search", in: "query", schema: { type: "string" }, description: "Từ khóa tìm kiếm sản phẩm" },
          { name: "sort", in: "query", schema: { type: "string", enum: ["price-asc", "price-desc", "newest", "popular"] } },
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 12 } },
        ],
        responses: {
          200: { description: "Danh sách sản phẩm kèm metadata phân trang" },
        },
      },
      post: {
        tags: ["Products"],
        summary: "Thêm sản phẩm mới (Chỉ Admin)",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "price", "image", "categoryId"],
                properties: {
                  name: { type: "string", example: "Áo Polo Nam Classic" },
                  description: { type: "string", example: "Chất liệu cotton cá sấu thoáng mát..." },
                  price: { type: "integer", example: 250000 },
                  oldPrice: { type: "integer", example: 350000 },
                  stock: { type: "integer", example: 50 },
                  image: { type: "string", example: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab" },
                  badge: { type: "string", example: "Mới" },
                  isFeatured: { type: "boolean", example: true },
                  categoryId: { type: "integer", example: 1 },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Tạo sản phẩm thành công" },
          403: { description: "Không có quyền Admin" },
        },
      },
    },
    "/api/products/{id}": {
      get: {
        tags: ["Products"],
        summary: "Lấy chi tiết 1 sản phẩm",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          200: { description: "Thông tin chi tiết sản phẩm" },
          404: { description: "Không tìm thấy sản phẩm" },
        },
      },
      put: {
        tags: ["Products"],
        summary: "Cập nhật sản phẩm (Chỉ Admin)",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                  price: { type: "integer" },
                  oldPrice: { type: "integer" },
                  stock: { type: "integer" },
                  image: { type: "string" },
                  badge: { type: "string" },
                  isFeatured: { type: "boolean" },
                  categoryId: { type: "integer" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Cập nhật thành công" },
          403: { description: "Không có quyền Admin" },
        },
      },
      delete: {
        tags: ["Products"],
        summary: "Xóa sản phẩm (Chỉ Admin)",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          200: { description: "Xóa sản phẩm thành công" },
          403: { description: "Không có quyền Admin" },
        },
      },
    },
    "/api/products/featured": {
      get: {
        tags: ["Products"],
        summary: "Lấy danh sách sản phẩm nổi bật (Featured)",
        responses: {
          200: { description: "Danh sách sản phẩm có isFeatured = true" },
        },
      },
    },
    "/api/products/search": {
      get: {
        tags: ["Products"],
        summary: "Tìm kiếm sản phẩm theo từ khóa",
        parameters: [
          { name: "q", in: "query", required: true, schema: { type: "string" }, description: "Từ khóa cần tìm" },
        ],
        responses: {
          200: { description: "Kết quả tìm kiếm sản phẩm" },
        },
      },
    },
    "/api/categories": {
      get: {
        tags: ["Categories"],
        summary: "Lấy danh sách tất cả danh mục",
        responses: {
          200: { description: "Danh sách danh mục kèm số lượng sản phẩm" },
        },
      },
      post: {
        tags: ["Categories"],
        summary: "Tạo danh mục mới (Chỉ Admin)",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "slug"],
                properties: {
                  name: { type: "string", example: "Đồng hồ" },
                  slug: { type: "string", example: "dong-ho" },
                  icon: { type: "string", example: "⌚" },
                  description: { type: "string", example: "Đồng hồ nam nữ chính hãng" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Tạo danh mục thành công" },
          403: { description: "Không có quyền Admin" },
        },
      },
    },
    "/api/categories/{id}": {
      get: {
        tags: ["Categories"],
        summary: "Chi tiết 1 danh mục",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          200: { description: "Thông tin danh mục" },
          404: { description: "Không tìm thấy" },
        },
      },
      put: {
        tags: ["Categories"],
        summary: "Cập nhật danh mục (Chỉ Admin)",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  slug: { type: "string" },
                  icon: { type: "string" },
                  description: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Cập nhật danh mục thành công" },
        },
      },
      delete: {
        tags: ["Categories"],
        summary: "Xóa danh mục (Chỉ Admin)",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          200: { description: "Xóa danh mục thành công" },
        },
      },
    },
    "/api/cart": {
      get: {
        tags: ["Cart"],
        summary: "Lấy giỏ hàng của user đang đăng nhập",
        responses: {
          200: { description: "Chi tiết giỏ hàng và danh sách items" },
          401: { description: "Chưa đăng nhập" },
        },
      },
      post: {
        tags: ["Cart"],
        summary: "Thêm sản phẩm vào giỏ hàng",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["productId"],
                properties: {
                  productId: { type: "integer", example: 1 },
                  quantity: { type: "integer", default: 1, example: 1 },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Thêm vào giỏ thành công" },
        },
      },
      put: {
        tags: ["Cart"],
        summary: "Cập nhật số lượng của món hàng trong giỏ",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["cartItemId", "quantity"],
                properties: {
                  cartItemId: { type: "integer", example: 1 },
                  quantity: { type: "integer", example: 2 },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Cập nhật số lượng thành công" },
        },
      },
      delete: {
        tags: ["Cart"],
        summary: "Xóa sản phẩm khỏi giỏ hàng",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["cartItemId"],
                properties: {
                  cartItemId: { type: "integer", example: 1 },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Xóa thành công" },
        },
      },
    },
    "/api/cart/count": {
      get: {
        tags: ["Cart"],
        summary: "Đếm tổng số lượng hàng trong giỏ",
        responses: {
          200: { description: "Tổng số lượng hàng trong giỏ" },
        },
      },
    },
    "/api/checkout": {
      post: {
        tags: ["Checkout & Orders"],
        summary: "Tiến hành đặt hàng từ giỏ hàng hiện tại",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["customerName", "customerEmail", "customerPhone", "address"],
                properties: {
                  customerName: { type: "string", example: "Nguyen Van A" },
                  customerEmail: { type: "string", example: "user@example.com" },
                  customerPhone: { type: "string", example: "0912345678" },
                  address: { type: "string", example: "123 Đường Lê Lợi, Quận 1, TP.HCM" },
                  paymentMethod: { type: "string", default: "COD", example: "COD" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Tạo đơn hàng thành công và xóa giỏ hàng" },
          400: { description: "Giỏ hàng rỗng hoặc không đủ số lượng tồn kho" },
        },
      },
    },
    "/api/orders": {
      get: {
        tags: ["Checkout & Orders"],
        summary: "Lấy danh sách đơn hàng của người dùng hiện tại",
        responses: {
          200: { description: "Danh sách đơn hàng của người dùng" },
          401: { description: "Chưa đăng nhập" },
        },
      },
    },
    "/api/orders/{id}": {
      get: {
        tags: ["Checkout & Orders"],
        summary: "Chi tiết 1 đơn hàng của người dùng",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          200: { description: "Thông tin chi tiết đơn hàng và các item" },
          404: { description: "Không tìm thấy đơn hàng" },
        },
      },
      put: {
        tags: ["Checkout & Orders"],
        summary: "Hủy đơn hàng (Khi trạng thái là PENDING)",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "string", example: "CANCELLED" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Hủy đơn thành công" },
        },
      },
    },
    "/api/admin/dashboard": {
      get: {
        tags: ["Admin"],
        summary: "Thống kê tổng quan Dashboard (Doanh thu, Đơn hàng, Khách hàng, Sản phẩm)",
        responses: {
          200: { description: "Dữ liệu tổng quan dashboard admin" },
          403: { description: "Không có quyền Admin" },
        },
      },
    },
    "/api/admin/stats": {
      get: {
        tags: ["Admin"],
        summary: "Dữ liệu thống kê doanh thu và biểu đồ",
        parameters: [
          { name: "period", in: "query", schema: { type: "string", enum: ["7days", "30days", "month", "year"] } },
        ],
        responses: {
          200: { description: "Dữ liệu thống kê biểu đồ" },
        },
      },
    },
    "/api/admin/orders": {
      get: {
        tags: ["Admin"],
        summary: "Lấy toàn bộ đơn hàng của hệ thống (Chỉ Admin)",
        parameters: [
          { name: "status", in: "query", schema: { type: "string" } },
          { name: "search", in: "query", schema: { type: "string" } },
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 10 } },
        ],
        responses: {
          200: { description: "Danh sách đơn hàng toàn hệ thống" },
        },
      },
    },
    "/api/admin/orders/{id}": {
      put: {
        tags: ["Admin"],
        summary: "Cập nhật trạng thái đơn hàng (Chỉ Admin)",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["status"],
                properties: {
                  status: {
                    type: "string",
                    enum: ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"],
                    example: "CONFIRMED",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Cập nhật trạng thái đơn thành công" },
        },
      },
      delete: {
        tags: ["Admin"],
        summary: "Xóa đơn hàng (Chỉ Admin)",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          200: { description: "Xóa đơn hàng thành công" },
        },
      },
    },
    "/api/admin/users": {
      get: {
        tags: ["Admin"],
        summary: "Danh sách người dùng hệ thống (Chỉ Admin)",
        parameters: [
          { name: "search", in: "query", schema: { type: "string" } },
          { name: "role", in: "query", schema: { type: "string", enum: ["USER", "ADMIN"] } },
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 10 } },
        ],
        responses: {
          200: { description: "Danh sách người dùng" },
        },
      },
      put: {
        tags: ["Admin"],
        summary: "Thay đổi phân quyền vai trò người dùng (USER/ADMIN)",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["userId", "role"],
                properties: {
                  userId: { type: "integer", example: 2 },
                  role: { type: "string", enum: ["USER", "ADMIN"], example: "ADMIN" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Thay đổi vai trò thành công" },
        },
      },
    },
    "/api/admin/users/{id}": {
      get: {
        tags: ["Admin"],
        summary: "Chi tiết người dùng (Chỉ Admin)",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          200: { description: "Chi tiết người dùng kèm đơn hàng" },
        },
      },
      delete: {
        tags: ["Admin"],
        summary: "Xóa tài khoản người dùng (Chỉ Admin)",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          200: { description: "Xóa người dùng thành công" },
        },
      },
    },
  },
};
