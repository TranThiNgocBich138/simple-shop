import { cookies } from "next/headers";
import prisma from "@/lib/prisma";

export async function getAuthUser() {
  try {
    const cookieStore = cookies();
    const userId = cookieStore.get("userId")?.value;

    if (!userId) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: {
        id: Number(userId),
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
