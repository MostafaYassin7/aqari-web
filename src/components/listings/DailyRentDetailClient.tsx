"use client";

import { useState } from "react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import {
  Bed, Bath, Home, Maximize2, MapPin, Star,
  AlertCircle, Heart, Eye, Users, Bookmark,
  ChevronRight, Share2, Check, Clock,
  Droplets, Zap, ArrowUpDown, Sofa, ChefHat, Car, Waves, Dumbbell, ShieldCheck, Wind,
} from "lucide-react";
import PhotoGallery from "@/components/listings/PhotoGallery";
import DescriptionClient from "@/components/listings/DescriptionClient";
import BookingPanel from "@/components/booking/BookingPanel";
import { formatPrice, formatListingType, formatAdNumber, timeAgo } from "@/lib/format";
import { toggleFavorite } from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import { useRouter } from "@/i18n/navigation";
import type { ListingDetail } from "@/types/listing";

const FEATURE_ICONS: Record<string, React.ReactNode> = {
  water: <Droplets size={15} />,
  electricity: <Zap size={15} />,
  elevator: <ArrowUpDown size={15} />,
  furnished: <Sofa size={15} />,
  kitchen: <ChefHat size={15} />,
  parking: <Car size={15} />,
  pool: <Waves size={15} />,
  gym: <Dumbbell size={15} />,
  security: <ShieldCheck size={15} />,
  ac: <Wind size={15} />,
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
  sale: "bg-blue-50 text-blue-700 border border-blue-100",
  rent_long: "bg-emerald-50 text-emerald-700 border border-emerald-100",
  rent_short: "bg-violet-50 text-violet-700 border border-violet-100",
};

interface Props {
  listing: ListingDetail;
  photos: string[];
}

export default function DailyRentDetailClient({ listing, photos }: Props) {
  const router = useRouter();
  const { isLoggedIn } = useAuthStore();
  const [favorited, setFavorited] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleFavorite() {
    if (!isLoggedIn) { router.push(`/login?redirect=/daily-rents/${listing.id}`); return; }
    if (favLoading) return;
    setFavLoading(true);
    try { const res = await toggleFavorite("listing", listing.id); setFavorited(res.isFavorited); }
    catch { /* silent */ } finally { setFavLoading(false); }
  }

  async function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: listing.title, url }); } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(url).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const enabledFeatures = listing.features
    ? Object.entries(listing.features).filter(([, v]) => v === true)
    : [];
  const ownerRole = listing.__owner__?.role;
  const stats = listing.stats;
  const typeStyle = TYPE_STYLE[listing.listingType] ?? "bg-gray-50 text-gray-600 border border-gray-100";
  const bookingListing = {
    ...listing,
    totalPrice: listing.price,
    __owner__: listing.__owner__
      ? { ...listing.__owner__, id: listing.owner?.id }
      : undefined,
  };

  if (!listing.id) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center py-32 px-4 text-center">
        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-5">
          <AlertCircle size={28} className="text-red-400" />
        </div>
        <h1 className="text-xl font-bold text-[#222222] mb-3">تعذّر تحميل العقار</h1>
        <p className="text-[#717171] mb-8 max-w-sm text-sm">يرجى العودة للقائمة والمحاولة مجدداً.</p>
        <Link href="/daily-rents" className="bg-[#F5A623] hover:bg-[#E09400] text-white font-bold px-8 py-3 rounded-2xl transition-colors">
          تصفح الإيجار اليومي
        </Link>
      </main>
    );
  }

  return (
    <>
      <main className="min-h-screen bg-white pb-24 lg:pb-8">

        {/* Breadcrumb */}
        <div className="bg-[#F9F9F9] border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center gap-1.5 text-xs text-[#717171]">
            <Link href="/" className="hover:text-[#F5A623] transition-colors">الرئيسية</Link>
            <ChevronRight size={12} />
            <Link href="/daily-rents" className="hover:text-[#F5A623] transition-colors">الإيجار اليومي</Link>
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

        {/* Two-column layout */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="lg:grid lg:grid-cols-[1fr_380px] lg:gap-12 lg:items-start">

            {/* Main content column */}
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
                </p>

                {listing.adNumber && (
                  <p className="text-sm text-gray-400 mt-1">{formatAdNumber(listing.adNumber)}</p>
                )}
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

              {/* Rental details */}
              <div className="bg-[#F9F9F9] rounded-xl p-4 space-y-1.5 text-sm">
                <p className="text-[#222222]">
                  <span className="text-[#717171]">السعر الليلي: </span>
                  <span className="font-bold">{formatPrice(listing.price)} / ليلة</span>
                </p>
                {listing.checkInTime && (
                  <p className="text-[#222222]">
                    <span className="text-[#717171]">وقت الوصول: </span>{listing.checkInTime}
                  </p>
                )}
                {listing.checkOutTime && (
                  <p className="text-[#222222]">
                    <span className="text-[#717171]">وقت المغادرة: </span>{listing.checkOutTime}
                  </p>
                )}
                {listing.minNights !== undefined && listing.minNights > 1 && (
                  <p className="text-[#222222]">
                    <span className="text-[#717171]">الحد الأدنى للإقامة: </span>{listing.minNights} ليالٍ
                  </p>
                )}
                {listing.maxGuests && (
                  <p className="text-[#222222]">
                    <span className="text-[#717171]">الحد الأقصى للضيوف: </span>{listing.maxGuests}
                  </p>
                )}
              </div>

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
                        {listing.owner?.lastActive && (
                          <p className="text-xs text-gray-400 mt-0.5">آخر نشاط: {listing.owner.lastActive}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Sticky sidebar (desktop) / booking sheet (mobile) */}
            <div className="lg:sticky lg:top-24">
              <BookingPanel listing={bookingListing} onBookingSuccess={() => {}} />
            </div>

          </div>
        </div>
      </main>
    </>
  );
}
