/**
 * One-time repair: unpaid Razorpay orders stuck as ORDER_PLACED → PAYMENT_FAILED.
 *
 * Usage (from project root, with MONGODB_URI already in the environment):
 *   MONGODB_URI='...' node scripts/fix-unpaid-razorpay-orders.js
 *
 * Or open the store Orders page once — listing auto-heals these rows.
 */
const mongoose = require('mongoose')

async function main() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI
  if (!uri) {
    console.error('Set MONGODB_URI in the environment, then re-run.')
    process.exit(1)
  }

  await mongoose.connect(uri)
  const Order = mongoose.connection.collection('orders')

  const filter = {
    paymentMethod: 'RAZORPAY',
    isPaid: { $ne: true },
    status: { $in: ['ORDER_PLACED', null, ''] },
  }

  const count = await Order.countDocuments(filter)
  console.log(`Unpaid Razorpay stuck as Order Placed: ${count}`)

  const result = await Order.updateMany(filter, {
    $set: {
      status: 'PAYMENT_FAILED',
      paymentStatus: 'failed',
      isPaid: false,
      paymentFailureReason: 'Backfilled: card/online payment never completed',
      paymentFailedAt: new Date(),
    },
  })

  console.log(`Updated matched=${result.matchedCount} modified=${result.modifiedCount}`)
  await mongoose.disconnect()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
