import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ items: [], totalAmount: 0 });
    }

    const cart = await prisma.cart.findUnique({
      where: { userId: user.id },
      include: {
        items: {
          include: {
            product: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!cart) {
      return NextResponse.json({ items: [], totalAmount: 0 });
    }

    const items = cart.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      quantity: item.quantity,
      product: {
        id: item.product.id,
        name: item.product.name,
        price: item.product.price,
        oldPrice: item.product.oldPrice,
        image: item.product.image,
        stock: item.product.stock,
      },
      subtotal: item.product.price * item.quantity,
    }));

    const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);

    return NextResponse.json({ items, totalAmount });
  } catch (error) {
    console.error("GET_CART_ERROR:", error);
    return NextResponse.json({ message: "Lỗi lấy giỏ hàng." }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ message: "Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng." }, { status: 401 });
    }

    const body = await request.json();
    const productId = Number(body.productId);
    const quantity = Number(body.quantity || 1);

    if (isNaN(productId) || quantity <= 0) {
      return NextResponse.json({ message: "Sản phẩm hoặc số lượng không hợp lệ." }, { status: 400 });
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return NextResponse.json({ message: "Sản phẩm không tồn tại." }, { status: 404 });
    }

    if (product.stock < quantity) {
      return NextResponse.json({ message: `Số lượng sản phẩm trong kho chỉ còn ${product.stock}.` }, { status: 400 });
    }

    // Find or create cart for user
    let cart = await prisma.cart.findUnique({ where: { userId: user.id } });
    if (!cart) {
      cart = await prisma.cart.create({ data: { userId: user.id } });
    }

    // Check existing item
    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId: product.id,
        },
      },
    });

    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      if (product.stock < newQuantity) {
        return NextResponse.json(
          { message: `Không thể thêm quá số lượng tồn kho (${product.stock}). Bạn hiện có ${existingItem.quantity} trong giỏ.` },
          { status: 400 }
        );
      }

      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: product.id,
          quantity,
        },
      });
    }

    return NextResponse.json({ message: "Thêm vào giỏ hàng thành công." });
  } catch (error) {
    console.error("ADD_TO_CART_ERROR:", error);
    return NextResponse.json({ message: "Lỗi thêm giỏ hàng." }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ message: "Chưa đăng nhập." }, { status: 401 });
    }

    const body = await request.json();
    const productId = Number(body.productId);
    const quantity = Number(body.quantity);

    if (isNaN(productId)) {
      return NextResponse.json({ message: "Sản phẩm không hợp lệ." }, { status: 400 });
    }

    const cart = await prisma.cart.findUnique({ where: { userId: user.id } });
    if (!cart) {
      return NextResponse.json({ message: "Giỏ hàng rỗng." }, { status: 404 });
    }

    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId,
        },
      },
      include: { product: true },
    });

    if (!existingItem) {
      return NextResponse.json({ message: "Sản phẩm không có trong giỏ hàng." }, { status: 404 });
    }

    if (quantity <= 0) {
      await prisma.cartItem.delete({ where: { id: existingItem.id } });
      return NextResponse.json({ message: "Đã xóa sản phẩm khỏi giỏ hàng." });
    }

    if (existingItem.product.stock < quantity) {
      return NextResponse.json({ message: `Số lượng vượt quá tồn kho (${existingItem.product.stock}).` }, { status: 400 });
    }

    await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: { quantity },
    });

    return NextResponse.json({ message: "Cập nhật số lượng thành công." });
  } catch (error) {
    console.error("UPDATE_CART_ERROR:", error);
    return NextResponse.json({ message: "Lỗi cập nhật giỏ hàng." }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ message: "Chưa đăng nhập." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");
    const clearAll = searchParams.get("clear") === "true";

    const cart = await prisma.cart.findUnique({ where: { userId: user.id } });
    if (!cart) {
      return NextResponse.json({ message: "Giỏ hàng rỗng." });
    }

    if (clearAll) {
      await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
      return NextResponse.json({ message: "Đã xóa toàn bộ giỏ hàng." });
    }

    if (productId) {
      await prisma.cartItem.deleteMany({
        where: {
          cartId: cart.id,
          productId: Number(productId),
        },
      });
      return NextResponse.json({ message: "Đã xóa sản phẩm khỏi giỏ hàng." });
    }

    return NextResponse.json({ message: "Yêu cầu không hợp lệ." }, { status: 400 });
  } catch (error) {
    console.error("DELETE_CART_ERROR:", error);
    return NextResponse.json({ message: "Lỗi xóa sản phẩm khỏi giỏ hàng." }, { status: 500 });
  }
}
