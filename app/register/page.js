"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [terms, setTerms] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName || !trimmedEmail || !password || !confirmPassword) {
      setError("Vui lòng nhập đầy đủ thông tin.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError("Địa chỉ email không hợp lệ (ví dụ: user@example.com).");
      return;
    }

    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    if (password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }

    if (!terms) {
      setError("Vui lòng đồng ý với điều khoản sử dụng.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: trimmedName,
          email: trimmedEmail,
          password,
          confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Đăng ký thất bại.");
        return;
      }

      setSuccess("Đăng ký thành công! Đang chuyển đến trang đăng nhập...");

      setTimeout(() => {
        router.push("/login");
      }, 1200);
    } catch (err) {
      console.error("REGISTER_SUBMIT_ERROR:", err);
      setError("Không thể kết nối đến máy chủ.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f8fc]">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-violet-300/20 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-indigo-300/20 blur-3xl" />
      </div>

      <div className="relative flex min-h-screen items-center justify-center px-5 py-10">
        <div className="grid w-full max-w-6xl overflow-hidden rounded-[2rem] bg-white shadow-2xl shadow-slate-200/70 lg:grid-cols-2">

          {/* LEFT */}
          <div className="relative hidden overflow-hidden bg-slate-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
            <div className="absolute -right-32 -top-32 h-80 w-80 rounded-full bg-violet-600/40 blur-3xl" />
            <div className="absolute -bottom-40 -left-20 h-96 w-96 rounded-full bg-indigo-600/30 blur-3xl" />

            <div className="relative z-10">
              <Link href="/" className="inline-flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-500 text-xl font-black shadow-lg">
                  S
                </div>

                <div>
                  <div className="text-lg font-black tracking-tight">
                    SIMPLE
                  </div>
                  <div className="-mt-1 text-[10px] font-bold tracking-[0.25em] text-violet-300">
                    SHOP
                  </div>
                </div>
              </Link>
            </div>

            <div className="relative z-10">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-violet-200">
                <span className="h-2 w-2 rounded-full bg-violet-400" />
                Join Simple Shop
              </div>

              <h1 className="max-w-md text-5xl font-black leading-[1.05]">
                Tạo tài khoản.
                <br />
                <span className="text-violet-400">
                  Bắt đầu mua sắm.
                </span>
              </h1>

              <p className="mt-6 max-w-md leading-7 text-slate-400">
                Tạo tài khoản miễn phí để lưu sản phẩm yêu thích,
                theo dõi đơn hàng và có trải nghiệm mua sắm tốt hơn.
              </p>

              <div className="mt-10 space-y-4 text-sm">
                {[
                  "Theo dõi đơn hàng dễ dàng",
                  "Lưu sản phẩm yêu thích",
                  "Nhận ưu đãi dành riêng cho thành viên",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-500/20 text-violet-300">
                      ✓
                    </div>
                    <span className="text-slate-300">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative z-10 text-xs text-slate-600">
              © 2026 Simple Shop
            </div>
          </div>

          {/* RIGHT */}
          <div className="flex items-center justify-center p-7 sm:p-12 lg:p-16">
            <div className="w-full max-w-md">

              {/* Mobile logo */}
              <div className="mb-10 lg:hidden">
                <Link href="/" className="inline-flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 font-black text-white">
                    S
                  </div>

                  <div>
                    <div className="font-black">SIMPLE</div>
                    <div className="-mt-1 text-[9px] font-bold tracking-[0.25em] text-violet-600">
                      SHOP
                    </div>
                  </div>
                </Link>
              </div>

              <p className="text-sm font-bold text-violet-600">
                THÀNH VIÊN MỚI
              </p>

              <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
                Tạo tài khoản
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                Điền thông tin bên dưới để bắt đầu.
              </p>

              <form onSubmit={handleSubmit} className="mt-8 space-y-4">

                {/* Name */}
                <div>
                  <label className="mb-2 block text-sm font-bold">
                    Họ và tên
                  </label>

                  <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 transition focus-within:border-violet-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-violet-100">
                    <span className="text-lg text-slate-400">👤</span>

                    <input
                      type="text"
                      placeholder="Nguyễn Văn A"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="mb-2 block text-sm font-bold">
                    Email
                  </label>

                  <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 transition focus-within:border-violet-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-violet-100">
                    <span className="text-lg text-slate-400">✉</span>

                    <input
                      type="email"
                      placeholder="example@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="mb-2 block text-sm font-bold">
                    Mật khẩu
                  </label>

                  <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 transition focus-within:border-violet-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-violet-100">
                    <span className="text-lg text-slate-400">🔒</span>

                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Ít nhất 6 ký tự"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-xs font-bold text-slate-400 hover:text-violet-600"
                    >
                      {showPassword ? "Ẩn" : "Hiện"}
                    </button>
                  </div>
                </div>

                {/* Confirm */}
                <div>
                  <label className="mb-2 block text-sm font-bold">
                    Xác nhận mật khẩu
                  </label>

                  <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 transition focus-within:border-violet-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-violet-100">
                    <span className="text-lg text-slate-400">🔑</span>

                    <input
                      type={showConfirm ? "text" : "password"}
                      placeholder="Nhập lại mật khẩu"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                    />

                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="text-xs font-bold text-slate-400 hover:text-violet-600"
                    >
                      {showConfirm ? "Ẩn" : "Hiện"}
                    </button>
                  </div>
                </div>

                {/* Terms */}
                <div className="flex items-start gap-3 pt-1">
                  <input
                    id="terms"
                    type="checkbox"
                    checked={terms}
                    onChange={(e) => setTerms(e.target.checked)}
                    className="mt-1 h-4 w-4 accent-violet-600 cursor-pointer"
                  />

                  <label
                    htmlFor="terms"
                    className="text-xs leading-5 text-slate-500 cursor-pointer"
                  >
                    Tôi đồng ý với điều khoản sử dụng và chính sách
                    bảo mật của Simple Shop.
                  </label>
                </div>

                {/* Error */}
                {error && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                    {error}
                  </div>
                )}

                {/* Success */}
                {success && (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-600">
                    {success}
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 w-full rounded-2xl bg-slate-950 py-4 text-sm font-black text-white shadow-xl shadow-slate-200 transition duration-300 hover:-translate-y-0.5 hover:bg-violet-600 hover:shadow-violet-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Đang tạo tài khoản..." : "Tạo tài khoản →"}
                </button>
              </form>

              <p className="mt-7 text-center text-sm text-slate-500">
                Đã có tài khoản?{" "}
                <Link
                  href="/login"
                  className="font-black text-violet-600 hover:text-violet-800"
                >
                  Đăng nhập
                </Link>
              </p>

              <div className="mt-4 text-center">
                <Link
                  href="/"
                  className="text-xs font-semibold text-slate-400 hover:text-violet-600"
                >
                  ← Quay lại cửa hàng
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}