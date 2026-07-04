"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, AlertCircle, Search } from "lucide-react";
import ListingCard from "@/components/listings/ListingCard";
import { ListingCardSkeleton } from "@/components/listings/ListingSkeleton";
import { searchListings } from "@/lib/api";
import type { Listing } from "@/types/listing";

const LIMIT = 12;
const CAPACITY_OPTIONS = [
  { label: "أي", value: "" },
  { label: "+50", value: "50" },
  { label: "+100", value: "100" },
  { label: "+200", value: "200" },
  { label: "+300", value: "300" },
  { label: "+500", value: "500" },
];

interface Filters {
  city: string;
  minCapacity: string;
  priceFrom: string;
  priceTo: string;
}

const defaultFilters: Filters = { city: "", minCapacity: "", priceFrom: "", priceTo: "" };

export default function EventHallsClient() {
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [listings, setListings] = useState<Listing[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const buildParams = useCallback(
    (f: Filters, pg: number) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const params: Record<string, any> = {
        page: pg,
        limit: LIMIT,
        propertyType: "event_hall",
      };
      if (f.city) params.city = f.city;
      if (f.minCapacity) params.maxGuests = f.minCapacity;
      if (f.priceFrom) params.priceFrom = f.priceFrom;
      if (f.priceTo) params.priceTo = f.priceTo;
      return params;
    },
    []
  );

  const fetchListings = useCallback(
    async (currentPage = 1) => {
      setLoading(true);
      setError(null);
      try {
        const data = await searchListings(buildParams(filters, currentPage));
        setListings(data.listings ?? []);
        setTotal(data.total ?? 0);
        setTotalPages(data.totalPages ?? 1);
        setPage(currentPage);
      } catch {
        setError("حدث خطأ في تحميل القاعات. يرجى المحاولة مرة أخرى.");
      } finally {
        setLoading(false);
      }
    },
    [filters, buildParams]
  );

  useEffect(() => {
    fetchListings(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function goToPage(p: number) {
    if (p < 1 || p > totalPages) return;
    fetchListings(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="flex-1 bg-[#F9F9F9]">
      {/* Filter panel */}
      <div className="bg-white border-b border-gray-100 py-5 px-4">
        <div className="max-w-7xl mx-auto flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">المدينة</label>
              <input
                type="text"
                value={filters.city}
                onChange={(e) => setFilters((f) => ({ ...f, city: e.target.value }))}
                placeholder="ابحث بالمدينة..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-[#F5A623] outline-none"
              />
            </div>
            <div className="flex gap-2 items-end">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">من (ريال)</label>
                <input
                  type="number"
                  value={filters.priceFrom}
                  onChange={(e) => setFilters((f) => ({ ...f, priceFrom: e.target.value }))}
                  className="w-28 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-[#F5A623] outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">إلى (ريال)</label>
                <input
                  type="number"
                  value={filters.priceTo}
                  onChange={(e) => setFilters((f) => ({ ...f, priceTo: e.target.value }))}
                  className="w-28 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-[#F5A623] outline-none"
                />
              </div>
              <button
                onClick={() => fetchListings(1)}
                className="h-[38px] px-5 flex items-center gap-1.5 bg-[#F5A623] hover:bg-[#E09400] text-white font-bold rounded-xl text-sm transition-colors"
              >
                <Search size={15} /> بحث
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">الطاقة الاستيعابية</label>
            <div className="flex flex-wrap gap-2">
              {CAPACITY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setFilters((f) => ({ ...f, minCapacity: opt.value }))}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    filters.minCapacity === opt.value
                      ? "bg-[#F5A623] border-[#F5A623] text-white"
                      : "border-gray-200 text-gray-600"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center">
              <AlertCircle size={28} className="text-red-400" />
            </div>
            <p className="text-[#717171] text-center">{error}</p>
            <button
              onClick={() => fetchListings(page)}
              className="px-6 py-2.5 bg-[#F5A623] text-white font-semibold rounded-xl text-sm hover:bg-[#E09400] transition-colors"
            >
              إعادة المحاولة
            </button>
          </div>
        )}

        {loading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: LIMIT }).map((_, i) => (
              <ListingCardSkeleton key={i} />
            ))}
          </div>
        )}

        {!loading && !error && listings.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <span className="text-6xl">🎊</span>
            <h3 className="text-xl font-bold text-[#222222]">لا توجد نتائج</h3>
            <p className="text-[#717171] max-w-sm">
              لم نجد قاعات تطابق بحثك. جرّب تغيير الفلاتر.
            </p>
          </div>
        )}

        {!loading && !error && listings.length > 0 && (
          <>
            <p className="text-sm text-gray-500 mb-4">{total.toLocaleString("ar-SA")} نتيجة</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} hrefBase="/event-halls" />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-12">
                <button
                  onClick={() => goToPage(page - 1)}
                  disabled={page === 1}
                  className="p-2 rounded-xl border border-gray-200 disabled:opacity-40 hover:border-[#F5A623] hover:text-[#F5A623] transition-all"
                >
                  <ChevronRight size={18} />
                </button>

                {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => {
                  const pageNum = i + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => goToPage(pageNum)}
                      className={`w-10 h-10 rounded-xl text-sm font-semibold transition-all ${
                        page === pageNum
                          ? "bg-[#F5A623] text-white shadow-md"
                          : "border border-gray-200 text-gray-600 hover:border-[#F5A623] hover:text-[#F5A623]"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={() => goToPage(page + 1)}
                  disabled={page === totalPages}
                  className="p-2 rounded-xl border border-gray-200 disabled:opacity-40 hover:border-[#F5A623] hover:text-[#F5A623] transition-all"
                >
                  <ChevronLeft size={18} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
