import mongoose from "mongoose";

const OrderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  name: String,
  image: String,
  price: Number,
  quantity: Number,
  // Add more fields as needed
}, { _id: false });

const OrderSchema = new mongoose.Schema({
  storeId: { type: String, required: true },
  userId: String,
  addressId: String,
  total: { type: Number, default: 0 },
  shippingFee: { type: Number, default: 0 },
  status: { type: String, default: "ORDER_PLACED" },
  paymentMethod: String,
  paymentStatus: { type: String, default: 'pending' }, // pending | paid | failed
  isPaid: { type: Boolean, default: false },
  razorpayOrderId: { type: String, index: true },
  razorpayPaymentId: String,
  razorpaySignature: String,
  isCouponUsed: { type: Boolean, default: false },
  coupon: Object,
  isGuest: { type: Boolean, default: false },
  guestName: String,
  guestEmail: String,
  guestPhone: String,
  shippingAddress: Object,
  trackingId: { type: String, index: true },
  trackingUrl: String,
  courier: String,
  delhiveryWaybill: { type: String, index: true },
  delhiveryOrderRef: String,
  delhiveryRaw: Object,
  delhiveryPickupId: String,
  delhiveryPickupDate: String,
  delhiveryPickupTime: String,
  delhiveryPickupRaw: Object,
  delhiveryLastStatus: String,
  delhiveryLastSyncedAt: Date,
  shippedAt: Date,
  deliveredAt: Date,
  shortOrderNumber: { type: Number, index: true },
  orderItems: [OrderItemSchema],
  items: Array,
}, { timestamps: true });

export default mongoose.models.Order || mongoose.model("Order", OrderSchema);
