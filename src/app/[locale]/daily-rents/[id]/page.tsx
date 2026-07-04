import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import DailyRentDetailClient from "@/components/listings/DailyRentDetailClient";
import { apiRequest } from "@/lib/api";
import type { ListingDetail } from "@/types/listing";

interface Props {
  params: Promise<{ id: string; locale: string }>;
}

interface MediaItem {
  url: string;
  isCover: boolean;
  order: number;
}

export default async function DailyRentDetailPage({ params }: Props) {
  const { id } = await params;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let data: any = null;
  try {
    data = await apiRequest<Record<string, unknown>>(`/listings/${id}`);
  } catch {
    data = null;
  }

  if (!data) notFound();

  const media: MediaItem[] = Array.isArray(data.__media__) ? data.__media__ : [];
  const photos = media
    .slice()
    .sort((a, b) => (b.isCover ? 1 : 0) - (a.isCover ? 1 : 0) || a.order - b.order)
    .map((m) => m.url)
    .filter(Boolean);
  if (photos.length === 0 && data.coverPhoto) photos.push(String(data.coverPhoto));

  const listing: ListingDetail = {
    id: String(data.id ?? id),
    title: String(data.title ?? ""),
    description: data.description ? String(data.description) : undefined,
    price: String(data.totalPrice ?? data.price ?? 0),
    area: data.area ? parseFloat(String(data.area)) : undefined,
    bedrooms: data.bedrooms as number | undefined,
    bathrooms: data.bathrooms as number | undefined,
    livingRooms: data.livingRooms as number | undefined,
    city: String(data.city ?? ""),
    district: data.district ? String(data.district) : undefined,
    category: (data.category as { nameAr?: string })?.nameAr ?? "",
    listingType: String(data.listingType ?? ""),
    propertyType: data.propertyType ? String(data.propertyType) : undefined,
    coverPhoto: photos[0],
    isGolden: Boolean(data.isGolden),
    isPromoted: Boolean(data.isPromoted),
    adNumber: data.adNumber ? String(data.adNumber) : undefined,
    pricePerMeter: data.pricePerMeter != null ? String(data.pricePerMeter) : undefined,
    createdAt: data.createdAt ? String(data.createdAt) : undefined,
    lat: data.latitude ? parseFloat(String(data.latitude)) : undefined,
    lng: data.longitude ? parseFloat(String(data.longitude)) : undefined,
    owner: data.__owner__
      ? {
          id: data.ownerId ? String(data.ownerId) : "",
          name: (data.__owner__ as { name?: string }).name,
          photo: (data.__owner__ as { profilePhoto?: string | null }).profilePhoto ?? undefined,
          phone: (data.__owner__ as { phone?: string }).phone,
          lastActive: (data.__owner__ as { lastActive?: string }).lastActive,
        }
      : undefined,
    features: {
      furnished: Boolean(data.isFurnished),
      elevator: Boolean(data.hasElevator),
      water: Boolean(data.hasWater),
      electricity: Boolean(data.hasElectricity),
      kitchen: Boolean(data.hasKitchen),
    },
    __owner__: data.__owner__ as ListingDetail["__owner__"],
    stats: data.stats as ListingDetail["stats"],
    latitude: data.latitude ? String(data.latitude) : undefined,
    longitude: data.longitude ? String(data.longitude) : undefined,
    maxGuests: typeof data.maxGuests === "number" ? data.maxGuests : undefined,
    minNights: typeof data.minNights === "number" ? data.minNights : undefined,
    checkInTime: data.checkInTime ? String(data.checkInTime) : undefined,
    checkOutTime: data.checkOutTime ? String(data.checkOutTime) : undefined,
  };

  return (
    <>
      <Navbar />
      <DailyRentDetailClient listing={listing} photos={photos} />
      <Footer />
    </>
  );
}
