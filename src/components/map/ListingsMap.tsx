'use client';
import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { GoogleMap, useLoadScript, OverlayView } from '@react-google-maps/api';
import Image from 'next/image';
import Link from 'next/link';
import { X, MapPin } from 'lucide-react';
import { formatPriceShort, formatPrice } from '@/lib/format';

const DEFAULT_CENTER = { lat: 24.7136, lng: 46.6753 };
const CONTAINER_STYLE = { width: '100%', height: '100%', minHeight: '400px' };
const MAP_OPTIONS = {
  disableDefaultUI: true,
  zoomControl: true,
  gestureHandling: 'greedy' as const,
  clickableIcons: false,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseListing(listing: any) {
  return {
    id: listing.id ?? listing.objectID ?? '',
    lat: parseFloat(listing.latitude ?? listing._geoloc?.lat ?? listing.lat ?? 0),
    lng: parseFloat(listing.longitude ?? listing._geoloc?.lng ?? listing.lng ?? 0),
    price: parseFloat(listing.totalPrice ?? listing.price ?? 0),
    title: listing.title ?? '',
    coverPhoto: listing.coverPhoto ?? null,
    city: listing.city ?? '',
    district: listing.district ?? '',
    listingType: listing.listingType ?? '',
    propertyType: listing.propertyType ?? '',
    isGolden: listing.isGolden ?? false,
    isPromoted: listing.isPromoted ?? false,
  };
}

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  listings: any[];
  onSearchArea?: (lat: number, lng: number) => void;
  hrefBase?: string;
}

export default function ListingsMap({ listings, onSearchArea, hrefBase = '/listings' }: Props) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ?? '';
  const { isLoaded, loadError } = useLoadScript({ googleMapsApiKey: apiKey });

  const parsed = useMemo(() => listings.map(parseListing).filter((l) => l.lat !== 0 && l.lng !== 0), [listings]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showSearchHere, setShowSearchHere] = useState(false);
  const mapRef = useRef<google.maps.Map | null>(null);
  const userMovedMap = useRef(false);
  const didFitBounds = useRef(false);

  const selected = parsed.find((l) => l.id === selectedId) ?? null;

  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  useEffect(() => {
    if (!mapRef.current || parsed.length === 0 || didFitBounds.current) return;
    const bounds = new google.maps.LatLngBounds();
    parsed.forEach((listing) => bounds.extend({ lat: listing.lat, lng: listing.lng }));
    mapRef.current.fitBounds(bounds, 72);
    if (parsed.length === 1) {
      window.setTimeout(() => {
        mapRef.current?.setZoom(14);
      }, 0);
    }
    didFitBounds.current = true;
  }, [parsed, isLoaded]);

  useEffect(() => {
    if (selectedId && !parsed.some((listing) => listing.id === selectedId)) {
      setSelectedId(null);
    }
  }, [parsed, selectedId]);

  function markUserMovedMap() {
    userMovedMap.current = true;
  }

  function handleIdle() {
    if (userMovedMap.current) setShowSearchHere(true);
  }

  function handleSearchHere() {
    if (!mapRef.current || !onSearchArea) return;
    const center = mapRef.current.getCenter();
    if (center) onSearchArea(center.lat(), center.lng());
    userMovedMap.current = false;
    setShowSearchHere(false);
  }

  if (!apiKey) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 text-[#717171] gap-2">
        <span className="text-4xl">🗺️</span>
        <p className="text-sm">أضف NEXT_PUBLIC_GOOGLE_MAPS_KEY لتفعيل الخريطة</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50 text-[#717171] text-sm">
        تعذّر تحميل الخريطة
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50">
        <span className="animate-spin rounded-full h-8 w-8 border-2 border-[#F5A623] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="relative w-full" style={{ height: '100%', minHeight: '400px' }}>
      <GoogleMap
        mapContainerStyle={CONTAINER_STYLE}
        center={DEFAULT_CENTER}
        zoom={6}
        options={MAP_OPTIONS}
        onLoad={onLoad}
        onIdle={handleIdle}
        onDragStart={() => { markUserMovedMap(); setShowSearchHere(false); }}
        onZoomChanged={markUserMovedMap}
        onClick={() => setSelectedId(null)}
      >
        {parsed.map((l) => (
          <OverlayView
            key={l.id}
            position={{ lat: l.lat, lng: l.lng }}
            mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedId(l.id);
                mapRef.current?.panTo({ lat: l.lat, lng: l.lng });
              }}
              className={`
                px-2.5 py-1 rounded-full text-xs font-black shadow-md whitespace-nowrap
                border-2 transition-transform hover:scale-110
                ${selected?.id === l.id
                  ? 'bg-[#222222] text-white border-[#F5A623] scale-110 z-20'
                  : l.isGolden
                    ? 'bg-yellow-400 text-yellow-950 border-white ring-2 ring-yellow-200'
                    : 'bg-[#F5A623] text-white border-white'
                }
              `}
              style={{ transform: 'translate(-50%, -50%)' }}
            >
              {formatPriceShort(l.price)}
            </button>
          </OverlayView>
        ))}

      </GoogleMap>

      {/* Search this area button */}
      {showSearchHere && onSearchArea && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
          <button
            onClick={handleSearchHere}
            className="bg-white shadow-md rounded-full px-4 py-2 text-sm font-semibold text-[#222222] hover:bg-gray-50 transition-colors border border-gray-200"
          >
            البحث في هذه المنطقة
          </button>
        </div>
      )}

      {selected && (
        <div className="absolute inset-x-3 bottom-3 z-20 sm:inset-x-auto sm:start-4 sm:bottom-20 sm:w-80" dir="rtl">
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl">
            <div className="flex gap-3 p-3">
              <div className="relative h-24 w-28 shrink-0 overflow-hidden rounded-xl bg-gray-100">
                {selected.coverPhoto ? (
                  <Image
                    src={selected.coverPhoto}
                    alt={selected.title}
                    fill
                    className="object-cover"
                    sizes="112px"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-gray-300">
                    <MapPin size={28} />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-start justify-between gap-2">
                  <p className="line-clamp-2 text-sm font-black leading-snug text-[#222222]">{selected.title}</p>
                  <button
                    onClick={() => setSelectedId(null)}
                    className="shrink-0 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-[#222222]"
                    aria-label="إغلاق"
                  >
                    <X size={15} />
                  </button>
                </div>
                <p className="text-base font-black text-[#F5A623]">{formatPrice(selected.price)}</p>
                <p className="mt-0.5 line-clamp-1 text-xs text-[#717171]">
                  {[selected.city, selected.district].filter(Boolean).join('، ')}
                </p>
                <div className="mt-2 flex items-center gap-1.5">
                  {selected.isGolden && (
                    <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-[10px] font-bold text-yellow-800">ذهبي</span>
                  )}
                  {selected.isPromoted && (
                    <span className="rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-bold text-[#F5A623]">مميز</span>
                  )}
                </div>
              </div>
            </div>

            <Link
              href={`${hrefBase}/${selected.id}`}
              className="block w-full bg-[#F5A623] px-4 py-2.5 text-center text-sm font-bold text-white transition-colors hover:bg-[#E09400]"
            >
              عرض التفاصيل
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
