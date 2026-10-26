"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function ApiDocsPage() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Add Swagger UI CSS
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css";
    document.head.appendChild(link);

    // Add Swagger UI Bundle script
    const script = document.createElement("script");
    script.src = "https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js";
    script.async = true;

    script.onload = () => {
      if (window.SwaggerUIBundle) {
        window.SwaggerUIBundle({
          url: "/api/docs/spec",
          dom_id: "#swagger-ui",
          deepLinking: true,
          presets: [
            window.SwaggerUIBundle.presets.apis,
          ],
          layout: "BaseLayout",
          docExpansion: "list",
          defaultModelsExpandDepth: 1,
        });
        setLoaded(true);
      }
    };

    document.body.appendChild(script);

    return () => {
      try {
        document.head.removeChild(link);
        document.body.removeChild(script);
      } catch (e) {
        // cleanup ignore
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Top Navigation Bar */}
      <header className="bg-slate-900 text-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              Simple Shop
            </span>
            <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2.5 py-1 rounded-full font-semibold border border-emerald-500/30">
              Swagger API Docs
            </span>
          </div>

          <div className="flex items-center gap-4 text-sm font-medium">
            <a
              href="/api/docs/spec"
              target="_blank"
              rel="noreferrer"
              className="text-slate-300 hover:text-white transition flex items-center gap-1.5"
            >
              📄 OpenAPI JSON
            </a>
            <Link
              href="/"
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3.5 py-1.5 rounded-lg border border-slate-700 transition"
            >
              Về Trang chủ
            </Link>
            <Link
              href="/admin"
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-1.5 rounded-lg transition shadow-sm"
            >
              Trang Quản trị
            </Link>
          </div>
        </div>
      </header>

      {/* Main Swagger UI Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!loaded && (
          <div className="flex flex-col items-center justify-center py-24 text-slate-500 space-y-3">
            <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="font-medium text-base">Đang tải giao diện Swagger UI...</p>
          </div>
        )}
        <div id="swagger-ui" className={loaded ? "block bg-white p-6 rounded-2xl shadow-sm border border-slate-200" : "hidden"} />
      </main>
    </div>
  );
}
