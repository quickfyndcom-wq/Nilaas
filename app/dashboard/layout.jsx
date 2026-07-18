import DashboardSidebar from '@/components/DashboardSidebar'

export default function DashboardLayout({ children }) {
  return (
    <div className="min-h-[70vh] bg-[#faf6f2]">
      <div className="mx-auto flex w-full max-w-6xl flex-col lg:flex-row">
        <DashboardSidebar />
        <main className="min-w-0 flex-1 px-4 py-5 sm:px-6 sm:py-8">{children}</main>
      </div>
    </div>
  )
}
