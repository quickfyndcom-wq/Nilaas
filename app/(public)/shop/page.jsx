"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import ProductCard from "@/components/ProductCard";
import { FilterIcon, XIcon, SlidersHorizontal } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSelector } from "react-redux";

function levenshtein(a, b) {
  const matrix = Array(a.length + 1)
    .fill(null)
    .map(() => Array(b.length + 1).fill(null));
  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[a.length][b.length];
}

function formatCategoryLabel(value) {
  return String(value || "")
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function ShopSidebar({
  categories,
  filters,
  setFilters,
  activeFilterCount,
  onClear,
  className = "",
}) {
  const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || "₹";

  return (
    <aside className={className}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-serif text-xl text-[#2a1210]">Filters</h2>
        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="text-xs uppercase tracking-[0.14em] text-[#6b2f28] hover:text-[#2a1210] transition"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="space-y-8">
        <section>
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9a7d72] mb-3">
            Category
          </h3>
          <ul className="space-y-1">
            <li>
              <button
                type="button"
                onClick={() => setFilters((prev) => ({ ...prev, categories: [] }))}
                className={`w-full text-left px-3 py-2 text-sm transition ${
                  filters.categories.length === 0
                    ? "bg-[#2a1210] text-[#faf7f4]"
                    : "text-[#2a1210] hover:bg-[#2a1210]/5"
                }`}
              >
                All styles
              </button>
            </li>
            {categories.map((cat) => {
              const active = filters.categories.includes(cat);
              return (
                <li key={cat}>
                  <button
                    type="button"
                    onClick={() =>
                      setFilters((prev) => ({
                        ...prev,
                        categories: active
                          ? prev.categories.filter((c) => c !== cat)
                          : [...prev.categories, cat],
                      }))
                    }
                    className={`w-full flex items-center justify-between gap-2 text-left px-3 py-2 text-sm transition ${
                      active
                        ? "bg-[#2a1210] text-[#faf7f4]"
                        : "text-[#2a1210] hover:bg-[#2a1210]/5"
                    }`}
                  >
                    <span>{formatCategoryLabel(cat)}</span>
                    {active && <XIcon size={14} className="shrink-0 opacity-80" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        <section>
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9a7d72] mb-3">
            Price
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="sr-only">Min price</span>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#9a7d72]">
                  {currency}
                </span>
                <input
                  type="number"
                  min={0}
                  value={filters.priceRange[0]}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      priceRange: [Number(e.target.value) || 0, prev.priceRange[1]],
                    }))
                  }
                  className="w-full border border-[#2a1210]/15 bg-white pl-7 pr-2 py-2 text-sm text-[#2a1210] focus:outline-none focus:border-[#2a1210]"
                  placeholder="Min"
                />
              </div>
            </label>
            <label className="block">
              <span className="sr-only">Max price</span>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#9a7d72]">
                  {currency}
                </span>
                <input
                  type="number"
                  min={0}
                  value={filters.priceRange[1]}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      priceRange: [prev.priceRange[0], Number(e.target.value) || 0],
                    }))
                  }
                  className="w-full border border-[#2a1210]/15 bg-white pl-7 pr-2 py-2 text-sm text-[#2a1210] focus:outline-none focus:border-[#2a1210]"
                  placeholder="Max"
                />
              </div>
            </label>
          </div>
          <input
            type="range"
            min={0}
            max={100000}
            step={100}
            value={filters.priceRange[1]}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                priceRange: [prev.priceRange[0], Number(e.target.value)],
              }))
            }
            className="mt-4 w-full accent-[#2a1210]"
          />
          <p className="mt-2 text-xs text-[#6b2f28]">
            Up to {currency}
            {Number(filters.priceRange[1]).toLocaleString("en-IN")}
          </p>
        </section>

        <section>
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9a7d72] mb-3">
            Availability
          </h3>
          <label className="flex items-center gap-3 cursor-pointer text-sm text-[#2a1210]">
            <input
              type="checkbox"
              checked={filters.inStock}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, inStock: e.target.checked }))
              }
              className="h-4 w-4 accent-[#2a1210] border-[#2a1210]/30"
            />
            In stock only
          </label>
        </section>
      </div>
    </aside>
  );
}

function ShopContent() {
  const searchParams = useSearchParams();
  const search = searchParams.get("search");
  const category = searchParams.get("category");
  const router = useRouter();
  const products = useSelector((state) => state.product.list);

  const [filters, setFilters] = useState({
    priceRange: [0, 100000],
    categories: category ? [category] : [],
    inStock: false,
  });
  const [sortBy, setSortBy] = useState("newest");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    if (category) {
      setFilters((prev) => ({
        ...prev,
        categories: prev.categories.includes(category)
          ? prev.categories
          : [category],
      }));
    }
  }, [category]);

  const categories = useMemo(() => {
    const cats = new Set();
    products.forEach((p) => p.category && cats.add(p.category));
    return Array.from(cats).sort();
  }, [products]);

  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    if (filters.categories.length > 0) {
      filtered = filtered.filter((p) => filters.categories.includes(p.category));
    }

    filtered = filtered.filter(
      (p) =>
        Number(p.price) >= filters.priceRange[0] &&
        Number(p.price) <= filters.priceRange[1]
    );

    if (filters.inStock) {
      filtered = filtered.filter((p) => (p.stockQuantity ?? p.stock ?? 1) > 0);
    }

    if (search) {
      const searchTerm = search.toLowerCase();
      filtered = filtered.filter((p) => {
        const productName = String(p.name || "").toLowerCase();
        return (
          productName.includes(searchTerm) ||
          levenshtein(productName, searchTerm) <= 2
        );
      });
    }

    switch (sortBy) {
      case "price-low":
        filtered.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        filtered.sort((a, b) => b.price - a.price);
        break;
      case "name":
        filtered.sort((a, b) => String(a.name).localeCompare(String(b.name)));
        break;
      default:
        filtered.sort(
          (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
        );
    }

    return filtered;
  }, [products, filters, sortBy, search]);

  const pageTitle = search
    ? `Search: ${search}`
    : filters.categories.length === 1
      ? formatCategoryLabel(filters.categories[0])
      : filters.categories.length > 1
        ? "Selected styles"
        : "Shop";

  const activeFilterCount =
    filters.categories.length +
    (filters.inStock ? 1 : 0) +
    (filters.priceRange[0] > 0 || filters.priceRange[1] < 100000 ? 1 : 0);

  const clearFilters = () => {
    setFilters({ priceRange: [0, 100000], categories: [], inStock: false });
    router.push("/shop");
  };

  return (
    <div className="relative min-h-screen bg-white text-[#2a1210]">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="mb-8 md:mb-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#9a7d72] mb-2">
            Nilaas
          </p>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <h1 className="font-serif text-3xl sm:text-4xl md:text-[2.75rem] leading-tight text-[#2a1210]">
              {pageTitle}
              <span className="ml-3 font-sans text-base sm:text-lg font-normal text-[#9a7d72] align-middle">
                {filteredProducts.length}{" "}
                {filteredProducts.length === 1 ? "piece" : "pieces"}
              </span>
            </h1>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(true)}
                className="lg:hidden inline-flex items-center gap-2 h-11 px-4 border border-[#2a1210] text-sm font-semibold tracking-wide"
              >
                <SlidersHorizontal size={16} />
                Filters
                {activeFilterCount > 0 && (
                  <span className="ml-0.5 min-w-[1.25rem] h-5 px-1.5 bg-[#2a1210] text-[#faf7f4] text-xs flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              <label className="flex items-center gap-2 text-sm text-[#6b2f28]">
                <span className="hidden sm:inline text-[11px] uppercase tracking-[0.14em]">
                  Sort
                </span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="h-11 border border-[#2a1210]/20 bg-white px-3 text-sm text-[#2a1210] focus:outline-none focus:border-[#2a1210]"
                >
                  <option value="newest">Newest</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="name">Name A–Z</option>
                </select>
              </label>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)] gap-8 lg:gap-10">
          <ShopSidebar
            categories={categories}
            filters={filters}
            setFilters={setFilters}
            activeFilterCount={activeFilterCount}
            onClear={clearFilters}
            className="hidden lg:block sticky top-28 self-start border border-[#2a1210]/10 bg-white p-5"
          />

          <div>
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap gap-2 mb-5">
                {filters.categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() =>
                      setFilters((prev) => ({
                        ...prev,
                        categories: prev.categories.filter((c) => c !== cat),
                      }))
                    }
                    className="inline-flex items-center gap-1.5 border border-[#2a1210]/25 px-3 py-1.5 text-xs text-[#2a1210] hover:bg-[#2a1210] hover:text-[#faf7f4] transition"
                  >
                    {formatCategoryLabel(cat)}
                    <XIcon size={12} />
                  </button>
                ))}
                {(filters.priceRange[0] > 0 || filters.priceRange[1] < 100000) && (
                  <button
                    type="button"
                    onClick={() =>
                      setFilters((prev) => ({
                        ...prev,
                        priceRange: [0, 100000],
                      }))
                    }
                    className="inline-flex items-center gap-1.5 border border-[#2a1210]/25 px-3 py-1.5 text-xs text-[#2a1210] hover:bg-[#2a1210] hover:text-[#faf7f4] transition"
                  >
                    ₹{filters.priceRange[0].toLocaleString("en-IN")} – ₹
                    {filters.priceRange[1].toLocaleString("en-IN")}
                    <XIcon size={12} />
                  </button>
                )}
                {filters.inStock && (
                  <button
                    type="button"
                    onClick={() =>
                      setFilters((prev) => ({ ...prev, inStock: false }))
                    }
                    className="inline-flex items-center gap-1.5 border border-[#2a1210]/25 px-3 py-1.5 text-xs text-[#2a1210] hover:bg-[#2a1210] hover:text-[#faf7f4] transition"
                  >
                    In stock
                    <XIcon size={12} />
                  </button>
                )}
              </div>
            )}

            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-3 gap-y-8 sm:gap-x-5 sm:gap-y-10 mb-24">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product._id || product.id}
                    product={product}
                  />
                ))}
              </div>
            ) : (
              <div className="border border-[#2a1210]/10 bg-white px-6 py-16 text-center mb-24">
                <p className="font-serif text-2xl text-[#2a1210] mb-2">
                  No pieces found
                </p>
                <p className="text-sm text-[#6b2f28] mb-6">
                  Try clearing filters or browsing all styles.
                </p>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex h-11 px-6 bg-[#2a1210] text-[#faf7f4] text-sm font-semibold tracking-wide hover:bg-[#4a221c] transition"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile filter drawer */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close filters"
            className="absolute inset-0 bg-[#2a1210]/40"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-[min(88vw,320px)] bg-white shadow-xl flex flex-col animate-in slide-in-from-left">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#2a1210]/10">
              <span className="inline-flex items-center gap-2 font-serif text-xl text-[#2a1210]">
                <FilterIcon size={18} />
                Filters
              </span>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="p-2 text-[#2a1210] hover:bg-[#2a1210]/5"
                aria-label="Close"
              >
                <XIcon size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-5">
              <ShopSidebar
                categories={categories}
                filters={filters}
                setFilters={setFilters}
                activeFilterCount={activeFilterCount}
                onClear={clearFilters}
              />
            </div>
            <div className="p-4 border-t border-[#2a1210]/10">
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="w-full h-12 bg-[#2a1210] text-[#faf7f4] text-sm font-semibold tracking-wide"
              >
                Show {filteredProducts.length}{" "}
                {filteredProducts.length === 1 ? "piece" : "pieces"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Shop() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] flex items-center justify-center bg-white text-[#9a7d72] text-sm">
          Loading shop…
        </div>
      }
    >
      <ShopContent />
    </Suspense>
  );
}
