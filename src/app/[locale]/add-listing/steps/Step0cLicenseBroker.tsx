'use client';
import { useState } from 'react';
import { useAddListingStore } from '@/store/add-listing.store';
import { validateBrokerLicense } from '@/lib/api';

export default function Step0cLicenseBroker() {
  const store = useAddListingStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const inp = 'w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#F5A623] transition-colors bg-white';
  const lbl = 'block text-sm font-medium text-[#222222] mb-1.5';

  const handleNext = async () => {
    if (!store.brokerAdLicenseNumber || !store.brokerOwnerIdNumber) {
      setError('يرجى ملء جميع الحقول المطلوبة');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await validateBrokerLicense({
        adLicenseNumber: store.brokerAdLicenseNumber,
        ownerIdType: store.brokerOwnerIdType,
        ownerIdNumber: store.brokerOwnerIdNumber,
      });
      if (res.isValid && res.licenseId) {
        store.setLicenseId(res.licenseId);
        store.nextStep();
      } else {
        setError('رقم الترخيص غير صحيح أو منتهي الصلاحية');
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'حدث خطأ، يرجى المحاولة مجدداً');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-4 py-6 space-y-5 pb-32">
      {/* Info banner */}
      <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
        <p className="text-sm text-orange-800">
          لإضافة إعلان يجب أن يكون لديك ترخيص إعلان صادر من الهيئة العامة للعقار
        </p>
      </div>

      {/* License number */}
      <div>
        <label className={lbl}>رقم ترخيص الإعلان <span className="text-red-500">*</span></label>
        <input
          value={store.brokerAdLicenseNumber ?? ''}
          onChange={(e) => store.setField('brokerAdLicenseNumber', e.target.value)}
          className={inp}
          dir="ltr"
          placeholder="أدخل رقم الترخيص"
        />
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      </div>

      {/* Owner ID type */}
      <div>
        <p className={lbl}>نوع هوية المالك <span className="text-red-500">*</span></p>
        <div className="flex gap-2">
          {[
            { value: 'national_id', label: 'هوية وطنية' },
            { value: 'commercial_registration', label: 'سجل تجاري' },
          ].map((t) => (
            <button
              key={t.value}
              onClick={() => store.setField('brokerOwnerIdType', t.value)}
              className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                store.brokerOwnerIdType === t.value
                  ? 'border-[#F5A623] bg-orange-50 text-[#F5A623]'
                  : 'border-gray-200 bg-white text-[#717171]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Dynamic ID number */}
      <div>
        <label className={lbl}>
          {store.brokerOwnerIdType === 'national_id'
            ? 'رقم الهوية الوطنية للمالك'
            : 'رقم السجل التجاري للمنشأة'}
          {' '}<span className="text-red-500">*</span>
        </label>
        <input
          value={store.brokerOwnerIdNumber ?? ''}
          onChange={(e) => store.setField('brokerOwnerIdNumber', e.target.value)}
          className={inp}
          dir="ltr"
        />
      </div>

      {/* Bottom bar */}
      <div className="fixed bottom-0 start-0 end-0 z-20 bg-white border-t border-gray-100 px-4 py-3 shadow-lg">
        <div className="max-w-2xl mx-auto flex gap-3">
          <button
            onClick={() => store.prevStep()}
            className="flex-1 h-12 border border-gray-200 rounded-xl text-sm font-medium text-[#717171] hover:bg-gray-50"
          >
            رجوع
          </button>
          <button
            onClick={handleNext}
            disabled={loading}
            className="flex-1 h-12 bg-[#F5A623] hover:bg-[#E09400] disabled:opacity-60 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2"
          >
            {loading && <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />}
            التالي
          </button>
        </div>
      </div>
    </div>
  );
}
