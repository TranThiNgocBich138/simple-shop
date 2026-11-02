"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, use } from "react";
import { useRouter, useParams } from "next/navigation";

function formatPrice(price) {
  if (!price) return "0₫";
  return new Intl.NumberFormat("vi-VN").format(price) + "₫";
}

export default function ProductDetailPage({ params }) {
  const router = useRouter();
  const routeParams = useParams();
  const rawId = params?.id || routeParams?.id;
  const productId = Number(rawId);

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [user, setUser] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState(0);
  const [selectedSize, setSelectedSize] = useState("M");
  const [activeTab, setActiveTab] = useState("description");
  const [isLiked, setIsLiked] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [buyingNow, setBuyingNow] = useState(false);
  const [notification, setNotification] = useState("");
  const [showAccount, setShowAccount] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedImage, setSelectedImage] = useState("");

  // Review submission state
  const [reviewsList, setReviewsList] = useState([
    {
      id: 1,
      author: "Trần Minh Quang",
      rating: 5,
      date: "10/10/2026",
      avatar: "Q",
      comment: "Chất lượng sản phẩm trên cả tuyệt vời, đường may sắc sảo và đóng gói rất cẩn thận. Giao hàng chỉ mất 2 ngày là nhận được. Rất hài lòng!",
      verified: true,
    },
    {
      id: 2,
      author: "Nguyễn Hải Yến",
      rating: 5,
      date: "08/10/2026",
      avatar: "Y",
      comment: "Đúng như mô tả và hình ảnh mẫu. Màu sắc bên ngoài nhìn còn sang xịn hơn trên hình. Shop tư vấn nhiệt tình, 10 điểm cho chất lượng!",
      verified: true,
    },
    {
      id: 3,
      author: "Lê Hoàng Long",
      rating: 4,
      date: "03/10/2026",
      avatar: "L",
      comment: "Sản phẩm tốt, giá cả hợp lý so với thị trường. Sẽ tiếp tục ủng hộ shop các đơn hàng tiếp theo.",
      verified: true,
    },
  ]);
  const [newReviewAuthor, setNewReviewAuthor] = useState("");
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState("");
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        setLoading(true);

        // Fetch user info
        const userRes = await fetch("/api/auth/me", { cache: "no-store" });
        const userData = await userRes.json();
        setUser(userData.user);

        // Fetch cart count if logged in
        if (userData.user) {
          const cartRes = await fetch("/api/cart", { cache: "no-store" });
          if (cartRes.ok) {
            const cartData = await cartRes.json();
            const totalQty = (cartData.items || []).reduce((sum, item) => sum + item.quantity, 0);
            setCartCount(totalQty);
          }
        }

        // Fetch product details
        if (productId) {
          const prodRes = await fetch(`/api/products/${productId}`, { cache: "no-store" });
          if (prodRes.ok) {
            const prodData = await prodRes.json();
            setProduct(prodData.product);
            setSelectedImage(prodData.product.image);

            // Fetch related products in the same category
            if (prodData.product.categoryId) {
              const relRes = await fetch(`/api/products?categoryId=${prodData.product.categoryId}`, { cache: "no-store" });
              if (relRes.ok) {
                const relData = await relRes.json();
                setRelatedProducts(
                  (relData.products || []).filter((p) => p.id !== prodData.product.id).slice(0, 4)
                );
              }
            }
          }
        }
      } catch (err) {
        console.error("LOAD_PRODUCT_DETAIL_ERROR:", err);
      } finally {
        setLoading(false);
      }
    }

    if (productId) {
      init();
    }
  }, [productId]);

  // Show toast notification
  const triggerToast = (msg) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification("");
    }, 3500);
  };

  // Add to cart
  async function handleAddToCart() {
    if (!user) {
      router.push(`/login?redirect=/products/${productId}`);
      return;
    }

    if (!product || product.stock <= 0) return;

    try {
      setAddingToCart(true);
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          quantity: quantity,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        triggerToast(data.message || "Không thể thêm sản phẩm.");
        return;
      }

      setCartCount((prev) => prev + quantity);
      triggerToast(`Đã thêm ${quantity} sản phẩm vào giỏ hàng thành công! 🛒`);
    } catch (err) {
      console.error(err);
      triggerToast("Có lỗi xảy ra khi thêm vào giỏ hàng.");
    } finally {
      setAddingToCart(false);
    }
  }

  // Buy now: add to cart & redirect to checkout
  async function handleBuyNow() {
    if (!user) {
      router.push(`/login?redirect=/products/${productId}`);
      return;
    }

    if (!product || product.stock <= 0) return;

    try {
      setBuyingNow(true);
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          quantity: quantity,
        }),
      });

      if (res.ok) {
        router.push("/checkout");
      } else {
        const data = await res.json();
        triggerToast(data.message || "Có lỗi khi mua ngay.");
      }
    } catch (err) {
      console.error(err);
      triggerToast("Có lỗi xảy ra khi mua ngay.");
    } finally {
      setBuyingNow(false);
    }
  }

  // Handle Logout
  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      setUser(null);
      setShowAccount(false);
      setCartCount(0);
      router.push("/");
    } catch (error) {
      console.error("LOGOUT_ERROR:", error);
    }
  }

  // Handle Search submit
  function handleSearch(e) {
    if (e.key === "Enter" && searchQuery.trim()) {
      router.push(`/?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  }

  // Handle Add review
  function handleAddReview(e) {
    e.preventDefault();
    if (!newReviewComment.trim()) return;

    const newRev = {
      id: Date.now(),
      author: newReviewAuthor.trim() || user?.name || "Khách hàng thân thiết",
      rating: newReviewRating,
      date: new Date().toLocaleDateString("vi-VN"),
      avatar: (newReviewAuthor.trim() || user?.name || "K").charAt(0).toUpperCase(),
      comment: newReviewComment.trim(),
      verified: true,
    };

    setReviewsList([newRev, ...reviewsList]);
    setNewReviewComment("");
    setNewReviewAuthor("");
    setReviewSubmitted(true);
    triggerToast("Cảm ơn bạn đã gửi đánh giá sản phẩm! ⭐");
    setTimeout(() => setReviewSubmitted(false), 4000);
  }

  // Share link
  function handleShare() {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      triggerToast("Đã sao chép đường dẫn sản phẩm! 📋");
    }
  }

  // Variant color definitions
  const colorOptions = [
    { name: "Màu tiêu chuẩn", hex: "bg-slate-900", border: "border-slate-900" },
    { name: "Trắng tinh khôi", hex: "bg-white", border: "border-slate-300" },
    { name: "Hồng pastel", hex: "bg-blue-400", border: "border-pink-400" },
    { name: "Xám titan", hex: "bg-slate-400", border: "border-slate-400" },
  ];

  // Variant size options (if fashion or shoes)
  const isShoe = product?.category?.slug === "giay-dep";
  const sizeOptions = isShoe ? ["39", "40", "41", "42", "43"] : ["S", "M", "L", "XL", "XXL"];

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f8faff] text-slate-900">
        <div className="flex h-screen items-center justify-center flex-col">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="mt-4 font-bold text-slate-600 text-lg">Đang tải chi tiết sản phẩm...</p>
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="min-h-screen bg-[#f8faff] text-slate-900">
        <header className="sticky top-0 z-50 border-b border-blue-100 bg-white/90 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-xl font-black text-white shadow-lg shadow-blue-200">
                S
              </div>
              <div className="text-lg font-black tracking-tight">SIMPLE SHOP</div>
            </Link>
          </div>
        </header>

        <div className="mx-auto max-w-2xl px-5 py-24 text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h1 className="text-3xl font-black text-slate-900">Không tìm thấy sản phẩm</h1>
          <p className="mt-3 text-slate-500">
            Sản phẩm bạn đang tìm kiếm không tồn tại hoặc đã ngừng kinh doanh.
          </p>
          <Link
            href="/"
            className="mt-8 inline-block rounded-2xl bg-slate-950 px-8 py-4 font-black text-white shadow-xl hover:bg-blue-600 transition"
          >
            ← Quay lại trang chủ
          </Link>
        </div>
      </main>
    );
  }

  const discountPercent = product.oldPrice
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : 0;

  return (
    <main className="min-h-screen bg-[#f8faff] text-slate-900">
      {/* NOTIFICATION TOAST */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl bg-slate-950 px-6 py-4 font-bold text-white shadow-2xl transition animate-bounce">
          <span>{notification}</span>
        </div>
      )}

      {/* TOP BAR */}
      <div className="bg-slate-950 px-4 py-2 text-center text-xs font-medium text-white">
        🚚 Miễn phí vận chuyển cho đơn hàng từ 500.000₫ • Đổi trả dễ dàng trong 7 ngày
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
            <Link className="transition hover:text-blue-600" href="/">
              Trang chủ
            </Link>
            <Link className="text-blue-600 font-bold" href="/#products">
              Sản phẩm
            </Link>
            <Link className="transition hover:text-blue-600" href="/#categories">
              Danh mục
            </Link>
          </nav>

          {/* SEARCH */}
          <div className="ml-auto hidden max-w-xs flex-1 md:block">
            <div className="flex items-center gap-3 rounded-2xl bg-slate-100 px-4 py-3">
              <span className="text-slate-400">⌕</span>
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearch}
                className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                placeholder="Tìm kiếm và nhấn Enter..."
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
                onClick={() => setShowAccount((v) => !v)}
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
              href={`/login?redirect=/products/${productId}`}
              className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-slate-200 transition hover:-translate-y-0.5 hover:bg-blue-600"
            >
              Đăng nhập
            </Link>
          )}
        </div>
      </header>

      {/* BREADCRUMB */}
      <div className="mx-auto max-w-7xl px-5 pt-8 lg:px-8">
        <nav className="flex items-center gap-2 text-sm text-slate-500">
          <Link href="/" className="hover:text-blue-600 transition">
            Trang chủ
          </Link>
          <span>/</span>
          <Link href={`/?categoryId=${product.categoryId}`} className="hover:text-blue-600 transition">
            {product.category?.name || "Danh mục"}
          </Link>
          <span>/</span>
          <span className="font-bold text-slate-900 truncate max-w-xs sm:max-w-md">
            {product.name}
          </span>
        </nav>
      </div>

      {/* MAIN PRODUCT SHOWCASE */}
      <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2">
          {/* LEFT: IMAGE & GALLERY */}
          <div>
            <div className="relative overflow-hidden rounded-[2.5rem] border border-blue-100 bg-white p-4 shadow-xl shadow-blue-100/50">
              <div className="relative h-[420px] sm:h-[500px] w-full overflow-hidden rounded-[2rem] bg-slate-100">
                <Image
                  src={selectedImage || product.image}
                  alt={product.name}
                  fill
                  priority
                  className="object-cover transition duration-500 hover:scale-105"
                />

                {product.badge && (
                  <div className="absolute left-5 top-5 rounded-full bg-slate-950 px-4 py-2 text-xs font-black text-white shadow-lg">
                    {product.badge}
                  </div>
                )}

                <button
                  onClick={() => setIsLiked(!isLiked)}
                  className={`absolute right-5 top-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/90 text-xl shadow-lg backdrop-blur transition hover:scale-110 ${
                    isLiked ? "text-blue-600" : "text-slate-400"
                  }`}
                  title="Yêu thích"
                >
                  {isLiked ? "♥" : "♡"}
                </button>
              </div>

              {/* THUMBNAIL PREVIEWS */}
              <div className="mt-4 flex items-center gap-3 overflow-x-auto pb-1">
                <button
                  onClick={() => setSelectedImage(product.image)}
                  className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-2 transition ${
                    selectedImage === product.image ? "border-blue-600 shadow-md scale-105" : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                >
                  <Image src={product.image} alt={product.name} fill className="object-cover" />
                </button>

                <div className="ml-auto flex items-center gap-2">
                  <button
                    onClick={handleShare}
                    className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-100"
                  >
                    <span>↗ Chia sẻ</span>
                  </button>
                </div>
              </div>
            </div>

            {/* VALUE PROPOSITION BADGES */}
            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-2xl border border-blue-100 bg-white p-4 text-center shadow-sm">
                <div className="text-2xl mb-1">🚀</div>
                <div className="text-xs font-black text-slate-900">Giao nhanh</div>
                <div className="text-[11px] text-slate-500">2 - 4 ngày nhận hàng</div>
              </div>
              <div className="rounded-2xl border border-blue-100 bg-white p-4 text-center shadow-sm">
                <div className="text-2xl mb-1">🛡️</div>
                <div className="text-xs font-black text-slate-900">Chính hãng</div>
                <div className="text-[11px] text-slate-500">Cam kết 100% chất lượng</div>
              </div>
              <div className="rounded-2xl border border-blue-100 bg-white p-4 text-center shadow-sm">
                <div className="text-2xl mb-1">🔄</div>
                <div className="text-xs font-black text-slate-900">Đổi trả 7 ngày</div>
                <div className="text-[11px] text-slate-500">Miễn phí nếu lỗi</div>
              </div>
              <div className="rounded-2xl border border-blue-100 bg-white p-4 text-center shadow-sm">
                <div className="text-2xl mb-1">📞</div>
                <div className="text-xs font-black text-slate-900">Hỗ trợ 24/7</div>
                <div className="text-[11px] text-slate-500">Nhiệt tình chu đáo</div>
              </div>
            </div>
          </div>

          {/* RIGHT: PRODUCT INFO & PURCHASE CONTROLS */}
          <div className="flex flex-col justify-between">
            <div>
              {/* CATEGORY & CODE */}
              <div className="flex items-center justify-between gap-4">
                <Link
                  href={`/?categoryId=${product.categoryId}`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3.5 py-1.5 text-xs font-black text-blue-700 hover:bg-blue-200 transition"
                >
                  <span>{product.category?.icon || "✦"}</span>
                  <span>{product.category?.name || "Danh mục"}</span>
                </Link>
                <span className="text-xs font-semibold text-slate-400">
                  Mã SP: SP-{String(product.id).padStart(5, "0")}
                </span>
              </div>

              {/* TITLE */}
              <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                {product.name}
              </h1>

              {/* RATING & SALES */}
              <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5 rounded-xl bg-amber-50 px-3 py-1 font-black text-amber-600 border border-amber-200">
                  <span>★</span>
                  <span>{product.rating || 5.0}</span>
                </div>
                <span className="text-slate-400">•</span>
                <span className="font-semibold text-slate-600">
                  {reviewsList.length} đánh giá
                </span>
                <span className="text-slate-400">•</span>
                <span className="font-semibold text-slate-600">
                  Đã bán <strong className="text-slate-900">{product.sold || 0}</strong> sản phẩm
                </span>
              </div>

              {/* PRICING */}
              <div className="mt-6 flex flex-wrap items-baseline gap-4 rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
                <div className="text-4xl font-black text-blue-600">
                  {formatPrice(product.price)}
                </div>
                {product.oldPrice && (
                  <div className="text-lg text-slate-400 line-through">
                    {formatPrice(product.oldPrice)}
                  </div>
                )}
                {discountPercent > 0 && (
                  <div className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-black text-indigo-600 border border-indigo-200">
                    Giảm {discountPercent}%
                  </div>
                )}
              </div>

              {/* SHORT DESCRIPTION */}
              <p className="mt-6 text-base leading-relaxed text-slate-600">
                {product.description || "Sản phẩm chất lượng cao, mang lại trải nghiệm tiện nghi và phong cách."}
              </p>

              {/* COLOR VARIANTS */}
              <div className="mt-8 border-t border-slate-200/60 pt-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-900">Màu sắc lựa chọn:</span>
                  <span className="text-xs font-bold text-blue-600">{colorOptions[selectedColor]?.name}</span>
                </div>
                <div className="mt-3 flex items-center gap-3">
                  {colorOptions.map((c, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedColor(idx)}
                      className={`flex items-center gap-2 rounded-2xl border px-3.5 py-2 text-xs font-bold transition ${
                        selectedColor === idx
                          ? "border-blue-600 bg-blue-50 text-blue-700 shadow-sm"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      <span className={`h-4 w-4 rounded-full border ${c.hex} ${c.border}`} />
                      <span>{c.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* SIZE OPTIONS */}
              {(product.category?.slug === "thoi-trang" || product.category?.slug === "giay-dep") && (
                <div className="mt-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-900">
                      {isShoe ? "Kích cỡ giày (EU):" : "Kích cỡ áo / quần:"}
                    </span>
                    <span className="text-xs text-blue-600 font-semibold cursor-pointer hover:underline">
                      Hướng dẫn chọn size
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2.5">
                    {sizeOptions.map((sz) => (
                      <button
                        key={sz}
                        onClick={() => setSelectedSize(sz)}
                        className={`flex h-11 min-w-12 items-center justify-center rounded-2xl border text-sm font-black transition ${
                          selectedSize === sz
                            ? "border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-200"
                            : "border-slate-200 bg-white text-slate-800 hover:border-blue-300"
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* STOCK STATUS & QUANTITY */}
              <div className="mt-8 border-t border-slate-200/60 pt-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className={`h-3 w-3 rounded-full ${product.stock > 0 ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`} />
                    <span className="text-sm font-bold text-slate-700">
                      {product.stock > 0
                        ? `Còn hàng (${product.stock} sản phẩm có sẵn)`
                        : "Tạm thời hết hàng"}
                    </span>
                  </div>

                  {product.stock > 0 && (
                    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
                      <button
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        disabled={quantity <= 1}
                        className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 font-black text-slate-700 transition hover:bg-slate-200 disabled:opacity-40"
                      >
                        -
                      </button>
                      <span className="w-10 text-center font-black text-base">{quantity}</span>
                      <button
                        onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                        disabled={quantity >= product.stock}
                        className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 font-black text-slate-700 transition hover:bg-slate-200 disabled:opacity-40"
                      >
                        +
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <button
                  onClick={handleAddToCart}
                  disabled={addingToCart || product.stock <= 0}
                  className="flex flex-1 items-center justify-center gap-3 rounded-2xl border-2 border-blue-600 bg-blue-50 py-4 font-black text-blue-600 shadow-sm transition hover:bg-blue-100 disabled:opacity-50"
                >
                  <span className="text-lg">🛒</span>
                  <span>{addingToCart ? "Đang thêm vào giỏ..." : "Thêm vào giỏ hàng"}</span>
                </button>

                <button
                  onClick={handleBuyNow}
                  disabled={buyingNow || product.stock <= 0}
                  className="flex flex-1 items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-pink-600 to-rose-600 py-4 font-black text-white shadow-xl shadow-blue-200 transition hover:from-pink-700 hover:to-rose-700 hover:shadow-2xl disabled:opacity-50"
                >
                  <span>⚡</span>
                  <span>{buyingNow ? "Đang xử lý..." : "Mua ngay"}</span>
                </button>
              </div>
            </div>

            {/* SAFE CHECKOUT FOOTNOTE */}
            <div className="mt-6 flex items-center justify-center gap-6 text-xs font-semibold text-slate-400">
              <span>🔒 Thanh toán bảo mật</span>
              <span>•</span>
              <span>📦 Kiểm tra hàng trước thanh toán</span>
            </div>
          </div>
        </div>
      </div>

      {/* DETAILED TABS SECTION */}
      <section className="mx-auto max-w-7xl px-5 py-14 lg:px-8">
        <div className="rounded-[2.5rem] border border-slate-200/80 bg-white p-6 shadow-sm sm:p-10">
          {/* TAB HEADERS */}
          <div className="flex border-b border-slate-200 overflow-x-auto gap-4 sm:gap-8 pb-4">
            <button
              onClick={() => setActiveTab("description")}
              className={`text-base font-black pb-2 transition whitespace-nowrap ${
                activeTab === "description"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-slate-400 hover:text-slate-800"
              }`}
            >
              Mô tả chi tiết
            </button>
            <button
              onClick={() => setActiveTab("specs")}
              className={`text-base font-black pb-2 transition whitespace-nowrap ${
                activeTab === "specs"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-slate-400 hover:text-slate-800"
              }`}
            >
              Thông số kỹ thuật
            </button>
            <button
              onClick={() => setActiveTab("reviews")}
              className={`text-base font-black pb-2 transition whitespace-nowrap ${
                activeTab === "reviews"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-slate-400 hover:text-slate-800"
              }`}
            >
              Đánh giá ({reviewsList.length})
            </button>
            <button
              onClick={() => setActiveTab("shipping")}
              className={`text-base font-black pb-2 transition whitespace-nowrap ${
                activeTab === "shipping"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-slate-400 hover:text-slate-800"
              }`}
            >
              Chính sách giao nhận
            </button>
          </div>

          {/* TAB 1: DESCRIPTION */}
          {activeTab === "description" && (
            <div className="mt-8 space-y-6 text-slate-700 leading-relaxed">
              <h3 className="text-xl font-black text-slate-900">
                Giới thiệu về {product.name}
              </h3>
              <p>{product.description}</p>
              <p>
                Sản phẩm được tuyển chọn kỹ lưỡng theo tiêu chuẩn khắt khe của Simple Shop.
                Từng chi tiết được hoàn thiện sắc sảo nhằm đem lại sự hài lòng tối đa cho người dùng trong đời sống hàng ngày cũng như các dịp đặc biệt.
              </p>

              <div className="rounded-3xl bg-blue-50/60 p-6 border border-blue-100">
                <h4 className="font-bold text-pink-900 mb-3 text-base">✨ Điểm nổi bật của sản phẩm:</h4>
                <ul className="list-disc list-inside space-y-2 text-sm text-pink-950 font-medium">
                  <li>Thiết kế hiện đại, tinh tế phù hợp nhiều bối cảnh sử dụng.</li>
                  <li>Chất liệu cao cấp bền đẹp, an toàn tuyệt đối cho người dùng.</li>
                  <li>Màu sắc thanh lịch, dễ dàng phối đồ hoặc bố trí không gian sống.</li>
                  <li>Độ bền cao, dễ dàng bảo quản và vệ sinh sau thời gian dài sử dụng.</li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 2: SPECS */}
          {activeTab === "specs" && (
            <div className="mt-8">
              <h3 className="text-xl font-black text-slate-900 mb-6">
                Thông số kỹ thuật chi tiết
              </h3>
              <div className="overflow-hidden rounded-2xl border border-slate-200">
                <table className="w-full text-left text-sm">
                  <tbody>
                    <tr className="border-b border-slate-100 bg-slate-50/50">
                      <th className="p-4 font-bold text-slate-600 w-1/3">Tên sản phẩm</th>
                      <td className="p-4 font-semibold text-slate-900">{product.name}</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <th className="p-4 font-bold text-slate-600">Danh mục</th>
                      <td className="p-4 font-semibold text-slate-900">{product.category?.name || "Khác"}</td>
                    </tr>
                    <tr className="border-b border-slate-100 bg-slate-50/50">
                      <th className="p-4 font-bold text-slate-600">Thương hiệu</th>
                      <td className="p-4 font-semibold text-slate-900">Simple Shop Selection</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <th className="p-4 font-bold text-slate-600">Xuất xứ</th>
                      <td className="p-4 font-semibold text-slate-900">Việt Nam / Nhập khẩu chính ngạch</td>
                    </tr>
                    <tr className="border-b border-slate-100 bg-slate-50/50">
                      <th className="p-4 font-bold text-slate-600">Chất liệu</th>
                      <td className="p-4 font-semibold text-slate-900">Cao cấp tiêu chuẩn xuất khẩu</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <th className="p-4 font-bold text-slate-600">Chế độ bảo hành</th>
                      <td className="p-4 font-semibold text-slate-900">12 tháng chính hãng (Lỗi 1 đổi 1 trong 7 ngày)</td>
                    </tr>
                    <tr className="bg-slate-50/50">
                      <th className="p-4 font-bold text-slate-600">Tình trạng kho hàng</th>
                      <td className="p-4 font-semibold text-emerald-600">Còn hàng ({product.stock} sản phẩm)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: REVIEWS */}
          {activeTab === "reviews" && (
            <div className="mt-8">
              <div className="grid gap-8 lg:grid-cols-3">
                {/* RATING OVERVIEW */}
                <div className="rounded-3xl bg-blue-50/60 p-6 border border-blue-100 text-center flex flex-col justify-center items-center">
                  <div className="text-5xl font-black text-blue-600">{product.rating || 4.9}</div>
                  <div className="mt-2 text-amber-500 text-xl font-black">★★★★★</div>
                  <p className="mt-2 text-xs font-bold text-slate-500">
                    Dựa trên {reviewsList.length} đánh giá thực tế từ khách hàng đã mua
                  </p>

                  <div className="mt-6 w-full space-y-2 text-xs font-semibold text-slate-600">
                    <div className="flex items-center gap-2">
                      <span>5 sao</span>
                      <div className="h-2 flex-1 rounded-full bg-slate-200 overflow-hidden">
                        <div className="h-full bg-blue-600 rounded-full w-[85%]" />
                      </div>
                      <span>85%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>4 sao</span>
                      <div className="h-2 flex-1 rounded-full bg-slate-200 overflow-hidden">
                        <div className="h-full bg-blue-600 rounded-full w-[15%]" />
                      </div>
                      <span>15%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>3 sao</span>
                      <div className="h-2 flex-1 rounded-full bg-slate-200 overflow-hidden">
                        <div className="h-full bg-slate-300 rounded-full w-[0%]" />
                      </div>
                      <span>0%</span>
                    </div>
                  </div>
                </div>

                {/* REVIEWS LIST & SUBMISSION */}
                <div className="lg:col-span-2 space-y-6">
                  {/* REVIEW SUBMIT FORM */}
                  <form onSubmit={handleAddReview} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <h4 className="font-bold text-slate-900 text-sm">Viết đánh giá của bạn</h4>
                    <div className="mt-3 flex items-center gap-3">
                      <span className="text-xs font-semibold text-slate-600">Đánh giá số sao:</span>
                      <div className="flex gap-1 text-lg">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            type="button"
                            key={star}
                            onClick={() => setNewReviewRating(star)}
                            className={`transition hover:scale-125 ${star <= newReviewRating ? "text-amber-500" : "text-slate-300"}`}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                    </div>

                    {!user && (
                      <input
                        type="text"
                        placeholder="Họ và tên của bạn..."
                        value={newReviewAuthor}
                        onChange={(e) => setNewReviewAuthor(e.target.value)}
                        className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500"
                      />
                    )}

                    <textarea
                      rows={3}
                      placeholder="Cảm nhận của bạn về chất lượng sản phẩm, giao hàng, phục vụ..."
                      value={newReviewComment}
                      onChange={(e) => setNewReviewComment(e.target.value)}
                      className="mt-3 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none focus:border-blue-500"
                      required
                    />

                    <div className="mt-3 flex items-center justify-between">
                      {reviewSubmitted && (
                        <span className="text-xs font-bold text-emerald-600">✓ Đã gửi đánh giá thành công!</span>
                      )}
                      <button
                        type="submit"
                        className="ml-auto rounded-xl bg-slate-950 px-5 py-2.5 text-xs font-black text-white hover:bg-blue-600 transition"
                      >
                        Gửi nhận xét
                      </button>
                    </div>
                  </form>

                  {/* REVIEWS DISPLAY */}
                  <div className="space-y-4">
                    {reviewsList.map((rev) => (
                      <div key={rev.id} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-600 text-sm">
                              {rev.avatar}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 text-sm">{rev.author}</span>
                                {rev.verified && (
                                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600 border border-emerald-200">
                                    ✓ Đã mua hàng
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-slate-400">{rev.date}</span>
                            </div>
                          </div>

                          <div className="text-amber-500 text-sm font-bold">
                            {"★".repeat(rev.rating)}
                          </div>
                        </div>

                        <p className="mt-3 text-sm text-slate-700 leading-relaxed">
                          {rev.comment}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SHIPPING & RETURNS */}
          {activeTab === "shipping" && (
            <div className="mt-8 space-y-5 text-sm text-slate-700 leading-relaxed">
              <h3 className="text-xl font-black text-slate-900">
                Chính sách vận chuyển & Đổi trả hàng
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 p-5 bg-slate-50">
                  <h4 className="font-bold text-slate-900 mb-2">🚚 Vận chuyển toàn quốc</h4>
                  <p>
                    Đơn hàng được đóng gói kỹ càng và vận chuyển thông qua các đơn vị chuyển phát nhanh hàng đầu (GHTK, GHN, Viettel Post).
                  </p>
                  <p className="mt-2 text-blue-600 font-bold">
                    • Miễn phí vận chuyển cho hóa đơn từ 500.000₫.
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-5 bg-slate-50">
                  <h4 className="font-bold text-slate-900 mb-2">🔄 Quy định đổi trả 7 ngày</h4>
                  <p>
                    Quý khách được đổi trả miễn phí trong vòng 7 ngày kể từ lúc nhận hàng nếu sản phẩm có lỗi từ nhà sản xuất hoặc giao sai mẫu mã, kích thước.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* RELATED PRODUCTS SECTION */}
      {relatedProducts.length > 0 && (
        <section className="bg-white py-16">
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <div className="mb-10 flex items-end justify-between">
              <div>
                <div className="text-sm font-bold uppercase tracking-widest text-blue-600">
                  Gợi ý cho bạn
                </div>
                <h2 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl mt-1">
                  Sản phẩm tương tự
                </h2>
              </div>
              <Link
                href={`/?categoryId=${product.categoryId}`}
                className="text-sm font-bold text-slate-500 hover:text-blue-600 transition"
              >
                Xem tất cả →
              </Link>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {relatedProducts.map((rel) => (
                <div
                  key={rel.id}
                  className="group flex flex-col justify-between overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white transition duration-300 hover:-translate-y-2 hover:border-blue-200 hover:shadow-2xl hover:shadow-blue-100"
                >
                  <Link href={`/products/${rel.id}`} className="relative h-64 overflow-hidden bg-slate-100 block">
                    <Image
                      src={rel.image}
                      alt={rel.name}
                      fill
                      className="object-cover transition duration-500 group-hover:scale-110"
                    />
                    {rel.badge && (
                      <div className="absolute left-3 top-3 rounded-full bg-slate-950 px-2.5 py-1 text-[10px] font-bold text-white">
                        {rel.badge}
                      </div>
                    )}
                  </Link>

                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="text-xs font-semibold text-blue-600">
                        {rel.category?.name || "Sản phẩm"}
                      </div>
                      <Link href={`/products/${rel.id}`}>
                        <h3 className="mt-1.5 font-black text-slate-900 line-clamp-1 hover:text-blue-600 transition">
                          {rel.name}
                        </h3>
                      </Link>
                      <div className="mt-2 flex items-center gap-2 text-xs">
                        <span className="font-bold text-amber-500">★ {rel.rating || 5.0}</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-400">Đã bán {rel.sold || 0}</span>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between pt-2 border-t border-slate-100">
                      <span className="font-black text-blue-600 text-base">
                        {formatPrice(rel.price)}
                      </span>
                      <Link
                        href={`/products/${rel.id}`}
                        className="rounded-xl bg-slate-950 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-blue-600"
                      >
                        Chi tiết →
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

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
