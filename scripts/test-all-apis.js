const BASE_URL = "http://localhost:5000";

let userCookie = "";
let adminCookie = "";
let createdOrderId = null;
let createdProductId = null;
let createdCouponId = null;

const testResults = [];

async function request(method, path, body = null, cookie = "") {
  const headers = { "Content-Type": "application/json" };
  if (cookie) {
    headers["Cookie"] = cookie;
  }

  const options = {
    method,
    headers,
  };

  if (body && (method === "POST" || method === "PUT")) {
    options.body = JSON.stringify(body);
  }

  const res = await fetch(`${BASE_URL}${path}`, options);
  let data = null;
  try {
    data = await res.json();
  } catch (e) {
    data = null;
  }

  // Get set-cookie header if any
  const setCookie = res.headers.get("set-cookie");

  return { status: res.status, ok: res.ok, data, setCookie };
}

function extractCookies(setCookieHeader) {
  if (!setCookieHeader) return "";
  // Split multiple cookies if comma-separated or keep simple
  return setCookieHeader.split(";")[0];
}

async function runTest(testName, fn) {
  process.stdout.write(`⏳ Đang test: ${testName}... `);
  try {
    const res = await fn();
    console.log(`✅ [${res.status}] PASS`);
    testResults.push({ name: testName, status: "PASS", code: res.status, detail: res.detail || "" });
    return res;
  } catch (err) {
    console.log(`❌ FAIL: ${err.message}`);
    testResults.push({ name: testName, status: "FAIL", error: err.message });
    return null;
  }
}

async function main() {
  console.log("=================================================");
  console.log("🧪 BẮT ĐẦU KIỂM THỬ TOÀN DIỆN CÁC API BACKEND");
  console.log(`📡 Base URL: ${BASE_URL}`);
  console.log("=================================================\n");

  // 1. Health check
  await runTest("GET /health - Server Health Check", async () => {
    const res = await request("GET", "/health");
    if (res.status !== 200 || res.data?.status !== "ok") throw new Error("Health check thất bại");
    return { status: res.status };
  });

  // 2. Swagger Docs spec
  await runTest("GET /api/docs/spec - OpenAPI Specification", async () => {
    const res = await request("GET", "/api/docs/spec");
    if (res.status !== 200 || !res.data?.openapi) throw new Error("Swagger spec không hợp lệ");
    return { status: res.status };
  });

  // 3. Categories
  await runTest("GET /api/categories - Lấy danh mục sản phẩm", async () => {
    const res = await request("GET", "/api/categories");
    if (res.status !== 200 || !Array.isArray(res.data?.categories)) throw new Error("Không lấy được danh mục");
    return { status: res.status, detail: `Tìm thấy ${res.data.categories.length} danh mục` };
  });

  await runTest("GET /api/categories/1 - Lấy chi tiết danh mục 1", async () => {
    const res = await request("GET", "/api/categories/1");
    if (res.status !== 200 || !res.data?.category) throw new Error("Không tìm thấy danh mục 1");
    return { status: res.status };
  });

  // 4. Products
  await runTest("GET /api/products - Danh sách sản phẩm (phân trang)", async () => {
    const res = await request("GET", "/api/products?page=1&limit=5");
    if (res.status !== 200 || !Array.isArray(res.data?.products)) throw new Error("Lỗi lấy sản phẩm");
    return { status: res.status, detail: `Tổng ${res.data.pagination?.total} sản phẩm` };
  });

  await runTest("GET /api/products/search - Tìm kiếm từ khóa 'áo'", async () => {
    const res = await request("GET", "/api/products/search?q=áo");
    if (res.status !== 200 || !Array.isArray(res.data?.products)) throw new Error("Lỗi tìm kiếm");
    return { status: res.status, detail: `Tìm thấy ${res.data.products.length} kết quả` };
  });

  await runTest("GET /api/products/featured - Sản phẩm nổi bật", async () => {
    const res = await request("GET", "/api/products/featured");
    if (res.status !== 200 || !Array.isArray(res.data?.products)) throw new Error("Lỗi lấy sản phẩm nổi bật");
    return { status: res.status };
  });

  await runTest("GET /api/products/1 - Chi tiết sản phẩm 1", async () => {
    const res = await request("GET", "/api/products/1");
    if (res.status !== 200 || !res.data?.product) throw new Error("Không tìm thấy sản phẩm 1");
    return { status: res.status };
  });

  await runTest("GET /api/products/1/reviews - Lấy đánh giá sản phẩm 1", async () => {
    const res = await request("GET", "/api/products/1/reviews");
    if (res.status !== 200 || !Array.isArray(res.data?.reviews)) throw new Error("Lỗi lấy reviews");
    return { status: res.status, detail: `Có ${res.data.total} đánh giá, Điểm TB: ${res.data.averageRating}` };
  });

  // 5. Auth Flow - Customer
  const testEmail = `test_${Date.now()}@test.com`;
  await runTest("POST /api/auth/register - Đăng ký tài khoản mới", async () => {
    const res = await request("POST", "/api/auth/register", {
      name: "Khách Hàng Test",
      email: testEmail,
      password: "password123",
      confirmPassword: "password123",
    });
    if (res.status !== 201) throw new Error(res.data?.message || "Đăng ký thất bại");
    return { status: res.status };
  });

  await runTest("POST /api/auth/login - Đăng nhập tài khoản khách", async () => {
    const res = await request("POST", "/api/auth/login", {
      email: testEmail,
      password: "password123",
    });
    if (res.status !== 200) throw new Error(res.data?.message || "Đăng nhập thất bại");
    userCookie = res.setCookie || "";
    return { status: res.status };
  });

  await runTest("GET /api/auth/me - Lấy thông tin user hiện tại (xác thực cookie)", async () => {
    const res = await request("GET", "/api/auth/me", null, userCookie);
    if (res.status !== 200 || !res.data?.user || res.data.user.email !== testEmail) {
      throw new Error("Không nhận diện được phiên đăng nhập của user");
    }
    return { status: res.status };
  });

  await runTest("PUT /api/auth/me - Cập nhật tên hồ sơ", async () => {
    const res = await request("PUT", "/api/auth/me", { name: "Khách Hàng VIP Đã Cập Nhật" }, userCookie);
    if (res.status !== 200 || res.data?.user?.name !== "Khách Hàng VIP Đã Cập Nhật") {
      throw new Error("Cập nhật thông tin thất bại");
    }
    return { status: res.status };
  });

  // 6. Reviews Flow
  await runTest("POST /api/products/1/reviews - Gửi nhận xét và đánh giá 5 sao", async () => {
    const res = await request(
      "POST",
      "/api/products/1/reviews",
      { rating: 5, comment: "Sản phẩm dùng rất thích, vải mịn mát!" },
      userCookie
    );
    if (res.status !== 201) throw new Error(res.data?.message || "Gửi review thất bại");
    return { status: res.status };
  });

  // 7. Cart Flow
  await runTest("POST /api/cart - Thêm sản phẩm 1 vào giỏ hàng", async () => {
    const res = await request("POST", "/api/cart", { productId: 1, quantity: 2 }, userCookie);
    if (res.status !== 200) throw new Error(res.data?.message || "Thêm giỏ hàng thất bại");
    return { status: res.status };
  });

  await runTest("GET /api/cart - Xem giỏ hàng", async () => {
    const res = await request("GET", "/api/cart", null, userCookie);
    if (res.status !== 200 || !res.data?.items?.length) throw new Error("Giỏ hàng rỗng");
    return { status: res.status, detail: `Tổng tiền: ${res.data.totalAmount?.toLocaleString()}₫` };
  });

  await runTest("GET /api/cart/count - Đếm số lượng sản phẩm giỏ hàng", async () => {
    const res = await request("GET", "/api/cart/count", null, userCookie);
    if (res.status !== 200 || res.data?.count <= 0) throw new Error("Lỗi đếm giỏ hàng");
    return { status: res.status, detail: `Số lượng: ${res.data.count}` };
  });

  await runTest("PUT /api/cart - Cập nhật số lượng sản phẩm", async () => {
    const res = await request("PUT", "/api/cart", { productId: 1, quantity: 1 }, userCookie);
    if (res.status !== 200) throw new Error(res.data?.message || "Lỗi cập nhật giỏ hàng");
    return { status: res.status };
  });

  // 8. Coupon Flow
  await runTest("POST /api/coupons/apply - Áp dụng mã giảm giá 'GIAM10'", async () => {
    const res = await request("POST", "/api/coupons/apply", { code: "GIAM10", totalAmount: 300000 }, userCookie);
    if (res.status !== 200 || !res.data?.valid) throw new Error(res.data?.message || "Mã không hợp lệ");
    return { status: res.status, detail: `Giảm: ${res.data.discountAmount?.toLocaleString()}₫` };
  });

  // 9. Checkout & Order Flow
  await runTest("POST /api/checkout - Đặt hàng với Coupon 'GIAM10'", async () => {
    const res = await request(
      "POST",
      "/api/checkout",
      {
        customerName: "Nguyễn Văn Test",
        customerPhone: "0987654321",
        address: "123 Đường Test, Quận 1, TP.HCM",
        paymentMethod: "COD",
        couponCode: "GIAM10",
      },
      userCookie
    );
    if (res.status !== 200 || !res.data?.orderId) throw new Error(res.data?.message || "Đặt hàng thất bại");
    createdOrderId = res.data.orderId;
    return { status: res.status, detail: `Mã đơn: ${res.data.orderNumber}` };
  });

  await runTest("GET /api/orders - Xem danh sách đơn hàng đã đặt", async () => {
    const res = await request("GET", "/api/orders", null, userCookie);
    if (res.status !== 200 || !res.data?.orders?.length) throw new Error("Không thấy đơn hàng vừa đặt");
    return { status: res.status };
  });

  await runTest(`GET /api/orders/${createdOrderId} - Xem chi tiết đơn hàng`, async () => {
    const res = await request("GET", `/api/orders/${createdOrderId}`, null, userCookie);
    if (res.status !== 200 || !res.data?.order) throw new Error("Không lấy được chi tiết đơn hàng");
    return { status: res.status };
  });

  await runTest(`PUT /api/orders/${createdOrderId} - Khách tự hủy đơn hàng`, async () => {
    const res = await request("PUT", `/api/orders/${createdOrderId}`, { action: "cancel" }, userCookie);
    if (res.status !== 200) throw new Error(res.data?.message || "Hủy đơn hàng thất bại");
    return { status: res.status };
  });

  // 10. Admin Flow
  await runTest("POST /api/auth/login - Đăng nhập tài khoản Admin (admin@simpleshop.com)", async () => {
    const res = await request("POST", "/api/auth/login", {
      email: "admin@simpleshop.com",
      password: "admin123",
    });
    if (res.status !== 200 || res.data?.user?.role !== "ADMIN") throw new Error("Đăng nhập Admin thất bại");
    adminCookie = res.setCookie || "";
    return { status: res.status };
  });

  await runTest("GET /api/admin/dashboard - Thống kê Dashboard & Doanh thu 12 tháng", async () => {
    const res = await request("GET", "/api/admin/dashboard", null, adminCookie);
    if (res.status !== 200 || !res.data?.monthlyRevenue) throw new Error("Lỗi lấy dashboard admin");
    return {
      status: res.status,
      detail: `SP: ${res.data.totalProducts}, User: ${res.data.totalUsers}, Đơn: ${res.data.totalOrders}`,
    };
  });

  await runTest("GET /api/admin/orders - Admin xem tất cả đơn hàng", async () => {
    const res = await request("GET", "/api/admin/orders", null, adminCookie);
    if (res.status !== 200 || !Array.isArray(res.data?.orders)) throw new Error("Lỗi admin lấy đơn hàng");
    return { status: res.status };
  });

  await runTest("GET /api/admin/users - Admin xem danh sách người dùng", async () => {
    const res = await request("GET", "/api/admin/users", null, adminCookie);
    if (res.status !== 200 || !Array.isArray(res.data?.users)) throw new Error("Lỗi admin lấy danh sách user");
    return { status: res.status, detail: `Tổng: ${res.data.pagination?.total} người dùng` };
  });

  await runTest("POST /api/admin/coupons - Admin tạo mã giảm giá 'TEST50'", async () => {
    const res = await request(
      "POST",
      "/api/admin/coupons",
      {
        code: "TEST50",
        discount: 50000,
        isPercent: false,
        minAmount: 200000,
      },
      adminCookie
    );
    if (res.status !== 201) throw new Error(res.data?.message || "Tạo coupon thất bại");
    createdCouponId = res.data?.coupon?.id;
    return { status: res.status };
  });

  await runTest(`DELETE /api/admin/coupons/${createdCouponId} - Admin xóa mã 'TEST50'`, async () => {
    const res = await request("DELETE", `/api/admin/coupons/${createdCouponId}`, null, adminCookie);
    if (res.status !== 200) throw new Error(res.data?.message || "Xóa coupon thất bại");
    return { status: res.status };
  });

  await runTest("POST /api/products - Admin tạo sản phẩm mới", async () => {
    const res = await request(
      "POST",
      "/api/products",
      {
        name: "Áo Polo Nam Kiểm Thử API",
        description: "Chất liệu cotton cao cấp, thấm hút mồ hôi tốt.",
        price: 250000,
        oldPrice: 350000,
        stock: 50,
        image: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=500",
        categoryId: 1,
        isFeatured: true,
      },
      adminCookie
    );
    if (res.status !== 201 || !res.data?.product?.id) throw new Error(res.data?.message || "Tạo SP thất bại");
    createdProductId = res.data.product.id;
    return { status: res.status };
  });

  await runTest(`PUT /api/products/${createdProductId} - Admin cập nhật sản phẩm`, async () => {
    const res = await request(
      "PUT",
      `/api/products/${createdProductId}`,
      {
        price: 280000,
        stock: 45,
      },
      adminCookie
    );
    if (res.status !== 200) throw new Error(res.data?.message || "Cập nhật SP thất bại");
    return { status: res.status };
  });

  await runTest(`DELETE /api/products/${createdProductId} - Admin xóa sản phẩm kiểm thử`, async () => {
    const res = await request("DELETE", `/api/products/${createdProductId}`, null, adminCookie);
    if (res.status !== 200) throw new Error(res.data?.message || "Xóa SP thất bại");
    return { status: res.status };
  });

  // 11. Logout
  await runTest("POST /api/auth/logout - Đăng xuất tài khoản", async () => {
    const res = await request("POST", "/api/auth/logout", null, adminCookie);
    if (res.status !== 200) throw new Error("Đăng xuất thất bại");
    return { status: res.status };
  });

  // Summary
  console.log("\n=================================================");
  console.log("📊 TỔNG KẾT KẾT QUẢ KIỂM THỬ API");
  console.log("=================================================");
  const total = testResults.length;
  const passed = testResults.filter((r) => r.status === "PASS").length;
  const failed = testResults.filter((r) => r.status === "FAIL").length;

  console.log(`Tổng số API đã test: ${total}`);
  console.log(`✅ Thành công (PASS) : ${passed}/${total}`);
  console.log(`❌ Thất bại (FAIL)   : ${failed}/${total}`);
  if (failed === 0) {
    console.log("\n🎉 CHÚC MỪNG: 100% TẤT CẢ CÁC API HOẠT ĐỘNG HOÀN HẢO!");
  }
}

main().catch(console.error);
