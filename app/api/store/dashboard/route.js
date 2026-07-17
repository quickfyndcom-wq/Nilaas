import dbConnect from "@/lib/mongodb";
import { getAuth } from "firebase-admin/auth";
import Order from "@/models/Order";
import Product from "@/models/Product";
import Rating from "@/models/Rating";
import AbandonedCart from "@/models/AbandonedCart";
import authSeller from "@/middlewares/authSeller";
import { NextResponse } from "next/server";
import "@/lib/firebase-admin";

function emptyDashboard(extra = {}) {
  return {
    ratings: [],
    totalOrders: 0,
    totalEarnings: 0,
    totalProducts: 0,
    totalCustomers: 0,
    abandonedCarts: 0,
    pendingOrders: 0,
    processingOrders: 0,
    shippedOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,
    codOrders: 0,
    prepaidOrders: 0,
    avgOrderValue: 0,
    salesLast7Days: 0,
    salesLast30Days: 0,
    ordersLast7Days: 0,
    ordersLast30Days: 0,
    salesOverTime: [],
    ordersByStatus: [],
    paymentBreakdown: [],
    topProducts: [],
    recentOrders: [],
    ...extra,
  };
}

function dayKey(d) {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
}

function buildLastNDays(n) {
  const days = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    days.push({
      key: dayKey(d),
      label: d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
      orders: 0,
      revenue: 0,
    });
  }
  return days;
}

export async function GET(request) {
  try {
    const authHeader = request.headers.get("authorization");
    let userId = null;
    let userEmail = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const idToken = authHeader.split("Bearer ")[1];
      try {
        const auth = getAuth();
        const decodedToken = await auth.verifyIdToken(idToken);
        userId = decodedToken.uid;
        userEmail = decodedToken.email;

        const allowedEmail = (
          process.env.NEXT_PUBLIC_STORE_ADMIN_EMAIL ||
          process.env.NEXT_PUBLIC_ADMIN_EMAIL ||
          "quickfynd.com@gmail.com"
        ).toLowerCase();
        if (userEmail?.toLowerCase() !== allowedEmail) {
          return NextResponse.json(
            { error: `Access denied. Only ${allowedEmail} can access this dashboard.` },
            { status: 403 }
          );
        }
      } catch (e) {
        return NextResponse.json(
          { error: "Invalid or expired token. Please sign in again.", details: e.message },
          { status: 401 }
        );
      }
    } else {
      return NextResponse.json({ error: "Missing authorization header" }, { status: 401 });
    }

    let storeId = null;
    if (userId) {
      try {
        storeId = await authSeller(userId);
      } catch {
        // continue without storeId
      }
    }

    try {
      await dbConnect();
    } catch (dbError) {
      return NextResponse.json(
        { dashboardData: emptyDashboard(), error: "Database connection error" },
        { status: 200 }
      );
    }

    try {
      const orderQuery = storeId ? { storeId } : {};
      const productQuery = storeId ? { storeId } : {};
      const cartQuery = storeId ? { storeId } : {};

      const [orders, products, abandonedCarts] = await Promise.all([
        Order.find(orderQuery).sort({ createdAt: -1 }).lean(),
        Product.find(productQuery).select("name images price category slug").lean(),
        AbandonedCart.countDocuments(cartQuery),
      ]);

      const productIds = products.map((p) => p._id);
      const productMap = new Map(products.map((p) => [String(p._id), p]));
      const rawRatings = await Rating.find({
        productId: { $in: [...productIds, ...productIds.map(String)] },
      })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean();

      let userMap = new Map();
      try {
        const User = (await import("@/models/User")).default;
        const userIds = [
          ...new Set(rawRatings.map((r) => r.userId).filter(Boolean).map(String)),
        ];
        if (userIds.length) {
          const users = await User.find({ _id: { $in: userIds } })
            .select("name image email")
            .lean();
          userMap = new Map(users.map((u) => [String(u._id), u]));
        }
      } catch {
        // optional
      }

      const ratings = rawRatings.map((r) => ({
        ...r,
        review: r.review || r.comment || "",
        user: userMap.get(String(r.userId)) || null,
        product: productMap.get(String(r.productId)) || null,
      }));

      const uniqueCustomerIds = [
        ...new Set(
          orders
            .map((o) => o.userId || o.guestEmail)
            .filter((id) => id && id !== "guest")
        ),
      ];

      const statusCounts = {};
      let codOrders = 0;
      let prepaidOrders = 0;
      let totalEarnings = 0;

      for (const order of orders) {
        const st = order.status || "ORDER_PLACED";
        statusCounts[st] = (statusCounts[st] || 0) + 1;
        totalEarnings += Number(order.total) || 0;
        const pay = String(order.paymentMethod || "").toUpperCase();
        if (pay === "COD") codOrders += 1;
        else prepaidOrders += 1;
      }

      const now = Date.now();
      const day7 = now - 7 * 24 * 60 * 60 * 1000;
      const day30 = now - 30 * 24 * 60 * 60 * 1000;

      let salesLast7Days = 0;
      let salesLast30Days = 0;
      let ordersLast7Days = 0;
      let ordersLast30Days = 0;

      const salesOverTime = buildLastNDays(30);
      const byDay = Object.fromEntries(salesOverTime.map((d) => [d.key, d]));

      for (const order of orders) {
        const t = new Date(order.createdAt).getTime();
        if (Number.isNaN(t)) continue;
        const total = Number(order.total) || 0;
        if (t >= day30) {
          salesLast30Days += total;
          ordersLast30Days += 1;
        }
        if (t >= day7) {
          salesLast7Days += total;
          ordersLast7Days += 1;
        }
        const key = dayKey(order.createdAt);
        if (byDay[key]) {
          byDay[key].orders += 1;
          byDay[key].revenue += total;
        }
      }

      // Top products by quantity sold
      const productSales = new Map();
      for (const order of orders) {
        for (const item of order.orderItems || []) {
          const pid = String(item.productId?._id || item.productId || item.name || "unknown");
          const name = item.name || item.productId?.name || "Product";
          const qty = Number(item.quantity) || 1;
          const revenue = (Number(item.price) || 0) * qty;
          const prev = productSales.get(pid) || { name, qty: 0, revenue: 0 };
          prev.qty += qty;
          prev.revenue += revenue;
          if (!prev.name || prev.name === "Product") prev.name = name;
          productSales.set(pid, prev);
        }
      }
      const topProducts = [...productSales.values()]
        .sort((a, b) => b.qty - a.qty)
        .slice(0, 8)
        .map((p) => ({
          name: p.name.length > 28 ? `${p.name.slice(0, 26)}…` : p.name,
          fullName: p.name,
          qty: p.qty,
          revenue: Math.round(p.revenue),
        }));

      const ordersByStatus = Object.entries(statusCounts)
        .map(([status, count]) => ({
          status,
          label: status.replace(/_/g, " "),
          count,
        }))
        .sort((a, b) => b.count - a.count);

      const paymentBreakdown = [
        { name: "COD", value: codOrders, fill: "#b45309" },
        { name: "Prepaid", value: prepaidOrders, fill: "#047857" },
      ].filter((p) => p.value > 0);

      const recentOrders = orders.slice(0, 8).map((o) => ({
        _id: o._id,
        shortOrderNumber: o.shortOrderNumber,
        total: o.total,
        status: o.status,
        paymentMethod: o.paymentMethod,
        createdAt: o.createdAt,
        customer: o.isGuest
          ? o.guestName || o.guestEmail || "Guest"
          : o.guestName || "Customer",
        awb: o.delhiveryWaybill || (o.courier === "Delhivery" ? o.trackingId : "") || "",
      }));

      const dashboardData = {
        ratings: ratings || [],
        totalOrders: orders.length,
        totalEarnings: Math.round(totalEarnings),
        totalProducts: products.length,
        totalCustomers: uniqueCustomerIds.length,
        abandonedCarts,
        pendingOrders:
          (statusCounts.ORDER_PLACED || 0) +
          (statusCounts.CONFIRMED || 0) +
          (statusCounts.PROCESSING || 0),
        processingOrders: statusCounts.PROCESSING || 0,
        shippedOrders:
          (statusCounts.SHIPPED || 0) +
          (statusCounts.MANIFESTED || 0) +
          (statusCounts.IN_TRANSIT || 0) +
          (statusCounts.OUT_FOR_DELIVERY || 0) +
          (statusCounts.PICKED_UP || 0) +
          (statusCounts.PICKUP_REQUESTED || 0) +
          (statusCounts.WAITING_FOR_PICKUP || 0),
        deliveredOrders: statusCounts.DELIVERED || 0,
        cancelledOrders: (statusCounts.CANCELLED || 0) + (statusCounts.RTO || 0),
        codOrders,
        prepaidOrders,
        avgOrderValue: orders.length ? Math.round(totalEarnings / orders.length) : 0,
        salesLast7Days: Math.round(salesLast7Days),
        salesLast30Days: Math.round(salesLast30Days),
        ordersLast7Days,
        ordersLast30Days,
        salesOverTime: salesOverTime.map(({ label, orders: o, revenue }) => ({
          label,
          orders: o,
          revenue: Math.round(revenue),
        })),
        ordersByStatus,
        paymentBreakdown,
        topProducts,
        recentOrders,
      };

      return NextResponse.json({ dashboardData }, { status: 200 });
    } catch (queryError) {
      console.error("Dashboard query error:", queryError.message);
      return NextResponse.json(
        { dashboardData: emptyDashboard(), error: queryError.message },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("Dashboard error:", error.message);
    return NextResponse.json(
      { error: error.message, dashboardData: emptyDashboard() },
      { status: 200 }
    );
  }
}
