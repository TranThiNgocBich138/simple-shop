import { cookies } from "next/headers";
import crypto from "crypto";
import prisma from "@/lib/prisma";

const AUTH_SECRET = process.env.AUTH_SECRET || "simple-shop-super-secret-key-salt-2025";

/**
 * Tạo token mã hóa kèm chữ ký HMAC-SHA256
 */
export function signAuthToken(payload) {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto.createHmac("sha256", AUTH_SECRET).update(data).digest("base64url");
  return `${data}.${signature}`;
}

/**
 * Xác thực token và giải mã payload
 */
export function verifyAuthToken(token) {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [data, signature] = parts;
  const expectedSignature = crypto.createHmac("sha256", AUTH_SECRET).update(data).digest("base64url");
  try {
    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expectedSignature);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }
    return JSON.parse(Buffer.from(data, "base64url").toString("utf-8"));
  } catch {
    return null;
  }
}

export async function getAuthUser() {
  try {
    const cookieStore = cookies();
    let targetUserId = null;

    // 1. Kiểm tra signed auth_token
    const authToken = cookieStore.get("auth_token")?.value;
    if (authToken) {
      const decoded = verifyAuthToken(authToken);
      if (decoded && decoded.userId) {
        targetUserId = Number(decoded.userId);
      }
    }

    // 2. Hỗ trợ fallback cookie userId (để tương thích)
    if (!targetUserId) {
      const legacyId = cookieStore.get("userId")?.value;
      if (legacyId && !isNaN(Number(legacyId))) {
        targetUserId = Number(legacyId);
      }
    }

    if (!targetUserId) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: {
        id: targetUserId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return user;
  } catch (error) {
    console.error("GET_AUTH_USER_ERROR:", error);
    return null;
  }
}

export async function requireAdmin() {
  const user = await getAuthUser();
  if (!user || user.role !== "ADMIN") {
    return null;
  }
  return user;
}
