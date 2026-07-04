import { AlertCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Link } from "@/i18n/navigation";
import EventHallDetailClient, { type HallDetail } from "@/components/event-halls/EventHallDetailClient";
import { apiRequest } from "@/lib/api";

interface Props {
  params: Promise<{ id: string; locale: string }>;
}

interface MediaItem {
  url: string;
  isCover: boolean;
  order: number;
}

export default async function EventHallDetailPage({ params }: Props) {
  const { id } = await params;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let data: any = null;
  try {
    data = await apiRequest<Record<string, unknown>>(`/listings/${id}`);
  } catch {
    data = null;
  }

  if (!data) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen flex-1 flex flex-col items-center justify-center py-32 px-4 text-center">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-5">
            <AlertCircle size={28} className="text-red-400" />
          </div>
          <h1 className="text-xl font-bold text-[#222222] mb-3">تعذّر تحميل القاعة</h1>
          <p className="text-[#717171] mb-8 max-w-sm text-sm">يرجى العودة للقائمة والمحاولة مجدداً.</p>
          <Link
            href="/event-halls"
            className="bg-[#F5A623] hover:bg-[#E09400] text-white font-bold px-8 py-3 rounded-2xl transition-colors"
          >
            تصفح القاعات
          </Link>
        </main>
        <Footer />
      </>
    );
  }

  const media: MediaItem[] = Array.isArray(data.__media__) ? data.__media__ : [];
  const photos = media
    .slice()
    .sort((a, b) => (b.isCover ? 1 : 0) - (a.isCover ? 1 : 0) || a.order - b.order)
    .map((m) => m.url)
    .filter(Boolean);

  const owner = data.__owner__ as
    | { name: string; phone: string; profilePhoto: string | null; role: string }
    | undefined;

  const category = data.category as { nameAr?: string } | undefined;

  const hall: HallDetail = {
    id: String(data.id),
    title: String(data.title ?? ""),
    city: String(data.city ?? ""),
    district: data.district ? String(data.district) : undefined,
    category: category?.nameAr,
    adNumber: data.adNumber ? String(data.adNumber) : undefined,
    listingType: String(data.listingType ?? ""),
    isGolden: Boolean(data.isGolden),
    isPromoted: Boolean(data.isPromoted),
    createdAt: data.createdAt ? String(data.createdAt) : undefined,
    totalPrice: String(data.totalPrice ?? "0"),
    pricePerHalfDay: data.pricePerHalfDay != null ? String(data.pricePerHalfDay) : undefined,
    maxGuests: typeof data.maxGuests === "number" ? data.maxGuests : undefined,
    includedServices: Array.isArray(data.includedServices) ? data.includedServices : [],
    description: data.description ? String(data.description) : undefined,
    latitude: data.latitude ? String(data.latitude) : undefined,
    longitude: data.longitude ? String(data.longitude) : undefined,
    ownerId: data.ownerId ? String(data.ownerId) : "",
    owner,
    stats: data.stats as HallDetail["stats"],
  };

  return (
    <>
      <Navbar />
      <EventHallDetailClient hall={hall} photos={photos} />
      <Footer />
    </>
  );
}
