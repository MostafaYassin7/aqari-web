"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import PhotoGallery from "@/components/listings/PhotoGallery";
import ListingCard from "@/components/listings/ListingCard";
import DescriptionClient from "@/components/listings/DescriptionClient";
import { ListingDetailSkeleton } from "@/components/listings/ListingSkeleton";
import type { ListingDetail, Listing } from "@/types/listing";
import { formatPrice, formatListingType, formatAdNumber, timeAgo } from "@/lib/format";
import { apiRequest, toggleFavorite, getSimilarListings, startChat } from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import { useRouter } from "@/i18n/navigation";
import BookingPanel from "@/components/booking/BookingPanel";
import {
  Bed, Bath, Home, Maximize2, MapPin, Star,
  MessageCircle, AlertCircle, Heart, Eye, Users, Bookmark,
  ChevronRight, Share2, Check, Clock,
  Droplets, Zap, ArrowUpDown, Sofa, ChefHat, Car, Waves, Dumbbell, ShieldCheck, Wind,
} from "lucide-react";

function WhatsAppIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

// ── Lucide feature icons — no emojis ────────────────────────────────────────
const FEATURE_ICONS: Record<string, React.ReactNode> = {
  water:       <Droplets   size={15} />,
  electricity: <Zap        size={15} />,
  elevator:    <ArrowUpDown size={15} />,
  furnished:   <Sofa       size={15} />,
  kitchen:     <ChefHat    size={15} />,
  parking:     <Car        size={15} />,
  pool:        <Waves      size={15} />,
  gym:         <Dumbbell   size={15} />,
  security:    <ShieldCheck size={15} />,
  ac:          <Wind       size={15} />,
};

const FEATURE_LABELS: Record<string, string> = {
  water: "مياه", electricity: "كهرباء", elevator: "مصعد", furnished: "مفروش",
  kitchen: "مطبخ", parking: "موقف سيارة", pool: "مسبح", gym: "صالة رياضية",
  security: "حراسة أمنية", ac: "تكييف مركزي",
};

const ROLE_LABELS: Record<string, string> = {
  OWNER: "مالك", BROKER: "وسيط عقاري", HOST: "مضيف",
};

const TYPE_STYLE: Record<string, string> = {
  sale:       "bg-blue-50 text-blue-700 border border-blue-100",
  rent_long:  "bg-emerald-50 text-emerald-700 border border-emerald-100",
  rent_short: "bg-violet-50 text-violet-700 border border-violet-100",
};

export default function ListingDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const { isLoggedIn } = useAuthStore();
  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [similar, setSimilar] = useState<Listing[]>([]);
  const [error, setError] = useState(false);
  const [favorited, setFavorited] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = await apiRequest<any>(`/listings/${id}`);

        let resolvedPhotos: string[] = [];
        if (Array.isArray(data.__media__) && data.__media__.length > 0) {
          const sorted = [...data.__media__].sort((a, b) => {
            if (a.isCover && !b.isCover) return -1;
            if (!a.isCover && b.isCover) return 1;
            return (a.order ?? 0) - (b.order ?? 0);
          });
          resolvedPhotos = sorted.map((m: { url: string }) => m.url).filter(Boolean);
        } else if (data.photos?.length) {
          resolvedPhotos = data.photos.filter(Boolean);
        } else if (data.coverPhoto) {
          resolvedPhotos = [data.coverPhoto];
        }
        setPhotos(resolvedPhotos);

        const mapped: ListingDetail = {
          id: data.id ?? id,
          title: data.title ?? "",
          description: data.description,
          price: String(data.totalPrice ?? data.price ?? 0),
          area: data.area ? parseFloat(String(data.area)) : undefined,
          bedrooms: data.bedrooms,
          bathrooms: data.bathrooms,
          livingRooms: data.livingRooms,
          city: data.city ?? "",
          district: data.district !== "string" ? data.district : undefined,
          category: data.category?.nameAr ?? data.categoryName ?? data.category ?? "",
          listingType: data.listingType ?? "",
          propertyType: data.propertyType,
          coverPhoto: resolvedPhotos[0] ?? data.coverPhoto,
          isGolden: data.isGolden ?? false,
          isPromoted: data.isPromoted ?? false,
          adNumber: data.adNumber,
          pricePerMeter: data.pricePerMeter ? String(data.pricePerMeter) : undefined,
          createdAt: data.createdAt,
          lat: parseFloat(data.latitude ?? data._geoloc?.lat ?? data.lat ?? 0) || undefined,
          lng: parseFloat(data.longitude ?? data._geoloc?.lng ?? data.lng ?? 0) || undefined,
          owner: data.__owner__
            ? { id: data.ownerId ?? "", name: data.__owner__.name, photo: data.__owner__.profilePhoto, phone: data.__owner__.phone }
            : { id: data.ownerId ?? "", name: data.ownerName, photo: data.ownerPhoto, phone: data.ownerPhone, rating: data.ownerRating, reviewCount: data.ownerReviewCount },
          features: {
            furnished: data.isFurnished ?? data.features?.furnished,
            elevator: data.hasElevator ?? data.features?.elevator,
            water: data.hasWater ?? data.features?.water,
            electricity: data.hasElectricity ?? data.features?.electricity,
            parking: data.hasParking ?? data.features?.parking,
            pool: data.hasPool ?? data.features?.pool,
            gym: data.hasGym ?? data.features?.gym,
            ac: data.hasAC ?? data.features?.ac,
            kitchen: data.hasKitchen ?? data.features?.kitchen,
          },
          __owner__: data.__owner__,
          stats: data.stats,
          latitude: data.latitude,
          longitude: data.longitude,
          maxGuests: data.maxGuests,
          minNights: data.minNights,
          checkInTime: data.checkInTime,
          checkOutTime: data.checkOutTime,
        };
        setListing(mapped);
      } catch {
        setError(true);
      }
    }

    async function loadSimilar() {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = await getSimilarListings(id) as any[];
        const mapped: Listing[] = data.map((d) => ({
          id: d.id ?? d.objectID ?? "",
          title: d.title ?? "",
          price: String(d.totalPrice ?? d.price ?? 0),
          area: d.area ? parseFloat(String(d.area)) : undefined,
          bedrooms: d.bedrooms,
          bathrooms: d.bathrooms,
          city: d.city ?? "",
          category: d.categoryName ?? "",
          listingType: d.listingType ?? "",
          coverPhoto: d.coverPhoto,
          isGolden: d.isGolden ?? false,
          isPromoted: d.isPromoted ?? false,
        }));
        setSimilar(mapped);
      } catch { /* not critical */ }
    }

    load();
    loadSimilar();
  }, [id]);

  async function handleFavorite() {
    if (!isLoggedIn) { router.push(`/login?redirect=/listings/${id}`); return; }
    if (favLoading) return;
    setFavLoading(true);
    try { const res = await toggleFavorite("listing", id); setFavorited(res.isFavorited); }
    catch { /* silent */ } finally { setFavLoading(false); }
  }

  async function handleChat() {
    if (!isLoggedIn) { router.push(`/login?redirect=/listings/${id}`); return; }
    if (!listing?.owner?.id || chatLoading) return;
    setChatLoading(true);
    try {
      const res = await startChat({ participantId: listing.owner.id, listingId: id });
      router.push(`/account/chat?chatId=${res.id}`);
    } catch { /* silent */ } finally { setChatLoading(false); }
  }

  async function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: listing?.title ?? "عقار", url }); } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(url).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  if (error) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center py-32 px-4 text-center">
        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-5">
          <AlertCircle size={28} className="text-red-400" />
        </div>
        <h1 className="text-xl font-bold text-[#222222] mb-3">تعذّر تحميل العقار</h1>
        <p className="text-[#717171] mb-8 max-w-sm text-sm">يرجى العودة للقائمة والمحاولة مجدداً.</p>
        <Link href="/listings" className="bg-[#F5A623] hover:bg-[#E09400] text-white font-bold px-8 py-3 rounded-2xl transition-colors">
          تصفح العقارات
        </Link>
      </main>
    );
  }

  if (!listing) return <ListingDetailSkeleton />;

  const enabledFeatures = listing.features
    ? Object.entries(listing.features).filter(([, v]) => v === true)
    : [];
  const ownerPhone = listing.__owner__?.phone ?? listing.owner?.phone;
  const ownerRole = listing.__owner__?.role;
  const stats = listing.stats;
  const typeStyle = TYPE_STYLE[listing.listingType] ?? "bg-gray-50 text-gray-600 border border-gray-100";
  const isDailyRental = listing.listingType === "rent_short" && listing.propertyType !== "event_hall";
  const bookingListing = {
    ...listing,
    totalPrice: listing.price,
    __owner__: listing.__owner__
      ? { ...listing.__owner__, id: listing.owner?.id }
      : undefined,
  };

  // ── Contact buttons (reused in sidebar + mobile bar) ──────────────────────
  const contactButtons = (size: "sm" | "lg" = "lg") => (
    <div className={size === "lg" ? "flex flex-col gap-3" : "flex flex-col gap-2"}>
      {ownerPhone && (
        <a
          href={`https://wa.me/${ownerPhone.replace(/\D/g, "")}`}
          target="_blank" rel="noopener noreferrer"
          className={`flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebe5d] text-white font-bold rounded-xl transition-colors ${size === "lg" ? "py-3.5 text-sm" : "py-2.5 text-xs"}`}
        >
          <WhatsAppIcon size={size === "lg" ? 17 : 15} /> واتساب
        </a>
      )}
      <button
        onClick={handleChat}
        disabled={chatLoading}
        className={`flex items-center justify-center gap-2 bg-[#F5A623] hover:bg-[#E09400] disabled:opacity-60 text-white font-bold rounded-xl transition-colors ${size === "lg" ? "py-3.5 text-sm" : "py-2.5 text-xs"}`}
      >
        {chatLoading
          ? <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
          : <><MessageCircle size={size === "lg" ? 17 : 15} /> تواصل عبر التطبيق</>}
      </button>
    </div>
  );

  return (
    <>
      <main className="min-h-screen bg-white pb-24 lg:pb-8">

        {/* Breadcrumb */}
        <div className="bg-[#F9F9F9] border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center gap-1.5 text-xs text-[#717171]">
            <Link href="/" className="hover:text-[#F5A623] transition-colors">الرئيسية</Link>
            <ChevronRight size={12} />
            <Link href="/listings" className="hover:text-[#F5A623] transition-colors">الإعلانات</Link>
            <ChevronRight size={12} />
            <span className="text-[#222222] font-medium truncate max-w-48">{listing.title}</span>
          </div>
        </div>

        {/* Gallery + action buttons */}
        <div className="relative">
          <PhotoGallery photos={photos} title={listing.title} />
          <div className="absolute top-3 start-3 z-10 flex items-center gap-2">
            <button
              onClick={handleFavorite}
              disabled={favLoading}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white/90 shadow-md hover:bg-white transition-all"
            >
              <Heart size={18} className={favorited ? "fill-red-500 text-red-500" : "text-gray-500"} />
            </button>
            <button
              onClick={handleShare}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white/90 shadow-md hover:bg-white transition-all"
            >
              {copied ? <Check size={18} className="text-green-500" /> : <Share2 size={18} className="text-gray-500" />}
            </button>
          </div>
        </div>

        {/* ── Two-column layout ───────────────────────────────────────────── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="lg:grid lg:grid-cols-[1fr_360px] lg:gap-12 lg:items-start">

            {/* ── Main content column ─────────────────────────────────────── */}
            <div className="space-y-8">

              {/* Header */}
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${typeStyle}`}>
                      {formatListingType(listing.listingType)}
                    </span>
                    {listing.isGolden && (
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-100">
                        ذهبي
                      </span>
                    )}
                    {listing.isPromoted && !listing.isGolden && (
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-orange-50 text-orange-600 border border-orange-100">
                        مميز
                      </span>
                    )}
                  </div>
                  {listing.createdAt && (
                    <span className="flex items-center gap-1 text-xs text-gray-400 shrink-0">
                      <Clock size={12} /> {timeAgo(listing.createdAt)}
                    </span>
                  )}
                </div>

                <h1 className="text-2xl sm:text-3xl font-black text-[#222222] leading-snug mb-3">
                  {listing.title}
                </h1>

                <p className="flex items-center gap-1.5 text-sm text-[#717171]">
                  <MapPin size={14} className="text-[#F5A623] shrink-0" />
                  {listing.city}
                  {listing.district ? ` · ${listing.district}` : ""}
                  {listing.category ? ` · ${listing.category}` : ""}
                </p>

                {/* Price (mobile only — desktop shows in sidebar) */}
                <div className="lg:hidden mt-4">
                  <p className="text-3xl font-black text-[#222222]">{formatPrice(listing.price)}</p>
                  {listing.pricePerMeter && (
                    <p className="text-sm text-[#717171] mt-0.5">{formatPrice(listing.pricePerMeter)} / م²</p>
                  )}
                </div>
              </div>

              {/* Stats */}
              {stats && (
                <div className="flex gap-5 text-sm text-[#717171]">
                  <span className="flex items-center gap-1.5"><Eye size={14} /> {stats.viewCount} مشاهدة</span>
                  <span className="flex items-center gap-1.5"><Users size={14} /> {stats.messageCount} تواصل</span>
                  <span className="flex items-center gap-1.5"><Bookmark size={14} /> {stats.favoriteCount} حفظ</span>
                </div>
              )}

              {/* Specs */}
              {(listing.area || listing.bedrooms !== undefined || listing.bathrooms !== undefined || listing.livingRooms !== undefined) && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {listing.area && (
                    <div className="bg-[#F9F9F9] rounded-2xl p-4 text-center">
                      <Maximize2 size={18} className="text-[#F5A623] mx-auto mb-2" />
                      <p className="text-lg font-bold text-[#222222]">{listing.area}</p>
                      <p className="text-xs text-[#717171]">م²</p>
                    </div>
                  )}
                  {listing.bedrooms !== undefined && (
                    <div className="bg-[#F9F9F9] rounded-2xl p-4 text-center">
                      <Bed size={18} className="text-[#F5A623] mx-auto mb-2" />
                      <p className="text-lg font-bold text-[#222222]">{listing.bedrooms}</p>
                      <p className="text-xs text-[#717171]">غرف نوم</p>
                    </div>
                  )}
                  {listing.bathrooms !== undefined && (
                    <div className="bg-[#F9F9F9] rounded-2xl p-4 text-center">
                      <Bath size={18} className="text-[#F5A623] mx-auto mb-2" />
                      <p className="text-lg font-bold text-[#222222]">{listing.bathrooms}</p>
                      <p className="text-xs text-[#717171]">دورات مياه</p>
                    </div>
                  )}
                  {listing.livingRooms !== undefined && (
                    <div className="bg-[#F9F9F9] rounded-2xl p-4 text-center">
                      <Home size={18} className="text-[#F5A623] mx-auto mb-2" />
                      <p className="text-lg font-bold text-[#222222]">{listing.livingRooms}</p>
                      <p className="text-xs text-[#717171]">غرف معيشة</p>
                    </div>
                  )}
                </div>
              )}

              {/* Description */}
              {listing.description && (
                <>
                  <hr className="border-gray-100" />
                  <DescriptionClient text={listing.description} />
                </>
              )}

              {/* Features */}
              {enabledFeatures.length > 0 && (
                <>
                  <hr className="border-gray-100" />
                  <div>
                    <h2 className="text-base font-bold text-[#222222] mb-4">المرافق والخدمات</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {enabledFeatures.map(([key]) => (
                        <div key={key} className="flex items-center gap-3 bg-[#F9F9F9] rounded-xl px-3.5 py-3 border border-transparent hover:border-[#F5A623]/20 transition-colors">
                          <span className="text-[#F5A623] shrink-0">{FEATURE_ICONS[key] ?? <Check size={15} />}</span>
                          <span className="text-sm font-medium text-[#222222]">{FEATURE_LABELS[key] ?? key}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Map */}
              {listing.lat && listing.lng && (
                <>
                  <hr className="border-gray-100" />
                  <div>
                    <h2 className="text-base font-bold text-[#222222] mb-4">الموقع</h2>
                    <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                      <iframe
                        src={`https://maps.google.com/maps?q=${listing.lat},${listing.lng}&z=15&output=embed`}
                        width="100%" height="280" style={{ border: 0 }}
                        loading="lazy" referrerPolicy="no-referrer-when-downgrade"
                        title="موقع العقار"
                      />
                    </div>
                    <p className="text-sm text-[#717171] mt-2 flex items-center gap-1">
                      <MapPin size={13} className="text-[#F5A623]" />
                      {listing.city}{listing.district ? ` · ${listing.district}` : ""}
                    </p>
                  </div>
                </>
              )}

              {/* Owner card */}
              {(listing.__owner__?.name ?? listing.owner?.name) && (
                <>
                  <hr className="border-gray-100" />
                  <div>
                    <h2 className="text-base font-bold text-[#222222] mb-4">المعلن</h2>
                    <div className="flex items-center gap-4 bg-[#F9F9F9] rounded-2xl p-5">
                      <div className="relative w-14 h-14 rounded-2xl overflow-hidden bg-gray-200 shrink-0">
                        {(listing.__owner__?.profilePhoto ?? listing.owner?.photo) ? (
                          <Image
                            src={listing.__owner__?.profilePhoto ?? listing.owner!.photo!}
                            alt={listing.__owner__?.name ?? listing.owner?.name ?? ""}
                            fill className="object-cover" unoptimized
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-200">
                            <span className="text-2xl font-bold text-gray-400">
                              {(listing.__owner__?.name ?? listing.owner?.name ?? "؟").charAt(0)}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-[#222222]">
                            {listing.__owner__?.name ?? listing.owner?.name}
                          </p>
                          {ownerRole && ROLE_LABELS[ownerRole] && (
                            <span className="text-xs bg-orange-50 text-[#F5A623] border border-orange-100 font-semibold px-2 py-0.5 rounded-full">
                              {ROLE_LABELS[ownerRole]}
                            </span>
                          )}
                        </div>
                        {listing.owner?.rating !== undefined && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <Star size={13} className="text-amber-400 fill-amber-400" />
                            <span className="text-sm text-[#717171]">
                              {listing.owner.rating.toFixed(1)}
                              {listing.owner.reviewCount !== undefined && ` (${listing.owner.reviewCount})`}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Similar listings */}
              {similar.length > 0 && (
                <>
                  <hr className="border-gray-100" />
                  <div>
                    <h2 className="text-base font-bold text-[#222222] mb-4">إعلانات مشابهة</h2>
                    <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4">
                      {similar.slice(0, 4).map((s) => (
                        <div key={s.id} className="shrink-0 w-64">
                          <ListingCard listing={s} showFavorite={false} />
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* ── Sticky sidebar (desktop only) ───────────────────────────── */}
            {isDailyRental ? (
              <div className="lg:sticky lg:top-24">
                <BookingPanel listing={bookingListing} onBookingSuccess={() => {}} />
              </div>
            ) : (
              <div className="hidden lg:block">
                <div className="sticky top-24 bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden">

                  {/* Price section */}
                  <div className="p-6 border-b border-gray-100">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-2xl font-black text-[#222222] leading-tight">{formatPrice(listing.price)}</p>
                        {listing.pricePerMeter && (
                          <p className="text-xs text-[#717171] mt-1">{formatPrice(listing.pricePerMeter)} / م²</p>
                        )}
                      </div>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${typeStyle}`}>
                        {formatListingType(listing.listingType)}
                      </span>
                    </div>

                    {/* Quick specs strip */}
                    {(listing.area || listing.bedrooms !== undefined || listing.bathrooms !== undefined) && (
                      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100 text-sm text-[#717171]">
                        {listing.area && (
                          <span className="flex items-center gap-1.5">
                            <Maximize2 size={14} className="text-[#F5A623]" /> {listing.area} م²
                          </span>
                        )}
                        {listing.bedrooms !== undefined && (
                          <span className="flex items-center gap-1.5">
                            <Bed size={14} className="text-[#F5A623]" /> {listing.bedrooms}
                          </span>
                        )}
                        {listing.bathrooms !== undefined && (
                          <span className="flex items-center gap-1.5">
                            <Bath size={14} className="text-[#F5A623]" /> {listing.bathrooms}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Contact buttons */}
                  <div className="p-6 space-y-3">
                    {contactButtons("lg")}
                  </div>

                  {/* Ad meta */}
                  <div className="px-6 pb-5 pt-0 flex items-center justify-between text-xs text-gray-400">
                    {listing.adNumber && <span>{formatAdNumber(listing.adNumber)}</span>}
                    {listing.createdAt && (
                      <span className="flex items-center gap-1">
                        <Clock size={11} /> {timeAgo(listing.createdAt)}
                      </span>
                    )}
                  </div>

                  {/* Share */}
                  <div className="px-6 pb-6">
                    <button
                      onClick={handleShare}
                      className="w-full flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-xl text-sm text-[#717171] hover:border-gray-300 hover:text-[#222222] transition-colors"
                    >
                      {copied ? <><Check size={15} className="text-green-500" /> تم النسخ</> : <><Share2 size={15} /> مشاركة الإعلان</>}
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </main>

      {/* Mobile sticky contact bar */}
      {!isDailyRental && (
        <div className="fixed bottom-0 start-0 end-0 z-40 bg-white border-t border-gray-100 shadow-lg px-4 py-3 lg:hidden">
          <div className="flex gap-2 max-w-lg mx-auto">
            {ownerPhone && (
              <a
                href={`https://wa.me/${ownerPhone.replace(/\D/g, "")}`}
                target="_blank" rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 bg-[#25D366] hover:bg-[#1ebe5d] text-white font-bold py-3 rounded-xl text-sm transition-colors"
              >
                <WhatsAppIcon size={16} /> واتساب
              </a>
            )}
            <button
              onClick={handleChat}
              disabled={chatLoading}
              className="flex-1 flex items-center justify-center gap-1.5 bg-[#F5A623] hover:bg-[#E09400] disabled:opacity-60 text-white font-bold py-3 rounded-xl text-sm transition-colors"
            >
              {chatLoading
                ? <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                : <><MessageCircle size={16} /> تواصل</>}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
