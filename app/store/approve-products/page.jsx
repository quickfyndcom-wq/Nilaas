'use client'

export default function ApproveProductsPage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Product Approval</h1>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <p className="text-blue-800">
          Product auto-approval is enabled. All products are automatically approved when added by store owners.
        </p>
      </div>
    </div>
  )
}
