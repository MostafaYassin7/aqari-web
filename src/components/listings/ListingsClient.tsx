"use client";

import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import SearchFilters, { type FilterValues, defaultFilters } from "@/components/listings/SearchFilters";
import ListingCard from "@/components/listings/ListingCard";
import { ListingCardSkeleton } from "@/components/listings/ListingSkeleton";
import { searchListings, geoSearch } from "@/lib/api";
import type { Listing } from "@/types/listing";
import { ChevronLeft, ChevronRight, AlertCircle, Plus } from "lucide-react";
import { Link } from "@/i18n/navigation";

const ListingsMap = lazy(() => import("@/components/map/ListingsMap"));

const LIMIT = 12;

interface Props {
  forcedListingType?: string;
  hideListingType?: boolean;
}

export default function ListingsClient({ forcedListingType, hideListingType }: Props) {
  const [filters, setFilters] = useState<FilterValues>({
    ...defaultFilters,
    listingType: forcedListingType ?? "",
  });
  const [listings, setListings] = useState<Listing[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"list" | "map">("list");

  const buildParams = useCallback((f: FilterValues, pg: number) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const params: Record<string, any> = {
      page: pg,
      limit: LIMIT,
    };
    if (f.query) params.q = f.query;
    if (f.city) params.city = f.city;
    if (forcedListingType) params.listingType = forcedListingType;
    else if (f.listingType) params.listingType = f.listingType;
    if (f.propertyType) params.propertyType = f.propertyType;
    if (f.priceFrom) params.priceFrom = f.priceFrom;
    if (f.priceTo) params.priceTo = f.priceTo;
    if (f.areaFrom) params.areaFrom = f.areaFrom;
    if (f.areaTo) params.areaTo = f.areaTo;
    if (f.bedrooms) params.bedrooms = f.bedrooms === "5+" ? "5" : f.bedrooms;
    if (f.isFurnished) params.isFurnished = true;
    if (f.hasElevator) params.hasElevator = true;
    if (f.hasWater) params.hasWater = true;
    if (f.hasElectricity) params.hasElectricity = true;
    if (f.sortBy && f.sortBy !== "newest") params.sortBy = f.sortBy;
    return params;
  }, [forcedListingType]);

  const fetchListings = useCallback(async (currentPage = 1) => {
    setLoading(true);
    setError(null);
    try {
      const data = await searchListings(buildParams(filters, currentPage));
      setListings(data.listings ?? []);
      setTotal(data.total ?? 0);
      setTotalPages(data.totalPages ?? 1);
      setPage(currentPage);
    } catch {
      setError("حدث خطأ في تحميل العقارات. يرجى المحاولة مرة أخرى.");
    } finally {
      setLoading(false);
    }
  }, [filters, buildParams]);

  useEffect(() => {
    fetchListings(1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleGeoSearch(lat: number, lng: number) {
    setLoading(true);
    setError(null);
    try {
      const data = await geoSearch({
        latitude: lat,
        longitude: lng,
        listingType: (forcedListingType ?? filters.listingType) || undefined,
        propertyType: filters.propertyType || undefined,
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const hits = (data.hits ?? []) as any[];
      const mapped: Listing[] = hits.map((h) => ({
        id: h.objectID ?? h.id ?? "",
        title: h.title ?? "",
        price: String(h.totalPrice ?? 0),
        area: h.area ? parseFloat(h.area) : undefined,
        bedrooms: h.bedrooms,
        bathrooms: h.bathrooms,
        city: h.city ?? "",
        district: h.district,
        category: h.categoryName ?? "",
        listingType: h.listingType ?? "",
        propertyType: h.propertyType,
        coverPhoto: h.coverPhoto,
        isGolden: h.isGolden ?? false,
        isPromoted: h.isPromoted ?? false,
        lat: h._geoloc?.lat,
        lng: h._geoloc?.lng,
      }));
      setListings(mapped);
      setTotal(data.total ?? mapped.length);
      setTotalPages(1);
    } catch {
      setError("حدث خطأ في البحث الجغرافي.");
    } finally {
      setLoading(false);
    }
  }

  function goToPage(p: number) {
    if (p < 1 || p > totalPages) return;
    fetchListings(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <>
      <SearchFilters
        values={filters}
        onChange={setFilters}
        onSearch={() => fetchListings(1)}
        resultCount={!loading ? total : undefined}
        loading={loading}
        view={view}
        onViewChange={setView}
        hideListingType={hideListingType}
      />

      {/* Map view */}
      {view === "map" && (
        <div style={{ height: "calc(100dvh - 128px)" }} className="bg-gray-100">
          <Suspense fallback={
            <div className="w-full h-full flex items-center justify-center">
              <span className="animate-spin rounded-full h-8 w-8 border-2 border-[#F5A623] border-t-transparent" />
            </div>
          }>
            <ListingsMap listings={listings} onSearchArea={handleGeoSearch} />
          </Suspense>
        </div>
      )}

      {/* List view */}
      {view === "list" && (
        <div className="flex-1 bg-[#F9F9F9]">
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
                {Array.from({ length: LIMIT }).map((_, i) => <ListingCardSkeleton key={i} />)}
              </div>
            )}

            {!loading && !error && listings.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
                <span className="text-6xl">🏠</span>
                <h3 className="text-xl font-bold text-[#222222]">لا توجد نتائج</h3>
                <p className="text-[#717171] max-w-sm">
                  لم نجد عقارات تطابق بحثك. جرّب تغيير الفلاتر أو ابحث بكلمات مختلفة.
                </p>
              </div>
            )}

            {!loading && !error && listings.length > 0 && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {listings.map((listing) => (
                    <ListingCard key={listing.id} listing={listing} />
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
      )}

      {/* Floating add listing button */}
      <Link
        href="/add-listing"
        className="fixed bottom-6 end-5 z-40 flex items-center gap-2 bg-[#F5A623] hover:bg-[#E09400] text-white font-bold px-5 py-3.5 rounded-2xl shadow-lg hover:shadow-xl transition-all active:scale-95"
        aria-label="إضافة إعلان"
      >
        <Plus size={20} strokeWidth={2.5} />
        <span className="text-sm">إضافة إعلان</span>
      </Link>
    </>
  );
}
