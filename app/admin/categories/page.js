"use client";

import { useEffect, useState } from "react";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [icon, setIcon] = useState("✦");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    try {
      setLoading(true);
      const res = await fetch("/api/categories", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function handleNameChange(val) {
    setName(val);
    const autoSlug = val
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[đĐ]/g, "d")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");
    setSlug(autoSlug);
  }

  async function handleCreateCategory(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!name.trim() || !slug.trim()) {
      setError("Vui lòng điền Tên và Slug cho danh mục.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug, icon, description }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Tạo danh mục thất bại.");
        return;
      }

      setSuccess("Tạo danh mục thành công!");
      setName("");
      setSlug("");
      setDescription("");
      loadCategories();
    } catch (err) {
      console.error(err);
      setError("Lỗi tạo danh mục.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-white">Quản lý Danh mục</h1>
        <p className="mt-1 text-sm text-slate-400">Danh mục sản phẩm trên hệ thống ({categories.length})</p>
      </div>

      {error && <div className="rounded-2xl bg-red-500/10 border border-red-500/30 p-4 text-sm font-semibold text-red-400">{error}</div>}
      {success && <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-4 text-sm font-semibold text-emerald-400">{success}</div>}

      <div className="grid gap-8 lg:grid-cols-3">
        {/* ADD CATEGORY FORM */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-xl h-fit">
          <h2 className="text-lg font-black text-white mb-4">Thêm danh mục mới</h2>

          <form onSubmit={handleCreateCategory} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2">Tên danh mục *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                required
                placeholder="Thời trang, Giày dép..."
                className="w-full rounded-2xl border border-slate-800 bg-slate-950 p-4 text-sm text-white outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2">Slug (URL) *</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                required
                placeholder="thoi-trang, giay-dep..."
                className="w-full rounded-2xl border border-slate-800 bg-slate-950 p-4 text-sm text-white outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2">Icon ký tự</label>
              <input
                type="text"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                placeholder="✦, ◈, ◇..."
                className="w-full rounded-2xl border border-slate-800 bg-slate-950 p-4 text-sm text-white outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2">Mô tả ngắn</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mô tả danh mục..."
                className="w-full rounded-2xl border border-slate-800 bg-slate-950 p-4 text-sm text-white outline-none focus:border-violet-500"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-2xl bg-violet-600 py-3.5 text-sm font-bold text-white shadow-lg hover:bg-violet-500 transition disabled:opacity-60"
            >
              {submitting ? "Đang tạo..." : "Tạo danh mục"}
            </button>
          </form>
        </div>

        {/* CATEGORIES LIST */}
        <div className="lg:col-span-2">
          {loading ? (
            <div className="py-20 text-center text-slate-400">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-xl flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-2xl text-violet-400 border border-slate-800">
                      {cat.icon || "✦"}
                    </div>
                    <div>
                      <h3 className="font-black text-white text-base">{cat.name}</h3>
                      <p className="text-xs text-slate-400">/{cat.slug}</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-violet-500/10 px-3 py-1 text-xs font-bold text-violet-300 border border-violet-500/20">
                    {cat._count?.products || 0} sản phẩm
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
