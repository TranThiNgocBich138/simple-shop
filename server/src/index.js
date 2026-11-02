require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");
const swaggerUi = require("swagger-ui-express");

const swaggerSpec = require("./swagger");
const authRoutes = require("./routes/auth.routes");
const productRoutes = require("./routes/product.routes");
const categoryRoutes = require("./routes/category.routes");
const cartRoutes = require("./routes/cart.routes");
const checkoutRoutes = require("./routes/checkout.routes");
const orderRoutes = require("./routes/order.routes");
const couponRoutes = require("./routes/coupon.routes");
const uploadRoutes = require("./routes/upload.routes");
const adminRoutes = require("./routes/admin.routes");

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

// CORS Configuration
app.use(
  cors({
    origin: [CLIENT_URL, "http://localhost:3000", "http://127.0.0.1:3000"],
    credentials: true,
  })
);

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Static folder for uploaded images
const uploadDir = path.join(__dirname, "../uploads");
app.use("/uploads", express.static(uploadDir));

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Simple Shop Express API is running!",
    timestamp: new Date().toISOString(),
  });
});

// Swagger API Documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get("/api/docs/spec", (req, res) => {
  res.json(swaggerSpec);
});

// Register API Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/checkout", checkoutRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/admin", adminRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.url} không tồn tại trên server.` });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("SERVER_UNHANDLED_ERROR:", err);
  res.status(err.status || 500).json({
    message: err.message || "Lỗi máy chủ nội bộ.",
  });
});

app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🚀 Simple Shop Backend Server is running!`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`📖 Swagger API Docs: http://localhost:${PORT}/api-docs`);
  console.log(`🌐 Allowed Client Origin: ${CLIENT_URL}`);
  console.log(`===============================================`);
});
