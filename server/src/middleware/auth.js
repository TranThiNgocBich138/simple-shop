const crypto = require("crypto");
const prisma = require("../prisma");

const AUTH_SECRET = process.env.AUTH_SECRET || "simple-shop-express-secret-key-2025";

function signAuthToken(payload) {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto.createHmac("sha256", AUTH_SECRET).update(data).digest("base64url");
  return `${data}.${signature}`;
}

function verifyAuthToken(token) {
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

async function getAuthUser(req) {
  try {
    let targetUserId = null;
    const authToken = req.cookies?.auth_token;
    if (authToken) {
      const decoded = verifyAuthToken(authToken);
      if (decoded && decoded.userId) {
        targetUserId = Number(decoded.userId);
      }
    }

    if (!targetUserId) {
      const legacyId = req.cookies?.userId;
      if (legacyId && !isNaN(Number(legacyId))) {
        targetUserId = Number(legacyId);
      }
    }

    if (!targetUserId) return null;

    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
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

async function requireAuth(req, res, next) {
  const user = await getAuthUser(req);
  if (!user) {
    return res.status(401).json({ message: "Vui lòng đăng nhập để tiếp tục." });
  }
  req.user = user;
  next();
}

async function requireAdmin(req, res, next) {
  const user = await getAuthUser(req);
  if (!user || user.role !== "ADMIN") {
    return res.status(403).json({ message: "Không có quyền truy cập." });
  }
  req.user = user;
  next();
}

module.exports = {
  signAuthToken,
  verifyAuthToken,
  getAuthUser,
  requireAuth,
  requireAdmin,
};
