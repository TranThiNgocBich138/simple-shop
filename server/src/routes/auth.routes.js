const express = require("express");
const bcrypt = require("bcryptjs");
const prisma = require("../prisma");
const { signAuthToken, getAuthUser, requireAuth } = require("../middleware/auth");

const router = express.Router();

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 7 * 1000, // 7 days in ms for express
};

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const name = req.body.name?.trim();
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin (Họ tên, Email, Mật khẩu)." });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Địa chỉ email không hợp lệ." });
    }

    if (confirmPassword !== undefined && password !== confirmPassword) {
      return res.status(400).json({ message: "Mật khẩu xác nhận không khớp." });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Mật khẩu phải có ít nhất 6 ký tự." });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: "Email này đã được sử dụng. Vui lòng chọn email khác." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "USER",
      },
    });

    return res.status(201).json({
      message: "Đăng ký tài khoản thành công.",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("REGISTER_ERROR:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi đăng ký." });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password;

    if (!email || !password) {
      return res.status(400).json({ message: "Vui lòng nhập email và mật khẩu." });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: "Email hoặc mật khẩu không đúng." });
    }

    const passwordCorrect = await bcrypt.compare(password, user.password);
    if (!passwordCorrect) {
      return res.status(401).json({ message: "Email hoặc mật khẩu không đúng." });
    }

    const token = signAuthToken({ userId: user.id, role: user.role, email: user.email });

    res.cookie("auth_token", token, COOKIE_OPTIONS);
    res.cookie("userId", String(user.id), COOKIE_OPTIONS);

    return res.json({
      message: "Đăng nhập thành công.",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("LOGIN_ERROR:", error);
    return res.status(500).json({ message: "Có lỗi xảy ra khi đăng nhập." });
  }
});

// POST /api/auth/logout
router.post("/logout", (req, res) => {
  const clearOptions = { ...COOKIE_OPTIONS, maxAge: 0 };
  res.cookie("auth_token", "", clearOptions);
  res.cookie("userId", "", clearOptions);
  return res.json({ message: "Đăng xuất thành công." });
});

// GET /api/auth/me
router.get("/me", async (req, res) => {
  try {
    const user = await getAuthUser(req);
    return res.json({ user });
  } catch (error) {
    console.error("GET_ME_ERROR:", error);
    return res.status(500).json({ user: null, message: "Lỗi lấy thông tin người dùng." });
  }
});

// PUT /api/auth/me
router.put("/me", requireAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) {
      return res.status(404).json({ message: "Người dùng không tồn tại." });
    }

    const { name, currentPassword, newPassword } = req.body;

    if (name !== undefined && !name.trim()) {
      return res.status(400).json({ message: "Họ tên không được để trống." });
    }

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ message: "Vui lòng nhập mật khẩu hiện tại để đổi mật khẩu." });
      }

      const passwordCorrect = await bcrypt.compare(currentPassword, user.password);
      if (!passwordCorrect) {
        return res.status(400).json({ message: "Mật khẩu hiện tại không đúng." });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: "Mật khẩu mới phải có ít nhất 6 ký tự." });
      }
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (newPassword) updateData.password = await bcrypt.hash(newPassword, 10);

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "Không có thông tin nào để cập nhật." });
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    return res.json({
      message: "Cập nhật thông tin thành công.",
      user: updatedUser,
    });
  } catch (error) {
    console.error("UPDATE_PROFILE_ERROR:", error);
    return res.status(500).json({ message: "Lỗi khi cập nhật thông tin." });
  }
});

module.exports = router;
