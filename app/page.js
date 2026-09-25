"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";

const products = [
  {
    id: 1,
    name: "Áo thun Essential",
    category: "Thời trang",
    price: 189000,
    oldPrice: 249000,
    rating: 4.9,
    sold: 128,
    image:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80",
    badge: "Bán chạy",
  },
  {
    id: 2,
    name: "Sneaker Urban White",
    category: "Giày dép",
    price: 649000,
    oldPrice: 799000,
    rating: 4.8,
    sold: 96,
    image:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80",
    badge: "Hot",
  },
  {
    id: 3,
    name: "Túi đeo chéo Mini",
    category: "Phụ kiện",
    price: 299000,
    oldPrice: 399000,
    rating: 4.9,
    sold: 84,
    image:
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=80",
    badge: "-25%",
  },
  {
    id: 4,
    name: "Đồng hồ Minimal",
    category: "Phụ kiện",
    price: 799000,
    oldPrice: 990000,
    rating: 4.7,
    sold: 62,
    image:
      "https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=900&q=80",
    badge: "Mới",
  },
];

const categories = [
  { name: "Thời trang", icon: "✦", count: "120+ sản phẩm" },
  { name: "Giày dép", icon: "◈", count: "80+ sản phẩm" },
  { name: "Phụ kiện", icon: "◇", count: "65+ sản phẩm" },
  { name: "Đồ công nghệ", icon: "⌁", count: "45+ sản phẩm" },
];

function formatPrice(price) {
  return new Intl.NumberFormat("vi-VN").format(price) + "₫";
}

export default function Home() {
  const [cart, setCart] = useState(0);
  const [liked, setLiked] = useState([]);
  const [user, setUser] = useState(null);
  const [showAccount, setShowAccount] = useState(false);

  // Lấy tài khoản đã đăng nhập
useEffect(() => {
  async function getCurrentUser() {
    try {
      const response = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("GET_USER_ERROR:", error);
      setUser(null);
    }
  }

  getCurrentUser();
}, []);

  // Thêm giỏ hàng
  function addToCart() {
    setCart((value) => value + 1);
  }

  // Like sản phẩm
  function toggleLike(id) {
    setLiked((items) =>
      items.includes(id)
        ? items.filter((item) => item !== id)
        : [...items, id]
    );
  }

 // Đăng xuất
async function handleLogout() {
  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });

    setUser(null);
    setShowAccount(false);

    window.location.href = "/";
  } catch (error) {
    console.error("LOGOUT_ERROR:", error);
  }
}

  return (
    <main className="min-h-screen bg-[#f7f8fc] text-slate-900">
      {/* TOP BAR */}
      <div className="bg-slate-950 px-4 py-2 text-center text-xs font-medium text-white">
        🚚 Miễn phí vận chuyển cho đơn hàng từ 500.000₫
      </div>

      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center gap-6 px-5 py-4 lg:px-8">
          {/* LOGO */}
          <div className="flex shrink-0 items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-xl font-black text-white shadow-lg shadow-indigo-200">
              S
            </div>

            <div>
              <div className="text-lg font-black tracking-tight">
                SIMPLE
              </div>

              <div className="-mt-1 text-[10px] font-bold tracking-[0.25em] text-violet-600">
                SHOP
              </div>
            </div>
          </div>

          {/* NAV */}
          <nav className="hidden items-center gap-7 text-sm font-semibold lg:flex">
            <a
              className="text-violet-600"
              href="#"
            >
              Trang chủ
            </a>

            <a
              className="transition hover:text-violet-600"
              href="#products"
            >
              Sản phẩm
            </a>

            <a
              className="transition hover:text-violet-600"
              href="#categories"
            >
              Danh mục
            </a>

            <a
              className="transition hover:text-violet-600"
              href="#about"
            >
              Về chúng tôi
            </a>
          </nav>

          {/* SEARCH */}
          <div className="ml-auto hidden max-w-xs flex-1 md:block">
            <div className="flex items-center gap-3 rounded-2xl bg-slate-100 px-4 py-3">
              <span className="text-slate-400">
                ⌕
              </span>

              <input
                className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                placeholder="Tìm kiếm sản phẩm..."
              />
            </div>
          </div>

          {/* GIỎ HÀNG */}
          <button
            onClick={() =>
              alert(
                `Bạn đang có ${cart} sản phẩm trong giỏ hàng`
              )
            }
            className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-lg shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            🛒

            {cart > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-violet-600 px-1 text-[10px] font-bold text-white">
                {cart}
              </span>
            )}
          </button>

          {/* ================= ACCOUNT ================= */}
          {user ? (
            <div className="relative">
              {/* USER BUTTON */}
              <button
                onClick={() =>
                  setShowAccount((value) => !value)
                }
                className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm transition hover:border-violet-300 hover:shadow-md"
              >
                {/* AVATAR */}
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 font-black text-violet-600">
                  {user.name
                    ? user.name.charAt(0).toUpperCase()
                    : "U"}
                </div>

                {/* NAME */}
                <div className="hidden text-left sm:block">
                  <p className="max-w-[130px] truncate text-sm font-bold text-slate-900">
                    {user.name}
                  </p>

                  <p className="text-xs text-slate-500">
                    {user.role === "ADMIN"
                      ? "Quản trị viên"
                      : "Khách hàng"}
                  </p>
                </div>

                {/* ARROW */}
                <span
                  className={`text-xs transition ${
                    showAccount
                      ? "rotate-180"
                      : ""
                  }`}
                >
                  ▼
                </span>
              </button>

              {/* DROPDOWN */}
              {showAccount && (
                <div className="absolute right-0 top-14 z-[100] w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                  {/* ACCOUNT INFO */}
                  <div className="border-b border-slate-100 bg-slate-50 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 text-lg font-black text-violet-600">
                        {user.name
                          ? user.name
                              .charAt(0)
                              .toUpperCase()
                          : "U"}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate font-bold text-slate-900">
                          {user.name}
                        </p>

                        <p className="truncate text-sm text-slate-500">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* MENU */}
                  <div className="p-2">
                    <button
                      onClick={() =>
                        alert(
                          `Tài khoản: ${user.name}\nEmail: ${user.email}`
                        )
                      }
                      className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition hover:bg-violet-50 hover:text-violet-600"
                    >
                      👤
                      <span>Tài khoản của tôi</span>
                    </button>

                    <button
                      onClick={() =>
                        alert(
                          "Chức năng đơn hàng sẽ được làm tiếp."
                        )
                      }
                      className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition hover:bg-violet-50 hover:text-violet-600"
                    >
                      📦
                      <span>Đơn hàng của tôi</span>
                    </button>

                    {/* LOGOUT */}
                    <button
                      onClick={handleLogout}
                      className="mt-1 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-bold text-red-600 transition hover:bg-red-50"
                    >
                      🚪
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* CHƯA ĐĂNG NHẬP */
            <Link
              href="/login"
              className="hidden rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-slate-200 transition hover:-translate-y-0.5 hover:bg-violet-600 sm:block"
            >
              Đăng nhập
            </Link>
          )}
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute -left-32 top-10 h-72 w-72 rounded-full bg-violet-400/20 blur-3xl" />

        <div className="absolute -right-20 bottom-0 h-96 w-96 rounded-full bg-indigo-400/20 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 lg:grid-cols-2 lg:px-8 lg:py-24">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white px-4 py-2 text-xs font-bold text-violet-700 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-violet-500" />
              Bộ sưu tập mới 2026
            </div>

            <h1 className="max-w-3xl text-5xl font-black leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
              Mua sắm
              <br />

              <span className="bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-500 bg-clip-text text-transparent">
                theo cách của bạn.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-500">
              Những sản phẩm được chọn lọc dành cho phong cách sống hiện đại.
              Đẹp hơn, tiện lợi hơn và phù hợp với bạn.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href="#products"
                className="rounded-2xl bg-slate-950 px-7 py-4 text-sm font-bold text-white shadow-xl shadow-slate-300 transition hover:-translate-y-1 hover:bg-violet-600"
              >
                Khám phá sản phẩm →
              </a>

              <a
                href="#categories"
                className="rounded-2xl border border-slate-200 bg-white px-7 py-4 text-sm font-bold shadow-sm transition hover:-translate-y-1 hover:border-violet-200 hover:text-violet-600"
              >
                Xem danh mục
              </a>
            </div>

            <div className="mt-10 flex items-center gap-8 text-sm">
              <div>
                <div className="text-2xl font-black">
                  10K+
                </div>

                <div className="mt-1 text-slate-400">
                  Khách hàng
                </div>
              </div>

              <div className="h-10 w-px bg-slate-200" />

              <div>
                <div className="text-2xl font-black">
                  4.9/5
                </div>

                <div className="mt-1 text-slate-400">
                  Đánh giá
                </div>
              </div>

              <div className="h-10 w-px bg-slate-200" />

              <div>
                <div className="text-2xl font-black">
                  24/7
                </div>

                <div className="mt-1 text-slate-400">
                  Hỗ trợ
                </div>
              </div>
            </div>
          </div>

          {/* HERO IMAGE */}
          <div className="relative">
            <div className="absolute -right-4 -top-4 z-10 rounded-2xl bg-white px-4 py-3 shadow-xl">
              <div className="text-xs text-slate-400">
                Đánh giá
              </div>

              <div className="font-black">
                ★★★★★ 4.9
              </div>
            </div>

            <div className="absolute -bottom-5 -left-5 z-10 rounded-2xl bg-slate-950 px-5 py-4 text-white shadow-2xl">
              <div className="text-xs text-slate-400">
                Ưu đãi hôm nay
              </div>

              <div className="mt-1 text-xl font-black">
                Giảm đến 30%
              </div>
            </div>

            <div className="overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-violet-100 to-indigo-100 p-3 shadow-2xl shadow-indigo-200/50">
              <div className="overflow-hidden rounded-[2rem]">
                <Image
                  src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=85"
                  alt="Simple Shop"
                  width={1200}
                  height={520}
                  className="h-[520px] w-full object-cover transition duration-700 hover:scale-105"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-1 divide-y divide-slate-200 px-5 sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:px-8">
          {[
            ["🚚", "Giao hàng nhanh", "Nhận hàng toàn quốc"],
            ["✓", "Sản phẩm chất lượng", "Được kiểm tra kỹ"],
            ["↻", "Đổi trả dễ dàng", "Trong vòng 7 ngày"],
            ["♡", "Hỗ trợ tận tâm", "Luôn sẵn sàng hỗ trợ"],
          ].map(([icon, title, desc]) => (
            <div
              key={title}
              className="flex items-center gap-4 px-5 py-7"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-xl">
                {icon}
              </div>

              <div>
                <div className="font-bold">
                  {title}
                </div>

                <div className="mt-1 text-xs text-slate-400">
                  {desc}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CATEGORIES */}
      <section
        id="categories"
        className="mx-auto max-w-7xl px-5 py-20 lg:px-8"
      >
        <div className="mb-10 flex items-end justify-between gap-5">
          <div>
            <div className="mb-3 text-sm font-bold uppercase tracking-widest text-violet-600">
              Khám phá
            </div>

            <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
              Mua sắm theo danh mục
            </h2>
          </div>

          <a
            href="#products"
            className="hidden text-sm font-bold text-violet-600 sm:block"
          >
            Xem tất cả →
          </a>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => (
            <div
              key={category.name}
              className="group cursor-pointer overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-violet-200 hover:shadow-xl hover:shadow-violet-100"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-950 text-2xl text-white transition group-hover:bg-violet-600">
                  {category.icon}
                </div>

                <span className="text-2xl text-slate-300 transition group-hover:translate-x-1 group-hover:text-violet-500">
                  ↗
                </span>
              </div>

              <h3 className="mt-7 text-lg font-black">
                {category.name}
              </h3>

              <p className="mt-1 text-sm text-slate-400">
                {category.count}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* PRODUCTS */}
      <section id="products" className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="mb-10 flex items-end justify-between gap-5">
            <div>
              <div className="mb-3 text-sm font-bold uppercase tracking-widest text-violet-600">
                Được yêu thích
              </div>

              <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
                Sản phẩm nổi bật
              </h2>

              <p className="mt-3 text-slate-500">
                Những lựa chọn đang được khách hàng quan tâm nhất.
              </p>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product) => (
              <article
                key={product.id}
                className="group overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white transition duration-300 hover:-translate-y-2 hover:border-violet-200 hover:shadow-2xl hover:shadow-violet-100"
              >
                <div className="relative overflow-hidden bg-slate-100">
                  <Image
                    src={product.image}
                    alt={product.name}
                    width={900}
                    height={900}
                    className="h-72 w-full object-cover transition duration-500 group-hover:scale-110"
                  />

                  <div className="absolute left-4 top-4 rounded-full bg-slate-950 px-3 py-1.5 text-[11px] font-bold text-white">
                    {product.badge}
                  </div>

                  <button
                    onClick={() =>
                      toggleLike(product.id)
                    }
                    className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-lg shadow-lg backdrop-blur transition hover:scale-110"
                  >
                    {liked.includes(product.id)
                      ? "♥"
                      : "♡"}
                  </button>

                  <button
                    onClick={addToCart}
                    className="absolute bottom-4 left-4 right-4 translate-y-16 rounded-xl bg-slate-950 py-3 text-sm font-bold text-white opacity-0 shadow-xl transition duration-300 group-hover:translate-y-0 group-hover:opacity-100 hover:bg-violet-600"
                  >
                    + Thêm vào giỏ hàng
                  </button>
                </div>

                <div className="p-5">
                  <div className="text-xs font-semibold text-violet-600">
                    {product.category}
                  </div>

                  <h3 className="mt-2 font-black">
                    {product.name}
                  </h3>

                  <div className="mt-3 flex items-center gap-2 text-xs">
                    <span className="font-bold">
                      ★ {product.rating}
                    </span>

                    <span className="text-slate-300">
                      •
                    </span>

                    <span className="text-slate-400">
                      Đã bán {product.sold}
                    </span>
                  </div>

                  <div className="mt-4 flex items-end gap-2">
                    <span className="text-lg font-black text-violet-600">
                      {formatPrice(product.price)}
                    </span>

                    <span className="text-xs text-slate-400 line-through">
                      {formatPrice(product.oldPrice)}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* PROMO */}
      <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
        <div className="relative overflow-hidden rounded-[2rem] bg-slate-950 px-7 py-12 text-white sm:px-12">
          <div className="absolute -right-20 -top-32 h-80 w-80 rounded-full bg-violet-600/40 blur-3xl" />

          <div className="absolute -bottom-40 left-1/3 h-80 w-80 rounded-full bg-indigo-600/30 blur-3xl" />

          <div className="relative flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
            <div>
              <div className="mb-3 text-sm font-bold uppercase tracking-widest text-violet-300">
                Ưu đãi đặc biệt
              </div>

              <h2 className="max-w-2xl text-3xl font-black leading-tight sm:text-4xl">
                Giảm đến 30% cho bộ sưu tập mới
              </h2>

              <p className="mt-4 max-w-xl text-slate-400">
                Đừng bỏ lỡ những sản phẩm mới nhất. Ưu đãi có thời hạn.
              </p>
            </div>

            <button className="shrink-0 rounded-2xl bg-white px-7 py-4 text-sm font-black text-slate-950 transition hover:-translate-y-1 hover:bg-violet-500 hover:text-white">
              Mua ngay →
            </button>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section
        id="about"
        className="border-t border-slate-200 bg-[#f7f8fc]"
      >
        <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <div className="mb-3 text-sm font-bold uppercase tracking-widest text-violet-600">
                SIMPLE SHOP
              </div>

              <h2 className="text-3xl font-black leading-tight sm:text-4xl">
                Đơn giản trong trải nghiệm.
                <br />
                Khác biệt trong phong cách.
              </h2>

              <p className="mt-6 leading-8 text-slate-500">
                Simple Shop được xây dựng với mục tiêu mang đến trải nghiệm
                mua sắm trực tuyến nhanh chóng, hiện đại và dễ sử dụng.
              </p>

              <button className="mt-7 rounded-2xl bg-slate-950 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-violet-600">
                Tìm hiểu thêm
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-3xl bg-white p-7 shadow-sm">
                <div className="text-4xl font-black text-violet-600">
                  10K+
                </div>

                <div className="mt-2 font-bold">
                  Khách hàng
                </div>

                <div className="mt-1 text-sm text-slate-400">
                  Đang tin tưởng
                </div>
              </div>

              <div className="mt-8 rounded-3xl bg-slate-950 p-7 text-white shadow-xl">
                <div className="text-4xl font-black">
                  500+
                </div>

                <div className="mt-2 font-bold">
                  Sản phẩm
                </div>

                <div className="mt-1 text-sm text-slate-400">
                  Đa dạng lựa chọn
                </div>
              </div>

              <div className="rounded-3xl bg-slate-950 p-7 text-white shadow-xl">
                <div className="text-4xl font-black">
                  4.9
                </div>

                <div className="mt-2 font-bold">
                  Đánh giá
                </div>

                <div className="mt-1 text-sm text-slate-400">
                  Từ khách hàng
                </div>
              </div>

              <div className="mt-8 rounded-3xl bg-white p-7 shadow-sm">
                <div className="text-4xl font-black text-violet-600">
                  24/7
                </div>

                <div className="mt-2 font-bold">
                  Hỗ trợ
                </div>

                <div className="mt-1 text-sm text-slate-400">
                  Luôn sẵn sàng
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* NEWSLETTER */}
      <section className="bg-white">
        <div className="mx-auto max-w-3xl px-5 py-20 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100 text-2xl">
            ✉
          </div>

          <h2 className="mt-6 text-3xl font-black">
            Nhận ưu đãi mới nhất
          </h2>

          <p className="mt-3 text-slate-500">
            Đăng ký để không bỏ lỡ sản phẩm mới và chương trình khuyến mãi.
          </p>

          <div className="mx-auto mt-7 flex max-w-xl gap-3 rounded-2xl bg-slate-100 p-2">
            <input
              className="min-w-0 flex-1 bg-transparent px-4 text-sm outline-none"
              placeholder="Email của bạn..."
            />

            <button className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-violet-600">
              Đăng ký
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-950 text-white">
        <div className="mx-auto max-w-7xl px-5 py-14 lg:px-8">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 font-black">
                  S
                </div>

                <span className="font-black">
                  SIMPLE SHOP
                </span>
              </div>

              <p className="mt-5 text-sm leading-7 text-slate-400">
                Shop online hiện đại dành cho phong cách sống của bạn.
              </p>
            </div>

            <div>
              <h3 className="font-bold">
                Mua sắm
              </h3>

              <div className="mt-5 space-y-3 text-sm text-slate-400">
                <p>Thời trang</p>
                <p>Giày dép</p>
                <p>Phụ kiện</p>
                <p>Đồ công nghệ</p>
              </div>
            </div>

            <div>
              <h3 className="font-bold">
                Hỗ trợ
              </h3>

              <div className="mt-5 space-y-3 text-sm text-slate-400">
                <p>Trung tâm trợ giúp</p>
                <p>Chính sách đổi trả</p>
                <p>Chính sách giao hàng</p>
                <p>Liên hệ</p>
              </div>
            </div>

            <div>
              <h3 className="font-bold">
                Liên hệ
              </h3>

              <div className="mt-5 space-y-3 text-sm text-slate-400">
                <p>📧 support@simpleshop.vn</p>
                <p>☎ 0123 456 789</p>
                <p>📍 Việt Nam</p>
              </div>
            </div>
          </div>

          <div className="mt-12 border-t border-slate-800 pt-7 text-center text-xs text-slate-500">
            © 2026 Simple Shop. All rights reserved.
          </div>
        </div>
      </footer>
    </main>
  );
}