import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function POST(request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ message: "Vui lòng đăng nhập để hoàn tất đặt hàng." }, { status: 401 });
    }

    const body = await request.json();
    const { customerName, customerEmail, customerPhone, address, paymentMethod } = body;

    if (!customerName || !customerPhone || !address) {
      return NextResponse.json(
        { message: "Vui lòng điền đầy đủ thông tin nhận hàng (Họ tên, SĐT, Địa chỉ)." },
        { status: 400 }
      );
    }

    // 1. Get user cart items
    const cart = await prisma.cart.findUnique({
      where: { userId: user.id },
      include: {
        items: {
          include: { product: true },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      return NextResponse.json({ message: "Giỏ hàng của bạn đang trống." }, { status: 400 });
    }

    // 2. Validate stock and calculate total server-side
    let totalAmount = 0;
    const orderItemsData = [];

    for (const item of cart.items) {
      const product = item.product;

      if (!product) {
        return NextResponse.json({ message: "Một số sản phẩm không còn tồn tại." }, { status: 400 });
      }

      if (product.stock < item.quantity) {
        return NextResponse.json(
          { message: `Sản phẩm "${product.name}" chỉ còn ${product.stock} trong kho.` },
          { status: 400 }
        );
      }

      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;

      orderItemsData.push({
        productId: product.id,
        price: product.price,
        quantity: item.quantity,
      });
    }

    // Calculate shipping fee server side
    const shippingFee = totalAmount > 500000 ? 0 : 30000;
    const finalTotal = totalAmount + shippingFee;

    // 3. Execute DB Transaction
    const order = await prisma.$transaction(async (tx) => {
      const orderNum = `ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

      // Create Order
      const newOrder = await tx.order.create({
        data: {
          orderNumber: orderNum,
          userId: user.id,
          customerName: customerName.trim(),
          customerEmail: (customerEmail || user.email).trim(),
          customerPhone: customerPhone.trim(),
          address: address.trim(),
          paymentMethod: paymentMethod || "COD",
          status: "PENDING",
          totalAmount: finalTotal,
          items: {
            create: orderItemsData,
          },
        },
        include: {
          items: {
            include: { product: true },
          },
        },
      });

      // Update product stock and sold count
      for (const item of orderItemsData) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: { decrement: item.quantity },
            sold: { increment: item.quantity },
          },
        });
      }

      // Clear user cart
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      return newOrder;
    });

    return NextResponse.json({
      message: "Đặt hàng thành công!",
      orderId: order.id,
      orderNumber: order.orderNumber,
    });
  } catch (error) {
    console.error("CHECKOUT_ERROR:", error);
    return NextResponse.json({ message: "Có lỗi xảy ra khi tạo đơn hàng. Vui lòng thử lại." }, { status: 500 });
  }
}
