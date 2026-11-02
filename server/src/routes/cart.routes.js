const express = require("express");
const prisma = require("../prisma");
const { getAuthUser, requireAuth } = require("../middleware/auth");

const router = express.Router();

// GET /api/cart/count
router.get("/count", async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return res.json({ count: 0 });
    }

    const cart = await prisma.cart.findUnique({
      where: { userId: user.id },
      include: { _count: { select: { items: true } } },
    });

    const count = cart?._count?.items || 0;
    return res.json({ count });
  } catch (error) {
    console.error("GET_CART_COUNT_ERROR:", error);
    return res.json({ count: 0 });
  }
});

// GET /api/cart
router.get("/", async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return res.json({ items: [], totalAmount: 0 });
    }

    const cart = await prisma.cart.findUnique({
      where: { userId: user.id },
      include: {
        items: {
          include: { product: true },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!cart) {
      return res.json({ items: [], totalAmount: 0 });
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

    return res.json({ items, totalAmount });
  } catch (error) {
    console.error("GET_CART_ERROR:", error);
    return res.status(500).json({ message: "Lỗi lấy giỏ hàng." });
  }
});

// POST /api/cart
router.post("/", requireAuth, async (req, res) => {
  try {
    const productId = Number(req.body.productId);
    const quantity = Number(req.body.quantity || 1);

    if (isNaN(productId) || quantity <= 0) {
      return res.status(400).json({ message: "Sản phẩm hoặc số lượng không hợp lệ." });
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return res.status(404).json({ message: "Sản phẩm không tồn tại." });
    }

    if (product.stock < quantity) {
      return res.status(400).json({ message: `Số lượng sản phẩm trong kho chỉ còn ${product.stock}.` });
    }

    let cart = await prisma.cart.findUnique({ where: { userId: req.user.id } });
    if (!cart) {
      cart = await prisma.cart.create({ data: { userId: req.user.id } });
    }

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
        return res.status(400).json({
          message: `Không thể thêm quá số lượng tồn kho (${product.stock}). Bạn hiện có ${existingItem.quantity} trong giỏ.`,
        });
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

    return res.json({ message: "Thêm vào giỏ hàng thành công." });
  } catch (error) {
    console.error("ADD_TO_CART_ERROR:", error);
    return res.status(500).json({ message: "Lỗi thêm giỏ hàng." });
  }
});

// PUT /api/cart
router.put("/", requireAuth, async (req, res) => {
  try {
    const productId = Number(req.body.productId);
    const quantity = Number(req.body.quantity);

    if (isNaN(productId)) {
      return res.status(400).json({ message: "Sản phẩm không hợp lệ." });
    }

    const cart = await prisma.cart.findUnique({ where: { userId: req.user.id } });
    if (!cart) {
      return res.status(404).json({ message: "Giỏ hàng rỗng." });
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
      return res.status(404).json({ message: "Sản phẩm không có trong giỏ hàng." });
    }

    if (quantity <= 0) {
      await prisma.cartItem.delete({ where: { id: existingItem.id } });
      return res.json({ message: "Đã xóa sản phẩm khỏi giỏ hàng." });
    }

    if (existingItem.product.stock < quantity) {
      return res.status(400).json({ message: `Số lượng vượt quá tồn kho (${existingItem.product.stock}).` });
    }

    await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: { quantity },
    });

    return res.json({ message: "Cập nhật số lượng thành công." });
  } catch (error) {
    console.error("UPDATE_CART_ERROR:", error);
    return res.status(500).json({ message: "Lỗi cập nhật giỏ hàng." });
  }
});

// DELETE /api/cart
router.delete("/", requireAuth, async (req, res) => {
  try {
    const productId = req.query.productId;
    const clearAll = req.query.clear === "true";

    const cart = await prisma.cart.findUnique({ where: { userId: req.user.id } });
    if (!cart) {
      return res.json({ message: "Giỏ hàng rỗng." });
    }

    if (clearAll) {
      await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
      return res.json({ message: "Đã xóa toàn bộ giỏ hàng." });
    }

    if (productId) {
      await prisma.cartItem.deleteMany({
        where: {
          cartId: cart.id,
          productId: Number(productId),
        },
      });
      return res.json({ message: "Đã xóa sản phẩm khỏi giỏ hàng." });
    }

    return res.status(400).json({ message: "Yêu cầu không hợp lệ." });
  } catch (error) {
    console.error("DELETE_CART_ERROR:", error);
    return res.status(500).json({ message: "Lỗi xóa sản phẩm khỏi giỏ hàng." });
  }
});

module.exports = router;
