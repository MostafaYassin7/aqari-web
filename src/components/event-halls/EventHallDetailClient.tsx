"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Link, useRouter } from "@/i18n/navigation";
import {
  MapPin, Heart, MessageCircle, ChevronRight, Users, Eye, Bookmark,
  Share2, Check, Clock,
} from "lucide-react";
import PhotoGallery from "@/components/listings/PhotoGallery";
import { formatPrice, formatListingType, formatAdNumber, timeAgo } from "@/lib/format";
import { toggleFavorite, createOrFindChat } from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";

function WhatsAppIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

const ROLE_LABELS: Record<string, string> = {
  OWNER: "مالك", BROKER: "وسيط عقاري", HOST: "مضيف",
};

const TYPE_STYLE: Record<string, string> = {
  sale: "bg-blue-50 text-blue-700 border border-blue-100",
  rent_long: "bg-emerald-50 text-emerald-700 border border-emerald-100",
  rent_short: "bg-violet-50 text-violet-700 border border-violet-100",
};

const SERVICE_LABELS: Record<string, string> = {
  catering: "🍽 تقديم طعام",
  sound_system: "🔊 نظام صوتي",
  projector: "📽 شاشة عرض",
  decoration: "🎊 تزيين",
  security: "🔒 أمن",
  parking: "🅿 مواقف سيارات",
};

function HallDescription({ text }: { text: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [isClamped, setIsClamped] = useState(false);

  useEffect(() => {
    if (ref.current) setIsClamped(ref.current.scrollHeight > ref.current.clientHeight + 1);
  }, []);

  return (
    <div>
      <h2 className="text-base font-bold text-[#222222] mb-4">وصف القاعة</h2>
      <p
        ref={ref}
        className={`text-[#717171] leading-relaxed text-sm whitespace-pre-wrap ${expanded ? "" : "line-clamp-4"}`}
      >
        {text}
      </p>
      {isClamped && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 text-[#F5A623] font-semibold text-sm hover:text-[#E09400] transition-colors"
        >
          {expanded ? "عرض أقل" : "عرض المزيد"}
        </button>
      )}
    </div>
  );
}

interface HallOwner {
  name: string;
  phone: string;
  profilePhoto: string | null;
  role: string;
}

interface HallStats {
  viewCount: number;
  messageCount: number;
  favoriteCount: number;
}

export interface HallDetail {
  id: string;
  title: string;
  city: string;
  district?: string;
  category?: string;
  adNumber?: string;
  listingType: string;
  isGolden?: boolean;
  isPromoted?: boolean;
  createdAt?: string;
  totalPrice: string;
  pricePerHalfDay?: string;
  maxGuests?: number;
  includedServices: string[];
  description?: string;
  latitude?: string;
  longitude?: string;
  ownerId: string;
  owner?: HallOwner;
  stats?: HallStats;
}

interface Props {
  hall: HallDetail;
  photos: string[];
}

export default function EventHallDetailClient({ hall, photos }: Props) {
  const router = useRouter();
  const { isLoggedIn } = useAuthStore();
  const [favorited, setFavorited] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const lat = hall.latitude ? parseFloat(hall.latitude) : undefined;
  const lng = hall.longitude ? parseFloat(hall.longitude) : undefined;
  const ownerPhone = hall.owner?.phone;
  const typeStyle = TYPE_STYLE[hall.listingType] ?? "bg-gray-50 text-gray-600 border border-gray-100";

  async function handleFavorite() {
    if (!isLoggedIn) { router.push(`/login?redirect=/event-halls/${hall.id}`); return; }
    if (favLoading) return;
    setFavLoading(true);
    try {
      const res = await toggleFavorite("listing", hall.id);
      setFavorited(res.isFavorited);
    } catch { /* silent */ } finally { setFavLoading(false); }
  }

  async function handleChat() {
    if (!isLoggedIn) { router.push(`/login?redirect=/event-halls/${hall.id}`); return; }
    if (chatLoading) return;
    setChatLoading(true);
    try {
      const res = await createOrFindChat(hall.ownerId, hall.id);
      router.push(`/account/chat?chatId=${res.id}`);
    } catch { /* silent */ } finally { setChatLoading(false); }
  }

  async function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: hall.title, url }); } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(url).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const contactButtons = (size: "sm" | "lg" = "lg") => (
    <div className={size === "lg" ? "flex flex-col gap-3" : "flex flex-1 gap-2"}>
      {ownerPhone && (
        <a
          href={`https://wa.me/${ownerPhone.replace(/\D/g, "")}`}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex-1 flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebe5d] text-white font-bold rounded-xl transition-colors ${
            size === "lg" ? "py-3.5 text-sm" : "py-3 text-sm"
          }`}
        >
          <WhatsAppIcon size={size === "lg" ? 17 : 16} /> واتساب
        </a>
      )}
      <button
        onClick={handleChat}
        disabled={chatLoading}
        className={`flex-1 flex items-center justify-center gap-2 bg-[#F5A623] hover:bg-[#E09400] disabled:opacity-60 text-white font-bold rounded-xl transition-colors ${
          size === "lg" ? "py-3.5 text-sm" : "py-3 text-sm"
        }`}
      >
        {chatLoading ? (
          <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
        ) : (
          <><MessageCircle size={size === "lg" ? 17 : 16} /> {size === "lg" ? "محادثة عبر التطبيق" : "تواصل"}</>
        )}
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
            <Link href="/event-halls" className="hover:text-[#F5A623] transition-colors">قاعات المناسبات</Link>
            <ChevronRight size={12} />
            <span className="text-[#222222] font-medium truncate max-w-48">{hall.title}</span>
          </div>
        </div>

        {/* Gallery + action buttons */}
        <div className="relative">
          <PhotoGallery photos={photos} title={hall.title} />
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
          <div className="lg:grid lg:grid-cols-[1fr_360px] lg:gap-12 lg:items-start">
            {/* Main content column */}
            <div className="space-y-8">
              {/* Header */}
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${typeStyle}`}>
                      {formatListingType(hall.listingType)}
                    </span>
                    {hall.isGolden && (
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-100">
                        ذهبي
                      </span>
                    )}
                    {hall.isPromoted && !hall.isGolden && (
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-orange-50 text-orange-600 border border-orange-100">
                        مميز
                      </span>
                    )}
                  </div>
                  {hall.createdAt && (
                    <span className="flex items-center gap-1 text-xs text-gray-400 shrink-0">
                      <Clock size={12} /> {timeAgo(hall.createdAt)}
                    </span>
                  )}
                </div>

                <h1 className="text-2xl sm:text-3xl font-black text-[#222222] leading-snug mb-3">
                  {hall.title}
                </h1>

                <p className="flex items-center gap-1.5 text-sm text-[#717171]">
                  <MapPin size={14} className="text-[#F5A623] shrink-0" />
                  {hall.city}
                  {hall.district ? ` · ${hall.district}` : ""}
                  {hall.category ? ` · ${hall.category}` : ""}
                </p>

                {/* Price (mobile only — desktop shows in sidebar) */}
                <div className="lg:hidden mt-4">
                  <p className="text-3xl font-black text-[#222222]">
                    {formatPrice(hall.totalPrice)} <span className="text-sm font-normal text-gray-400">/ يوم</span>
                  </p>
                  {hall.pricePerHalfDay && (
                    <p className="text-sm text-[#717171] mt-0.5">{formatPrice(hall.pricePerHalfDay)} / فترة</p>
                  )}
                </div>
              </div>

              {/* Stats */}
              {hall.stats && (
                <div className="flex gap-5 text-sm text-[#717171]">
                  <span className="flex items-center gap-1.5"><Eye size={14} /> {hall.stats.viewCount} مشاهدة</span>
                  <span className="flex items-center gap-1.5"><Users size={14} /> {hall.stats.messageCount} تواصل</span>
                  <span className="flex items-center gap-1.5"><Bookmark size={14} /> {hall.stats.favoriteCount} حفظ</span>
                </div>
              )}

              {/* Capacity */}
              {hall.maxGuests && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-[#F9F9F9] rounded-2xl p-4 text-center">
                    <Users size={18} className="text-[#F5A623] mx-auto mb-2" />
                    <p className="text-lg font-bold text-[#222222]">{hall.maxGuests}</p>
                    <p className="text-xs text-[#717171]">ضيف</p>
                  </div>
                </div>
              )}

              {/* Pricing */}
              <>
                <hr className="border-gray-100" />
                <div>
                  <h2 className="text-base font-bold text-[#222222] mb-4">الأسعار</h2>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-[#717171]">سعر اليوم الكامل</span>
                      <span className="font-bold text-[#222222]">{formatPrice(hall.totalPrice)}</span>
                    </div>
                    {hall.pricePerHalfDay != null && (
                      <div className="flex justify-between text-sm">
                        <span className="text-[#717171]">سعر الفترة (صباحي أو مسائي)</span>
                        <span className="font-bold text-[#222222]">{formatPrice(hall.pricePerHalfDay)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </>

              {/* Included services */}
              {hall.includedServices.length > 0 && (
                <>
                  <hr className="border-gray-100" />
                  <div>
                    <h2 className="text-base font-bold text-[#222222] mb-4">الخدمات المشمولة في السعر</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {hall.includedServices.map((service) => (
                        <div
                          key={service}
                          className="flex items-center gap-3 bg-[#F9F9F9] rounded-xl px-3.5 py-3 border border-transparent hover:border-[#F5A623]/20 transition-colors"
                        >
                          <span className="text-sm font-medium text-[#222222]">
                            {SERVICE_LABELS[service] ?? service}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Description */}
              {hall.description && (
                <>
                  <hr className="border-gray-100" />
                  <HallDescription text={hall.description} />
                </>
              )}

              {/* Map */}
              {lat !== undefined && lng !== undefined && (
                <>
                  <hr className="border-gray-100" />
                  <div>
                    <h2 className="text-base font-bold text-[#222222] mb-4">الموقع</h2>
                    <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                      <iframe
                        src={`https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`}
                        width="100%"
                        height="280"
                        style={{ border: 0 }}
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        title="موقع القاعة"
                      />
                    </div>
                    <p className="text-sm text-[#717171] mt-2 flex items-center gap-1">
                      <MapPin size={13} className="text-[#F5A623]" />
                      {hall.city}
                      {hall.district ? ` · ${hall.district}` : ""}
                    </p>
                  </div>
                </>
              )}

              {/* Owner card */}
              {hall.owner?.name && (
                <>
                  <hr className="border-gray-100" />
                  <div>
                    <h2 className="text-base font-bold text-[#222222] mb-4">المعلن</h2>
                    <div className="flex items-center gap-4 bg-[#F9F9F9] rounded-2xl p-5">
                      <div className="relative w-14 h-14 rounded-2xl overflow-hidden bg-gray-200 shrink-0">
                        {hall.owner.profilePhoto ? (
                          <Image
                            src={hall.owner.profilePhoto}
                            alt={hall.owner.name}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-200">
                            <span className="text-2xl font-bold text-gray-400">
                              {hall.owner.name.charAt(0)}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-[#222222]">{hall.owner.name}</p>
                          {ROLE_LABELS[hall.owner.role] && (
                            <span className="text-xs bg-orange-50 text-[#F5A623] border border-orange-100 font-semibold px-2 py-0.5 rounded-full">
                              {ROLE_LABELS[hall.owner.role]}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Sticky sidebar (desktop only) */}
            <div className="hidden lg:block">
              <div className="sticky top-24 bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden">
                {/* Price section */}
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-2xl font-black text-[#222222] leading-tight">
                        {formatPrice(hall.totalPrice)} <span className="text-xs font-normal text-gray-400">/ يوم</span>
                      </p>
                      {hall.pricePerHalfDay && (
                        <p className="text-xs text-[#717171] mt-1">{formatPrice(hall.pricePerHalfDay)} / فترة</p>
                      )}
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${typeStyle}`}>
                      {formatListingType(hall.listingType)}
                    </span>
                  </div>

                  {/* Quick specs strip */}
                  {hall.maxGuests && (
                    <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100 text-sm text-[#717171]">
                      <span className="flex items-center gap-1.5">
                        <Users size={14} className="text-[#F5A623]" /> يتسع لـ {hall.maxGuests} ضيف
                      </span>
                    </div>
                  )}
                </div>

                {/* Contact buttons */}
                <div className="p-6 space-y-3">
                  {contactButtons("lg")}
                </div>

                {/* Ad meta */}
                <div className="px-6 pb-5 pt-0 flex items-center justify-between text-xs text-gray-400">
                  {hall.adNumber && <span>{formatAdNumber(hall.adNumber)}</span>}
                  {hall.createdAt && (
                    <span className="flex items-center gap-1">
                      <Clock size={11} /> {timeAgo(hall.createdAt)}
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
          </div>
        </div>
      </main>

      {/* Mobile sticky contact bar */}
      <div className="fixed bottom-0 start-0 end-0 z-40 bg-white border-t border-gray-100 shadow-lg px-4 py-3 lg:hidden">
        <div className="flex gap-2 max-w-lg mx-auto">
          {contactButtons("sm")}
        </div>
      </div>
    </>
  );
}
