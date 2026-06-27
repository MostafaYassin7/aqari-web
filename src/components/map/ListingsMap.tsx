'use client';
import { useState, useCallback, useRef } from 'react';
import { GoogleMap, useLoadScript, OverlayView, InfoWindow } from '@react-google-maps/api';
import Image from 'next/image';
import Link from 'next/link';
import { formatPriceShort, formatPrice } from '@/lib/format';

const DEFAULT_CENTER = { lat: 24.7136, lng: 46.6753 };
const CONTAINER_STYLE = { width: '100%', height: '100%', minHeight: '400px' };
const MAP_OPTIONS = {
  disableDefaultUI: true,
  zoomControl: true,
  gestureHandling: 'greedy' as const,
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
  };
}

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  listings: any[];
  onSearchArea?: (lat: number, lng: number) => void;
}

export default function ListingsMap({ listings, onSearchArea }: Props) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ?? '';
  const { isLoaded, loadError } = useLoadScript({ googleMapsApiKey: apiKey });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selected, setSelected] = useState<any | null>(null);
  const [showSearchHere, setShowSearchHere] = useState(false);
  const mapRef = useRef<google.maps.Map | null>(null);
  const idleCount = useRef(0);

  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  function handleIdle() {
    // Skip the first idle event (initial map load), only show after user interaction
    idleCount.current += 1;
    if (idleCount.current > 1) setShowSearchHere(true);
  }

  function handleSearchHere() {
    if (!mapRef.current || !onSearchArea) return;
    const center = mapRef.current.getCenter();
    if (center) onSearchArea(center.lat(), center.lng());
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

  const parsed = listings.map(parseListing).filter((l) => l.lat !== 0 && l.lng !== 0);

  return (
    <div className="relative w-full" style={{ height: '100%', minHeight: '400px' }}>
      <GoogleMap
        mapContainerStyle={CONTAINER_STYLE}
        center={DEFAULT_CENTER}
        zoom={6}
        options={MAP_OPTIONS}
        onLoad={onLoad}
        onIdle={handleIdle}
        onDragStart={() => setShowSearchHere(false)}
      >
        {parsed.map((l) => (
          <OverlayView
            key={l.id}
            position={{ lat: l.lat, lng: l.lng }}
            mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
          >
            <button
              onClick={() => setSelected(l)}
              className={`
                px-2.5 py-1 rounded-full text-xs font-bold shadow-md whitespace-nowrap
                border-2 border-white transition-transform hover:scale-110
                ${selected?.id === l.id ? 'bg-[#222222] text-white' : 'bg-[#F5A623] text-white'}
              `}
              style={{ transform: 'translate(-50%, -50%)' }}
            >
              {formatPriceShort(l.price)}
            </button>
          </OverlayView>
        ))}

        {selected && (
          <InfoWindow
            position={{ lat: selected.lat, lng: selected.lng }}
            onCloseClick={() => setSelected(null)}
          >
            <div className="w-52 text-right" dir="rtl">
              {selected.coverPhoto && (
                <div className="relative w-full h-28 rounded-lg overflow-hidden mb-2">
                  <Image src={selected.coverPhoto} alt={selected.title} fill className="object-cover" unoptimized />
                </div>
              )}
              <p className="font-bold text-[#222222] text-sm leading-snug line-clamp-2">{selected.title}</p>
              <p className="text-[#F5A623] font-black text-base mt-1">{formatPrice(selected.price)}</p>
              <p className="text-xs text-[#717171] mb-2">{selected.city}</p>
              <Link
                href={`/listings/${selected.id}`}
                className="block w-full text-center bg-[#F5A623] hover:bg-[#E09400] text-white text-xs font-bold py-1.5 rounded-lg transition-colors"
              >
                عرض التفاصيل
              </Link>
            </div>
          </InfoWindow>
        )}
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
    </div>
  );
}
