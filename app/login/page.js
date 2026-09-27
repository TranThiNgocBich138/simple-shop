"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams ? searchParams.get("redirect") : null;

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");

    if (!email.trim() || !password) {
      setError("Vui lòng nhập email và mật khẩu.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Email hoặc mật khẩu không đúng.");
        return;
      }

      // Redirect based on role or searchParam
      if (redirectParam) {
        router.replace(redirectParam);
      } else if (data.user?.role === "ADMIN") {
        router.replace("/admin");
      } else {
        router.replace("/");
      }

      router.refresh();
    } catch (err) {
      console.error("LOGIN_ERROR:", err);
      setError("Không kết nối được với máy chủ.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      {/* MOBILE LOGO */}
      <div className="mb-10 lg:hidden">
        <Link href="/" className="inline-flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 font-black text-white shadow-lg">
            S
          </div>
          <div>
            <div className="font-black tracking-tight">SIMPLE</div>
            <div className="-mt-1 text-[9px] font-bold tracking-[0.25em] text-violet-600">
              SHOP
            </div>
          </div>
        </Link>
      </div>

      {/* TITLE */}
      <div>
        <p className="text-sm font-bold text-violet-600">TÀI KHOẢN</p>
        <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
          Đăng nhập
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          Đăng nhập vào tài khoản để tiếp tục.
        </p>
      </div>

      {/* FORM */}
      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        {/* EMAIL */}
        <div>
          <label className="mb-2 block text-sm font-bold">Email</label>
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 transition focus-within:border-violet-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-violet-100">
            <span className="text-lg text-slate-400">✉</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="example@email.com"
              autoComplete="email"
              className="h-14 w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* PASSWORD */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm font-bold">Mật khẩu</label>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 transition focus-within:border-violet-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-violet-100">
            <span className="text-lg text-slate-400">🔒</span>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Nhập mật khẩu"
              autoComplete="current-password"
              className="h-14 w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="text-sm text-slate-400 transition hover:text-violet-600 font-semibold"
            >
              {showPassword ? "Ẩn" : "Hiện"}
            </button>
          </div>
        </div>

        {/* ERROR */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
            {error}
          </div>
        )}

        {/* SUBMIT */}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-slate-950 py-4 text-sm font-black text-white shadow-xl shadow-slate-200 transition duration-300 hover:-translate-y-0.5 hover:bg-violet-600 hover:shadow-violet-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Đang đăng nhập..." : "Đăng nhập →"}
        </button>
      </form>

      {/* REGISTER */}
      <p className="mt-8 text-center text-sm text-slate-500">
        Chưa có tài khoản?{" "}
        <Link
          href="/register"
          className="font-black text-violet-600 hover:text-violet-800"
        >
          Đăng ký ngay
        </Link>
      </p>

      {/* BACK */}
      <div className="mt-5 text-center">
        <Link
          href="/"
          className="text-xs font-semibold text-slate-400 transition hover:text-violet-600"
        >
          ← Quay lại cửa hàng
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[#f7f8fc]">
      {/* BACKGROUND */}
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
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-500 text-xl font-black shadow-lg shadow-violet-900/50">
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
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-violet-200 backdrop-blur">
                <span className="h-2 w-2 rounded-full bg-violet-400" />
                Welcome back
              </div>

              <h1 className="max-w-md text-5xl font-black leading-[1.05]">
                Chào mừng bạn
                <br />
                <span className="text-violet-400">quay trở lại.</span>
              </h1>

              <p className="mt-6 max-w-md leading-7 text-slate-400">
                Đăng nhập để tiếp tục mua sắm và quản lý đơn hàng của bạn trên Simple Shop.
              </p>

              <div className="mt-10 flex gap-8">
                <div>
                  <div className="text-2xl font-black">10K+</div>
                  <div className="mt-1 text-xs text-slate-500">Khách hàng</div>
                </div>
                <div>
                  <div className="text-2xl font-black">500+</div>
                  <div className="mt-1 text-xs text-slate-500">Sản phẩm</div>
                </div>
                <div>
                  <div className="text-2xl font-black">4.9</div>
                  <div className="mt-1 text-xs text-slate-500">Đánh giá</div>
                </div>
              </div>
            </div>

            <div className="relative z-10 text-xs text-slate-600">
              © 2026 Simple Shop
            </div>
          </div>

          {/* RIGHT */}
          <div className="flex items-center justify-center p-7 sm:p-12 lg:p-16">
            <Suspense fallback={<div>Đang tải...</div>}>
              <LoginForm />
            </Suspense>
          </div>
        </div>
      </div>
    </main>
  );
}