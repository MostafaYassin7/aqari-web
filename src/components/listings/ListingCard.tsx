"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale } from "next-intl";
import { Bed, Bath, Maximize2, Heart, Building2, Clock, Users } from "lucide-react";
import { useState } from "react";
import type { Listing } from "@/types/listing";
import { formatPrice, formatListingType, formatAdNumber, timeAgo } from "@/lib/format";
import { toggleFavorite } from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import { useRouter } from "@/i18n/navigation";

const TYPE_STYLE: Record<string, string> = {
  sale:       "bg-blue-50 text-blue-700",
  rent_long:  "bg-emerald-50 text-emerald-700",
  rent_short: "bg-violet-50 text-violet-700",
};

interface Props {
  listing: Listing;
  showFavorite?: boolean;
  hrefBase?: string;
}

export default function ListingCard({ listing, showFavorite = true, hrefBase = "/listings" }: Props) {
  const locale = useLocale();
  const router = useRouter();
  const { isLoggedIn } = useAuthStore();
  const [favorited, setFavorited] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const isEventHall = listing.propertyType === "event_hall";
  const resolvedHrefBase = isEventHall ? "/event-halls" : hrefBase;

  function cacheListing() {
    try { sessionStorage.setItem(`listing_${listing.id}`, JSON.stringify(listing)); } catch {}
  }

  async function handleFavorite(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoggedIn) { router.push(`/login?redirect=${resolvedHrefBase}/${listing.id}`); return; }
    if (favLoading) return;
    setFavLoading(true);
    try {
      const res = await toggleFavorite("listing", listing.id);
      setFavorited(res.isFavorited);
    } catch { /* silent */ } finally { setFavLoading(false); }
  }

  const typeStyle = TYPE_STYLE[listing.listingType] ?? "bg-gray-50 text-gray-600";

  return (
    <Link
      onClick={cacheListing}
      href={`/${locale}${resolvedHrefBase}/${listing.id}`}
      className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all overflow-hidden flex flex-col"
    >
      {/* Photo */}
      <div className="relative aspect-[3/2] bg-gray-100 overflow-hidden">
        {listing.coverPhoto ? (
          <Image
            src={listing.coverPhoto}
            alt={listing.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
            <Building2 size={40} className="text-gray-300" strokeWidth={1.5} />
          </div>
        )}

        {/* Golden / promoted badge — photo overlay only for status */}
        <div className="absolute top-2.5 start-2.5 flex flex-col gap-1">
          {listing.isGolden && (
            <span className="inline-flex items-center gap-1 bg-amber-400 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
              ذهبي
            </span>
          )}
          {listing.isPromoted && !listing.isGolden && (
            <span className="inline-flex items-center gap-1 bg-[#F5A623] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
              مميز
            </span>
          )}
        </div>

        {/* Favorite */}
        {showFavorite && (
          <button
            onClick={handleFavorite}
            disabled={favLoading}
            className="absolute top-2.5 end-2.5 w-8 h-8 flex items-center justify-center rounded-full bg-white/90 hover:bg-white shadow-sm transition-all"
            aria-label="المفضلة"
          >
            <Heart size={14} className={favorited ? "fill-red-500 text-red-500" : "text-gray-400"} />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col gap-1.5 flex-1">

        {/* Location */}
        <p className="text-xs text-[#717171] truncate">
          {listing.city}{listing.district ? ` · ${listing.district}` : ""}
          {listing.category ? ` · ${listing.category}` : ""}
        </p>

        {/* Title */}
        <h3 className="text-sm font-semibold text-[#222222] line-clamp-2 leading-snug">
          {listing.title}
        </h3>

        {/* Price + listing type */}
        <div className="flex items-center justify-between gap-2 mt-1">
          {isEventHall ? (
            <div>
              <p className="text-base font-black text-[#222222]">
                {parseFloat(listing.price).toLocaleString()} ريال{" "}
                <span className="text-xs font-normal text-gray-400">/ يوم</span>
              </p>
              {listing.pricePerHalfDay && (
                <p className="text-xs text-gray-400 mt-0.5">
                  ({parseFloat(listing.pricePerHalfDay).toLocaleString()} ريال / فترة)
                </p>
              )}
            </div>
          ) : (
            <p className="text-base font-black text-[#222222]">{formatPrice(listing.price)}</p>
          )}
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${typeStyle}`}>
            {formatListingType(listing.listingType)}
          </span>
        </div>

        {/* Specs */}
        {isEventHall ? (
          listing.maxGuests && (
            <div className="flex items-center gap-3 text-xs text-[#717171] mt-0.5">
              <span className="flex items-center gap-1">
                <Users size={11} /> يتسع لـ {listing.maxGuests} ضيف
              </span>
            </div>
          )
        ) : (
          (listing.area || listing.bedrooms || listing.bathrooms) && (
            <div className="flex items-center gap-3 text-xs text-[#717171] mt-0.5">
              {listing.area && (
                <span className="flex items-center gap-1">
                  <Maximize2 size={11} />
                  {typeof listing.area === "number" ? listing.area : parseFloat(String(listing.area))} م²
                </span>
              )}
              {listing.bedrooms !== undefined && listing.bedrooms !== null && listing.bedrooms > 0 && (
                <span className="flex items-center gap-1"><Bed size={11} /> {listing.bedrooms}</span>
              )}
              {listing.bathrooms !== undefined && listing.bathrooms !== null && listing.bathrooms > 0 && (
                <span className="flex items-center gap-1"><Bath size={11} /> {listing.bathrooms}</span>
              )}
            </div>
          )
        )}

        {/* Footer: ad number + timestamp */}
        <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-50">
          {listing.adNumber
            ? <p className="text-[10px] text-gray-300">{formatAdNumber(listing.adNumber)}</p>
            : <span />
          }
          {listing.createdAt && (
            <span className="flex items-center gap-1 text-[10px] text-gray-300">
              <Clock size={10} /> {timeAgo(listing.createdAt)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
