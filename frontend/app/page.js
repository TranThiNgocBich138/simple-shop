"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

function formatPrice(price) {
  return new Intl.NumberFormat("vi-VN").format(price) + "₫";
}

export default function Home() {
  const router = useRouter();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [liked, setLiked] = useState([]);
  const [user, setUser] = useState(null);
  const [showAccount, setShowAccount] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [addingId, setAddingId] = useState(null);
  const [notification, setNotification] = useState("");

  useEffect(() => {
    async function init() {
      try {
        // Fetch current logged in user
        const userRes = await fetch("/api/auth/me", { cache: "no-store" });
        const userData = await userRes.json();
        setUser(userData.user);

        // Fetch categories
        const catRes = await fetch("/api/categories", { cache: "no-store" });
        if (catRes.ok) {
          const cData = await catRes.json();
          setCategories(cData.categories || []);
        }

        // Fetch cart count if logged in
        if (userData.user) {
          const cartRes = await fetch("/api/cart", { cache: "no-store" });
          if (cartRes.ok) {
            const cartData = await cartRes.json();
            const totalQty = (cartData.items || []).reduce((sum, item) => sum + item.quantity, 0);
            setCartCount(totalQty);
          }
        }

        // Check URL parameters for category or search
        if (typeof window !== "undefined") {
          const urlParams = new URLSearchParams(window.location.search);
          const catParam = urlParams.get("categoryId");
          const searchParam = urlParams.get("search");
          if (catParam) setSelectedCategory(Number(catParam));
          if (searchParam) setSearchQuery(searchParam);
        }
      } catch (err) {
        console.error("HOME_INIT_ERROR:", err);
      }
    }

    init();
  }, []);

  // Load products based on filter
  useEffect(() => {
    async function loadProducts() {
      try {
        setLoadingProducts(true);
        let url = "/api/products?";
        if (searchQuery) url += `search=${encodeURIComponent(searchQuery)}&`;
        if (selectedCategory) url += `categoryId=${selectedCategory}&`;

        const res = await fetch(url, { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setProducts(data.products || []);
        }
      } catch (err) {
        console.error("LOAD_PRODUCTS_ERROR:", err);
      } finally {
        setLoadingProducts(false);
      }
    }

    const timer = setTimeout(() => {
      loadProducts();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory]);

  // Thêm vào giỏ hàng
  async function handleAddToCart(productId) {
    if (!user) {
      router.push("/login?redirect=/");
      return;
    }

    try {
      setAddingId(productId);
      setNotification("");

      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity: 1 }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Không thể thêm sản phẩm.");
        return;
      }

      setCartCount((prev) => prev + 1);
      setNotification("Đã thêm 1 sản phẩm vào giỏ hàng!");
      setTimeout(() => setNotification(""), 3000);
    } catch (err) {
      console.error(err);
      alert("Có lỗi xảy ra khi thêm vào giỏ hàng.");
    } finally {
      setAddingId(null);
    }
  }

  // Like sản phẩm
  function toggleLike(id) {
    setLiked((items) =>
      items.includes(id) ? items.filter((item) => item !== id) : [...items, id]
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
      setCartCount(0);
      window.location.href = "/";
    } catch (error) {
      console.error("LOGOUT_ERROR:", error);
    }
  }

  return (
    <main className="min-h-screen bg-[#f8faff] text-slate-900">
      {/* NOTIFICATION TOAST */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl bg-slate-950 px-6 py-4 font-bold text-white shadow-2xl transition animate-bounce">
          🛒 {notification}
        </div>
      )}

      {/* TOP BAR */}
      <div className="bg-blue-700 px-4 py-2 text-center text-xs font-medium text-white">
        🚚 Miễn phí vận chuyển cho đơn hàng từ 500.000₫
      </div>

      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-blue-100 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center gap-6 px-5 py-4 lg:px-8">
          {/* LOGO */}
          <Link href="/" className="flex shrink-0 items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-xl font-black text-white shadow-lg shadow-blue-200">
              S
            </div>
            <div>
              <div className="text-lg font-black tracking-tight">SIMPLE</div>
              <div className="-mt-1 text-[10px] font-bold tracking-[0.25em] text-blue-600">
                SHOP
              </div>
            </div>
          </Link>

          {/* NAV */}
          <nav className="hidden items-center gap-7 text-sm font-semibold lg:flex">
            <a className="text-blue-600 font-bold" href="#">
              Trang chủ
            </a>
            <a className="transition hover:text-blue-600" href="#products">
              Sản phẩm
            </a>
            <a className="transition hover:text-blue-600" href="#categories">
              Danh mục
            </a>
            <a className="transition hover:text-blue-600" href="#about">
              Về chúng tôi
            </a>
          </nav>

          {/* SEARCH */}
          <div className="ml-auto hidden max-w-xs flex-1 md:block">
            <div className="flex items-center gap-3 rounded-2xl bg-slate-100 px-4 py-3">
              <span className="text-slate-400">⌕</span>
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                placeholder="Tìm kiếm sản phẩm..."
              />
            </div>
          </div>

          {/* GIỎ HÀNG */}
          <Link
            href="/cart"
            className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-lg shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            🛒
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-bold text-white">
                {cartCount}
              </span>
            )}
          </Link>

          {/* ACCOUNT */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowAccount((value) => !value)}
                className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm transition hover:border-blue-300 hover:shadow-md"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-black text-blue-600">
                  {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                </div>
                <div className="hidden text-left sm:block">
                  <p className="max-w-[130px] truncate text-sm font-bold text-slate-900">
                    {user.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {user.role === "ADMIN" ? "Quản trị viên" : "Khách hàng"}
                  </p>
                </div>
                <span className={`text-xs transition ${showAccount ? "rotate-180" : ""}`}>
                  ▼
                </span>
              </button>

              {showAccount && (
                <div className="absolute right-0 top-14 z-[100] w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                  <div className="border-b border-slate-100 bg-slate-50 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-lg font-black text-blue-600">
                        {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-bold text-slate-900">{user.name}</p>
                        <p className="truncate text-sm text-slate-500">{user.email}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-2">
                    {user.role === "ADMIN" && (
                      <Link
                        href="/admin"
                        onClick={() => setShowAccount(false)}
                        className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-bold text-blue-600 transition hover:bg-blue-50"
                      >
                        ⚡ <span>Trang Quản trị (Admin)</span>
                      </Link>
                    )}

                    <Link
                      href="/orders"
                      onClick={() => setShowAccount(false)}
                      className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition hover:bg-blue-50 hover:text-blue-600"
                    >
                      📦 <span>Đơn hàng của tôi</span>
                    </Link>

                    <button
                      onClick={handleLogout}
                      className="mt-1 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-bold text-red-600 transition hover:bg-red-50"
                    >
                      🚪 <span>Đăng xuất</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-200 transition hover:-translate-y-0.5 hover:bg-blue-700"
            >
              Đăng nhập
            </Link>
          )}
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute -left-32 top-10 h-72 w-72 rounded-full bg-blue-400/15 blur-3xl" />
        <div className="absolute -right-20 bottom-0 h-96 w-96 rounded-full bg-indigo-400/15 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 lg:grid-cols-2 lg:px-8 lg:py-24">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-4 py-2 text-xs font-bold text-blue-700 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-blue-500" />
              Bộ sưu tập mới 2026
            </div>

            <h1 className="max-w-3xl text-5xl font-black leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
              Mua sắm
              <br />
              <span className="bg-gradient-to-r from-blue-600 via-indigo-500 to-violet-500 bg-clip-text text-transparent">
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
                className="rounded-2xl bg-blue-600 px-7 py-4 text-sm font-bold text-white shadow-xl shadow-blue-200 transition hover:-translate-y-1 hover:bg-blue-700"
              >
                Khám phá sản phẩm →
              </a>
              <a
                href="#categories"
                className="rounded-2xl border border-slate-200 bg-white px-7 py-4 text-sm font-bold shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:text-blue-600"
              >
                Khám phá danh mục
              </a>
            </div>
          </div>

          <div className="relative">
            <div className="overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-blue-100 to-indigo-100 p-3 shadow-2xl shadow-blue-200/50">
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

      {/* CATEGORIES */}
      <section id="categories" className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
        <div className="mb-10 flex items-end justify-between gap-5">
          <div>
            <div className="mb-3 text-sm font-bold uppercase tracking-widest text-blue-600">
              Khám phá
            </div>
            <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
              Mua sắm theo danh mục
            </h2>
          </div>
          {selectedCategory && (
            <button
              onClick={() => setSelectedCategory(null)}
              className="text-sm font-bold text-slate-500 hover:text-blue-600"
            >
              ✕ Tất cả danh mục
            </button>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => {
            const isSelected = selectedCategory === category.id;
            return (
              <div
                key={category.id}
                onClick={() => setSelectedCategory(isSelected ? null : category.id)}
                className={`group cursor-pointer overflow-hidden rounded-3xl border p-6 shadow-sm transition duration-300 hover:-translate-y-1 ${
                  isSelected
                    ? "border-blue-600 bg-blue-600 text-white shadow-blue-200"
                    : "border-slate-200 bg-white hover:border-blue-200 hover:shadow-xl hover:shadow-blue-100/50"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-2xl text-2xl ${
                      isSelected ? "bg-white/20 text-white" : "bg-slate-950 text-white group-hover:bg-blue-600"
                    }`}
                  >
                    {category.icon || "✦"}
                  </div>
                  <span className={`text-2xl ${isSelected ? "text-white" : "text-slate-300 group-hover:text-blue-400"}`}>
                    ↗
                  </span>
                </div>
                <h3 className="mt-7 text-lg font-black">{category.name}</h3>
                <p className={`mt-1 text-sm ${isSelected ? "text-blue-200" : "text-slate-400"}`}>
                  {category._count?.products || 0} sản phẩm
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* PRODUCTS */}
      <section id="products" className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-5">
            <div>
              <div className="mb-3 text-sm font-bold uppercase tracking-widest text-blue-600">
                Được yêu thích
              </div>
              <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
                Sản phẩm nổi bật
              </h2>
            </div>

            {/* SEARCH INPUT ON MOBILE / TABLET */}
            <div className="w-full max-w-xs md:hidden">
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-2xl bg-slate-100 px-4 py-3 text-sm outline-none placeholder:text-slate-400"
                placeholder="Tìm kiếm sản phẩm..."
              />
            </div>
          </div>

          {loadingProducts ? (
            <div className="py-20 text-center text-slate-500">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
              <p className="mt-3 font-semibold">Đang tải sản phẩm...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="py-16 text-center text-slate-400 font-semibold">
              Không tìm thấy sản phẩm phù hợp.
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {products.map((product) => (
                <article
                  key={product.id}
                  className="group overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white transition duration-300 hover:-translate-y-2 hover:border-blue-200 hover:shadow-2xl hover:shadow-blue-100 flex flex-col justify-between"
                >
                  <div className="relative overflow-hidden bg-slate-100 h-72">
                    <Link href={`/products/${product.id}`} className="block h-full w-full">
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-cover transition duration-500 group-hover:scale-110"
                      />
                    </Link>

                    {product.badge && (
                      <div className="absolute left-4 top-4 rounded-full bg-slate-950 px-3 py-1.5 text-[11px] font-bold text-white pointer-events-none">
                        {product.badge}
                      </div>
                    )}

                    <button
                      onClick={() => toggleLike(product.id)}
                      className={`absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-lg shadow-lg backdrop-blur transition hover:scale-110 ${
                        liked.includes(product.id) ? "text-blue-600" : "text-slate-600"
                      }`}
                    >
                      {liked.includes(product.id) ? "♥" : "♡"}
                    </button>

                    <div className="absolute bottom-4 left-4 right-4 translate-y-16 flex gap-2 opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                      <button
                        onClick={() => handleAddToCart(product.id)}
                        disabled={addingId === product.id || product.stock <= 0}
                        className="flex-1 rounded-xl bg-blue-600 py-3 text-xs font-bold text-white shadow-xl transition hover:bg-blue-700 disabled:opacity-60"
                      >
                        {addingId === product.id
                          ? "Đang thêm..."
                          : product.stock <= 0
                          ? "Hết hàng"
                          : "+ Giỏ hàng"}
                      </button>
                      <Link
                        href={`/products/${product.id}`}
                        className="flex items-center justify-center rounded-xl bg-white/95 px-3.5 py-3 text-xs font-bold text-slate-900 shadow-xl backdrop-blur transition hover:bg-blue-50 hover:text-blue-600"
                      >
                        Chi tiết
                      </Link>
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="text-xs font-semibold text-blue-600">
                        {product.category?.name || "Danh mục"}
                      </div>
                      <Link href={`/products/${product.id}`}>
                        <h3 className="mt-2 font-black text-slate-900 hover:text-blue-600 transition line-clamp-1">{product.name}</h3>
                      </Link>
                      <div className="mt-3 flex items-center gap-2 text-xs">
                        <span className="font-bold text-amber-500">★ {product.rating || 5.0}</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-400">Đã bán {product.sold || 0}</span>
                      </div>
                    </div>

                    <div className="mt-4 flex items-end justify-between">
                      <div className="flex items-end gap-2">
                        <span className="text-lg font-black text-blue-600">
                          {formatPrice(product.price)}
                        </span>
                        {product.oldPrice && (
                          <span className="text-xs text-slate-400 line-through">
                            {formatPrice(product.oldPrice)}
                          </span>
                        )}
                      </div>
                      <Link
                        href={`/products/${product.id}`}
                        className="text-xs font-bold text-slate-400 hover:text-blue-600 transition"
                      >
                        Xem →
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-950 text-white">
        <div className="mx-auto max-w-7xl px-5 py-14 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 font-black">
                S
              </div>
              <span className="font-black">SIMPLE SHOP</span>
            </div>
            <p className="text-xs text-slate-400">© 2026 Simple Shop. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}