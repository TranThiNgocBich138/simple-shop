"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

function formatPrice(price) {
  return new Intl.NumberFormat("vi-VN").format(price) + "₫";
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Form Fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [oldPrice, setOldPrice] = useState("");
  const [stock, setStock] = useState("50");
  const [image, setImage] = useState("");
  const [badge, setBadge] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [prodRes, catRes] = await Promise.all([
        fetch("/api/products", { cache: "no-store" }),
        fetch("/api/categories", { cache: "no-store" }),
      ]);

      if (prodRes.ok) {
        const pData = await prodRes.json();
        setProducts(pData.products || []);
      }
      if (catRes.ok) {
        const cData = await catRes.json();
        setCategories(cData.categories || []);
      }
    } catch (err) {
      console.error(err);
      setError("Lỗi tải danh sách sản phẩm.");
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setEditingProduct(null);
    setName("");
    setDescription("");
    setPrice("");
    setOldPrice("");
    setStock("50");
    setImage("https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80");
    setBadge("");
    setCategoryId(categories[0]?.id ? String(categories[0].id) : "");
    setIsFeatured(false);
    setError("");
    setShowModal(true);
  }

  function openEditModal(prod) {
    setEditingProduct(prod);
    setName(prod.name);
    setDescription(prod.description || "");
    setPrice(String(prod.price));
    setOldPrice(prod.oldPrice ? String(prod.oldPrice) : "");
    setStock(String(prod.stock));
    setImage(prod.image);
    setBadge(prod.badge || "");
    setCategoryId(String(prod.categoryId));
    setIsFeatured(Boolean(prod.isFeatured));
    setError("");
    setShowModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!name.trim() || !price || !categoryId || !image.trim()) {
      setError("Vui lòng điền đầy đủ các thông tin bắt buộc.");
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        name: name.trim(),
        description: description.trim(),
        price: Number(price),
        oldPrice: oldPrice ? Number(oldPrice) : null,
        stock: Number(stock),
        image: image.trim(),
        badge: badge.trim() || null,
        categoryId: Number(categoryId),
        isFeatured,
      };

      const url = editingProduct ? `/api/products/${editingProduct.id}` : "/api/products";
      const method = editingProduct ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Lỗi lưu sản phẩm.");
        return;
      }

      setSuccess(editingProduct ? "Đã cập nhật sản phẩm!" : "Đã tạo sản phẩm mới!");
      setShowModal(false);
      loadData();
    } catch (err) {
      console.error(err);
      setError("Không thể lưu sản phẩm.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Bạn có chắc chắn muốn xóa sản phẩm này?")) return;

    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (res.ok) {
        setSuccess("Đã xóa sản phẩm thành công.");
        setProducts((prev) => prev.filter((p) => p.id !== id));
      } else {
        const data = await res.json();
        setError(data.message || "Không thể xóa sản phẩm.");
      }
    } catch (err) {
      console.error(err);
      setError("Lỗi xóa sản phẩm.");
    }
  }

  return (
    <div className="space-y-8">
      {/* TITLE & ADD BUTTON */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white">Quản lý Sản phẩm</h1>
          <p className="mt-1 text-sm text-slate-400">Danh sách tất cả sản phẩm trong cửa hàng ({products.length})</p>
        </div>

        <button
          onClick={openCreateModal}
          className="rounded-2xl bg-violet-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-900/50 hover:bg-violet-500 transition"
        >
          + Thêm sản phẩm mới
        </button>
      </div>

      {/* NOTIFICATIONS */}
      {error && <div className="rounded-2xl bg-red-500/10 border border-red-500/30 p-4 text-sm font-semibold text-red-400">{error}</div>}
      {success && <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-4 text-sm font-semibold text-emerald-400">{success}</div>}

      {/* PRODUCTS TABLE */}
      {loading ? (
        <div className="py-20 text-center text-slate-400">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
          <p className="mt-3 font-semibold">Đang tải danh sách sản phẩm...</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-900 shadow-xl">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/80 text-xs uppercase text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-5">Sản phẩm</th>
                <th className="p-5">Danh mục</th>
                <th className="p-5">Giá bán</th>
                <th className="p-5">Tồn kho</th>
                <th className="p-5">Đã bán</th>
                <th className="p-5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {products.map((prod) => (
                <tr key={prod.id} className="hover:bg-slate-800/40 transition">
                  <td className="p-5 flex items-center gap-4">
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-slate-950 border border-slate-800">
                      <Image src={prod.image} alt={prod.name} fill className="object-cover" />
                    </div>
                    <div>
                      <p className="font-bold text-white">{prod.name}</p>
                      {prod.badge && <span className="text-[10px] bg-violet-500/20 text-violet-300 px-2 py-0.5 rounded-full border border-violet-500/30">{prod.badge}</span>}
                    </div>
                  </td>
                  <td className="p-5 font-semibold text-slate-400">{prod.category?.name || "N/A"}</td>
                  <td className="p-5 font-black text-violet-400">{formatPrice(prod.price)}</td>
                  <td className="p-5 font-bold">
                    <span className={prod.stock <= 10 ? "text-amber-400" : "text-slate-200"}>
                      {prod.stock}
                    </span>
                  </td>
                  <td className="p-5 font-semibold text-slate-400">{prod.sold}</td>
                  <td className="p-5 text-right space-x-2">
                    <button
                      onClick={() => openEditModal(prod)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition"
                    >
                      ✏️ Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(prod.id)}
                      className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-xs font-bold text-red-400 transition"
                    >
                      🗑 Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
            <h2 className="text-2xl font-black text-white mb-6">
              {editingProduct ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">Tên sản phẩm *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950 p-4 text-sm text-white outline-none focus:border-violet-500"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-2">Danh mục *</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    required
                    className="w-full rounded-2xl border border-slate-800 bg-slate-950 p-4 text-sm text-white outline-none focus:border-violet-500"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-2">Giá bán (VNĐ) *</label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                    min="0"
                    className="w-full rounded-2xl border border-slate-800 bg-slate-950 p-4 text-sm text-white outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-2">Giá gốc (nếu có)</label>
                  <input
                    type="number"
                    value={oldPrice}
                    onChange={(e) => setOldPrice(e.target.value)}
                    min="0"
                    className="w-full rounded-2xl border border-slate-800 bg-slate-950 p-4 text-sm text-white outline-none focus:border-violet-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-2">Số lượng tồn kho *</label>
                  <input
                    type="number"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    required
                    min="0"
                    className="w-full rounded-2xl border border-slate-800 bg-slate-950 p-4 text-sm text-white outline-none focus:border-violet-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-2">Huy hiệu (Badge)</label>
                  <input
                    type="text"
                    value={badge}
                    onChange={(e) => setBadge(e.target.value)}
                    placeholder="Bán chạy, Hot..."
                    className="w-full rounded-2xl border border-slate-800 bg-slate-950 p-4 text-sm text-white outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">URL Hình ảnh *</label>
                <input
                  type="text"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  required
                  placeholder="https://..."
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950 p-4 text-sm text-white outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">Mô tả sản phẩm</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950 p-4 text-sm text-white outline-none focus:border-violet-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  id="featured"
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-700 accent-violet-600"
                />
                <label htmlFor="featured" className="text-sm font-semibold text-slate-300">
                  Hiển thị ở Sản phẩm nổi bật (Trang chủ)
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-2xl border border-slate-800 px-6 py-3.5 text-sm font-bold text-slate-400 hover:bg-slate-800 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-2xl bg-violet-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg hover:bg-violet-500 transition disabled:opacity-60"
                >
                  {submitting ? "Đang lưu..." : "Lưu sản phẩm"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
