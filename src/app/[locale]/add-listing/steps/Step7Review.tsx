'use client';
import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from '@/i18n/navigation';
import { useAddListingStore } from '@/store/add-listing.store';
import { submitLicense, createListing } from '@/lib/api';
import { CheckCircle, AlertCircle } from 'lucide-react';

const LISTING_TYPE_LABEL: Record<string, string> = {
  sale: 'للبيع',
  rent_long: 'للإيجار',
  rent_short: 'إيجار يومي',
};

function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex items-start justify-between gap-2 py-2 border-b border-gray-50 last:border-0">
      <span className="text-xs text-[#717171] shrink-0">{label}</span>
      <span className="text-xs font-medium text-[#222222] text-left">{value}</span>
    </div>
  );
}

export default function Step7Review() {
  const store = useAddListingStore();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      let licenseId: string | null = store.licenseId;

      // OWNER/AGENT with license data filled → submit license first
      if (
        (store.advertiserType === 'owner' || store.advertiserType === 'agent') &&
        !store.skipLicenseInfo &&
        !licenseId
      ) {
        const licPayload: Record<string, unknown> = {
          advertiserType: store.advertiserType,
          ownershipDocumentType: store.ownershipDocumentType,
          ownershipDocumentNumber: store.ownershipDocumentNumber,
          propertyOwnerIdType: store.propertyOwnerIdType,
          propertyOwnerBirthDate: store.propertyOwnerBirthDate,
          isHijriCalendar: store.isHijriCalendar,
          propertyOwnerPhone: store.propertyOwnerPhone,
          oneOfOwnersNationalId: store.oneOfOwnersNationalId || undefined,
        };
        if (store.propertyOwnerIdType === 'national_id') licPayload.ownerNationalIdNumber = store.ownerNationalIdNumber;
        if (store.propertyOwnerIdType === 'commercial_registration') licPayload.ownerCommercialRegNumber = store.ownerCommercialRegNumber;
        if (store.propertyOwnerIdType === 'unified_700') licPayload.ownerUnifiedNumber = store.ownerUnifiedNumber;
        if (store.advertiserType === 'agent') {
          licPayload.powerOfAttorneyNumber = store.powerOfAttorneyNumber;
          licPayload.agentNationalIdNumber = store.agentNationalIdNumber;
          licPayload.agentBirthDate = store.agentBirthDate;
          licPayload.agentPhone = store.agentPhone;
        }
        const licRes = await submitLicense(licPayload);
        licenseId = licRes.id;
      }

      // Build listing payload
      const listing: Record<string, unknown> = {
        title: store.title,
        categoryId: store.categoryId,
        propertyType: store.propertyType,
        listingType: store.listingType,
        totalPrice: store.totalPrice,
        area: store.area,
        city: store.city,
        district: store.district,
        address: store.address,
        latitude: store.lat,
        longitude: store.lng,
        description: store.description,
        usageType: store.isResidential ? 'residential' : 'commercial',
        commission: store.hasCommission,
        commissionPercent: store.hasCommission ? store.commissionPercent : undefined,
        bedrooms: store.bedrooms,
        livingRooms: store.livingRooms,
        bathrooms: store.bathrooms,
        floor: store.floorNumber,
        propertyAge: store.propertyAge,
        streetWidth: store.streetWidth,
        facade: store.facade,
        hasWater: store.hasWater,
        hasElectricity: store.hasElectricity,
        hasSewage: store.hasSewage,
        hasPrivateRoof: store.hasPrivateRoof,
        isInVilla: store.isInVilla,
        hasTwoEntrances: store.hasTwoEntrances,
        hasSpecialEntrance: store.hasSpecialEntrance,
        isFurnished: store.isFurnished,
        hasKitchen: store.hasKitchen,
        hasExtraUnit: store.hasExtraUnit,
        hasCarEntrance: store.hasCarEntrance,
        hasElevator: store.hasElevator,
        mediaUrls: store.uploadedUrls,
        coverPhoto: store.coverPhoto,
        advertiserType: store.advertiserType,
        licenseId: licenseId ?? undefined,
      };

      await createListing(listing);

      // Success message based on flow
      if (store.advertiserType === 'broker' || store.advertiserType === 'host') {
        setSuccess('تم نشر إعلانك بنجاح');
      } else if (store.skipLicenseInfo) {
        setSuccess('تم حفظ إعلانك كمسودة');
      } else {
        setSuccess('تم إرسال إعلانك للمراجعة');
      }

      store.reset();
      setTimeout(() => router.push('/account/my-ads'), 2000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'حدث خطأ، يرجى المحاولة مجدداً');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-16 gap-4 text-center min-h-[50vh]">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle size={32} className="text-green-500" />
        </div>
        <h2 className="text-lg font-bold text-[#222222]">{success}</h2>
        <p className="text-sm text-[#717171]">جاري التوجيه لإعلاناتك...</p>
      </div>
    );
  }

  const hasFeatures = [
    store.hasWater, store.hasElectricity, store.hasSewage, store.hasPrivateRoof,
    store.isInVilla, store.hasTwoEntrances, store.hasSpecialEntrance,
    store.isFurnished, store.hasKitchen, store.hasExtraUnit, store.hasCarEntrance, store.hasElevator,
  ].some(Boolean);

  const FEATURE_LABELS: Record<string, string> = {
    hasWater: 'مياه', hasElectricity: 'كهرباء', hasSewage: 'صرف صحي',
    hasPrivateRoof: 'سطح خاص', isInVilla: 'داخل فيلا', hasTwoEntrances: 'مدخلان',
    hasSpecialEntrance: 'مدخل خاص', isFurnished: 'مفروش', hasKitchen: 'مطبخ',
    hasExtraUnit: 'وحدة إضافية', hasCarEntrance: 'مدخل سيارة', hasElevator: 'مصعد',
  };

  const activeFeatures = Object.entries(FEATURE_LABELS)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter(([key]) => !!(store as any)[key])
    .map(([, label]) => label);

  return (
    <div className="px-4 py-6 space-y-4 pb-32">
      <h2 className="text-base font-bold text-[#222222]">مراجعة الإعلان</h2>

      {/* Photos */}
      {store.uploadedUrls.length > 0 && (
        <div>
          <p className="text-xs font-medium text-[#717171] mb-2">الصور ({store.uploadedUrls.length})</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {store.uploadedUrls.slice(0, 4).map((url, i) => (
              <div key={url} className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-gray-100">
                <Image src={url} alt="" fill className="object-cover" unoptimized />
                {i === 0 && (
                  <span className="absolute bottom-1 start-1 bg-[#F5A623] text-white text-[9px] font-bold px-1 py-0.5 rounded">غلاف</span>
                )}
              </div>
            ))}
            {store.uploadedUrls.length > 4 && (
              <div className="w-20 h-20 rounded-xl bg-gray-100 shrink-0 flex items-center justify-center text-xs text-[#717171]">
                +{store.uploadedUrls.length - 4}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Info card */}
      <div className="bg-white rounded-2xl p-4 shadow-sm space-y-0">
        <Row label="العنوان" value={store.title} />
        <Row label="الفئة" value={store.categoryNameAr ?? undefined} />
        <Row label="نوع الإعلان" value={store.listingType ? LISTING_TYPE_LABEL[store.listingType] : undefined} />
        <Row label="السعر" value={store.totalPrice ? `${store.totalPrice.toLocaleString('ar-SA')} ريال` : undefined} />
        <Row label="المساحة" value={store.area ? `${store.area} م²` : undefined} />
        <Row label="الاستخدام" value={store.isResidential ? 'سكني' : 'تجاري'} />
        <Row label="المدينة" value={store.city || undefined} />
        <Row label="الحي" value={store.district ?? undefined} />
        {store.lat && store.lng && (
          <Row label="الإحداثيات" value={`${store.lat.toFixed(4)}, ${store.lng.toFixed(4)}`} />
        )}
      </div>

      {/* Details card */}
      <div className="bg-white rounded-2xl p-4 shadow-sm space-y-0">
        <Row label="غرف النوم" value={store.bedrooms ? String(store.bedrooms) : undefined} />
        <Row label="دورات المياه" value={store.bathrooms ? String(store.bathrooms) : undefined} />
        <Row label="غرف المعيشة" value={store.livingRooms ? String(store.livingRooms) : undefined} />
        <Row label="الطابق" value={store.floorNumber !== null ? String(store.floorNumber) : undefined} />
        <Row label="عمر العقار" value={store.propertyAge ? `${store.propertyAge} سنة` : undefined} />
        <Row label="الواجهة" value={store.facade ?? undefined} />
      </div>

      {/* Features */}
      {hasFeatures && (
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-xs font-medium text-[#717171] mb-2">المرافق والمميزات</p>
          <div className="flex flex-wrap gap-1.5">
            {activeFeatures.map((f) => (
              <span key={f} className="text-xs bg-orange-50 text-[#F5A623] px-2.5 py-1 rounded-full font-medium">
                {f}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* License status */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <p className="text-xs font-medium text-[#717171] mb-1">الترخيص</p>
        {store.licenseId ? (
          <p className="text-xs text-green-600 font-medium">✓ تم التحقق من الترخيص</p>
        ) : store.skipLicenseInfo ? (
          <p className="text-xs text-orange-600 font-medium">⚠ سيتم حفظ الإعلان كمسودة</p>
        ) : (store.advertiserType === 'owner' || store.advertiserType === 'agent') ? (
          <p className="text-xs text-blue-600 font-medium">سيتم إرسال بيانات الترخيص للمراجعة</p>
        ) : (
          <p className="text-xs text-gray-500">لا يوجد ترخيص</p>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {/* Submit bottom bar */}
      <div className="fixed bottom-0 start-0 end-0 z-20 bg-white border-t border-gray-100 px-4 py-3 shadow-lg">
        <div className="flex gap-3 max-w-2xl mx-auto">
          <button
            onClick={() => store.prevStep()}
            className="flex-1 h-12 border border-gray-200 rounded-xl text-sm font-medium text-[#717171] hover:bg-gray-50"
          >
            رجوع
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 h-12 bg-[#F5A623] hover:bg-[#E09400] disabled:opacity-60 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2"
          >
            {loading && <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />}
            نشر الإعلان
          </button>
        </div>
      </div>
    </div>
  );
}
