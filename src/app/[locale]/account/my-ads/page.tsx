'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from '@/i18n/navigation';
import { MoreVertical, ExternalLink, PauseCircle, Trash2, Plus, AlertCircle } from 'lucide-react';
import { getMyListings, patchListingStatus, deleteListing } from '@/lib/api';
import { formatPrice, formatAdNumber } from '@/lib/format';

const STATUS_TABS = [
  { label: 'الكل',           value: '' },
  { label: 'منشور',          value: 'published' },
  { label: 'قيد المراجعة',  value: 'pending' },
  { label: 'موقوف',          value: 'paused' },
  { label: 'مسودة',          value: 'draft' },
  { label: 'منتهي',          value: 'expired' },
];

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  published:   { label: 'منشور',         className: 'bg-green-100 text-green-700' },
  pending:     { label: 'قيد المراجعة', className: 'bg-yellow-100 text-yellow-700' },
  paused_temp: { label: 'موقوف مؤقتاً', className: 'bg-orange-100 text-orange-700' },
  paused:      { label: 'موقوف',         className: 'bg-orange-100 text-orange-700' },
  draft:       { label: 'مسودة',         className: 'bg-gray-100 text-gray-600' },
  expired:     { label: 'منتهي',         className: 'bg-red-100 text-red-600' },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MyListing = any;

interface ConfirmState {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
}

export default function MyAdsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('');
  const [listings, setListings] = useState<MyListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState>({ open: false, title: '', message: '', onConfirm: () => {} });
  const menuRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async (status: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await getMyListings({ status: status || undefined, limit: 50 });
      setListings((res.data as MyListing[]) ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'حدث خطأ');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(activeTab); }, [activeTab, load]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function askConfirm(title: string, message: string, onConfirm: () => void) {
    setConfirm({ open: true, title, message, onConfirm });
    setOpenMenu(null);
  }

  async function handlePause(id: string) {
    askConfirm('إيقاف مؤقت', 'هل تريد إيقاف هذا الإعلان مؤقتاً؟', async () => {
      setConfirm((c) => ({ ...c, open: false }));
      try {
        await patchListingStatus(id, 'paused_temp');
        setListings((prev) => prev.map((l) => l.id === id ? { ...l, status: 'paused_temp' } : l));
      } catch (e: unknown) {
        alert(e instanceof Error ? e.message : 'حدث خطأ');
      }
    });
  }

  async function handleDelete(id: string) {
    askConfirm('حذف الإعلان', 'هل تريد حذف هذا الإعلان نهائياً؟ لا يمكن التراجع عن هذا الإجراء.', async () => {
      setConfirm((c) => ({ ...c, open: false }));
      try {
        await deleteListing(id);
        setListings((prev) => prev.filter((l) => l.id !== id));
      } catch (e: unknown) {
        alert(e instanceof Error ? e.message : 'حدث خطأ');
      }
    });
  }

  const coverOf = (l: MyListing): string | null =>
    l.coverPhoto ?? l.__media__?.[0]?.url ?? null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-[#222222]">إعلاناتي</h1>
        <Link
          href="/add-listing"
          className="flex items-center gap-2 bg-[#F5A623] hover:bg-[#E09400] text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-colors"
        >
          <Plus size={16} /> إضافة إعلان جديد
        </Link>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 mb-6">
        {STATUS_TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setActiveTab(t.value)}
            className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium border transition-all ${
              activeTab === t.value
                ? 'bg-[#F5A623] border-[#F5A623] text-white'
                : 'border-gray-200 text-[#717171] hover:border-gray-300 bg-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 rounded-xl px-4 py-3 mb-4">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-4 animate-pulse flex gap-4">
              <div className="w-[120px] h-[80px] rounded-lg bg-gray-200 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-gray-200 rounded w-24" />
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && !error && listings.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <span className="text-6xl">📋</span>
          <h3 className="text-xl font-bold text-[#222222]">لا توجد إعلانات</h3>
          <p className="text-[#717171] text-sm">
            {activeTab ? 'لا توجد إعلانات بهذه الحالة' : 'لم تضف أي إعلان بعد'}
          </p>
          <Link
            href="/add-listing"
            className="mt-2 bg-[#F5A623] hover:bg-[#E09400] text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-colors"
          >
            أضف إعلانك الأول
          </Link>
        </div>
      )}

      {/* Listing rows */}
      {!loading && !error && listings.length > 0 && (
        <div className="space-y-3" ref={menuRef}>
          {listings.map((listing: MyListing) => {
            const statusCfg = STATUS_CONFIG[listing.status] ?? { label: listing.status, className: 'bg-gray-100 text-gray-600' };
            const cover = coverOf(listing);
            const isDraft = listing.status === 'draft';

            return (
              <div key={listing.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="flex items-center gap-4 p-4">
                  {/* Cover photo */}
                  <div className="relative w-[120px] h-[80px] rounded-lg overflow-hidden bg-gray-100 shrink-0">
                    {cover ? (
                      <Image src={cover} alt={listing.title ?? ''} fill className="object-cover" unoptimized />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl text-gray-300">🏠</div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    {listing.adNumber && (
                      <p className="text-[11px] text-gray-400 mb-0.5">{formatAdNumber(listing.adNumber)}</p>
                    )}
                    <p className="font-bold text-[#222222] text-sm leading-snug line-clamp-1">{listing.title}</p>
                    <p className="text-xs text-[#717171] mt-0.5">
                      {listing.city}{listing.category ? ` · ${listing.category?.nameAr ?? listing.category}` : ''}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-sm font-black text-[#F5A623]">
                        {formatPrice(String(listing.totalPrice ?? listing.price ?? 0))}
                      </span>
                      {listing.area && (
                        <span className="text-xs text-[#717171]">
                          {parseFloat(String(listing.area))} م²
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Status + menu */}
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${statusCfg.className}`}>
                      {statusCfg.label}
                    </span>

                    <div className="relative">
                      <button
                        onClick={() => setOpenMenu(openMenu === listing.id ? null : listing.id)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
                      >
                        <MoreVertical size={16} />
                      </button>

                      {openMenu === listing.id && (
                        <div className="absolute end-0 top-8 w-44 bg-white border border-gray-100 rounded-xl shadow-lg z-10 py-1" dir="rtl">
                          <a
                            href={`/listings/${listing.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#222222] hover:bg-gray-50"
                            onClick={() => setOpenMenu(null)}
                          >
                            <ExternalLink size={14} /> عرض الإعلان
                          </a>
                          {listing.status === 'published' && (
                            <button
                              onClick={() => handlePause(listing.id)}
                              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-orange-600 hover:bg-orange-50"
                            >
                              <PauseCircle size={14} /> إيقاف مؤقت
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(listing.id)}
                            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50"
                          >
                            <Trash2 size={14} /> حذف
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Draft warning banner */}
                {isDraft && (
                  <div className="border-t border-orange-100 bg-orange-50 px-4 py-3 flex items-center justify-between gap-3">
                    <p className="text-xs text-orange-700 flex items-center gap-1.5">
                      <span>⚠️</span>
                      أكمل بيانات الترخيص لنشر هذا الإعلان
                    </p>
                    <Link
                      href={`/account/complete-license?listingId=${listing.id}`}
                      className="shrink-0 text-xs font-bold text-[#F5A623] border border-[#F5A623] px-3 py-1.5 rounded-lg hover:bg-orange-50 transition-colors"
                    >
                      إكمال الترخيص
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Confirm dialog */}
      {confirm.open && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl" dir="rtl">
            <h3 className="text-lg font-bold text-[#222222] mb-2">{confirm.title}</h3>
            <p className="text-sm text-[#717171] mb-6">{confirm.message}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirm((c) => ({ ...c, open: false }))}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-[#717171] hover:bg-gray-50 transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={confirm.onConfirm}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 rounded-xl text-sm font-bold text-white transition-colors"
              >
                تأكيد
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
