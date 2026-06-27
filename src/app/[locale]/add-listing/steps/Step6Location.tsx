'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAddListingStore } from '@/store/add-listing.store';
import SearchableSelect from '@/components/SearchableSelect';
import { SAUDI_CITIES, getCityByValue } from '@/data/saudi-cities';

const GOOGLE_MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ?? '';
const RIYADH = { lat: 24.7136, lng: 46.6753 };

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    google: any;
    __mapsLoaded?: boolean;
  }
}

function loadMapsScript(): Promise<void> {
  if (window.__mapsLoaded || window.google?.maps) {
    window.__mapsLoaded = true;
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_KEY}&libraries=places`;
    s.async = true;
    s.onload = () => { window.__mapsLoaded = true; resolve(); };
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

const CITY_OPTIONS = SAUDI_CITIES.map((c) => ({ value: c.value, label: c.label }));

export default function Step6Location() {
  const store = useAddListingStore();
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstance = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markerEl = useRef<any>(null);
  const [mapReady, setMapReady] = useState(false);
  const [noKey] = useState(!GOOGLE_MAPS_KEY);

  const inp = 'w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#F5A623] transition-colors bg-white';
  const lbl = 'block text-sm font-medium text-[#222222] mb-1.5';

  // District options for the selected city
  const districtOptions = store.city
    ? (getCityByValue(store.city)?.districts ?? [])
    : [];

  const setPin = useCallback((lat: number, lng: number) => {
    store.setField('lat', lat);
    store.setField('lng', lng);
    if (markerEl.current && mapInstance.current) {
      markerEl.current.setPosition({ lat, lng });
    }
    mapInstance.current?.panTo({ lat, lng });
  }, [store]);

  useEffect(() => {
    if (noKey || !mapRef.current) return;
    loadMapsScript().then(() => {
      if (!mapRef.current || mapInstance.current) return;
      const center = store.lat && store.lng
        ? { lat: store.lat, lng: store.lng }
        : RIYADH;

      const map = new window.google.maps.Map(mapRef.current, {
        center,
        zoom: 12,
        disableDefaultUI: true,
        zoomControl: true,
        gestureHandling: 'greedy',
      });
      mapInstance.current = map;

      // Overlay pin
      const div = document.createElement('div');
      div.innerHTML = `<div style="width:28px;height:28px;background:#F5A623;border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3);transform:translate(-50%,-50%);cursor:pointer"></div>`;
      const overlay = new window.google.maps.OverlayView();
      overlay.onAdd = function () {
        this.getPanes().overlayMouseTarget.appendChild(div);
      };
      overlay.draw = function () {
        if (!store.lat || !store.lng) return;
        const projection = this.getProjection();
        const pos = projection.fromLatLngToDivPixel(
          new window.google.maps.LatLng(store.lat ?? center.lat, store.lng ?? center.lng)
        );
        if (pos) {
          div.style.left = `${pos.x}px`;
          div.style.top = `${pos.y}px`;
          div.style.position = 'absolute';
          div.style.display = 'block';
        }
      };
      overlay.setMap(map);
      markerEl.current = {
        setPosition: (pos: { lat: number; lng: number }) => {
          overlay.draw = function () {
            const proj = this.getProjection();
            const p = proj.fromLatLngToDivPixel(new window.google.maps.LatLng(pos.lat, pos.lng));
            if (p) {
              div.style.left = `${p.x}px`;
              div.style.top = `${p.y}px`;
            }
          };
          overlay.draw();
        },
      };

      if (store.lat && store.lng) {
        markerEl.current.setPosition({ lat: store.lat, lng: store.lng });
      }

      map.addListener('click', (e: { latLng: { lat: () => number; lng: () => number } }) => {
        setPin(e.latLng.lat(), e.latLng.lng());
      });

      setMapReady(true);
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noKey]);

  // Pan map when city changes
  useEffect(() => {
    if (!mapReady || !store.city || !window.google?.maps) return;
    const geo = new window.google.maps.Geocoder();
    geo.geocode({ address: store.city + ', Saudi Arabia' }, (results: unknown[], status: string) => {
      if (status === 'OK' && results?.[0]) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const loc = (results[0] as any).geometry.location;
        mapInstance.current?.panTo({ lat: loc.lat(), lng: loc.lng() });
        mapInstance.current?.setZoom(12);
      }
    });
  }, [store.city, mapReady]);

  function handleCityChange(val: string) {
    store.setField('city', val);
    // Reset district when city changes
    store.setField('district', null);
  }

  return (
    <div className="px-4 py-6 space-y-4">
      <h2 className="text-base font-bold text-[#222222]">موقع العقار</h2>

      {/* City */}
      <div>
        <label className={lbl}>
          المدينة <span className="text-red-500">*</span>
        </label>
        <SearchableSelect
          options={CITY_OPTIONS}
          value={store.city}
          onChange={handleCityChange}
          placeholder="اختر المدينة"
          searchPlaceholder="ابحث عن مدينة..."
        />
      </div>

      {/* District */}
      <div>
        <label className={lbl}>الحي</label>
        {districtOptions.length > 0 ? (
          <SearchableSelect
            options={districtOptions}
            value={store.district ?? ''}
            onChange={(val) => store.setField('district', val || null)}
            placeholder="اختر الحي (اختياري)"
            searchPlaceholder="ابحث عن حي..."
            disabled={!store.city}
          />
        ) : (
          <input
            value={store.district ?? ''}
            onChange={(e) => store.setField('district', e.target.value || null)}
            className={inp}
            placeholder={store.city ? 'أدخل اسم الحي' : 'اختر المدينة أولاً'}
            disabled={!store.city}
          />
        )}
      </div>

      {/* Address */}
      <div>
        <label className={lbl}>العنوان التفصيلي</label>
        <input
          value={store.address ?? ''}
          onChange={(e) => store.setField('address', e.target.value || null)}
          className={inp}
          placeholder="اختياري"
        />
      </div>

      {/* Map */}
      {noKey ? (
        <div className="h-48 bg-gray-100 rounded-2xl flex items-center justify-center text-sm text-[#717171]">
          خريطة غير متاحة — يرجى إضافة مفتاح Google Maps
        </div>
      ) : (
        <div>
          <p className="text-xs text-[#717171] mb-2">انقر على الخريطة لتحديد موقع العقار</p>
          <div ref={mapRef} style={{ height: 260, borderRadius: 16, overflow: 'hidden' }} />
          {store.lat && store.lng && (
            <p className="text-xs text-[#717171] mt-1 text-center" dir="ltr">
              {store.lat.toFixed(5)}, {store.lng.toFixed(5)}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
