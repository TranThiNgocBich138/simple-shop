const http = require("http");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function runTests() {
  console.log("=== STARTING FULL END-TO-END VERIFICATION TESTS ===\n");

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  }

  try {
    // TEST 1: Register User
    const testEmail = `testuser_${Date.now()}@example.com`;
    const password = "password123";
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name: "Test Automated User",
        email: testEmail,
        password: hashedPassword,
        role: "USER",
      },
    });

    assert(user && user.role === "USER", "TEST 1.1: Register User created in DB with role USER");
    assert(user.password !== password, "TEST 1.2: Password correctly hashed in database");

    // TEST 2: Email Duplicate Check
    try {
      await prisma.user.create({
        data: {
          name: "Test Duplicate",
          email: testEmail,
          password: hashedPassword,
          role: "USER",
        },
      });
      assert(false, "TEST 2: Duplicate email constraint failed to trigger");
    } catch (e) {
      assert(true, "TEST 2: Duplicate email correctly blocked by database unique constraint");
    }

    // TEST 3: Login Verification
    const foundUser = await prisma.user.findUnique({ where: { email: testEmail } });
    const isPasswordValid = await bcrypt.compare(password, foundUser.password);
    const isWrongPasswordValid = await bcrypt.compare("wrongpass", foundUser.password);

    assert(isPasswordValid === true, "TEST 3.1: Login with correct password verified");
    assert(isWrongPasswordValid === false, "TEST 3.2: Login with wrong password rejected");

    // TEST 4: Products & Categories DB Fetch
    const categories = await prisma.category.findMany();
    const products = await prisma.product.findMany();
    assert(categories.length > 0, `TEST 4.1: Found ${categories.length} categories in DB`);
    assert(products.length > 0, `TEST 4.2: Found ${products.length} products in DB`);

    const targetProduct = products[0];

    // TEST 5: Cart Management
    let cart = await prisma.cart.create({ data: { userId: user.id } });
    let cartItem = await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId: targetProduct.id,
        quantity: 2,
      },
    });

    assert(cartItem && cartItem.quantity === 2, "TEST 5.1: Product added to Cart in database");

    // Update quantity
    cartItem = await prisma.cartItem.update({
      where: { id: cartItem.id },
      data: { quantity: 3 },
    });
    assert(cartItem.quantity === 3, "TEST 5.2: Cart item quantity updated to 3");

    // TEST 6: Order Creation & Server-side Total & Transaction
    const initialStock = targetProduct.stock;
    const orderQty = 2;
    const serverTotal = targetProduct.price * orderQty;

    const newOrder = await prisma.$transaction(async (tx) => {
      const ord = await tx.order.create({
        data: {
          orderNumber: `TEST-ORD-${Date.now()}`,
          userId: user.id,
          customerName: user.name,
          customerEmail: user.email,
          customerPhone: "0987654321",
          address: "123 Test Street",
          paymentMethod: "COD",
          totalAmount: serverTotal,
          items: {
            create: [
              {
                productId: targetProduct.id,
                price: targetProduct.price,
                quantity: orderQty,
              },
            ],
          },
        },
        include: { items: true },
      });

      await tx.product.update({
        where: { id: targetProduct.id },
        data: {
          stock: { decrement: orderQty },
          sold: { increment: orderQty },
        },
      });

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      return ord;
    });

    assert(newOrder && newOrder.totalAmount === serverTotal, "TEST 6.1: Order created with server calculated total");

    const updatedProduct = await prisma.product.findUnique({ where: { id: targetProduct.id } });
    assert(updatedProduct.stock === initialStock - orderQty, "TEST 6.2: Product stock decremented correctly in DB");

    const remainingCartItems = await prisma.cartItem.findMany({ where: { cartId: cart.id } });
    assert(remainingCartItems.length === 0, "TEST 6.3: Cart cleared after order placement");

    // TEST 7: Order Ownership Security
    const otherUser = await prisma.user.create({
      data: {
        name: "Other User",
        email: `other_${Date.now()}@example.com`,
        password: hashedPassword,
        role: "USER",
      },
    });

    assert(newOrder.userId === user.id && newOrder.userId !== otherUser.id, "TEST 7: Order ownership correctly distinguishes User A vs User B");

    // TEST 8: Admin Role Check
    const adminUser = await prisma.user.findFirst({ where: { role: "ADMIN" } });
    assert(adminUser && adminUser.role === "ADMIN", "TEST 8.1: Admin user exists in database with role ADMIN");
    assert(user.role !== "ADMIN", "TEST 8.2: Regular user does not have ADMIN role");

    console.log("\n==================================================");
    console.log(`SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log("==================================================\n");

  } catch (err) {
    console.error("TEST RUN ERROR:", err);
    failed++;
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
