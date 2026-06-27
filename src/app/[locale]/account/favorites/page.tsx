'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, Maximize2, Bed, Bath } from 'lucide-react';
import { getFavorites, toggleFavorite } from '@/lib/api';
import { formatPrice, formatAdNumber } from '@/lib/format';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FavItem = any;

export default function FavoritesPage() {
  const [items, setItems] = useState<FavItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<Set<string>>(new Set());

  useEffect(() => {
    getFavorites({ limit: 50 })
      .then((res) => {
        // Response may nest the listing inside a `listing` or `target` field
        const raw = (res.data as FavItem[]) ?? [];
        setItems(raw);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleUnfavorite(id: string) {
    setRemoving((s) => new Set(s).add(id));
    try {
      await toggleFavorite('listing', id);
      // Fade then remove
      setTimeout(() => {
        setItems((prev) => prev.filter((item) => {
          const itemId = item.listing?.id ?? item.id ?? item.targetId;
          return itemId !== id;
        }));
        setRemoving((s) => { const n = new Set(s); n.delete(id); return n; });
      }, 300);
    } catch {
      setRemoving((s) => { const n = new Set(s); n.delete(id); return n; });
    }
  }

  // Normalize — favorites endpoint may return the listing directly or nested
  function normalize(item: FavItem) {
    const l = item.listing ?? item;
    return {
      id: l.id ?? l.objectID ?? '',
      title: l.title ?? '',
      price: String(l.totalPrice ?? l.price ?? 0),
      area: l.area ? parseFloat(String(l.area)) : undefined,
      bedrooms: l.bedrooms,
      bathrooms: l.bathrooms,
      city: l.city ?? '',
      district: l.district,
      category: l.categoryName ?? l.category?.nameAr ?? l.category ?? '',
      coverPhoto: l.coverPhoto ?? null,
      isGolden: l.isGolden ?? false,
      isPromoted: l.isPromoted ?? false,
      adNumber: l.adNumber,
      listingType: l.listingType ?? '',
    };
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        <h1 className="text-2xl font-black text-[#222222] mb-6">المفضلة</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl overflow-hidden animate-pulse">
              <div className="aspect-[4/3] bg-gray-200" />
              <div className="p-4 space-y-2">
                <div className="h-3 bg-gray-200 rounded w-1/2" />
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-200 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        <h1 className="text-2xl font-black text-[#222222] mb-6">المفضلة</h1>
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <Heart size={64} className="text-gray-200" strokeWidth={1.5} />
          <h3 className="text-xl font-bold text-[#222222]">لا توجد إعلانات في المفضلة بعد</h3>
          <p className="text-[#717171] text-sm">احفظ الإعلانات التي تعجبك لتجدها هنا</p>
          <Link
            href="/listings"
            className="mt-2 bg-[#F5A623] hover:bg-[#E09400] text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-colors"
          >
            استعرض الإعلانات
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-[#222222]">المفضلة</h1>
        <span className="text-sm text-[#717171]">{items.length} إعلان</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {items.map((raw) => {
          const l = normalize(raw);
          const isRemoving = removing.has(l.id);

          return (
            <div
              key={l.id}
              className="transition-all duration-300"
              style={{ opacity: isRemoving ? 0 : 1, transform: isRemoving ? 'scale(0.95)' : 'scale(1)' }}
            >
              <Link
                href={`/listings/${l.id}`}
                className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all overflow-hidden flex flex-col"
              >
                {/* Photo */}
                <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
                  {l.coverPhoto ? (
                    <Image
                      src={l.coverPhoto} alt={l.title} fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                      <span className="text-5xl opacity-30">🏠</span>
                    </div>
                  )}

                  {l.isGolden && (
                    <span className="absolute top-3 start-3 bg-yellow-400 text-yellow-900 text-[11px] font-bold px-2 py-0.5 rounded-full">⭐ ذهبي</span>
                  )}

                  {/* Unfavorite button */}
                  <button
                    onClick={(e) => { e.preventDefault(); handleUnfavorite(l.id); }}
                    disabled={isRemoving}
                    className="absolute top-3 end-3 w-7 h-7 flex items-center justify-center rounded-full bg-white/90 hover:bg-white shadow transition-all"
                  >
                    <Heart size={14} className="fill-red-500 text-red-500" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-4 flex flex-col gap-2 flex-1">
                  <p className="text-xs text-[#717171]">
                    {l.city}{l.district ? ` · ${l.district}` : ''}{l.category ? ` · ${l.category}` : ''}
                  </p>
                  <h3 className="text-sm font-semibold text-[#222222] line-clamp-2">{l.title}</h3>
                  <p className="text-base font-black text-[#F5A623] mt-auto">{formatPrice(l.price)}</p>
                  {(l.area || l.bedrooms || l.bathrooms) && (
                    <div className="flex items-center gap-3 text-xs text-[#717171]">
                      {l.area && <span className="flex items-center gap-1"><Maximize2 size={12} />{l.area} م²</span>}
                      {l.bedrooms > 0 && <span className="flex items-center gap-1"><Bed size={12} />{l.bedrooms}</span>}
                      {l.bathrooms > 0 && <span className="flex items-center gap-1"><Bath size={12} />{l.bathrooms}</span>}
                    </div>
                  )}
                  {l.adNumber && <p className="text-[10px] text-gray-400">{formatAdNumber(l.adNumber)}</p>}
                </div>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
