import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ message: "Không có quyền truy cập." }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      return NextResponse.json({ message: "Vui lòng chọn file ảnh để tải lên." }, { status: 400 });
    }

    // Kiểm tra định dạng file ảnh
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { message: "Định dạng file không hỗ trợ. Chỉ chấp nhận JPG, PNG, WEBP, GIF, SVG." },
        { status: 400 }
      );
    }

    // Giới hạn dung lượng tối đa 5MB
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ message: "Dung lượng ảnh vượt quá giới hạn cho phép (tối đa 5MB)." }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Tạo tên file ngẫu nhiên an toàn để tránh ghi đè
    const rawExt = path.extname(file.name) || ".jpg";
    const ext = rawExt.toLowerCase();
    const filename = `img_${Date.now()}_${Math.random().toString(36).substring(2, 9)}${ext}`;

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, filename);
    await writeFile(filePath, buffer);

    const fileUrl = `/uploads/${filename}`;

    return NextResponse.json(
      {
        message: "Tải ảnh lên thành công.",
        url: fileUrl,
        filename,
        size: file.size,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("UPLOAD_FILE_ERROR:", error);
    return NextResponse.json({ message: "Lỗi trong quá trình tải ảnh." }, { status: 500 });
  }
}
